"""Error envelope from the contract: { "error": { code, message, details, requestId } }."""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

CODES = {400: "bad_request", 401: "unauthorized", 403: "forbidden", 404: "not_found",
         409: "idempotency_conflict", 422: "validation_failed", 429: "rate_limited", 503: "source_unavailable"}


def error_body(request: Request, code: str, message: str, details: list | None = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details or [],
                      "requestId": getattr(request.state, "request_id", "")}}


def install(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_error(request: Request, exc: StarletteHTTPException):
        code = CODES.get(exc.status_code, "internal_error")
        return JSONResponse(error_body(request, code, str(exc.detail)), status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        details = [{"field": ".".join(str(p) for p in e["loc"][1:]) or "body", "issue": e["msg"]} for e in exc.errors()]
        return JSONResponse(error_body(request, "validation_failed", "One or more fields are invalid.", details), status_code=422)

    @app.exception_handler(Exception)
    async def unexpected(request: Request, exc: Exception):
        # Never leak internals. The request id lets us find the log line.
        return JSONResponse(error_body(request, "internal_error", "Something went wrong. Quote the request id when you report it."), status_code=500)

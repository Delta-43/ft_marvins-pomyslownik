# One image for the API and the worker. The command decides: serve | worker | migrate
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /srv

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY migrations ./migrations
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh && useradd --system --uid 10001 radar
USER radar

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["serve"]

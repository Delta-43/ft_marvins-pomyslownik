"""Auth tag: providers, register, login, logout, me. The demo provider is a labelled sandbox, not a real identity check."""
import datetime as dt
from typing import Literal

import psycopg
from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, ConfigDict, Field

from ..config import settings
from ..db import connection, one
from ..errors import ApiError
from ..security import SESSION_HOURS, RateLimiter, current_user, hash_token, new_token
from ..services.cards import iso

router = APIRouter(tags=["Auth"])
# Two limits. Per address: high, because every sign-in on the deployed site arrives from the one web server.
# Per identity: low, so nobody can hammer one account.
limited = Depends(RateLimiter(limit=300, window=60))
per_identity = RateLimiter(limit=10, window=60)
session = Depends(current_user)

Role = Literal["investors_business", "public_bodies", "universities", "schools", "startups_enterprises", "inventors"]
OrgType = Literal["university", "research_institute", "school", "local_government", "public_institution", "company",
                  "startup", "incubator", "investor", "individual", "other"]


class Affiliation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(max_length=200)
    type: OrgType


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    provider: Literal["sandbox_id"]
    providerSubject: str = Field(min_length=3, max_length=200)
    email: str = Field(max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    displayName: str | None = Field(default=None, max_length=120)
    role: Role
    affiliation: Affiliation
    interests: list[str] = Field(max_length=20)
    acceptedTerms: bool
    consentToContact: bool = False


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    provider: Literal["sandbox_id"]
    providerSubject: str = Field(min_length=3, max_length=200)


class UpdateMeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Role | None = None
    affiliation: Affiliation | None = None
    interests: list[str] | None = Field(default=None, max_length=20)
    consentToContact: bool | None = None


def user_json(u: dict) -> dict:
    return {"id": str(u["id"]), "email": u["email"], "displayName": u["display_name"], "role": u["role"],
            "affiliation": {"name": u["affiliation_name"], "type": u["affiliation_type"]}, "interests": list(u["interests"]),
            "identityVerified": False,  # the sandbox never verifies identity. Only a real provider may set this
            "provider": u["provider"], "consentToContact": u["consent_to_contact"], "createdAt": iso(u["created_at"])}


def open_session(user: dict) -> dict:
    token = new_token()
    expires = dt.datetime.now(dt.UTC) + dt.timedelta(hours=SESSION_HOURS)
    with connection() as conn:
        conn.execute("DELETE FROM sessions WHERE expires_at < now()")
        conn.execute("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (%s,%s,%s)", (hash_token(token), user["id"], expires))
    return {"token": token, "expiresAt": iso(expires), "user": user_json(user)}


def _limit_identity(action: str, subject: str) -> None:
    if subject.strip().lower() not in settings.demo_identity_set:  # a whole jury may share one demo identity
        per_identity.hit((action, subject.strip().lower()))


@router.get("/auth/providers")
def providers():
    demo = [{"subject": s, "label": {"pl": "Wspólna tożsamość demonstracyjna", "en": "Shared demo identity"}}
            for s in sorted(settings.demo_identity_set)]
    return {"data": [{"id": "sandbox_id", "label": {"pl": "Tożsamość testowa (demo)", "en": "Test identity (demo)"},
                      "kind": "sandbox", "enabled": True, "flow": "direct", "assuranceLevel": "none", "demoIdentities": demo},
                     {"id": "login_gov_pl", "label": {"pl": "login.gov.pl (wkrótce)", "en": "login.gov.pl (coming)"},
                      "kind": "saml", "enabled": False, "flow": "redirect", "assuranceLevel": "substantial",
                      "methods": ["profil_zaufany", "mobywatel", "e_dowod", "bank"]}]}


@router.post("/auth/register", status_code=201, dependencies=[limited])
def register(body: RegisterRequest):
    _limit_identity("register", body.providerSubject)
    if not body.acceptedTerms:
        raise ApiError(422, "terms_not_accepted", "You must accept the terms of use to register.")
    subject = body.providerSubject.strip().lower()
    with connection() as conn:
        if conn.execute("SELECT 1 FROM users WHERE provider = %s AND provider_subject = %s", (body.provider, subject)).fetchone():
            raise ApiError(409, "account_exists", "An account already exists for this identity. Sign in instead.")
        try:
            user = conn.execute(
                """INSERT INTO users (provider, provider_subject, email, display_name, role, affiliation_name, affiliation_type,
                     interests, consent_to_contact, terms_accepted_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, now()) RETURNING *""",
                (body.provider, subject, body.email, body.displayName, body.role, body.affiliation.name, body.affiliation.type,
                 body.interests, body.consentToContact)).fetchone()
        except psycopg.errors.UniqueViolation as exc:  # two registrations for one identity at the same moment
            raise ApiError(409, "account_exists", "An account already exists for this identity. Sign in instead.") from exc
    return {"data": open_session(user)}


@router.post("/auth/login", dependencies=[limited])
def login(body: LoginRequest):
    _limit_identity("login", body.providerSubject)
    user = one("SELECT * FROM users WHERE provider = %s AND provider_subject = %s", (body.provider, body.providerSubject.strip().lower()))
    if not user:
        raise ApiError(404, "registration_required", "No account for this identity. Register first.")
    return {"data": open_session(user)}


@router.post("/auth/logout", status_code=204)
def logout(user: dict = session):
    with connection() as conn:
        conn.execute("DELETE FROM sessions WHERE token_hash = %s", (user["_token_hash"],))
    return Response(status_code=204)


@router.get("/me")
def get_me(user: dict = session):
    return {"data": user_json(user)}


@router.patch("/me")
def update_me(body: UpdateMeRequest, user: dict = session):
    changes = body.model_dump(exclude_unset=True)
    if not changes:
        raise ApiError(422, "validation_failed", "Send at least one field to change.")
    sets, p = [], {"id": user["id"]}
    if "role" in changes and body.role:
        sets.append("role = %(role)s"); p["role"] = body.role
    if "affiliation" in changes and body.affiliation:
        sets += ["affiliation_name = %(an)s", "affiliation_type = %(at)s"]; p.update(an=body.affiliation.name, at=body.affiliation.type)
    if "interests" in changes and body.interests is not None:
        sets.append("interests = %(i)s"); p["i"] = body.interests
    if "consentToContact" in changes and body.consentToContact is not None:
        sets.append("consent_to_contact = %(c)s"); p["c"] = body.consentToContact
    updated = one(f"UPDATE users SET {', '.join(sets)} WHERE id = %(id)s RETURNING *", p) if sets else user
    return {"data": user_json(updated)}


@router.delete("/me", status_code=204)
def delete_me(user: dict = session):
    """Right to erasure: removes the profile and every session. Aggregated usage counts hold no user id and stay."""
    if user["provider"] == "sandbox_id" and user["provider_subject"] in settings.demo_identity_set:
        raise ApiError(403, "forbidden", "The shared demo identity cannot be deleted. Register your own test identity to try this.")
    with connection() as conn:
        conn.execute("DELETE FROM users WHERE id = %s", (user["id"],))
    return Response(status_code=204)

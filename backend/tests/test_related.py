"""B17: similarity hits and research hits are kept on the card, with organisations and public pages, never people."""
import json
import os
import uuid

import pytest
from fastapi.testclient import TestClient

needs_db = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a seeded database")
WORKS = {"results": [{"id": "https://openalex.org/W1", "display_name": "Continuous desilting of reservoirs", "publication_year": 2021,
                      "doi": "https://doi.org/10.1/abc",
                      "authorships": [{"author": {"display_name": "Jan Kowalski"},
                                       "institutions": [{"display_name": "Poznań University of Life Sciences", "country_code": "PL",
                                                         "ror": "https://ror.org/03tth1e03"}]}]}]}


def test_openalex_works_keep_institutions_and_drop_people(monkeypatch):
    from app.collectors import openalex
    monkeypatch.setattr(openalex.settings, "openalex_api_key", "k")
    monkeypatch.setattr(openalex.fetch, "get", lambda url, **kw: (json.dumps(WORKS).encode(), {}))
    w = openalex.top_polish_works("Continuous desilting of water reservoirs")
    assert w[0]["org_name"] == "Poznań University of Life Sciences" and w[0]["contact_url"] == "https://ror.org/03tth1e03"
    assert "Kowalski" not in json.dumps(w)


@needs_db
def test_related_work_is_stored_and_served(monkeypatch):
    from app import related
    from app.collectors import openalex
    from app.db import connection
    from app.main import app
    monkeypatch.setattr(openalex.settings, "openalex_api_key", "k")
    monkeypatch.setattr(openalex.fetch, "get", lambda url, **kw: (json.dumps(WORKS).encode(), {}))
    cid = "e7ddd917-2546-5e40-9d13-d47ba47930ea"  # continuous desilting, technological
    with connection() as conn, conn.transaction():
        n = related.build(conn, cid)
    assert n >= 1
    c = TestClient(app)
    r = c.post("/api/v1/auth/register", json={"provider": "sandbox_id", "providerSubject": f"rel-{uuid.uuid4().hex[:8]}",
                                               "email": "r@example.invalid", "role": "schools",
                                               "affiliation": {"name": "T", "type": "school"}, "interests": [], "acceptedTerms": True})
    h = {"Authorization": f"Bearer {r.json()['data']['token']}"}
    try:
        work = c.get(f"/api/v1/cards/{cid}?lang=en", headers=h).json()["data"]["relatedWork"]
        pub = next(x for x in work if x["kind"] == "publication")
        assert pub["organisation"]["contactUrl"] == "https://ror.org/03tth1e03" and 0 <= pub["similarity"] <= 1
        assert all(x["url"].startswith("http") and x["basis"] == "estimate" for x in work)
        assert work == sorted(work, key=lambda x: -x["similarity"])
    finally:
        c.delete("/api/v1/me", headers=h)
        with connection() as conn:
            conn.execute("DELETE FROM related_work WHERE card_id = %s", (cid,))

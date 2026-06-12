from io import BytesIO
from unittest.mock import patch

from fastapi.testclient import TestClient
from langchain_core.language_models.fake_chat_models import FakeListChatModel

from app.main import app


def test_health(isolated_settings):
    with TestClient(app) as client:
        resp = client.get("/api/health")

    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_document_upload_list_and_delete(isolated_settings, sample_csv):
    with TestClient(app) as client, open(sample_csv, "rb") as f:
        resp = client.post(
            "/api/documents/upload", files={"file": ("sample.csv", f, "text/csv")}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["source_type"] == "csv"
        assert body["num_chunks"] == 1

        resp = client.get("/api/documents")
        assert resp.status_code == 200
        docs = resp.json()
        assert len(docs) == 1
        assert docs[0]["source"] == "sample.csv"

        resp = client.delete(f"/api/documents/{body['document_id']}")
        assert resp.status_code == 200

        resp = client.get("/api/documents")
        assert resp.json() == []


def test_document_upload_unsupported_type(isolated_settings):
    with TestClient(app) as client:
        resp = client.post(
            "/api/documents/upload",
            files={"file": ("notes.txt", BytesIO(b"hello"), "text/plain")},
        )

    assert resp.status_code == 400


def test_ingest_url_endpoint(isolated_settings):
    from langchain_core.documents import Document

    fake_doc = Document(
        page_content="Example Domain. This domain is for use in illustrative examples.",
        metadata={"source": "https://example.com", "title": "Example Domain"},
    )

    with TestClient(app) as client:
        with patch("app.ingestion.pipeline.load_webpage", return_value=[fake_doc]):
            resp = client.post("/api/documents/url", json={"url": "https://example.com"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["source_type"] == "url"
    assert body["num_chunks"] >= 1


def test_chat_with_citations(isolated_settings, sample_csv):
    fake_llm = FakeListChatModel(
        responses=["The population of New York is 8000000 [1]."]
    )

    with TestClient(app) as client, open(sample_csv, "rb") as f:
        client.post("/api/documents/upload", files={"file": ("sample.csv", f, "text/csv")})

        with patch("app.rag.chain._get_llm", return_value=fake_llm):
            resp = client.post(
                "/api/chat",
                json={"message": "What is the population of New York?"},
                headers={"X-Session-Id": "test-session", "X-User-Id": "tester"},
            )

    assert resp.status_code == 200
    body = resp.json()
    assert "8000000" in body["answer"]
    assert len(body["sources"]) >= 1
    assert body["sources"][0]["source"] == "sample.csv"
    assert body["chat_message_id"]


def test_feedback_and_analytics_summary(isolated_settings, sample_csv):
    fake_llm = FakeListChatModel(
        responses=["The population of New York is 8000000 [1]."]
    )

    with TestClient(app) as client, open(sample_csv, "rb") as f:
        client.post("/api/documents/upload", files={"file": ("sample.csv", f, "text/csv")})

        with patch("app.rag.chain._get_llm", return_value=fake_llm):
            chat_resp = client.post(
                "/api/chat",
                json={"message": "What is the population of New York?"},
                headers={"X-Session-Id": "test-session", "X-User-Id": "tester"},
            )
        chat_message_id = chat_resp.json()["chat_message_id"]

        resp = client.post(
            "/api/feedback", json={"chat_message_id": chat_message_id, "score": 1}
        )
        assert resp.status_code == 200
        assert resp.json() == {"status": "recorded"}

        resp = client.post("/api/feedback", json={"chat_message_id": "missing", "score": 1})
        assert resp.status_code == 404

        resp = client.post("/api/feedback", json={"chat_message_id": chat_message_id, "score": 5})
        assert resp.status_code == 422

        resp = client.get("/api/analytics/summary")

    assert resp.status_code == 200
    summary = resp.json()
    assert summary["document_count"] == 1
    assert summary["chunk_count"] == 1
    assert summary["chat_count"] == 1
    assert summary["feedback_count"] == 1
    assert summary["positive_feedback_count"] == 1
    assert summary["positive_feedback_ratio"] == 1.0
    assert summary["langfuse_enabled"] is False

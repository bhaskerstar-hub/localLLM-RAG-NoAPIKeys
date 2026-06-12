from unittest.mock import MagicMock, patch

from app.config import get_settings
from app.observability.feedback import record_feedback
from app.observability.langfuse_client import (
    build_run_config,
    get_langfuse_client,
    new_trace_id,
)


def test_langfuse_disabled_by_default(isolated_settings):
    assert get_langfuse_client() is None
    assert new_trace_id() is None
    assert build_run_config(trace_id=None, user_id="u", session_id="s") == {}


def test_langfuse_enabled_builds_run_config(isolated_settings, monkeypatch):
    monkeypatch.setenv("ENABLE_LANGFUSE", "true")
    monkeypatch.setenv("LANGFUSE_PUBLIC_KEY", "pk-test")
    monkeypatch.setenv("LANGFUSE_SECRET_KEY", "sk-test")
    get_settings.cache_clear()
    get_langfuse_client.cache_clear()

    fake_client = MagicMock()
    try:
        with (
            patch("langfuse.Langfuse", return_value=fake_client) as mock_langfuse_cls,
            patch("langfuse.langchain.CallbackHandler") as mock_handler_cls,
        ):
            mock_langfuse_cls.create_trace_id.return_value = "trace-123"

            assert get_langfuse_client() is fake_client

            trace_id = new_trace_id()
            assert trace_id == "trace-123"

            config = build_run_config(
                trace_id=trace_id, user_id="alice", session_id="session-1"
            )

        assert config["metadata"] == {
            "langfuse_user_id": "alice",
            "langfuse_session_id": "session-1",
            "langfuse_tags": ["rag-chat"],
        }
        assert len(config["callbacks"]) == 1
        mock_handler_cls.assert_called_once_with(trace_context={"trace_id": "trace-123"})
    finally:
        get_settings.cache_clear()
        get_langfuse_client.cache_clear()


def test_record_feedback_noop_when_disabled(isolated_settings):
    # Should not raise even though no Langfuse client is configured.
    record_feedback(trace_id="abc", score=1, comment="great")


def test_record_feedback_calls_create_score_when_enabled(isolated_settings, monkeypatch):
    monkeypatch.setenv("ENABLE_LANGFUSE", "true")
    get_settings.cache_clear()
    get_langfuse_client.cache_clear()

    fake_client = MagicMock()
    try:
        with patch("langfuse.Langfuse", return_value=fake_client):
            record_feedback(trace_id="trace-123", score=1, comment="nice")

        fake_client.create_score.assert_called_once_with(
            trace_id="trace-123",
            name="user-feedback",
            value=1,
            data_type="NUMERIC",
            comment="nice",
        )
    finally:
        get_settings.cache_clear()
        get_langfuse_client.cache_clear()

from functools import lru_cache
from typing import Any

from app.config import get_settings


@lru_cache
def get_langfuse_client() -> Any | None:
    """Return the cached Langfuse client, or None if observability is disabled."""
    settings = get_settings()
    if not settings.enable_langfuse:
        return None

    from langfuse import Langfuse

    return Langfuse(
        public_key=settings.langfuse_public_key,
        secret_key=settings.langfuse_secret_key,
        host=settings.langfuse_host,
    )


def new_trace_id() -> str | None:
    """Generate a fresh Langfuse trace id, or None if observability is disabled."""
    if get_langfuse_client() is None:
        return None

    from langfuse import Langfuse

    return Langfuse.create_trace_id()


def build_run_config(*, trace_id: str | None, user_id: str, session_id: str) -> dict[str, Any]:
    """Build LCEL invoke config that attaches a run to a Langfuse trace.

    Returns an empty dict if observability is disabled or no trace id was
    generated, so chains run unaffected by Langfuse.
    """
    if get_langfuse_client() is None or trace_id is None:
        return {}

    from langfuse.langchain import CallbackHandler

    handler = CallbackHandler(trace_context={"trace_id": trace_id})
    return {
        "callbacks": [handler],
        "metadata": {
            "langfuse_user_id": user_id,
            "langfuse_session_id": session_id,
            "langfuse_tags": ["rag-chat"],
        },
    }

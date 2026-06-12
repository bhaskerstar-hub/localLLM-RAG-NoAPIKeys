from app.observability.langfuse_client import get_langfuse_client


def record_feedback(*, trace_id: str, score: int, comment: str | None = None) -> None:
    """Push a user feedback score to Langfuse, if observability is enabled.

    This is the "% positive results" signal: scores > 0 are treated as
    positive (thumbs-up), scores <= 0 as negative (thumbs-down).
    """
    client = get_langfuse_client()
    if client is None:
        return

    client.create_score(
        trace_id=trace_id,
        name="user-feedback",
        value=score,
        data_type="NUMERIC",
        comment=comment,
    )

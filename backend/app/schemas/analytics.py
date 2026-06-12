from pydantic import BaseModel


class AnalyticsSummary(BaseModel):
    document_count: int
    chunk_count: int
    chat_count: int
    feedback_count: int
    positive_feedback_count: int
    positive_feedback_ratio: float | None
    total_tokens: int
    estimated_cost_usd: float | None
    langfuse_enabled: bool
    langfuse_host: str | None = None

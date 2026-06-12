from pydantic import BaseModel, Field


class FeedbackRequest(BaseModel):
    chat_message_id: str | None = None
    trace_id: str | None = None
    score: int = Field(..., ge=-1, le=1, description="-1 (thumbs down) or 1 (thumbs up)")
    comment: str | None = None


class FeedbackResponse(BaseModel):
    status: str

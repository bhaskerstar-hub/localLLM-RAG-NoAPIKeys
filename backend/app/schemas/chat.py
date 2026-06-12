from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class SourceChunk(BaseModel):
    index: int
    source: str
    page: int | None = None
    sheet: str | None = None
    snippet: str


class TokenUsage(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    trace_id: str | None = None
    chat_message_id: str
    usage: TokenUsage | None = None

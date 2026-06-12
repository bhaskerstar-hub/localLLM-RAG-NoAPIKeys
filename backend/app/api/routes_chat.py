import uuid

from fastapi import APIRouter, Header

from app.config import get_settings
from app.db.models import ChatMessage
from app.db.session import session_scope
from app.llm.factory import get_model_name
from app.llm.pricing import estimate_cost_usd
from app.observability.langfuse_client import build_run_config, new_trace_id
from app.rag.chain import answer_question
from app.schemas.chat import ChatRequest, ChatResponse, SourceChunk, TokenUsage

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    x_session_id: str | None = Header(default=None, alias="X-Session-Id"),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> ChatResponse:
    session_id = x_session_id or "anonymous-session"
    user_id = x_user_id or "anonymous"

    trace_id = new_trace_id()
    config = build_run_config(trace_id=trace_id, user_id=user_id, session_id=session_id)

    result = answer_question(payload.message, config=config)

    usage: TokenUsage | None = None
    raw_usage = result.get("usage")
    if raw_usage:
        settings = get_settings()
        cost_usd = estimate_cost_usd(
            settings.llm_provider,
            get_model_name(settings),
            raw_usage["input_tokens"],
            raw_usage["output_tokens"],
        )
        usage = TokenUsage(**raw_usage, estimated_cost_usd=cost_usd)

    chat_message_id = str(uuid.uuid4())
    with session_scope() as db:
        db.add(
            ChatMessage(
                id=chat_message_id,
                session_id=session_id,
                user_id=user_id,
                question=payload.message,
                answer=result["answer"],
                trace_id=trace_id,
                input_tokens=usage.input_tokens if usage else None,
                output_tokens=usage.output_tokens if usage else None,
                total_tokens=usage.total_tokens if usage else None,
                cost_usd=usage.estimated_cost_usd if usage else None,
            )
        )

    return ChatResponse(
        answer=result["answer"],
        sources=[SourceChunk(**source) for source in result["sources"]],
        trace_id=trace_id,
        chat_message_id=chat_message_id,
        usage=usage,
    )

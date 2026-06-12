from fastapi import APIRouter
from sqlalchemy import func, select

from app.config import get_settings
from app.db.models import ChatMessage, DocumentRecord, Feedback
from app.db.session import session_scope
from app.schemas.analytics import AnalyticsSummary

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def summary() -> AnalyticsSummary:
    settings = get_settings()

    with session_scope() as db:
        document_count = db.scalar(select(func.count()).select_from(DocumentRecord)) or 0
        chunk_count = (
            db.scalar(select(func.coalesce(func.sum(DocumentRecord.num_chunks), 0))) or 0
        )
        chat_count = db.scalar(select(func.count()).select_from(ChatMessage)) or 0
        feedback_count = db.scalar(select(func.count()).select_from(Feedback)) or 0
        positive_feedback_count = (
            db.scalar(select(func.count()).select_from(Feedback).where(Feedback.score > 0)) or 0
        )
        total_tokens = (
            db.scalar(select(func.coalesce(func.sum(ChatMessage.total_tokens), 0))) or 0
        )
        total_cost = db.scalar(select(func.sum(ChatMessage.cost_usd)))

    positive_ratio = positive_feedback_count / feedback_count if feedback_count else None

    return AnalyticsSummary(
        document_count=document_count,
        chunk_count=int(chunk_count),
        chat_count=chat_count,
        feedback_count=feedback_count,
        positive_feedback_count=positive_feedback_count,
        positive_feedback_ratio=positive_ratio,
        total_tokens=int(total_tokens),
        estimated_cost_usd=float(total_cost) if total_cost is not None else None,
        langfuse_enabled=settings.enable_langfuse,
        langfuse_host=settings.langfuse_host if settings.enable_langfuse else None,
    )

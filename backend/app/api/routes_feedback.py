import uuid

from fastapi import APIRouter, HTTPException

from app.db.models import ChatMessage, Feedback
from app.db.session import session_scope
from app.observability.feedback import record_feedback
from app.schemas.feedback import FeedbackRequest, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse)
def submit_feedback(payload: FeedbackRequest) -> FeedbackResponse:
    trace_id = payload.trace_id

    with session_scope() as db:
        if payload.chat_message_id:
            message = db.get(ChatMessage, payload.chat_message_id)
            if message is None:
                raise HTTPException(status_code=404, detail="Chat message not found")
            trace_id = trace_id or message.trace_id

        db.add(
            Feedback(
                id=str(uuid.uuid4()),
                trace_id=trace_id,
                chat_message_id=payload.chat_message_id,
                score=payload.score,
                comment=payload.comment,
            )
        )

    if trace_id:
        record_feedback(trace_id=trace_id, score=payload.score, comment=payload.comment)

    return FeedbackResponse(status="recorded")

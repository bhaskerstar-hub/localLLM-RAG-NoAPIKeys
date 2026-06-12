from functools import lru_cache
from typing import Any

from langchain_core.documents import Document
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage
from langchain_core.runnables import Runnable, RunnableLambda, RunnableParallel, RunnablePassthrough
from sqlalchemy import select

from app.config import Settings, get_settings
from app.db.models import DocumentRecord
from app.db.session import session_scope
from app.llm.factory import get_chat_model
from app.llm.prompts import RAG_PROMPT
from app.rag.vectorstore import get_vectorstore


@lru_cache
def _get_llm() -> BaseChatModel:
    return get_chat_model(get_settings())


def _format_docs(docs: list[Document]) -> str:
    return "\n\n".join(f"[{i}] {doc.page_content}" for i, doc in enumerate(docs, start=1))


def _extract_usage(message: AIMessage) -> dict[str, int] | None:
    usage = getattr(message, "usage_metadata", None)
    if not usage:
        return None
    return {
        "input_tokens": usage.get("input_tokens", 0) or 0,
        "output_tokens": usage.get("output_tokens", 0) or 0,
        "total_tokens": usage.get("total_tokens", 0) or 0,
    }


def _docs_to_sources(docs: list[Document]) -> list[dict[str, Any]]:
    sources = []
    for i, doc in enumerate(docs, start=1):
        sources.append(
            {
                "index": i,
                "source": doc.metadata.get("source", "unknown"),
                "page": doc.metadata.get("page"),
                "sheet": doc.metadata.get("sheet"),
                "snippet": doc.page_content[:300],
            }
        )
    return sources


def _get_active_sources() -> list[str]:
    with session_scope() as db:
        return list(
            db.scalars(select(DocumentRecord.source).where(DocumentRecord.is_active.is_(True)))
        )


def _build_retriever(settings: Settings) -> Runnable:
    """Return a retriever limited to documents the user has marked active.

    If no documents are active, retrieval is skipped entirely (returns no
    context) rather than passing an empty `$in` filter to Chroma.
    """
    active_sources = _get_active_sources()
    if not active_sources:
        return RunnableLambda(lambda _: [])

    return get_vectorstore().as_retriever(
        search_kwargs={
            "k": settings.retriever_k,
            "filter": {"source": {"$in": active_sources}},
        }
    )


def build_rag_chain(settings: Settings | None = None) -> Runnable:
    """Build an LCEL chain that retrieves context and answers with citations.

    Invoked with a plain question string, returns
    `{"message": AIMessage, "sources": list[dict]}`.
    """
    settings = settings or get_settings()
    retriever = _build_retriever(settings)

    answer_chain = (
        {
            "context": lambda x: _format_docs(x["docs"]),
            "question": lambda x: x["question"],
        }
        | RAG_PROMPT
        | _get_llm()
    )

    return RunnableParallel(docs=retriever, question=RunnablePassthrough()) | RunnableParallel(
        message=answer_chain,
        sources=lambda x: _docs_to_sources(x["docs"]),
    )


def answer_question(
    question: str,
    *,
    settings: Settings | None = None,
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    chain = build_rag_chain(settings)
    result = chain.invoke(question, config=config)

    message: AIMessage = result["message"]
    content = message.content if isinstance(message.content, str) else str(message.content)

    return {
        "answer": content,
        "sources": result["sources"],
        "usage": _extract_usage(message),
    }

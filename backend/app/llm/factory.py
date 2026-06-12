from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel

from app.config import Settings


def get_chat_model(settings: Settings) -> BaseChatModel:
    """Return a chat model based on settings.llm_provider.

    Embeddings are intentionally configured separately (see
    get_embeddings) so the chat provider can be swapped without
    requiring re-ingestion of the vector store.
    """
    match settings.llm_provider:
        case "anthropic":
            from langchain_anthropic import ChatAnthropic

            return ChatAnthropic(
                model=settings.anthropic_model,
                api_key=settings.anthropic_api_key,
                temperature=0,
            )
        case "openai":
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                model=settings.openai_model,
                api_key=settings.openai_api_key,
                temperature=0,
            )
        case "ollama":
            from langchain_ollama import ChatOllama

            return ChatOllama(
                model=settings.ollama_model,
                base_url=settings.ollama_base_url,
                temperature=0,
            )
        case _:
            raise ValueError(f"Unsupported LLM_PROVIDER: {settings.llm_provider}")


def get_model_name(settings: Settings) -> str:
    """Return the active chat model name for the configured provider."""
    match settings.llm_provider:
        case "anthropic":
            return settings.anthropic_model
        case "openai":
            return settings.openai_model
        case "ollama":
            return settings.ollama_model
        case _:
            raise ValueError(f"Unsupported LLM_PROVIDER: {settings.llm_provider}")


def get_embeddings(settings: Settings) -> Embeddings:
    """Return an embeddings model based on settings.embedding_provider.

    Note: Anthropic has no embeddings API, so this is independent of
    LLM_PROVIDER. Changing EMBEDDING_PROVIDER after documents have been
    ingested requires re-ingestion (different vector space).
    """
    match settings.embedding_provider:
        case "huggingface":
            from langchain_huggingface import HuggingFaceEmbeddings

            return HuggingFaceEmbeddings(model_name=settings.embedding_model)
        case "openai":
            from langchain_openai import OpenAIEmbeddings

            return OpenAIEmbeddings(
                model="text-embedding-3-small",
                api_key=settings.openai_api_key,
            )
        case _:
            raise ValueError(
                f"Unsupported EMBEDDING_PROVIDER: {settings.embedding_provider}"
            )

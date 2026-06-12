from functools import lru_cache

from langchain_chroma import Chroma

from app.config import get_settings
from app.llm.factory import get_embeddings


@lru_cache
def get_vectorstore() -> Chroma:
    """Return the (cached) embedded/persistent Chroma vector store.

    Uses langchain-chroma's persistent-client mode -- no separate
    Chroma server/port is required.
    """
    settings = get_settings()
    embeddings = get_embeddings(settings)
    return Chroma(
        collection_name=settings.chroma_collection_name,
        embedding_function=embeddings,
        persist_directory=settings.chroma_persist_dir,
    )

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- LLM provider ---
    llm_provider: Literal["anthropic", "openai", "ollama"] = "ollama"
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-4-5"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "phi3:mini"

    # --- Embeddings ---
    embedding_provider: Literal["huggingface", "openai"] = "huggingface"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # --- Chroma ---
    chroma_persist_dir: str = "./data/chroma"
    chroma_collection_name: str = "rag_documents"

    # --- Database ---
    database_url: str = "sqlite:///./data/app.db"

    # --- Retrieval / chunking ---
    retriever_k: int = 4
    chunk_size: int = 1000
    chunk_overlap: int = 150

    # --- Langfuse ---
    enable_langfuse: bool = False
    langfuse_host: str = "http://localhost:3300"
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None

    # --- RAGAS (optional, future) ---
    enable_ragas_scoring: bool = False

    # --- Uploads ---
    upload_dir: str = "./data/uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()

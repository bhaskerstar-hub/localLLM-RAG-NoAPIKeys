from collections.abc import Generator
from contextlib import contextmanager
from functools import lru_cache

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.db.models import Base

# Columns added to chat_messages after the initial release. Base.metadata.create_all()
# only creates missing tables, not missing columns on existing ones, so add them here
# (cheap, idempotent) instead of pulling in a full migration framework.
_CHAT_MESSAGE_NEW_COLUMNS = {
    "input_tokens": "INTEGER",
    "output_tokens": "INTEGER",
    "total_tokens": "INTEGER",
    "cost_usd": "FLOAT",
}

# Columns added to documents after the initial release (see _CHAT_MESSAGE_NEW_COLUMNS).
_DOCUMENT_NEW_COLUMNS = {
    "is_active": "BOOLEAN DEFAULT 1",
}


@lru_cache
def get_engine() -> Engine:
    settings = get_settings()
    connect_args = (
        {"check_same_thread": False}
        if settings.database_url.startswith("sqlite")
        else {}
    )
    return create_engine(settings.database_url, connect_args=connect_args)


def init_db() -> None:
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    _add_missing_columns(engine, "chat_messages", _CHAT_MESSAGE_NEW_COLUMNS)
    _add_missing_columns(engine, "documents", _DOCUMENT_NEW_COLUMNS)


def _add_missing_columns(engine: Engine, table_name: str, new_columns: dict[str, str]) -> None:
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return

    existing = {col["name"] for col in inspector.get_columns(table_name)}
    missing = {name: sql_type for name, sql_type in new_columns.items() if name not in existing}
    if not missing:
        return

    with engine.begin() as conn:
        for name, sql_type in missing.items():
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {name} {sql_type}"))


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a session, caller is responsible for commit."""
    session_factory = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False)
    db = session_factory()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """Context manager for non-request code paths (e.g. ingestion pipeline).

    Commits on success, rolls back on error.
    """
    session_factory = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False)
    db = session_factory()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

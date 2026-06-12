import hashlib
import uuid
from pathlib import Path

from app.config import Settings, get_settings
from app.db.models import DocumentRecord
from app.db.session import session_scope
from app.ingestion.chunking import chunk_text_documents
from app.ingestion.loaders import load_csv, load_excel, load_pdf, load_webpage
from app.rag.vectorstore import get_vectorstore

EXTENSION_TO_SOURCE_TYPE = {
    ".pdf": "pdf",
    ".xlsx": "excel",
    ".xls": "excel",
    ".csv": "csv",
}


def detect_source_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in EXTENSION_TO_SOURCE_TYPE:
        supported = ", ".join(sorted(EXTENSION_TO_SOURCE_TYPE))
        raise ValueError(f"Unsupported file type '{ext}'. Supported: {supported}")
    return EXTENSION_TO_SOURCE_TYPE[ext]


def _make_chunk_id(source: str, index: int) -> str:
    return hashlib.sha256(f"{source}:{index}".encode()).hexdigest()


def ingest_document(
    *,
    source: str,
    source_type: str,
    file_path: str | None = None,
    settings: Settings | None = None,
) -> dict:
    """Load, chunk, embed, and record a document.

    `source` is the human-readable identifier (original filename or URL)
    used for citations and for generating deterministic chunk IDs.
    `file_path` is required for "pdf" / "excel" / "csv"; for "url" the
    `source` itself is fetched.
    """
    settings = settings or get_settings()

    if source_type == "pdf":
        if not file_path:
            raise ValueError("file_path is required for source_type='pdf'")
        chunks = chunk_text_documents(load_pdf(file_path), settings)
    elif source_type == "excel":
        if not file_path:
            raise ValueError("file_path is required for source_type='excel'")
        chunks = load_excel(file_path, source)
    elif source_type == "csv":
        if not file_path:
            raise ValueError("file_path is required for source_type='csv'")
        chunks = load_csv(file_path, source)
    elif source_type == "url":
        chunks = chunk_text_documents(load_webpage(source), settings)
    else:
        raise ValueError(f"Unsupported source_type: {source_type}")

    if not chunks:
        raise ValueError(f"No content could be extracted from '{source}'")

    for chunk in chunks:
        chunk.metadata["source"] = source

    ids = [_make_chunk_id(source, i) for i in range(len(chunks))]

    vectorstore = get_vectorstore()
    vectorstore.add_documents(chunks, ids=ids)

    document_id = str(uuid.uuid4())
    with session_scope() as db:
        db.add(
            DocumentRecord(
                id=document_id,
                source=source,
                source_type=source_type,
                num_chunks=len(chunks),
                status="ready",
            )
        )

    return {
        "document_id": document_id,
        "source": source,
        "source_type": source_type,
        "num_chunks": len(chunks),
    }

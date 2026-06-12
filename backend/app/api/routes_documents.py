import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile
from sqlalchemy import select

from app.config import get_settings
from app.db.models import DocumentRecord
from app.db.session import session_scope
from app.ingestion.pipeline import detect_source_type, ingest_document
from app.rag.vectorstore import get_vectorstore
from app.schemas.documents import DocumentOut, DocumentUpdate, IngestResponse, IngestUrlRequest

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=IngestResponse)
async def upload_document(file: UploadFile = File(...)) -> IngestResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file has no filename")

    try:
        source_type = detect_source_type(file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    settings = get_settings()
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest = upload_dir / f"{uuid4().hex}_{file.filename}"

    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        result = ingest_document(
            source=file.filename, source_type=source_type, file_path=str(dest)
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return IngestResponse(**result)


@router.post("/url", response_model=IngestResponse)
def ingest_url(payload: IngestUrlRequest) -> IngestResponse:
    try:
        result = ingest_document(source=payload.url, source_type="url")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return IngestResponse(**result)


@router.get("", response_model=list[DocumentOut])
def list_documents() -> list[DocumentOut]:
    with session_scope() as db:
        records = db.scalars(
            select(DocumentRecord).order_by(DocumentRecord.ingested_at.desc())
        ).all()
        return [DocumentOut.model_validate(record) for record in records]


@router.patch("/{document_id}", response_model=DocumentOut)
def update_document(document_id: str, payload: DocumentUpdate) -> DocumentOut:
    with session_scope() as db:
        record = db.get(DocumentRecord, document_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Document not found")
        record.is_active = payload.is_active
        db.flush()
        return DocumentOut.model_validate(record)


@router.delete("/{document_id}")
def delete_document(document_id: str) -> dict:
    with session_scope() as db:
        record = db.get(DocumentRecord, document_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Document not found")
        source = record.source
        db.delete(record)

    get_vectorstore().delete(where={"source": source})

    return {"status": "deleted", "document_id": document_id}

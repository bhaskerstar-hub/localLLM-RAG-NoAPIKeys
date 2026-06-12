import datetime as dt

from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source: str
    source_type: str
    num_chunks: int
    status: str
    is_active: bool
    ingested_at: dt.datetime


class IngestUrlRequest(BaseModel):
    url: str


class DocumentUpdate(BaseModel):
    is_active: bool


class IngestResponse(BaseModel):
    document_id: str
    source: str
    source_type: str
    num_chunks: int

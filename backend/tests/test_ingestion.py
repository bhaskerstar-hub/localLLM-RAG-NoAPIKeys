from unittest.mock import patch

from langchain_core.documents import Document

from app.db.models import DocumentRecord
from app.db.session import session_scope
from app.ingestion.pipeline import detect_source_type, ingest_document
from app.rag.vectorstore import get_vectorstore


def test_detect_source_type():
    assert detect_source_type("report.pdf") == "pdf"
    assert detect_source_type("data.xlsx") == "excel"
    assert detect_source_type("legacy.xls") == "excel"
    assert detect_source_type("table.csv") == "csv"


def test_detect_source_type_unsupported():
    try:
        detect_source_type("notes.txt")
        raise AssertionError("expected ValueError")
    except ValueError:
        pass


def _assert_document_record(document_id: str, expected_chunks: int) -> None:
    with session_scope() as db:
        record = db.get(DocumentRecord, document_id)
        assert record is not None
        assert record.num_chunks == expected_chunks
        assert record.status == "ready"


def test_ingest_pdf(isolated_settings, sample_pdf):
    vectorstore = get_vectorstore()
    before = vectorstore._collection.count()

    result = ingest_document(source="sample.pdf", source_type="pdf", file_path=sample_pdf)

    assert result["source_type"] == "pdf"
    assert result["num_chunks"] > 0
    assert vectorstore._collection.count() == before + result["num_chunks"]
    _assert_document_record(result["document_id"], result["num_chunks"])

    # Citations should reference the human-readable source name.
    hits = vectorstore.similarity_search("LangChain", k=1)
    assert hits[0].metadata["source"] == "sample.pdf"


def test_ingest_excel_per_sheet_chunks(isolated_settings, sample_excel):
    vectorstore = get_vectorstore()
    before = vectorstore._collection.count()

    result = ingest_document(source="sample.xlsx", source_type="excel", file_path=sample_excel)

    assert result["source_type"] == "excel"
    # 2 sheets, each with 2 rows (< ROWS_PER_CHUNK=50) -> 1 chunk per sheet.
    assert result["num_chunks"] == 2
    assert vectorstore._collection.count() == before + 2
    _assert_document_record(result["document_id"], 2)

    hits = vectorstore.similarity_search("Widget Gadget price", k=1)
    assert hits[0].metadata["sheet"] == "Products"


def test_ingest_csv(isolated_settings, sample_csv):
    vectorstore = get_vectorstore()
    before = vectorstore._collection.count()

    result = ingest_document(source="sample.csv", source_type="csv", file_path=sample_csv)

    assert result["source_type"] == "csv"
    assert result["num_chunks"] == 1
    assert vectorstore._collection.count() == before + 1
    _assert_document_record(result["document_id"], 1)


def test_ingest_url(isolated_settings):
    vectorstore = get_vectorstore()
    before = vectorstore._collection.count()

    fake_doc = Document(
        page_content="Example Domain. This domain is for use in illustrative examples.",
        metadata={"source": "https://example.com", "title": "Example Domain"},
    )
    with patch("app.ingestion.pipeline.load_webpage", return_value=[fake_doc]):
        result = ingest_document(source="https://example.com", source_type="url")

    assert result["source_type"] == "url"
    assert result["num_chunks"] >= 1
    assert vectorstore._collection.count() == before + result["num_chunks"]
    _assert_document_record(result["document_id"], result["num_chunks"])

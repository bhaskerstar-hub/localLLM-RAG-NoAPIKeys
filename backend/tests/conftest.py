import pandas as pd
import pytest
from fpdf import FPDF

from app.config import get_settings
from app.db.session import get_engine, init_db
from app.observability.langfuse_client import get_langfuse_client
from app.rag.vectorstore import get_vectorstore


@pytest.fixture
def isolated_settings(tmp_path, monkeypatch):
    """Point Chroma + SQLite at a temp directory and reset cached singletons."""
    monkeypatch.setenv("CHROMA_PERSIST_DIR", str(tmp_path / "chroma"))
    monkeypatch.setenv("CHROMA_COLLECTION_NAME", "test_collection")
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/test.db")
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path / "uploads"))

    get_settings.cache_clear()
    get_vectorstore.cache_clear()
    get_engine.cache_clear()
    get_langfuse_client.cache_clear()

    init_db()
    yield get_settings()

    get_settings.cache_clear()
    get_vectorstore.cache_clear()
    get_engine.cache_clear()
    get_langfuse_client.cache_clear()


@pytest.fixture
def sample_pdf(tmp_path):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)
    pdf.multi_cell(
        0,
        10,
        "LangChain is a framework for building applications powered by "
        "large language models.\nThis PDF fixture is used for ingestion "
        "pipeline testing.",
    )
    path = tmp_path / "sample.pdf"
    pdf.output(str(path))
    return str(path)


@pytest.fixture
def sample_excel(tmp_path):
    path = tmp_path / "sample.xlsx"
    with pd.ExcelWriter(path) as writer:
        pd.DataFrame({"name": ["Alice", "Bob"], "score": [90, 85]}).to_excel(
            writer, sheet_name="Scores", index=False
        )
        pd.DataFrame(
            {"product": ["Widget", "Gadget"], "price": [9.99, 19.99]}
        ).to_excel(writer, sheet_name="Products", index=False)
    return str(path)


@pytest.fixture
def sample_csv(tmp_path):
    path = tmp_path / "sample.csv"
    pd.DataFrame({"city": ["New York", "Los Angeles"], "population": [8000000, 4000000]}).to_csv(
        path, index=False
    )
    return str(path)

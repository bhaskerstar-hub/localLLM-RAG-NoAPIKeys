import os

import pandas as pd
from langchain_core.documents import Document

# WebBaseLoader emits a warning if no User-Agent is configured.
os.environ.setdefault("USER_AGENT", "enterprise-rag-platform/0.1")

ROWS_PER_CHUNK = 50


def load_pdf(file_path: str) -> list[Document]:
    """Load a PDF as one Document per page (metadata includes 'page')."""
    from langchain_community.document_loaders import PyPDFLoader

    return PyPDFLoader(file_path).load()


def load_webpage(url: str) -> list[Document]:
    """Load a webpage as a single Document (metadata includes 'source')."""
    from langchain_community.document_loaders import WebBaseLoader

    return WebBaseLoader(url).load()


def _dataframe_to_documents(
    df: pd.DataFrame, source: str, extra_metadata: dict | None = None
) -> list[Document]:
    documents = []
    for start in range(0, len(df), ROWS_PER_CHUNK):
        batch = df.iloc[start : start + ROWS_PER_CHUNK]
        text = batch.to_markdown(index=False)
        metadata = {
            "source": source,
            "row_start": int(start),
            "row_end": int(start + len(batch) - 1),
            **(extra_metadata or {}),
        }
        documents.append(Document(page_content=text, metadata=metadata))
    return documents


def load_excel(file_path: str, source: str) -> list[Document]:
    """Load an Excel workbook as row-batch Documents, one set per sheet.

    Each chunk renders ~50 rows as a markdown table with the header row
    repeated, so retrieved chunks remain self-describing.
    """
    sheets = pd.read_excel(file_path, sheet_name=None)
    documents: list[Document] = []
    for sheet_name, df in sheets.items():
        if df.empty:
            continue
        documents.extend(
            _dataframe_to_documents(df, source, extra_metadata={"sheet": str(sheet_name)})
        )
    return documents


def load_csv(file_path: str, source: str) -> list[Document]:
    """Load a CSV as row-batch Documents (~50 rows per chunk)."""
    df = pd.read_csv(file_path)
    if df.empty:
        return []
    return _dataframe_to_documents(df, source)

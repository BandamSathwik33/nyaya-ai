"""PDF document loader for NyayaAI legal documents using PyMuPDF."""

import logging
from pathlib import Path
from typing import List, Optional

import pymupdf
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


def derive_document_title(file_path: Path) -> str:
    """Derives a clean document title dynamically from the filename.
    
    Examples:
        BNS.pdf -> BNS
        BNS_2023.pdf -> BNS 2023
        a2023-45.pdf -> A2023-45
    """
    stem = file_path.stem
    return stem.replace("_", " ").strip()


def load_pdf(file_path: Path | str) -> List[Document]:
    """Extracts text page-by-page from a PDF file using PyMuPDF.
    
    Args:
        file_path: Path to the PDF file.
        
    Returns:
        List of Document objects, one for each page containing text.
    """
    path = Path(file_path)
    if not path.is_file():
        logger.error(f"File not found: {path}")
        raise FileNotFoundError(f"PDF file does not exist: {path}")

    documents: List[Document] = []
    doc_title = derive_document_title(path)
    
    try:
        pdf_doc = pymupdf.open(path)
        total_pages = len(pdf_doc)
        
        if total_pages == 0:
            logger.warning(f"PDF file '{path.name}' has 0 pages.")
            return documents
            
        extracted_pages = 0
        for page_idx in range(total_pages):
            page = pdf_doc[page_idx]
            text = page.get_text() or ""
            text = text.strip()
            
            if not text:
                continue
                
            metadata = {
                "source": path.name,
                "file_path": str(path.resolve()),
                "page": page_idx + 1,
                "total_pages": total_pages,
                "document_name": doc_title,
            }
            
            documents.append(Document(page_content=text, metadata=metadata))
            extracted_pages += 1
            
        pdf_doc.close()
        logger.info(f"Loaded '{path.name}': {extracted_pages}/{total_pages} text pages extracted.")
        return documents
        
    except Exception as e:
        logger.error(f"Failed to extract text from '{path.name}': {e}", exc_info=True)
        raise RuntimeError(f"Error processing PDF '{path.name}': {e}") from e


def load_all_pdfs(data_dir: Path | str) -> List[Document]:
    """Discovers and extracts text from all PDF files in the specified directory.
    
    Args:
        data_dir: Directory containing legal PDF documents.
        
    Returns:
        List of Document objects representing extracted pages from all discovered PDFs.
    """
    dir_path = Path(data_dir)
    if not dir_path.exists():
        logger.error(f"Data directory does not exist: {dir_path.resolve()}")
        raise FileNotFoundError(f"Data directory not found: {dir_path.resolve()}")

    # Discover all PDF files regardless of case (.pdf, .PDF)
    pdf_files = sorted(list(dir_path.glob("*.pdf")) + list(dir_path.glob("*.PDF")))
    # Eliminate potential duplicates from case-insensitive filesystems
    unique_pdf_files = sorted(list({p.resolve(): p for p in pdf_files}.values()))

    if not unique_pdf_files:
        logger.warning(f"No PDF files found in data directory: {dir_path.resolve()}")
        return []

    logger.info(f"Found {len(unique_pdf_files)} PDF file(s) in '{dir_path}': {[f.name for f in unique_pdf_files]}")

    all_documents: List[Document] = []
    for pdf_file in unique_pdf_files:
        try:
            docs = load_pdf(pdf_file)
            all_documents.extend(docs)
        except Exception as e:
            logger.warning(f"Skipping corrupted or unreadable PDF '{pdf_file.name}': {e}")
            continue

    logger.info(f"Total pages extracted across all documents: {len(all_documents)}")
    return all_documents

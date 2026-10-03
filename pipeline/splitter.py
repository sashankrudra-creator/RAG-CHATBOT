from langchain_text_splitters import RecursiveCharacterTextSplitter
from loader import load_pdf


def split_documents():
    documents = load_pdf()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )

    chunks = splitter.split_documents(documents)

    return chunks
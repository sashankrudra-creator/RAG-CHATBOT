from langchain_chroma import Chroma
from splitter import split_documents
from embeddings import get_embeddings


def create_vectorstore():
    chunks = split_documents()
    embeddings = get_embeddings()

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory="./chroma_db"
    )

    return vectorstore
from langchain_chroma import Chroma
from embeddings import get_embeddings


def get_retriever():
    embeddings = get_embeddings()

    vectorstore = Chroma(
        persist_directory="./chroma_db",
        embedding_function=embeddings
    )

    retriever = vectorstore.as_retriever(
        search_kwargs={"k": 3}
    )

    return retriever
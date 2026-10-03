from retriever import get_retriever
from generator import generate_answer


def ask_question(question):
    retriever = get_retriever()

    documents = retriever.invoke(question)

    context = "\n\n".join(
        document.page_content
        for document in documents
    )

    answer = generate_answer(question, context)

    sources = []

    for document in documents:
        source = document.metadata.get("source", "Unknown")
        page = document.metadata.get("page", 0) + 1

        sources.append({
            "document": source.split("\\")[-1],
            "page": page
        })

    return {
        "answer": answer,
        "sources": sources
    }
from rag_pipeline import ask_question


question = input("Ask a question: ")

result = ask_question(question)

print("\nANSWER:")
print(result["answer"])

print("\nSOURCES:")

for source in result["sources"]:
    print(f"- {source['document']} | Page {source['page']}")
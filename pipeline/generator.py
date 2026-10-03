import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv(dotenv_path=".env")


def get_llm():
    return ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
    google_api_key=os.getenv("GEMINI_API_KEY")
)


def generate_answer(question, context):
    llm = get_llm()

    prompt = f"""
You are a company policy assistant.

Answer the question ONLY using the policy context below.

If the answer is not present in the context, say:
"I could not find this information in the available company policies."

Do not make up information.

Policy Context:
{context}

Question:
{question}
"""

    response = llm.invoke(prompt)

    return response.content
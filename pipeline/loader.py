from langchain_community.document_loaders import PyPDFLoader

PDF_PATH = "documents/B.Tech_AIML_Syllabus_AR23 (1).pdf"


def load_pdf():
    loader = PyPDFLoader(PDF_PATH)
    documents = loader.load()

    return documents
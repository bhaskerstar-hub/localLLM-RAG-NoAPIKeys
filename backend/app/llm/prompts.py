from langchain_core.prompts import ChatPromptTemplate

RAG_SYSTEM_PROMPT = """You are an enterprise knowledge assistant. Answer the user's \
question using ONLY the information given in the context below.

- If the context does not contain enough information to answer, say so clearly \
instead of guessing.
- When you use information from the context, cite it inline using its bracketed \
number, e.g. [1] or [2].
- Be concise and accurate.

Context:
{context}"""

RAG_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", RAG_SYSTEM_PROMPT),
        ("human", "{question}"),
    ]
)

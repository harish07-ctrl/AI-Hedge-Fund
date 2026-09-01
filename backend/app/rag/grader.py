"""Hallucination grader — checks if an answer is grounded in retrieved documents."""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.config import get_llm

GRADER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a grading assistant. You will be given a set of SOURCE "
            "documents and a generated ANSWER. Determine whether the answer is "
            "grounded in / supported by the source documents.\n\n"
            "Return JSON with two keys:\n"
            '  "grounded": true/false — is the answer supported by sources?\n'
            '  "confidence": 0.0-1.0 — how confident are you?\n'
            '  "explanation": brief explanation of your grading',
        ),
        (
            "human",
            "SOURCE DOCUMENTS:\n{sources}\n\n---\n\nGENERATED ANSWER:\n{answer}",
        ),
    ]
)


async def grade_answer(
    answer: str, source_docs: list[dict]
) -> dict:
    """Check if a generated answer is grounded in source documents.

    Returns:
        dict with keys: grounded (bool), confidence (float), explanation (str)
    """
    sources_text = "\n\n".join(
        f"[Source {i+1}]: {doc['content']}" for i, doc in enumerate(source_docs)
    )

    llm = get_llm()
    chain = GRADER_PROMPT | llm | JsonOutputParser()

    try:
        result = await chain.ainvoke(
            {"sources": sources_text, "answer": answer}
        )
        return {
            "grounded": result.get("grounded", False),
            "confidence": result.get("confidence", 0.0),
            "explanation": result.get("explanation", ""),
        }
    except Exception as e:
        return {
            "grounded": False,
            "confidence": 0.0,
            "explanation": f"Grading failed: {str(e)}",
        }

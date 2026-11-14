from .llm_service import LLMService


def answer(message: str) -> str:
    return LLMService().generate(message)

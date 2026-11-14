from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.ai.chat_service import answer
from app.ai.llm_service import LLMConfigurationError, LLMGenerationError
from app.models.user import User
from app.utils.dependencies import current_user

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


@router.post("")
def chat(payload: ChatRequest, _user: User = Depends(current_user)):
    try:
        return {"reply": answer(payload.message)}
    except LLMConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except LLMGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc



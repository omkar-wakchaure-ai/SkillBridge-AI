from app.config.settings import settings
from app.ai.gemini_client import create_gemini_client

SYSTEM_INSTRUCTION = (
    "You are an expert AI Career and Learning Navigator. Provide concise, "
    "actionable advice to help the user learn new skills and navigate their "
    "career path."
)


class LLMConfigurationError(Exception):
    """Raised when the Gemini client is not configured."""


class LLMGenerationError(Exception):
    """Raised when Gemini cannot produce a usable chat response."""


class LLMService:
    def generate(self, message: str) -> str:
        if not settings.gemini_api_key:
            raise LLMConfigurationError(
                "Gemini is not configured. Set GEMINI_API_KEY in the backend .env file."
            )

        try:
            client = create_gemini_client(settings.gemini_api_key)
        except ImportError as exc:
            raise LLMConfigurationError(
                "The google-genai package is not installed on the server."
            ) from exc

        try:
            with client:
                interaction = client.interactions.create(
                    model=settings.gemini_model,
                    input=message,
                    system_instruction=SYSTEM_INSTRUCTION,
                    generation_config={
                        "max_output_tokens": 500,
                        "thinking_level": "low",
                    },
                    store=False,
                )
                text = interaction.output_text
        except Exception as exc:
            raise LLMGenerationError(
                "Gemini could not generate a response. Please try again."
            ) from exc

        if not isinstance(text, str) or not text.strip():
            raise LLMGenerationError(
                "Gemini returned an empty response. Please try again."
            )

        return text.strip()

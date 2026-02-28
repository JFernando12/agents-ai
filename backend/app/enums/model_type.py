from enum import Enum

class ModelType(Enum):
    """Available Claude models for AI services."""
    CLAUDE_SONNET_4_6 = "claude-sonnet-4-6"
    CLAUDE_SONNET_4_5 = "claude-sonnet-4-5"
    CLAUDE_SONNET_4 = "claude-sonnet-4"
    CLAUDE_SONNET_3_7 = "claude-sonnet-3.7"
    CLAUDE_HAIKU_4_5 = "claude-haiku-4-5"
    CLAUDE_HAIKU_3_5 = "claude-haiku-3.5"

    @classmethod
    def get_model_id(cls, model_type: 'ModelType') -> str:
        """Get the actual AWS Bedrock model ID for a given model type."""
        model_mapping = {
            cls.CLAUDE_SONNET_4_6: "us.anthropic.claude-sonnet-4-6",
            cls.CLAUDE_SONNET_4_5: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
            cls.CLAUDE_SONNET_4: "us.anthropic.claude-sonnet-4-20250514-v1:0",
            cls.CLAUDE_SONNET_3_7: "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
            cls.CLAUDE_HAIKU_4_5: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
            cls.CLAUDE_HAIKU_3_5: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
        }
        return model_mapping[model_type]

    @classmethod
    def get_all_options(cls) -> dict[str, str]:
        """Get all available model options as a dictionary."""
        return {
            cls.CLAUDE_SONNET_4_6.value: cls.get_model_id(cls.CLAUDE_SONNET_4_6),
            cls.CLAUDE_SONNET_4_5.value: cls.get_model_id(cls.CLAUDE_SONNET_4_5),
            cls.CLAUDE_SONNET_4.value: cls.get_model_id(cls.CLAUDE_SONNET_4),
            cls.CLAUDE_SONNET_3_7.value: cls.get_model_id(cls.CLAUDE_SONNET_3_7),
            cls.CLAUDE_HAIKU_4_5.value: cls.get_model_id(cls.CLAUDE_HAIKU_4_5),
            cls.CLAUDE_HAIKU_3_5.value: cls.get_model_id(cls.CLAUDE_HAIKU_3_5),
        }

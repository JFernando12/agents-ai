from app.models import CreateLog
from app.repositories import log_repository

class LoggerService:
    def save_log(self, log_data: CreateLog):
        before_state = log_data.agent_before_state
        after_state = log_data.agent_after_state

        different_fields = []
        fields_to_ignore = {'updated_at', 'created_at'}

        if before_state and after_state:
            for field in before_state.model_fields_set:
                if field not in fields_to_ignore:
                    if getattr(before_state, field) != getattr(after_state, field):
                        different_fields.append(field)

        action  = log_data.action
        if action == "CREATE_AGENT":
            log_data.detail = "Agente creado exitosamente."

        elif action == "UPDATE_AGENT" and before_state and after_state:
            log_data.detail = f"Se modificó: {', '.join(different_fields)}"

        elif action == "DELETE_AGENT":
            log_data.detail = "Agente eliminado exitosamente."

        log_repository.save(log_data)

logger_service = LoggerService()
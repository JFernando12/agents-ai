import requests
from typing import Any

def create_jira_ticket(titulo: str, cuerpo: str, correo: str, nombre: str) -> dict[str, Any]:
    try:
        print(f"[TOOL EXECUTED] create_jira_ticket - Titulo: '{titulo}', Correo: '{correo}'")
        
        # Call CPA Vision Jira API
        url = "https://access.cpavision.mx/api/creaTicketJiraProcess"
        
        # Prepare form data
        form_data = {
            'titulo': titulo,
            'cuerpo': cuerpo,
            'correo': correo,
            'nombre': nombre
        }
        
        response = requests.post(url, data=form_data, timeout=30)
        response.raise_for_status()
        
        # Try to parse JSON response, if available
        try:
            result = response.json()
        except ValueError:
            result = {'message': response.text}
        
        ticket_info = {
            'success': True,
            'titulo': titulo,
            'correo': correo,
            'nombre': nombre,
            'response': result
        }
        
        print(f"[TOOL SUCCESS] Jira ticket created: '{titulo}' for {nombre}")
        
        return ticket_info
        
    except requests.RequestException as e:
        print(f"[TOOL ERROR] create_jira_ticket failed: {str(e)}")
        return {
            'success': False,
            'error': f"No se pudo crear el ticket de Jira: {str(e)}",
            'titulo': titulo
        }
    except Exception as e:
        print(f"[TOOL ERROR] create_jira_ticket unexpected error: {str(e)}")
        return {
            'success': False,
            'error': f"Error inesperado al crear ticket: {str(e)}",
            'titulo': titulo
        }

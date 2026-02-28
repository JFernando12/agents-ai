AVAILABLE_TOOLS = [
    {
        "translation": "Crear Ticket de Jira",
        "toolSpec": {
            "name": "create_jira_ticket",
            "description": "Crea un ticket en Jira a través de la API de CPA Vision. Útil cuando el usuario necesita reportar un problema, solicitar soporte o crear una tarea.",
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "titulo": {
                            "type": "string",
                            "description": "Título del ticket de Jira (resumen del problema o solicitud)"
                        },
                        "cuerpo": {
                            "type": "string",
                            "description": "Descripción detallada del ticket (problema, detalles, pasos a reproducir, etc.)"
                        },
                        "correo": {
                            "type": "string",
                            "description": "Correo electrónico de la persona que crea el ticket"
                        },
                        "nombre": {
                            "type": "string",
                            "description": "Nombre completo de la persona que crea el ticket"
                        }
                    },
                    "required": ["titulo", "cuerpo", "correo", "nombre"]
                }
            }
        }
    },
    {
        "translation": "Consulta Pedimentos",
        "toolSpec": {
            "name": "consulta_pedimentos",
            "description": "Consulta el listado de pedimentos a través de la API de CPA Vision. Retorna información detallada de los pedimentos incluyendo número, fechas, valores, monedas, y datos relacionados con el comercio exterior.",
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "periodo": {
                            "type": "integer",
                            "description": "Mes del periodo a consultar (1-12)"
                        },
                        "ejercicio": {
                            "type": "integer",
                            "description": "Año del ejercicio fiscal (ej. 2025)"
                        },
                        "tax_id_proveedor": {
                            "type": "string",
                            "description": "RFC o Tax ID del proveedor. Al menos uno de tax_id_proveedor o razon_social debe estar presente."
                        },
                        "razon_social": {
                            "type": "string",
                            "description": "Razón social del proveedor. Al menos uno de tax_id_proveedor o razon_social debe estar presente."
                        }
                    },
                    "required": ["periodo", "ejercicio"]
                }
            }
        }
    }
]

def get_tool_specs(tool_names: list[str]) -> list[dict]:
    return [{"toolSpec": tool["toolSpec"]} for tool in AVAILABLE_TOOLS if tool["toolSpec"]["name"] in tool_names]

def get_tool_translations() -> list[dict]:
    return [{"name": tool["toolSpec"]["name"], "translation": tool["translation"]} for tool in AVAILABLE_TOOLS]
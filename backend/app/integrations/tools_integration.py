import requests
from typing import Any

from app.models import ToolResult
from app.repositories import tool_repository


class ToolsIntegration:
    """Generic HTTP executor for tools stored in DynamoDB.
    
    Reads tool configuration (URL, method, headers) from the database
    and executes the corresponding HTTP request with the parameters
    provided by the LLM.
    """

    def execute_tool(
        self,
        tool_name: str,
        parameters: dict[str, Any],
        tool_ids: list[str],
        whatsapp_context: dict[str, str] | None = None,
    ) -> ToolResult:
        try:
            # Look up tool config from DB using the agent's assigned tool IDs
            tools = tool_repository.get_by_ids(tool_ids)
            tool_config = next((t for t in tools if t.name == tool_name), None)

            if not tool_config:
                return ToolResult(
                    tool_name=tool_name,
                    success=False,
                    result=None,
                    error=f"Tool '{tool_name}' not found in assigned tools"
                )

            method = tool_config.method.upper()
            url = tool_config.url
            headers = tool_config.headers or {}

            # Resolve {param} templates in the URL from LLM-provided parameters.
            # Parameters consumed here are stripped from the query string / body
            # so the external system does not receive them twice.
            remaining_params: dict[str, Any] = {}
            for k, v in parameters.items():
                if f"{{{k}}}" in url:
                    url = url.replace(f"{{{k}}}", str(v))
                else:
                    remaining_params[k] = v
            parameters = remaining_params

            # Resolve WhatsApp context placeholders ({_session_id}, {_channel_id},
            # {_from_phone}) in the URL and silently inject them into the body
            # for POST / PUT / PATCH requests.
            if whatsapp_context:
                ctx = {
                    "_session_id": whatsapp_context.get("session_id", ""),
                    "_channel_id": whatsapp_context.get("channel_id", ""),
                    "whatsapp_phone": whatsapp_context.get("from_phone", ""),
                }
                for placeholder, value in ctx.items():
                    url = url.replace(f"{{{placeholder}}}", value)
                if method in ("POST", "PUT", "PATCH"):
                    parameters = {**parameters, **ctx}

            print(f"[TOOL EXECUTED] {tool_name} → {method} {url} | params: {parameters}")

            # Determine body encoding: form-encoded if Content-Type header says so, otherwise JSON
            content_type = headers.get('Content-Type', headers.get('content-type', ''))
            use_form_encoding = 'application/x-www-form-urlencoded' in content_type

            if method == 'GET':
                response = requests.get(url, params=parameters, headers=headers, timeout=30)
            elif method == 'POST':
                if use_form_encoding:
                    response = requests.post(url, data=parameters, headers=headers, timeout=30)
                else:
                    response = requests.post(url, json=parameters, headers=headers, timeout=30)
            elif method == 'PUT':
                if use_form_encoding:
                    response = requests.put(url, data=parameters, headers=headers, timeout=30)
                else:
                    response = requests.put(url, json=parameters, headers=headers, timeout=30)
            elif method == 'PATCH':
                if use_form_encoding:
                    response = requests.patch(url, data=parameters, headers=headers, timeout=30)
                else:
                    response = requests.patch(url, json=parameters, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, json=parameters, headers=headers, timeout=30)
            else:
                return ToolResult(
                    tool_name=tool_name,
                    success=False,
                    result=None,
                    error=f"Unsupported HTTP method '{method}' for tool '{tool_name}'"
                )

            # Handle expected validation errors gracefully
            if response.status_code == 422:
                result = response.json()
                print(f"[TOOL VALIDATION ERROR] {tool_name}: {result}")
                return ToolResult(
                    tool_name=tool_name,
                    success=False,
                    result=result,
                    error=result.get('message', 'Validation error')
                )

            response.raise_for_status()

            try:
                result = response.json()
            except ValueError:
                result = {'message': response.text}

            print(f"[TOOL SUCCESS] {tool_name} completed")

            return ToolResult(
                tool_name=tool_name,
                success=True,
                result=result,
                error=None
            )

        except requests.RequestException as e:
            print(f"[TOOL ERROR] {tool_name} request failed: {e}")
            return ToolResult(
                tool_name=tool_name,
                success=False,
                result=None,
                error=f"HTTP request failed: {str(e)}"
            )
        except Exception as e:
            print(f"[TOOL ERROR] {tool_name} unexpected error: {e}")
            return ToolResult(
                tool_name=tool_name,
                success=False,
                result=None,
                error=str(e)
            )


tools_integration = ToolsIntegration()

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.middleware import get_current_user, require_roles
from app.utils import success_response
from app.services import tool_service
from app.models import User, ToolCreate, ToolUpdate, ParseToolDocsRequest

tool_router = APIRouter(tags=["tools"], prefix="/tools")


@tool_router.post("/parse-docs")
def parse_tool_docs(
    body: ParseToolDocsRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        parsed = tool_service.parse_docs(body.docs)
        return JSONResponse(
            status_code=200,
            content=success_response(parsed, "Docs parsed successfully")
        )
    except Exception as e:
        return JSONResponse(
            status_code=422,
            content={"error": f"No se pudo interpretar la documentación: {str(e)}"}
        )


@tool_router.get("/")
def get_all_tools(
    limit: int | None = Query(default=None, ge=1, le=500, description="Items per page. Omit to fetch all."),
    cursor: str | None = Query(default=None, description="Pagination cursor returned by the previous call."),
    current_user: User = Depends(get_current_user),
):
    result = tool_service.get_all(limit=limit, cursor=cursor, account_id=current_user.account_id)
    return JSONResponse(
        status_code=200,
        content=success_response(result, "Tools retrieved successfully")
    )


@tool_router.get("/{tool_id}")
def get_tool(
    tool_id: str,
    current_user: User = Depends(get_current_user)
):
    tool = tool_service.get_one(tool_id)
    if not tool:
        return JSONResponse(status_code=404, content={"error": "Tool not found"})
    return JSONResponse(
        status_code=200,
        content=success_response(tool, "Tool retrieved successfully")
    )


@tool_router.post("/")
def create_tool(
    tool_data: ToolCreate,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin"))
):
    tool_id = tool_service.create(tool_data, account_id=current_user.account_id)
    if not tool_id:
        return JSONResponse(status_code=500, content={"error": "Failed to create tool"})
    return JSONResponse(
        status_code=201,
        content=success_response({"id": tool_id}, "Tool created successfully")
    )


@tool_router.put("/{tool_id}")
def update_tool(
    tool_id: str,
    tool_data: ToolUpdate,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin"))
):
    updated = tool_service.update(tool_id, tool_data)
    if not updated:
        return JSONResponse(status_code=404, content={"error": "Tool not found"})
    return JSONResponse(
        status_code=200,
        content=success_response(None, "Tool updated successfully")
    )


@tool_router.delete("/{tool_id}")
def delete_tool(
    tool_id: str,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin"))
):
    deleted = tool_service.delete(tool_id)
    if not deleted:
        return JSONResponse(status_code=404, content={"error": "Tool not found"})
    return JSONResponse(
        status_code=200,
        content=success_response(None, "Tool deleted successfully")
    )

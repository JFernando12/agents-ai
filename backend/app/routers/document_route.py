from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.middleware import get_current_user
from app.utils import success_response, error_response
from app.services import document_service
from app.models import DocumentUpload, DocumentUpdate

document_router = APIRouter(tags=["documents"], prefix="/documents")

@document_router.get("/")
def get_documents(agent_id: str, current_user=Depends(get_current_user)):
    documents = document_service.get_all(agent_id=agent_id)
    
    return JSONResponse(
        status_code=200,
        content=success_response(data=documents, message="Documents retrieved successfully.")
    )

@document_router.get("/{document_id}")
def get_document(document_id: str, current_user=Depends(get_current_user)):
    document = document_service.get_one(document_id=document_id)

    if not document:
        return JSONResponse(
            status_code=404,
            content=error_response("Document not found.")
        )
    
    return JSONResponse(
        status_code=200,
        content=success_response(data=document, message="Document retrieved successfully.")
    )

@document_router.post("/")
def upload_document(
    document_data: DocumentUpload,
    current_user=Depends(get_current_user)
):
    print("Uploading document:", document_data)
    result = document_service.upload(document_data)

    if not result:
        return JSONResponse(
            status_code=400,
            content=error_response(message="Failed to initiate document upload.")
        )
    
    return JSONResponse(
        status_code=200,
        content=success_response(data=result, message="Document upload initiated successfully.")
    )

@document_router.put("/{document_id}")
def update_document(
    document_id: str,
    document_data: DocumentUpdate,
    current_user=Depends(get_current_user)
):
    success = document_service.update(document_id, document_data)
    
    if not success:
        return JSONResponse(
            status_code=400,
            content=error_response(message="Failed to update document.")
        )
    
    return JSONResponse(
        status_code=200,
        content=success_response(message="Document updated successfully.")
    )

@document_router.delete("/{document_id}")
def delete_document(document_id: str, current_user=Depends(get_current_user)):
    success = document_service.delete(document_id)
    
    if not success:
        return JSONResponse(
            status_code=400,
            content=error_response(message="Failed to delete document.")
        )
    
    return JSONResponse(
        status_code=200,
        content=success_response(message="Document deleted successfully.")
    )

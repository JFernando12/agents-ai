from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.models import LoginRequest, AccountCreate
from app.services import auth_service
from app.utils import success_response, error_response

auth_router = APIRouter(tags=["auth"], prefix="/auth")


@auth_router.post("/register")
def register(register_data: AccountCreate):
    """
    Self-signup: creates a new account and its first admin user.
    Returns a JWT on success.
    """
    result = auth_service.register(register_data)
    if not result:
        return JSONResponse(
            status_code=409,
            content=error_response("Email is already registered"),
        )
    return JSONResponse(
        status_code=201,
        content=success_response(result.model_dump(mode="json"), "Account created successfully"),
    )


@auth_router.post("/login")
def login(login_data: LoginRequest):
    """Authenticate with email + password. Returns a JWT."""
    result = auth_service.login(login_data)
    if not result:
        return JSONResponse(
            status_code=401,
            content=error_response("Invalid credentials or inactive account"),
        )
    return JSONResponse(
        status_code=200,
        content=success_response(result.model_dump(mode="json"), "Login successful"),
    )

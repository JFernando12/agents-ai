from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.middleware import get_current_user, require_roles
from app.models import (
    User, AccountUpdate,
    UserCreate, UserUpdate, UserResetPassword,
)
from app.services import account_service
from app.utils import success_response, error_response

account_router = APIRouter(tags=["accounts"], prefix="/accounts")

# ------------------------------------------------------------------ #
# Account-level endpoints  (super_admin only)
# ------------------------------------------------------------------ #

@account_router.get("/")
def list_accounts(current_user: User = Depends(require_roles("super_admin"))):
    accounts = account_service.get_all_accounts()
    return JSONResponse(
        status_code=200,
        content=success_response(accounts, "Accounts retrieved successfully"),
    )


@account_router.get("/me")
def get_my_account(current_user: User = Depends(get_current_user)):
    """Return the account of the authenticated user."""
    account = account_service.get_account(current_user.account_id)
    if not account:
        return JSONResponse(
            status_code=404,
            content=error_response("Account not found"),
        )
    return JSONResponse(
        status_code=200,
        content=success_response(account, "Account retrieved successfully"),
    )


@account_router.put("/me")
def update_my_account(
    account_data: AccountUpdate,
    current_user: User = Depends(require_roles("super_admin", "owner")),
):
    """Owner can update their own account name."""
    # Non-super_admin owners can only change the account name
    if current_user.role == "owner":
        account_data = AccountUpdate(name=account_data.name)
    success = account_service.update_account(current_user.account_id, account_data)
    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response("Account not found or update failed"),
        )
    return JSONResponse(
        status_code=200,
        content=success_response(None, "Account updated successfully"),
    )


@account_router.get("/{account_id}")
def get_account(
    account_id: str,
    current_user: User = Depends(require_roles("super_admin")),
):
    account = account_service.get_account(account_id)
    if not account:
        return JSONResponse(
            status_code=404,
            content=error_response("Account not found"),
        )
    return JSONResponse(
        status_code=200,
        content=success_response(account, "Account retrieved successfully"),
    )


@account_router.put("/{account_id}")
def update_account(
    account_id: str,
    account_data: AccountUpdate,
    current_user: User = Depends(require_roles("super_admin")),
):
    success = account_service.update_account(account_id, account_data)
    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response("Account not found or update failed"),
        )
    return JSONResponse(
        status_code=200,
        content=success_response(None, "Account updated successfully"),
    )


@account_router.delete("/{account_id}")
def delete_account(
    account_id: str,
    current_user: User = Depends(require_roles("super_admin")),
):
    success = account_service.delete_account(account_id)
    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response("Account not found"),
        )
    return JSONResponse(
        status_code=200,
        content=success_response(None, "Account deleted successfully"),
    )


# ------------------------------------------------------------------ #
# User management within an account  (admin or super_admin)
# ------------------------------------------------------------------ #

def _assert_account_access(current_user: User, account_id: str):
    """Ensure a user can access the given account."""
    if current_user.role == "super_admin":
        return  # super_admin can access all accounts
    if current_user.account_id != account_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access to this account is not allowed")


@account_router.get("/{account_id}/users")
def list_users(
    account_id: str,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin")),
):
    _assert_account_access(current_user, account_id)
    users = account_service.get_users(account_id)
    return JSONResponse(
        status_code=200,
        content=success_response(users, "Users retrieved successfully"),
    )


@account_router.post("/{account_id}/users")
def create_user(
    account_id: str,
    user_data: UserCreate,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin")),
):
    _assert_account_access(current_user, account_id)
    user = account_service.create_user(account_id, user_data, current_user)
    if not user:
        return JSONResponse(
            status_code=409,
            content=error_response("Email already in use or role not allowed"),
        )
    return JSONResponse(
        status_code=201,
        content=success_response(user, "User created successfully"),
    )


@account_router.get("/{account_id}/users/{user_id}")
def get_user(
    account_id: str,
    user_id: str,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin")),
):
    _assert_account_access(current_user, account_id)
    user = account_service.get_user(account_id, user_id)
    if not user:
        return JSONResponse(
            status_code=404,
            content=error_response("User not found"),
        )
    return JSONResponse(
        status_code=200,
        content=success_response(user, "User retrieved successfully"),
    )


@account_router.put("/{account_id}/users/{user_id}")
def update_user(
    account_id: str,
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin")),
):
    _assert_account_access(current_user, account_id)
    success = account_service.update_user(account_id, user_id, user_data, current_user)
    if not success:
        return JSONResponse(
            status_code=400,
            content=error_response("Update failed or insufficient permissions"),
        )
    return JSONResponse(
        status_code=200,
        content=success_response(None, "User updated successfully"),
    )


@account_router.delete("/{account_id}/users/{user_id}")
def delete_user(
    account_id: str,
    user_id: str,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin")),
):
    _assert_account_access(current_user, account_id)

    # Prevent self-deletion
    if user_id == current_user.id:
        return JSONResponse(
            status_code=400,
            content=error_response("Cannot delete your own account"),
        )

    success = account_service.delete_user(account_id, user_id)
    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response("User not found"),
        )
    return JSONResponse(
        status_code=200,
        content=success_response(None, "User deleted successfully"),
    )


@account_router.post("/{account_id}/users/{user_id}/reset-password")
def reset_user_password(
    account_id: str,
    user_id: str,
    data: UserResetPassword,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin")),
):
    _assert_account_access(current_user, account_id)
    success = account_service.reset_user_password(account_id, user_id, data)
    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response("User not found"),
        )
    return JSONResponse(
        status_code=200,
        content=success_response(None, "Password reset successfully"),
    )

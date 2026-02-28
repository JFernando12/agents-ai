from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.middleware import get_current_user, require_roles
from app.utils import success_response
from app.services import product_service
from app.models import User, ProductCreate, ProductUpdate

product_router = APIRouter(tags=["products"], prefix="/products")


@product_router.get("/")
def get_all_products(
    current_user: User = Depends(get_current_user)
):
    products = product_service.get_all(account_id=current_user.account_id)
    return JSONResponse(
        status_code=200,
        content=success_response(products, "Products retrieved successfully")
    )


@product_router.get("/{product_id}")
def get_product(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    product = product_service.get_one(product_id)
    if not product:
        return JSONResponse(status_code=404, content={"error": "Product not found"})
    return JSONResponse(
        status_code=200,
        content=success_response(product, "Product retrieved successfully")
    )


@product_router.post("/")
def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin"))
):
    product_id = product_service.create(product_data, account_id=current_user.account_id)
    if not product_id:
        return JSONResponse(status_code=500, content={"error": "Failed to create product"})
    return JSONResponse(
        status_code=201,
        content=success_response({"id": product_id}, "Product created successfully")
    )


@product_router.put("/{product_id}")
def update_product(
    product_id: str,
    product_data: ProductUpdate,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin"))
):
    updated = product_service.update(product_id, product_data)
    if not updated:
        return JSONResponse(status_code=404, content={"error": "Product not found"})
    return JSONResponse(
        status_code=200,
        content=success_response(None, "Product updated successfully")
    )


@product_router.delete("/{product_id}")
def delete_product(
    product_id: str,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin"))
):
    deleted = product_service.delete(product_id)
    if not deleted:
        return JSONResponse(status_code=404, content={"error": "Product not found"})
    return JSONResponse(
        status_code=200,
        content=success_response(None, "Product deleted successfully")
    )

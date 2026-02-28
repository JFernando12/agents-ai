from app.repositories import product_repository
from app.models import ProductCreate, ProductUpdate


class ProductService:
    def get_all(self, account_id: str | None = None) -> list[dict]:
        products = product_repository.get_all(account_id=account_id)
        return [p.model_dump(mode='json') for p in products]

    def get_one(self, product_id: str) -> dict | None:
        product = product_repository.get_by_id(product_id)
        if not product:
            return None
        return product.model_dump(mode='json')

    def create(self, product_data: ProductCreate, account_id: str = 'default') -> str | None:
        return product_repository.create(product_data, account_id=account_id)

    def update(self, product_id: str, product_data: ProductUpdate) -> bool:
        existing = product_repository.get_by_id(product_id)
        if not existing:
            return False
        return product_repository.update(product_id, product_data)

    def delete(self, product_id: str) -> bool:
        existing = product_repository.get_by_id(product_id)
        if not existing:
            return False
        return product_repository.delete(product_id)


product_service = ProductService()

import uuid
from datetime import datetime

from app.config import env
from app.models import Product, ProductCreate, ProductUpdate
from .base_dynamodb_repository import BaseDynamoDBRepository


class ProductRepository(BaseDynamoDBRepository):
    def __init__(self):
        super().__init__()
        self.product_table = self.dynamodb.Table(env.product_table)  # type: ignore

    def _map_to_product(self, item: dict) -> Product:
        return Product(
            id=item['id'],
            name=item['name'],
            description=item.get('description'),
            slug=item['slug'],
            created_at=datetime.fromtimestamp(self._decimal_to_float(item['created_at']) / 1000),
            updated_at=datetime.fromtimestamp(self._decimal_to_float(item['updated_at']) / 1000),
        )

    def create(self, product_data: ProductCreate) -> str:
        product_id = str(uuid.uuid4())
        now = int(datetime.now().timestamp() * 1000)

        item = {
            'id': product_id,
            'name': product_data.name,
            'description': product_data.description or '',
            'slug': product_data.slug,
            'created_at': now,
            'updated_at': now,
        }

        self.product_table.put_item(Item=item)
        return product_id

    def get_by_id(self, product_id: str) -> Product | None:
        try:
            response = self.product_table.get_item(Key={'id': product_id})
            if 'Item' not in response:
                return None
            return self._map_to_product(response['Item'])
        except Exception as e:
            print(f"Error getting product by ID {product_id}: {e}")
            return None

    def get_by_slug(self, slug: str) -> Product | None:
        try:
            response = self.product_table.query(
                IndexName='slug-index',
                KeyConditionExpression='slug = :slug',
                ExpressionAttributeValues={':slug': slug}
            )
            items = response.get('Items', [])
            if not items:
                return None
            return self._map_to_product(items[0])
        except Exception as e:
            print(f"Error getting product by slug {slug}: {e}")
            return None

    def get_all(self) -> list[Product]:
        try:
            response = self.product_table.scan()
            return [self._map_to_product(item) for item in response.get('Items', [])]
        except Exception as e:
            print(f"Error getting all products: {e}")
            return []

    def update(self, product_id: str, product_data: ProductUpdate) -> bool:
        try:
            now = int(datetime.now().timestamp() * 1000)

            updates: dict = {'updated_at': now}
            if product_data.name is not None:
                updates['name'] = product_data.name
            if product_data.description is not None:
                updates['description'] = product_data.description
            if product_data.slug is not None:
                updates['slug'] = product_data.slug

            update_expr = 'SET ' + ', '.join(f'#{k} = :{k}' for k in updates)
            expr_names = {f'#{k}': k for k in updates}
            expr_values = {f':{k}': v for k, v in updates.items()}

            self.product_table.update_item(
                Key={'id': product_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values,
            )
            return True
        except Exception as e:
            print(f"Error updating product {product_id}: {e}")
            return False

    def delete(self, product_id: str) -> bool:
        try:
            self.product_table.delete_item(Key={'id': product_id})
            return True
        except Exception as e:
            print(f"Error deleting product {product_id}: {e}")
            return False


product_repository = ProductRepository()

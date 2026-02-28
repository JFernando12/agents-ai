import { Product, ProductCreate, ProductUpdate } from '@/types';
import { ApiService } from './api';

class ApiProducts extends ApiService {
  constructor() {
    super();
  }

  getAllProducts = async (): Promise<Product[]> => {
    const response = await this.api.get('/products/');
    return response.data.data as Product[];
  };

  getProduct = async (productId: string): Promise<Product> => {
    const response = await this.api.get(`/products/${productId}`);
    return response.data.data as Product;
  };

  createProduct = async (productData: ProductCreate): Promise<{ id: string }> => {
    const response = await this.api.post('/products/', productData);
    return response.data.data as { id: string };
  };

  updateProduct = async (productId: string, productData: ProductUpdate): Promise<void> => {
    await this.api.put(`/products/${productId}`, productData);
  };

  deleteProduct = async (productId: string): Promise<void> => {
    await this.api.delete(`/products/${productId}`);
  };
}

export const apiProducts = new ApiProducts();

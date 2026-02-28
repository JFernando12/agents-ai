import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductCreate, ProductUpdate } from '@/types';
import { apiProducts } from '../api/products';

export const useAllProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => apiProducts.getAllProducts(),
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productData: ProductCreate) => apiProducts.createProduct(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      productData,
    }: {
      productId: string;
      productData: ProductUpdate;
    }) => apiProducts.updateProduct(productId, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => apiProducts.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiDocuments } from "../api/documents"

export const useDocuments = ({ serviceId }: { serviceId?: string }) => {
    return useQuery({
        queryKey: ["documents", serviceId],
        queryFn: () => apiDocuments.getDocuments({ serviceId }),
    })
}

export const useUploadDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: apiDocuments.uploadDocument,
      onSuccess: (_, variables) => {
        // Solo invalida los documentos del servicio específico
        queryClient.invalidateQueries({
          queryKey: ['documents', variables.serviceId],
          exact: true,
        });
      },
    });
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiDocuments.deleteDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['documents'],
      });
    },
  });
}
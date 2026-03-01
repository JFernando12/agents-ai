import axios from 'axios';
import { ApiService } from './api';
import { Fuente } from '@/types';

class ApiDocuments extends ApiService {
  constructor() {
    super();
  }

  getDocuments = async ({
    serviceId,
  }: {
    serviceId?: string;
  }): Promise<Fuente[]> => {
    if (!serviceId) throw new Error('serviceId is required');

    const response = await this.api.get(`/documents?agent_id=${serviceId}`);
    const data = response.data;

    const formattedData = data.data.map((doc: any) => ({
      id: doc.id,
      name: doc.file_name,
      createdAt: new Date(doc.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    }));

    return formattedData;
  };

  uploadDocument = async ({
    serviceId,
    data: { file, name },
  }: {
    serviceId: string;
    data: {
      file: File;
      name: string;
    };
  }): Promise<void> => {
    const response = await this.api.post('/documents', {
      agent_id: serviceId,
      file_name: name,
    });
    const presignedUrl = response.data.data.presigned_url;

    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  };

  getDocumentPresignedUrl = async ({
    documentId,
  }: {
    documentId: string;
  }): Promise<string> => {
    const response = await this.api.get(`/documents/${documentId}`);
    const doc = response.data.data;
    console.log('Document fetched:', doc);
    return doc.presigned_url;
  };

  deleteDocument = async ({
    documentId,
  }: {
    documentId: string;
  }): Promise<void> => {
    await this.api.delete(`/documents/${documentId}`);
  };
}

export const apiDocuments = new ApiDocuments();

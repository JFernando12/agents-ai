import { ToolInputSchema } from '@/types';

export interface Param {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface HeaderRow {
  key: string;
  value: string;
}

export interface ToolFormState {
  product_id: string;
  section: string;
  display_name: string;
  name: string;
  description: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headerRows: HeaderRow[];
  schemaMode: 'builder' | 'json';
  params: Param[];
  jsonSchema: string;
}

export type { ToolInputSchema };

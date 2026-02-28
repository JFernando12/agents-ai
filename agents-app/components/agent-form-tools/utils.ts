import { Tool, ToolInputSchema } from '@/types';
import { HeaderRow, Param, ToolFormState } from './types';

export function toSnakeCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function buildSchemaFromParams(params: Param[]): ToolInputSchema {
  const properties: ToolInputSchema['properties'] = {};
  const required: string[] = [];
  for (const p of params) {
    if (!p.name.trim()) continue;
    properties[p.name] = { type: p.type, description: p.description };
    if (p.required) required.push(p.name);
  }
  return { type: 'object', properties, required };
}

export function parseParamsFromSchema(schema: ToolInputSchema): Param[] {
  return Object.entries(schema.properties || {}).map(([name, prop]) => ({
    name,
    type: prop.type || 'string',
    description: prop.description || '',
    required: (schema.required || []).includes(name),
  }));
}

export function headersToRows(
  headers: Record<string, string> | null,
): HeaderRow[] {
  if (!headers) return [{ key: '', value: '' }];
  const rows = Object.entries(headers).map(([key, value]) => ({ key, value }));
  return rows.length ? rows : [{ key: '', value: '' }];
}

export function rowsToHeaders(
  rows: HeaderRow[],
): Record<string, string> | null {
  const result: Record<string, string> = {};
  for (const r of rows) {
    if (r.key.trim()) result[r.key.trim()] = r.value;
  }
  return Object.keys(result).length ? result : null;
}

export function emptyForm(): ToolFormState {
  return {
    product_id: '',
    section: '',
    display_name: '',
    name: '',
    description: '',
    url: '',
    method: 'POST',
    headerRows: [{ key: '', value: '' }],
    schemaMode: 'builder',
    params: [{ name: '', type: 'string', description: '', required: false }],
    jsonSchema: JSON.stringify(
      { type: 'object', properties: {}, required: [] },
      null,
      2,
    ),
  };
}

export function toolToFormState(tool: Tool): ToolFormState {
  return {
    product_id: tool.product_id,
    section: tool.section || '',
    display_name: tool.display_name,
    name: tool.name,
    description: tool.description,
    url: tool.url,
    method: tool.method,
    headerRows: headersToRows(tool.headers),
    schemaMode: 'builder',
    params: parseParamsFromSchema(tool.input_schema),
    jsonSchema: JSON.stringify(tool.input_schema, null, 2),
  };
}

export type ToolGroup = { section: string; tools: Tool[] }[];

export function groupTools(toolList: Tool[]): Map<string, ToolGroup> {
  const result = new Map<string, ToolGroup>();
  toolList.forEach((tool) => {
    const pid = tool.product_id || '__none__';
    if (!result.has(pid)) result.set(pid, []);
    const sections = result.get(pid)!;
    const sectionKey = tool.section || '';
    const existing = sections.find((sg) => sg.section === sectionKey);
    if (existing) {
      existing.tools.push(tool);
    } else {
      sections.push({ section: sectionKey, tools: [tool] });
    }
  });
  return result;
}

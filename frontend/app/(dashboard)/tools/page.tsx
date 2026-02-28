'use client';

import { useState, useMemo } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Package,
  Wrench,
} from 'lucide-react';
import {
  Tool,
  ToolCreate,
  ToolUpdate,
  ToolInputSchema,
  Product,
  ProductCreate,
  ProductUpdate,
} from '@/types';
import {
  useAllTools,
  useCreateTool,
  useUpdateTool,
  useDeleteTool,
} from '@/lib/hooks/useTools';
import {
  useAllProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/lib/hooks/useProducts';
import { apiTools } from '@/lib/api/tools';
import ModalDelete from '@/components/ui/ModalDelete';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const PARAM_TYPES = [
  'string',
  'integer',
  'number',
  'boolean',
  'array',
  'object',
];

const labelClass =
  'block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5';
const formControlClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors';
const selectClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors';

interface Param {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

interface HeaderRow {
  key: string;
  value: string;
}

function toSnakeCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function buildSchemaFromParams(params: Param[]): ToolInputSchema {
  const properties: ToolInputSchema['properties'] = {};
  const required: string[] = [];
  for (const p of params) {
    if (!p.name.trim()) continue;
    properties[p.name] = { type: p.type, description: p.description };
    if (p.required) required.push(p.name);
  }
  return { type: 'object', properties, required };
}

function parseParamsFromSchema(schema: ToolInputSchema): Param[] {
  return Object.entries(schema.properties || {}).map(([name, prop]) => ({
    name,
    type: prop.type || 'string',
    description: prop.description || '',
    required: (schema.required || []).includes(name),
  }));
}

function headersToRows(headers: Record<string, string> | null): HeaderRow[] {
  if (!headers) return [{ key: '', value: '' }];
  const rows = Object.entries(headers).map(([key, value]) => ({ key, value }));
  return rows.length ? rows : [{ key: '', value: '' }];
}

function rowsToHeaders(rows: HeaderRow[]): Record<string, string> | null {
  const result: Record<string, string> = {};
  for (const r of rows) {
    if (r.key.trim()) result[r.key.trim()] = r.value;
  }
  return Object.keys(result).length ? result : null;
}

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function MethodBadge({ method }: { method: string }) {
  const colorMap: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    PATCH:
      'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  };
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded font-mono tracking-wide ${
        colorMap[method] ??
        'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400'
      }`}
    >
      {method}
    </span>
  );
}

interface ToolFormState {
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

const emptyToolForm = (): ToolFormState => ({
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
});

function toolToFormState(tool: Tool): ToolFormState {
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

interface ProductFormState {
  name: string;
  description: string;
  slug: string;
}

const emptyProductForm = (): ProductFormState => ({
  name: '',
  description: '',
  slug: '',
});

function productToFormState(product: Product): ProductFormState {
  return {
    name: product.name,
    description: product.description || '',
    slug: product.slug,
  };
}

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'products'>('catalog');

  const { data: tools, isLoading: loadingTools } = useAllTools();
  const { data: products, isLoading: loadingProducts } = useAllProducts();
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const deleteTool = useDeleteTool();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [toolMode, setToolMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [toolForm, setToolForm] = useState<ToolFormState>(emptyToolForm());
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const [toolToDelete, setToolToDelete] = useState<string | null>(null);
  const [showParseDrawer, setShowParseDrawer] = useState(false);
  const [parseDocs, setParseDocs] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [productMode, setProductMode] = useState<'list' | 'create' | 'edit'>(
    'list',
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] =
    useState<ProductFormState>(emptyProductForm());
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const productMap = useMemo(
    () => new Map<string, Product>((products ?? []).map((p) => [p.id, p])),
    [products],
  );

  type ToolGroup = { section: string; tools: Tool[] }[];
  const grouped = useMemo(() => {
    const map = new Map<string, ToolGroup>();
    (tools ?? []).forEach((tool) => {
      const pid = tool.product_id || '__none__';
      if (!map.has(pid)) map.set(pid, []);
      const sections = map.get(pid)!;
      const sectionKey = tool.section || '';
      const existing = sections.find((sg) => sg.section === sectionKey);
      if (existing) {
        existing.tools.push(tool);
      } else {
        sections.push({ section: sectionKey, tools: [tool] });
      }
    });
    return map;
  }, [tools]);

  const handleToolDisplayNameChange = (value: string) => {
    setToolForm((prev) => ({
      ...prev,
      display_name: value,
      ...(toolMode === 'create' ? { name: toSnakeCase(value) } : {}),
    }));
  };

  const handleParamChange = (
    index: number,
    field: keyof Param,
    value: string | boolean,
  ) => {
    setToolForm((prev) => {
      const params = [...prev.params];
      params[index] = { ...params[index], [field]: value };
      return { ...prev, params };
    });
  };

  const handleHeaderChange = (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    setToolForm((prev) => {
      const headerRows = [...prev.headerRows];
      headerRows[index] = { ...headerRows[index], [field]: value };
      return { ...prev, headerRows };
    });
  };

  const switchToJson = () => {
    const schema = buildSchemaFromParams(toolForm.params);
    setToolForm((prev) => ({
      ...prev,
      schemaMode: 'json',
      jsonSchema: JSON.stringify(schema, null, 2),
    }));
    setJsonError(null);
  };

  const switchToBuilder = () => {
    try {
      const schema: ToolInputSchema = JSON.parse(toolForm.jsonSchema);
      setToolForm((prev) => ({
        ...prev,
        schemaMode: 'builder',
        params: parseParamsFromSchema(schema),
      }));
      setJsonError(null);
    } catch {
      setJsonError(
        'JSON inválido. Corrige los errores antes de cambiar a builder.',
      );
    }
  };

  const buildToolPayload = (): { schema: ToolInputSchema; valid: boolean } => {
    if (toolForm.schemaMode === 'json') {
      try {
        return { schema: JSON.parse(toolForm.jsonSchema), valid: true };
      } catch {
        setJsonError('JSON inválido. Revisa el schema antes de guardar.');
        return {
          schema: { type: 'object', properties: {}, required: [] },
          valid: false,
        };
      }
    }
    return { schema: buildSchemaFromParams(toolForm.params), valid: true };
  };

  const handleToolSubmit = async () => {
    const { schema, valid } = buildToolPayload();
    if (!valid) return;

    if (toolMode === 'create') {
      const payload: ToolCreate = {
        product_id: toolForm.product_id,
        section: toolForm.section || null,
        name: toolForm.name,
        display_name: toolForm.display_name,
        description: toolForm.description,
        url: toolForm.url,
        method: toolForm.method,
        headers: rowsToHeaders(toolForm.headerRows),
        input_schema: schema,
      };
      await createTool.mutateAsync(payload);
    } else if (toolMode === 'edit' && editingToolId) {
      const payload: ToolUpdate = {
        product_id: toolForm.product_id,
        section: toolForm.section || null,
        name: toolForm.name,
        display_name: toolForm.display_name,
        description: toolForm.description,
        url: toolForm.url,
        method: toolForm.method,
        headers: rowsToHeaders(toolForm.headerRows),
        input_schema: schema,
      };
      await updateTool.mutateAsync({
        toolId: editingToolId,
        toolData: payload,
      });
    }

    setToolMode('list');
    setEditingToolId(null);
    setToolForm(emptyToolForm());
  };

  const handleEditTool = (tool: Tool) => {
    setToolForm(toolToFormState(tool));
    setEditingToolId(tool.id);
    setToolMode('edit');
    setActiveTab('catalog');
  };

  const handleConfirmDeleteTool = async () => {
    if (!toolToDelete) return;
    await deleteTool.mutateAsync(toolToDelete);
    setToolToDelete(null);
  };

  const handleParseDocs = async () => {
    if (!parseDocs.trim()) return;
    setIsParsing(true);
    setParseError(null);
    try {
      const parsed = await apiTools.parseToolDocs(parseDocs);
      const schema = (parsed.input_schema as ToolInputSchema) ?? {
        type: 'object',
        properties: {},
        required: [],
      };
      setToolForm((prev) => ({
        ...prev,
        display_name: (parsed.display_name as string) ?? '',
        name: (parsed.name as string) ?? '',
        description: (parsed.description as string) ?? '',
        url: (parsed.url as string) ?? '',
        method: ((parsed.method as string) ??
          'POST') as ToolFormState['method'],
        headerRows: headersToRows(
          (parsed.headers as Record<string, string>) ?? null,
        ),
        schemaMode: 'builder',
        params: parseParamsFromSchema(schema),
        jsonSchema: JSON.stringify(schema, null, 2),
      }));
      setShowParseDrawer(false);
      setParseDocs('');
      setToolMode('create');
    } catch {
      setParseError(
        'No se pudo interpretar la documentación. Intenta con más detalle o verifica el formato.',
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleCancelTool = () => {
    setToolMode('list');
    setEditingToolId(null);
    setToolForm(emptyToolForm());
    setJsonError(null);
  };

  const handleProductNameChange = (value: string) => {
    setProductForm((prev) => ({
      ...prev,
      name: value,
      ...(productMode === 'create' ? { slug: toSlug(value) } : {}),
    }));
  };

  const handleProductSubmit = async () => {
    if (productMode === 'create') {
      const payload: ProductCreate = {
        name: productForm.name,
        description: productForm.description || null,
        slug: productForm.slug,
      };
      await createProduct.mutateAsync(payload);
    } else if (productMode === 'edit' && editingProductId) {
      const payload: ProductUpdate = {
        name: productForm.name,
        description: productForm.description || null,
        slug: productForm.slug,
      };
      await updateProduct.mutateAsync({
        productId: editingProductId,
        productData: payload,
      });
    }
    setProductMode('list');
    setEditingProductId(null);
    setProductForm(emptyProductForm());
  };

  const handleEditProduct = (product: Product) => {
    setProductForm(productToFormState(product));
    setEditingProductId(product.id);
    setProductMode('edit');
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    await deleteProduct.mutateAsync(productToDelete);
    setProductToDelete(null);
  };

  const handleCancelProduct = () => {
    setProductMode('list');
    setEditingProductId(null);
    setProductForm(emptyProductForm());
  };

  const isMutatingTool = createTool.isPending || updateTool.isPending;
  const isMutatingProduct = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Page header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Herramientas</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Gestiona las capacidades y productos disponibles para tus agentes.
          </p>
        </div>
      </div>

      {/* Inner tabs */}
      <div className="flex-shrink-0 flex space-x-1">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'catalog'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08]'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Capacidades
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'products'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08]'
          }`}
        >
          <Package className="w-4 h-4" />
          Productos
          {(products ?? []).length > 0 && (
            <span className="ml-1 bg-gray-200 dark:bg-white/[0.08] text-gray-600 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded-full">
              {(products ?? []).length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* ── CATALOG TAB ── */}
        {activeTab === 'catalog' && (
          <div className="space-y-4 pb-6">
            {(toolMode === 'create' || toolMode === 'edit') && (
              <div className="space-y-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {toolMode === 'create'
                      ? 'Nueva Capacidad'
                      : 'Editar Capacidad'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCancelTool}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Producto *</label>
                    <select
                      className={selectClass}
                      value={toolForm.product_id}
                      onChange={(e) =>
                        setToolForm((p) => ({
                          ...p,
                          product_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">Selecciona un producto...</option>
                      {(products ?? []).map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name}
                        </option>
                      ))}
                    </select>
                    {(products ?? []).length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Crea un producto primero en la pestaña
                        &quot;Productos&quot;.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>
                      Sección{' '}
                      <span className="text-xs text-gray-400 font-normal">
                        (opcional)
                      </span>
                    </label>
                    <input
                      type="text"
                      className={formControlClass}
                      value={toolForm.section}
                      onChange={(e) =>
                        setToolForm((p) => ({ ...p, section: e.target.value }))
                      }
                      placeholder="ej. Gestión de Tickets"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Nombre visible *</label>
                    <input
                      type="text"
                      className={formControlClass}
                      value={toolForm.display_name}
                      onChange={(e) =>
                        handleToolDisplayNameChange(e.target.value)
                      }
                      placeholder="ej. Crear Ticket de Jira"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Nombre de función *{' '}
                      <span className="ml-1 text-xs text-gray-400">
                        (snake_case)
                      </span>
                    </label>
                    <input
                      type="text"
                      className={formControlClass}
                      value={toolForm.name}
                      onChange={(e) =>
                        setToolForm((p) => ({
                          ...p,
                          name: toSnakeCase(e.target.value),
                        }))
                      }
                      placeholder="ej. crear_ticket_jira"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Descripción para el LLM *
                  </label>
                  <textarea
                    rows={2}
                    className={formControlClass}
                    value={toolForm.description}
                    onChange={(e) =>
                      setToolForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe qué hace esta capacidad y cuándo usarla..."
                  />
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className={labelClass}>Método</label>
                    <select
                      className={selectClass}
                      value={toolForm.method}
                      onChange={(e) =>
                        setToolForm((p) => ({
                          ...p,
                          method: e.target.value as ToolFormState['method'],
                        }))
                      }
                    >
                      {HTTP_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className={labelClass}>URL *</label>
                    <input
                      type="text"
                      className={formControlClass}
                      value={toolForm.url}
                      onChange={(e) =>
                        setToolForm((p) => ({ ...p, url: e.target.value }))
                      }
                      placeholder="https://api.ejemplo.com/endpoint"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-white/[0.06] pt-3">
                  <label className={labelClass}>Headers (opcional)</label>
                  <div className="space-y-2">
                    {toolForm.headerRows.map((row, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="text"
                          className={`${formControlClass} flex-1`}
                          placeholder="Clave"
                          value={row.key}
                          onChange={(e) =>
                            handleHeaderChange(i, 'key', e.target.value)
                          }
                        />
                        <input
                          type="text"
                          className={`${formControlClass} flex-1`}
                          placeholder="Valor"
                          value={row.value}
                          onChange={(e) =>
                            handleHeaderChange(i, 'value', e.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setToolForm((p) => ({
                              ...p,
                              headerRows: p.headerRows.filter(
                                (_, j) => j !== i,
                              ),
                            }))
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setToolForm((p) => ({
                          ...p,
                          headerRows: [...p.headerRows, { key: '', value: '' }],
                        }))
                      }
                      className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Agregar header
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-white/[0.06] pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelClass + ' mb-0'}>
                      Parámetros de entrada
                    </label>
                    <div className="flex bg-gray-100 dark:bg-white/[0.06] rounded-md p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={switchToBuilder}
                        className={`px-3 py-1 rounded-md transition-colors ${
                          toolForm.schemaMode === 'builder'
                            ? 'bg-white dark:bg-white/[0.12] shadow text-gray-800 dark:text-white font-medium'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        Builder
                      </button>
                      <button
                        type="button"
                        onClick={switchToJson}
                        className={`px-3 py-1 rounded-md transition-colors ${
                          toolForm.schemaMode === 'json'
                            ? 'bg-white dark:bg-white/[0.12] shadow text-gray-800 dark:text-white font-medium'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        JSON
                      </button>
                    </div>
                  </div>

                  {toolForm.schemaMode === 'builder' ? (
                    <div className="space-y-2">
                      {toolForm.params.map((param, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-2 rounded-lg"
                        >
                          <input
                            type="text"
                            className={`${formControlClass} col-span-3`}
                            placeholder="nombre"
                            value={param.name}
                            onChange={(e) =>
                              handleParamChange(i, 'name', e.target.value)
                            }
                          />
                          <select
                            className={`${selectClass} col-span-2`}
                            value={param.type}
                            onChange={(e) =>
                              handleParamChange(i, 'type', e.target.value)
                            }
                          >
                            {PARAM_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            className={`${formControlClass} col-span-5`}
                            placeholder="descripción para el LLM"
                            value={param.description}
                            onChange={(e) =>
                              handleParamChange(
                                i,
                                'description',
                                e.target.value,
                              )
                            }
                          />
                          <div className="col-span-1 flex items-center justify-center gap-1">
                            <input
                              type="checkbox"
                              title="Requerido"
                              checked={param.required}
                              onChange={(e) =>
                                handleParamChange(
                                  i,
                                  'required',
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 text-indigo-500 dark:text-indigo-400"
                            />
                            <span className="text-xs text-gray-400">req</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setToolForm((p) => ({
                                ...p,
                                params: p.params.filter((_, j) => j !== i),
                              }))
                            }
                            className="col-span-1 text-gray-400 hover:text-red-500 flex justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setToolForm((p) => ({
                            ...p,
                            params: [
                              ...p.params,
                              {
                                name: '',
                                type: 'string',
                                description: '',
                                required: false,
                              },
                            ],
                          }))
                        }
                        className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Agregar parámetro
                      </button>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        rows={8}
                        className={`${formControlClass} font-mono`}
                        value={toolForm.jsonSchema}
                        onChange={(e) => {
                          setToolForm((p) => ({
                            ...p,
                            jsonSchema: e.target.value,
                          }));
                          setJsonError(null);
                        }}
                      />
                      {jsonError && (
                        <p className="text-xs text-red-500 mt-1">{jsonError}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-white/[0.06] pt-3">
                  <button
                    type="button"
                    onClick={handleCancelTool}
                    className="px-3.5 py-1.5 text-sm bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleToolSubmit}
                    disabled={
                      isMutatingTool ||
                      !toolForm.display_name ||
                      !toolForm.name ||
                      !toolForm.url ||
                      !toolForm.product_id
                    }
                    className="px-3.5 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {isMutatingTool && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {isMutatingTool ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}

            {toolMode === 'list' && (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Capacidades
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Todas las capacidades disponibles agrupadas por producto.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowParseDrawer(true);
                      setParseDocs('');
                      setParseError(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-xs font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Auto-completar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setToolForm(emptyToolForm());
                      setToolMode('create');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nueva Capacidad
                  </button>
                </div>
              </div>
            )}

            {showParseDrawer && toolMode === 'list' && (
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/[0.04] p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />{' '}
                      Auto-completar con IA
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Pega la documentación de la API (texto libre, cURL,
                      Swagger, Postman…) y la IA rellenará el formulario
                      automáticamente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowParseDrawer(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  rows={5}
                  className={`${formControlClass} font-mono text-xs`}
                  placeholder={`Ejemplo:\ncurl -X POST https://api.ejemplo.com/tickets \\\n  -H "Authorization: Bearer TOKEN" \\\n  -d '{"titulo": "...", "descripcion": "..."}'`}
                  value={parseDocs}
                  onChange={(e) => {
                    setParseDocs(e.target.value);
                    setParseError(null);
                  }}
                />
                {parseError && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {parseError}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowParseDrawer(false)}
                    className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleParseDocs}
                    disabled={isParsing || !parseDocs.trim()}
                    className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />{' '}
                        Analizando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Completar
                        formulario
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {loadingTools && (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-6">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando
                capacidades...
              </div>
            )}

            {!loadingTools &&
              (tools ?? []).length === 0 &&
              toolMode === 'list' && (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] p-10 text-center">
                  <Wrench className="w-7 h-7 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay capacidades registradas.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Haz clic en{' '}
                    <strong className="text-gray-600 dark:text-gray-300">
                      Nueva Capacidad
                    </strong>{' '}
                    para agregar una.
                  </p>
                </div>
              )}

            {!loadingTools &&
              toolMode === 'list' &&
              Array.from(grouped.entries()).map(
                ([productId, sectionGroups]) => {
                  const product = productMap.get(productId);
                  return (
                    <div key={productId} className="space-y-3">
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          {product?.name ?? 'Sin producto'}
                        </span>
                        {product?.description && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            — {product.description}
                          </span>
                        )}
                        <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.06]" />
                      </div>

                      {sectionGroups.map(({ section, tools: sectionTools }) => (
                        <div key={section} className="space-y-2">
                          {section && (
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 pl-2 ml-1 border-l-2 border-gray-200 dark:border-white/[0.1]">
                              {section}
                            </p>
                          )}
                          {sectionTools.map((tool) => (
                            <div
                              key={tool.id}
                              className="border border-gray-200 dark:border-white/[0.07] rounded-lg overflow-hidden"
                            >
                              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <MethodBadge method={tool.method} />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                      {tool.display_name}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
                                      {tool.name}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedToolId(
                                        expandedToolId === tool.id
                                          ? null
                                          : tool.id,
                                      )
                                    }
                                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 transition-colors"
                                  >
                                    {expandedToolId === tool.id ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEditTool(tool)}
                                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setToolToDelete(tool.id)}
                                    disabled={deleteTool.isPending}
                                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                  >
                                    {deleteTool.isPending ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {expandedToolId === tool.id && (
                                <div className="border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.02] px-4 py-3 space-y-2 text-xs">
                                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {tool.description}
                                  </p>
                                  <div className="flex gap-1.5 items-center">
                                    <span className="text-gray-400 dark:text-gray-500 font-medium">
                                      URL:
                                    </span>
                                    <span className="font-mono text-gray-600 dark:text-gray-300 truncate">
                                      {tool.url}
                                    </span>
                                  </div>
                                  {tool.headers &&
                                    Object.keys(tool.headers).length > 0 && (
                                      <div>
                                        <span className="text-gray-400 dark:text-gray-500 font-medium">
                                          Headers:
                                        </span>
                                        <div className="mt-1 space-y-0.5">
                                          {Object.entries(tool.headers).map(
                                            ([k, v]) => (
                                              <div
                                                key={k}
                                                className="font-mono text-gray-500 dark:text-gray-400"
                                              >
                                                <span className="text-indigo-500 dark:text-indigo-400">
                                                  {k}
                                                </span>
                                                :{' '}
                                                <span className="text-gray-400 dark:text-gray-500">
                                                  {v}
                                                </span>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  {tool.input_schema?.properties &&
                                    Object.keys(tool.input_schema.properties)
                                      .length > 0 && (
                                      <div>
                                        <span className="text-gray-400 dark:text-gray-500 font-medium">
                                          Parámetros:
                                        </span>
                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                          {Object.entries(
                                            tool.input_schema.properties,
                                          ).map(([name, prop]) => (
                                            <span
                                              key={name}
                                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono ${
                                                tool.input_schema.required?.includes(
                                                  name,
                                                )
                                                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20'
                                                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400'
                                              }`}
                                            >
                                              {name}
                                              <span className="text-gray-400 dark:text-gray-500">
                                                :{prop.type}
                                              </span>
                                              {tool.input_schema.required?.includes(
                                                name,
                                              ) && (
                                                <span className="text-indigo-400 dark:text-indigo-400 text-[10px]">
                                                  req
                                                </span>
                                              )}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                },
              )}
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === 'products' && (
          <div className="space-y-4 pb-6">
            {(productMode === 'create' || productMode === 'edit') && (
              <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {productMode === 'create'
                      ? 'Nuevo Producto'
                      : 'Editar Producto'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCancelProduct}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nombre *</label>
                    <input
                      type="text"
                      className={formControlClass}
                      value={productForm.name}
                      onChange={(e) => handleProductNameChange(e.target.value)}
                      placeholder="ej. Jira"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Slug *{' '}
                      <span className="text-xs text-gray-400 font-normal">
                        (identificador único)
                      </span>
                    </label>
                    <input
                      type="text"
                      className={formControlClass}
                      value={productForm.slug}
                      onChange={(e) =>
                        setProductForm((p) => ({
                          ...p,
                          slug: toSlug(e.target.value),
                        }))
                      }
                      placeholder="ej. jira"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Descripción{' '}
                    <span className="text-xs text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="text"
                    className={formControlClass}
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Descripción breve del producto..."
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-white/[0.06] pt-3">
                  <button
                    type="button"
                    onClick={handleCancelProduct}
                    className="px-3.5 py-1.5 text-sm bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleProductSubmit}
                    disabled={
                      isMutatingProduct ||
                      !productForm.name ||
                      !productForm.slug
                    }
                    className="px-3.5 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {isMutatingProduct && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {isMutatingProduct ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}

            {productMode === 'list' && (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Productos
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Los productos agrupan y categorizan las capacidades
                    disponibles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProductForm(emptyProductForm());
                    setProductMode('create');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo Producto
                </button>
              </div>
            )}

            {loadingProducts && (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-6">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando
                productos...
              </div>
            )}

            {!loadingProducts &&
              (products ?? []).length === 0 &&
              productMode === 'list' && (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] p-10 text-center">
                  <Package className="w-7 h-7 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay productos.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Haz clic en{' '}
                    <strong className="text-gray-600 dark:text-gray-300">
                      Nuevo Producto
                    </strong>{' '}
                    para agregar uno.
                  </p>
                </div>
              )}

            {productMode === 'list' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(products ?? []).map((product) => {
                  const toolCount = (tools ?? []).filter(
                    (t) => t.product_id === product.id,
                  ).length;
                  return (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.07] rounded-xl p-4 flex flex-col gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            {product.slug}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditProduct(product)}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product.id)}
                            disabled={deleteProduct.isPending}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {product.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <Wrench className="w-3 h-3" />
                        <span>
                          {toolCount} capacidad{toolCount !== 1 ? 'es' : ''}
                        </span>
                        {toolCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('catalog')}
                            className="ml-1 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline transition-colors"
                          >
                            Ver capacidades
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <ModalDelete
        isOpen={toolToDelete !== null}
        onClose={() => setToolToDelete(null)}
        onSave={handleConfirmDeleteTool}
        isLoading={deleteTool.isPending}
        message="¿Estás seguro de que quieres eliminar esta capacidad? Se eliminará de todos los agentes que la tengan asignada."
      />
      <ModalDelete
        isOpen={productToDelete !== null}
        onClose={() => setProductToDelete(null)}
        onSave={handleConfirmDeleteProduct}
        isLoading={deleteProduct.isPending}
        message="¿Estás seguro de que quieres eliminar este producto? Las capacidades asociadas quedarán sin producto asignado."
      />
    </div>
  );
}

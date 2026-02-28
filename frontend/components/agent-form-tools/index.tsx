'use client';

import { useState } from 'react';
import { Loader2, Plus, Sparkles, Library, Bot } from 'lucide-react';
import {
  Tool,
  ToolCreate,
  ToolUpdate,
  ToolInputSchema,
  AgentTool,
} from '@/types';
import {
  useAllTools,
  useCreateTool,
  useUpdateTool,
  useDeleteTool,
} from '@/lib/hooks/useTools';
import { useAllProducts } from '@/lib/hooks/useProducts';
import { useAgents } from '@/lib/hooks/useAgents';
import { apiTools } from '@/lib/api/tools';
import ModalDelete from '../ModalDelete';
import { ToolFormState } from './types';
import {
  emptyForm,
  toolToFormState,
  buildSchemaFromParams,
  parseParamsFromSchema,
  headersToRows,
  rowsToHeaders,
  groupTools,
} from './utils';
import { ToolForm } from './ToolForm';
import { AssignedToolCard } from './AssignedToolCard';
import { AssignedSubAgentCard } from './AssignedSubAgentCard';
import { CatalogPicker } from './CatalogPicker';
import { SubAgentPicker } from './SubAgentPicker';
import { ParseDocsDrawer } from './ParseDocsDrawer';

interface AgentFormToolsProps {
  agentId: string | undefined;
  assignedTools: AgentTool[];
  onToolsChange: (tools: AgentTool[]) => void;
  assignedSubAgents: AgentTool[];
  onSubAgentsChange: (subAgents: AgentTool[]) => void;
}

export default function AgentFormTools({
  agentId,
  assignedTools = [],
  onToolsChange,
  assignedSubAgents = [],
  onSubAgentsChange,
}: AgentFormToolsProps) {
  const {
    data: tools,
    isLoading: loadingTools,
    isFetching: fetchingTools,
  } = useAllTools();
  const {
    data: products,
    isLoading: loadingProducts,
    isFetching: fetchingProducts,
  } = useAllProducts();
  const { data: allAgents } = useAgents();
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const deleteTool = useDeleteTool();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ToolFormState>(emptyForm());
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const [toolToDelete, setToolToDelete] = useState<string | null>(null);
  const [showParseDrawer, setShowParseDrawer] = useState(false);
  const [parseDocs, setParseDocs] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showSubAgentPicker, setShowSubAgentPicker] = useState(false);
  const [subAgentSearch, setSubAgentSearch] = useState('');

  // Derive plain IDs for filtering and CatalogPicker
  const assignedToolIds = assignedTools.map((t) => t.id);

  // Sub-agent derived data
  const assignedSubAgentIds = assignedSubAgents.map((t) => t.id);
  const assignedSubAgentObjects = (allAgents ?? []).filter((a) =>
    assignedSubAgentIds.includes(a.id),
  );

  // ── Derived data ──────────────────────────────────────────────────────────

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  const assignedGrouped = groupTools(
    (tools ?? []).filter((t) => assignedToolIds.includes(t.id)),
  );

  const searchLower = catalogSearch.toLowerCase();
  const pickerFiltered = (tools ?? []).filter(
    (t) =>
      !searchLower ||
      t.display_name.toLowerCase().includes(searchLower) ||
      t.name.toLowerCase().includes(searchLower) ||
      (productMap.get(t.product_id)?.name ?? '')
        .toLowerCase()
        .includes(searchLower),
  );
  const pickerGrouped = groupTools(pickerFiltered);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const switchToJson = () => {
    const schema = buildSchemaFromParams(form.params);
    setForm((prev) => ({
      ...prev,
      schemaMode: 'json',
      jsonSchema: JSON.stringify(schema, null, 2),
    }));
    setJsonError(null);
  };

  const switchToBuilder = () => {
    try {
      const schema: ToolInputSchema = JSON.parse(form.jsonSchema);
      setForm((prev) => ({
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

  const buildPayload = (): { schema: ToolInputSchema; valid: boolean } => {
    if (form.schemaMode === 'json') {
      try {
        return { schema: JSON.parse(form.jsonSchema), valid: true };
      } catch {
        setJsonError('JSON inválido. Revisa el schema antes de guardar.');
        return {
          schema: { type: 'object', properties: {}, required: [] },
          valid: false,
        };
      }
    }
    return { schema: buildSchemaFromParams(form.params), valid: true };
  };

  const handleSubmit = async () => {
    const { schema, valid } = buildPayload();
    if (!valid) return;

    if (mode === 'create') {
      const payload: ToolCreate = {
        product_id: form.product_id,
        section: form.section || null,
        name: form.name,
        display_name: form.display_name,
        description: form.description,
        url: form.url,
        method: form.method,
        headers: rowsToHeaders(form.headerRows),
        input_schema: schema,
      };
      const result = await createTool.mutateAsync(payload);
      if (result?.id)
        onToolsChange([...assignedTools, { id: result.id, enabled: true }]);
    } else if (mode === 'edit' && editingId) {
      const payload: ToolUpdate = {
        product_id: form.product_id,
        section: form.section || null,
        name: form.name,
        display_name: form.display_name,
        description: form.description,
        url: form.url,
        method: form.method,
        headers: rowsToHeaders(form.headerRows),
        input_schema: schema,
      };
      await updateTool.mutateAsync({ toolId: editingId, toolData: payload });
    }

    setMode('list');
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleEdit = (tool: Tool) => {
    setForm(toolToFormState(tool));
    setEditingId(tool.id);
    setMode('edit');
  };

  const handleConfirmDelete = async () => {
    if (!toolToDelete) return;
    await deleteTool.mutateAsync(toolToDelete);
    if (assignedToolIds.includes(toolToDelete)) {
      onToolsChange(assignedTools.filter((t) => t.id !== toolToDelete));
    }
    setToolToDelete(null);
  };

  const handleToggleActive = (tool: Tool) => {
    onToolsChange(
      assignedTools.map((t) =>
        t.id === tool.id ? { ...t, enabled: !t.enabled } : t,
      ),
    );
  };

  const handleToggleAssign = (toolId: string) => {
    if (assignedToolIds.includes(toolId)) {
      onToolsChange(assignedTools.filter((t) => t.id !== toolId));
    } else {
      onToolsChange([...assignedTools, { id: toolId, enabled: true }]);
    }
  };

  // ── Sub-agent handlers ───────────────────────────────────────────────────

  const handleToggleSubAgentAssign = (agentId: string) => {
    if (assignedSubAgentIds.includes(agentId)) {
      onSubAgentsChange(assignedSubAgents.filter((t) => t.id !== agentId));
    } else {
      onSubAgentsChange([...assignedSubAgents, { id: agentId, enabled: true }]);
    }
  };

  const handleToggleSubAgentActive = (agentId: string) => {
    onSubAgentsChange(
      assignedSubAgents.map((t) =>
        t.id === agentId ? { ...t, enabled: !t.enabled } : t,
      ),
    );
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
      setForm((prev) => ({
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
      setMode('create');
    } catch {
      setParseError(
        'No se pudo interpretar la documentación. Intenta con más detalle o verifica el formato.',
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleCancel = () => {
    setMode('list');
    setEditingId(null);
    setForm(emptyForm());
    setJsonError(null);
  };

  const isMutating = createTool.isPending || updateTool.isPending;
  const isLoading = loadingTools || loadingProducts;
  const isFetching = fetchingTools || fetchingProducts;

  // ── Render form ───────────────────────────────────────────────────────────

  if (mode === 'create' || mode === 'edit') {
    return (
      <ToolForm
        mode={mode}
        form={form}
        products={products ?? []}
        isMutating={isMutating}
        jsonError={jsonError}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onSwitchToBuilder={switchToBuilder}
        onSwitchToJson={switchToJson}
      />
    );
  }

  // ── Render list ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-2 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800">
            Capacidades Adicionales
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Capacidades asignadas a este agente.{' '}
            {assignedToolIds.length > 0 && (
              <span className="font-medium text-[#232A37]">
                {assignedToolIds.length} asignada
                {assignedToolIds.length !== 1 ? 's' : ''}.
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowCatalogPicker(true);
              setCatalogSearch('');
            }}
            className="flex items-center gap-1 px-3 py-2 border border-[#232A37] text-[#232A37] rounded-lg hover:bg-gray-50 text-sm"
          >
            <Library className="w-4 h-4" />
            Agregar existente
          </button>
          <button
            type="button"
            onClick={() => {
              setShowParseDrawer(true);
              setParseDocs('');
              setParseError(null);
            }}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Auto-completar
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm());
              setMode('create');
            }}
            className="flex items-center gap-1 px-3 py-2 bg-[#232A37] text-white rounded-lg hover:bg-[#1a2030] text-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva
          </button>
        </div>
      </div>

      {/* Parse-docs drawer */}
      {showParseDrawer && (
        <ParseDocsDrawer
          parseDocs={parseDocs}
          isParsing={isParsing}
          parseError={parseError}
          onDocsChange={(v) => {
            setParseDocs(v);
            setParseError(null);
          }}
          onParse={handleParseDocs}
          onClose={() => setShowParseDrawer(false)}
        />
      )}

      {/* Loading */}
      {(isLoading || isFetching) && (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando capacidades...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isFetching && assignedToolIds.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          No hay capacidades asignadas. Usa <strong>Agregar existente</strong>{' '}
          para buscar en el catálogo, o <strong>Nueva</strong> para crear una.
        </div>
      )}

      {/* Fallback: assigned IDs not found in catalog */}
      {!isLoading &&
        !isFetching &&
        assignedToolIds.length > 0 &&
        assignedGrouped.size === 0 && (
          <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
            Las capacidades asignadas no se encontraron en el catálogo. Puede
            que hayan sido eliminadas.
            <button
              type="button"
              onClick={() => onToolsChange([])}
              className="ml-2 underline hover:no-underline"
            >
              Limpiar asignaciones
            </button>
          </div>
        )}

      {/* Assigned tools grouped by product → section */}
      {!isLoading &&
        !isFetching &&
        assignedToolIds.length > 0 &&
        assignedGrouped.size > 0 &&
        Array.from(assignedGrouped.entries()).map(
          ([productId, sectionGroups]) => {
            const product = productMap.get(productId);
            return (
              <div key={productId} className="space-y-3">
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    {product?.name ?? 'Sin producto'}
                  </span>
                  {product?.description && (
                    <span className="text-xs text-gray-400">
                      — {product.description}
                    </span>
                  )}
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {sectionGroups.map(({ section, tools: sectionTools }) => (
                  <div key={section} className="space-y-2">
                    {section && (
                      <p className="text-xs font-medium text-gray-500 pl-1 ml-1 border-l-2 border-gray-300">
                        {section}
                      </p>
                    )}
                    {sectionTools.map((tool) => (
                      <AssignedToolCard
                        key={tool.id}
                        tool={tool}
                        isEnabled={
                          assignedTools.find((t) => t.id === tool.id)
                            ?.enabled ?? true
                        }
                        isExpanded={expandedToolId === tool.id}
                        isDeleting={deleteTool.isPending}
                        onToggleExpand={() =>
                          setExpandedToolId(
                            expandedToolId === tool.id ? null : tool.id,
                          )
                        }
                        onToggleActive={() => handleToggleActive(tool)}
                        onEdit={() => handleEdit(tool)}
                        onUnassign={() =>
                          onToolsChange(
                            assignedTools.filter((t) => t.id !== tool.id),
                          )
                        }
                        onDelete={() => setToolToDelete(tool.id)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            );
          },
        )}

      {/* Delete confirmation */}
      <ModalDelete
        isOpen={toolToDelete !== null}
        onClose={() => setToolToDelete(null)}
        onSave={handleConfirmDelete}
        isLoading={deleteTool.isPending}
        message="¿Estás seguro de que quieres eliminar esta capacidad del catálogo? Se eliminará de todos los agentes que la tengan asignada."
      />

      {/* ── Sub-agents section ─────────────────────────────────────────────── */}
      <div className="mt-6 pt-5 border-t border-gray-200 space-y-3">
        {/* Sub-agents header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              Sub-agentes
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Agentes que este agente puede invocar como herramienta.{' '}
              {assignedSubAgentIds.length > 0 && (
                <span className="font-medium text-[#232A37]">
                  {assignedSubAgentIds.length} asignado
                  {assignedSubAgentIds.length !== 1 ? 's' : ''}.
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowSubAgentPicker(true);
              setSubAgentSearch('');
            }}
            className="flex items-center gap-1 px-3 py-2 border border-[#232A37] text-[#232A37] rounded-lg hover:bg-gray-50 text-sm"
          >
            <Bot className="w-4 h-4" />
            Agregar sub-agente
          </button>
        </div>

        {/* Empty state */}
        {assignedSubAgentIds.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
            No hay sub-agentes asignados. Usa{' '}
            <strong>Agregar sub-agente</strong> para seleccionar un agente a
            delegar.
          </div>
        )}

        {/* Assigned sub-agent cards */}
        {assignedSubAgentObjects.length > 0 && (
          <div className="space-y-2">
            {assignedSubAgentObjects.map((agent) => (
              <AssignedSubAgentCard
                key={agent.id}
                agent={agent}
                isEnabled={
                  assignedSubAgents.find((t) => t.id === agent.id)?.enabled ??
                  true
                }
                onToggleActive={() => handleToggleSubAgentActive(agent.id)}
                onUnassign={() =>
                  onSubAgentsChange(
                    assignedSubAgents.filter((t) => t.id !== agent.id),
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Fallback: assigned sub-agent IDs not found */}
        {assignedSubAgentIds.length > 0 &&
          assignedSubAgentObjects.length === 0 && (
            <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
              Los sub-agentes asignados no se encontraron. Puede que hayan sido
              eliminados.
              <button
                type="button"
                onClick={() => onSubAgentsChange([])}
                className="ml-2 underline hover:no-underline"
              >
                Limpiar asignaciones
              </button>
            </div>
          )}
      </div>

      {/* Catalog picker modal */}
      {showCatalogPicker && (
        <CatalogPicker
          tools={tools ?? []}
          pickerGrouped={pickerGrouped}
          productMap={productMap}
          assignedToolIds={assignedToolIds}
          catalogSearch={catalogSearch}
          onSearchChange={setCatalogSearch}
          onToggle={handleToggleAssign}
          onClose={() => setShowCatalogPicker(false)}
        />
      )}

      {/* Sub-agent picker modal */}
      {showSubAgentPicker && (
        <SubAgentPicker
          agents={allAgents ?? []}
          assignedSubAgentIds={assignedSubAgentIds}
          currentAgentId={agentId}
          search={subAgentSearch}
          onSearchChange={setSubAgentSearch}
          onToggle={handleToggleSubAgentAssign}
          onClose={() => setShowSubAgentPicker(false)}
        />
      )}
    </div>
  );
}

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
import ModalDelete from '../ui/ModalDelete';
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
    <div className="space-y-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Capacidades
            {assignedToolIds.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-bold">
                {assignedToolIds.length}
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Capacidades asignadas a este agente
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowCatalogPicker(true);
              setCatalogSearch('');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-indigo-500/60 text-indigo-700 dark:text-indigo-300 dark:border-indigo-500/40 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.08] transition-colors"
          >
            <Library className="w-3.5 h-3.5" />
            Agregar
          </button>
          <button
            type="button"
            onClick={() => {
              setShowParseDrawer(true);
              setParseDocs('');
              setParseError(null);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
            title="Auto-completar desde documentación"
          >
            <Sparkles className="w-3.5 h-3.5" />
            IA
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm());
              setMode('create');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
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
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] px-6 py-5 text-center text-xs text-gray-400 dark:text-gray-500">
          No hay capacidades asignadas. Usa <strong>Agregar</strong> para buscar
          en el catálogo, o <strong>Nueva</strong> para crear una.
        </div>
      )}

      {/* Fallback: assigned IDs not found in catalog */}
      {!isLoading &&
        !isFetching &&
        assignedToolIds.length > 0 &&
        assignedGrouped.size === 0 && (
          <div className="rounded-lg border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/[0.06] px-4 py-3 text-xs text-orange-700 dark:text-orange-400">
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
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {product?.name ?? 'Sin producto'}
                  </span>
                  {product?.description && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      — {product.description}
                    </span>
                  )}
                  <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.08]" />
                </div>

                {sectionGroups.map(({ section, tools: sectionTools }) => (
                  <div key={section} className="space-y-2">
                    {section && (
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 pl-1 ml-1 border-l-2 border-gray-300 dark:border-white/[0.12]">
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
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06] space-y-3">
        {/* Sub-agents header */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Sub-agentes
              {assignedSubAgentIds.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-bold">
                  {assignedSubAgentIds.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Agentes que este agente puede invocar
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowSubAgentPicker(true);
              setSubAgentSearch('');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-indigo-500/60 text-indigo-700 dark:text-indigo-300 dark:border-indigo-500/40 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.08] flex-shrink-0 transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>

        {/* Empty state */}
        {assignedSubAgentIds.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] px-6 py-5 text-center text-xs text-gray-400 dark:text-gray-500">
            No hay sub-agentes asignados. Usa <strong>Agregar</strong> para
            seleccionar un agente a delegar.
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
            <div className="rounded-lg border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/[0.06] px-4 py-3 text-xs text-orange-700 dark:text-orange-400">
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


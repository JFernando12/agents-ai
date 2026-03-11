'use client';

import { useState } from 'react';
import { Plus, X, Eye, EyeOff } from 'lucide-react';
import { WhatsAppChannel, WhatsAppChannelCreate } from '@/types';
import { useAgents } from '@/lib/hooks/useAgents';
import {
  useWhatsAppChannels,
  useWhatsAppStats,
  useCreateWhatsAppChannel,
  useUpdateWhatsAppChannel,
  useDeleteWhatsAppChannel,
  useToggleWhatsAppChannel,
} from '@/lib/hooks/useWhatsApp';
import WhatsAppStats from '@/components/whatsapp/WhatsAppStats';
import WhatsAppChannelList from '@/components/whatsapp/WhatsAppChannelList';
import WhatsAppChannelSetupGuide from '@/components/whatsapp/WhatsAppChannelSetupGuide';
import ModalDelete from '@/components/ui/ModalDelete';

const labelClass =
  'block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5';
const inputClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors';
const selectClass =
  'w-full px-3 py-2 text-sm bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors';

const emptyForm = (): WhatsAppChannelCreate => ({
  name: '',
  agent_id: '',
  phone_number_id: '',
  wa_token: '',
  app_secret: '',
  verify_token: '',
  webhook_secret: '',
});

export default function WhatsAppPage() {
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'setup'>(
    'list',
  );
  const [activeChannel, setActiveChannel] = useState<WhatsAppChannel | null>(
    null,
  );
  const [form, setForm] = useState<WhatsAppChannelCreate>(emptyForm());
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingChannel, setDeletingChannel] =
    useState<WhatsAppChannel | null>(null);

  const { data: channels = [], isLoading: loadingChannels } =
    useWhatsAppChannels();
  const { data: stats, isLoading: loadingStats } = useWhatsAppStats();
  const { data: agents = [] } = useAgents();

  const createChannel = useCreateWhatsAppChannel();
  const updateChannel = useUpdateWhatsAppChannel();
  const deleteChannel = useDeleteWhatsAppChannel();
  const toggleChannel = useToggleWhatsAppChannel();

  const set =
    (field: keyof WhatsAppChannelCreate) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCreate = () => {
    setForm(emptyForm());
    setFormError(null);
    setShowToken(false);
    setShowSecret(false);
    setMode('create');
  };

  const handleEdit = (channel: WhatsAppChannel) => {
    setForm({
      name: channel.name,
      agent_id: channel.agent_id,
      phone_number_id: channel.phone_number_id,
      wa_token: channel.wa_token,
      app_secret: channel.app_secret ?? '',
      verify_token: channel.verify_token,
      webhook_secret: channel.webhook_secret ?? '',
    });
    setActiveChannel(channel);
    setFormError(null);
    setShowToken(false);
    setShowSecret(false);
    setMode('edit');
  };

  const handleSetup = (channel: WhatsAppChannel) => {
    setActiveChannel(channel);
    setMode('setup');
  };

  const handleCancel = () => {
    setMode('list');
    setActiveChannel(null);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.agent_id ||
      !form.phone_number_id ||
      !form.wa_token ||
      !form.verify_token
    ) {
      setFormError('Completa todos los campos requeridos.');
      return;
    }
    setFormError(null);
    const payload = {
      ...form,
      app_secret: form.app_secret || null,
      webhook_secret: form.webhook_secret || null,
    };
    if (mode === 'create') {
      await createChannel.mutateAsync(payload);
    } else if (mode === 'edit' && activeChannel) {
      await updateChannel.mutateAsync({ id: activeChannel.id, data: payload });
    }
    setMode('list');
    setActiveChannel(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingChannel) return;
    await deleteChannel.mutateAsync(deletingChannel.id);
    setDeletingChannel(null);
  };

  const isMutating = createChannel.isPending || updateChannel.isPending;

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
              WhatsApp
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Conecta números de WhatsApp Business con tus agentes de IA
            </p>
          </div>
          {mode === 'list' && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo canal
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-5">
            {/* Inline create / edit form */}
            {(mode === 'create' || mode === 'edit') && (
              <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {mode === 'create'
                      ? 'Nuevo canal de WhatsApp'
                      : 'Editar canal'}
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nombre *</label>
                    <input
                      value={form.name}
                      onChange={set('name')}
                      placeholder="Ej: Soporte Ventas"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Agente *</label>
                    <select
                      value={form.agent_id}
                      onChange={set('agent_id')}
                      className={selectClass}
                    >
                      <option value="">Seleccionar agente...</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Phone Number ID *</label>
                  <input
                    value={form.phone_number_id}
                    onChange={set('phone_number_id')}
                    placeholder="ID del número en Meta"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Access Token *</label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={form.wa_token}
                        onChange={set('wa_token')}
                        placeholder="Token de acceso de Meta"
                        className={`${inputClass} pr-9`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showToken ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      App Secret{' '}
                      <span className="text-gray-400 font-normal normal-case">
                        (opcional)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={form.app_secret ?? ''}
                        onChange={set('app_secret')}
                        placeholder="App Secret de Meta"
                        className={`${inputClass} pr-9`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecret ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Verify Token *</label>
                    <input
                      value={form.verify_token}
                      onChange={set('verify_token')}
                      placeholder="Token de verificación del webhook"
                      className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Crea un token aleatorio; configúralo también en Meta.
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Webhook Secret{' '}
                      <span className="text-gray-400 font-normal normal-case">
                        (opcional)
                      </span>
                    </label>
                    <input
                      value={form.webhook_secret ?? ''}
                      onChange={set('webhook_secret')}
                      placeholder="Secreto para callbacks del ecommerce"
                      className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      El ecommerce lo incluye en X-Webhook-Secret.
                    </p>
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-red-500">{formError}</p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isMutating}
                    className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {isMutating
                      ? 'Guardando...'
                      : mode === 'create'
                        ? 'Crear canal'
                        : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )}

            {/* Inline setup guide */}
            {mode === 'setup' && activeChannel && (
              <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Configuración: {activeChannel.name}
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <WhatsAppChannelSetupGuide
                  channelId={activeChannel.id}
                  verifyToken={activeChannel.verify_token}
                  webhookSecret={activeChannel.webhook_secret}
                />
              </div>
            )}

            {/* Stats */}
            <WhatsAppStats stats={stats} isLoading={loadingStats} />

            {/* Channel list */}
            {loadingChannels ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 rounded-xl bg-gray-100 dark:bg-white/[0.05] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <WhatsAppChannelList
                channels={channels}
                agents={agents}
                onToggle={(id) => toggleChannel.mutate(id)}
                onEdit={handleEdit}
                onDelete={setDeletingChannel}
                onSetup={handleSetup}
              />
            )}
          </div>
        </div>
      </div>

      <ModalDelete
        isOpen={!!deletingChannel}
        onClose={() => setDeletingChannel(null)}
        onSave={handleConfirmDelete}
        isLoading={deleteChannel.isPending}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Agent, WhatsAppChannel, WhatsAppChannelCreate } from '@/types';
import { X, Eye, EyeOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WhatsAppChannelCreate) => Promise<void>;
  agents: Agent[];
  isLoading: boolean;
}

const empty: WhatsAppChannelCreate = {
  name: '',
  agent_id: '',
  phone_number_id: '',
  wa_token: '',
  app_secret: '',
  verify_token: '',
};

export default function ModalCreateChannel({ isOpen, onClose, onSave, agents, isLoading }: Props) {
  const [form, setForm] = useState<WhatsAppChannelCreate>(empty);
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(empty);
      setError('');
    }
  }, [isOpen]);

  const set = (field: keyof WhatsAppChannelCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.agent_id || !form.phone_number_id || !form.wa_token || !form.verify_token) {
      setError('Completa todos los campos requeridos.');
      return;
    }
    setError('');
    await onSave({
      ...form,
      app_secret: form.app_secret || null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#18181B] rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-white/[0.08]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Nuevo canal de WhatsApp</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre del canal <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={set('name')}
              placeholder="Ej: Soporte Ventas"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          {/* Agent */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Agente <span className="text-red-500">*</span>
            </label>
            <select
              value={form.agent_id}
              onChange={set('agent_id')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111111] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            >
              <option value="">Seleccionar agente...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Phone Number ID */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Phone Number ID <span className="text-red-500">*</span>
            </label>
            <input
              value={form.phone_number_id}
              onChange={set('phone_number_id')}
              placeholder="ID del número en Meta"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Access Token <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={form.wa_token}
                onChange={set('wa_token')}
                placeholder="Token de acceso de Meta"
                className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
              <button type="button" onClick={() => setShowToken((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* App Secret (optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              App Secret <span className="text-gray-400 font-normal">(recomendado para validar firma)</span>
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={form.app_secret ?? ''}
                onChange={set('app_secret')}
                placeholder="App Secret de tu aplicación Meta"
                className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
              <button type="button" onClick={() => setShowSecret((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Verify Token */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Verify Token <span className="text-red-500">*</span>
            </label>
            <input
              value={form.verify_token}
              onChange={set('verify_token')}
              placeholder="Token de verificación del webhook"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
              Crea un token aleatorio. Debes configurarlo también en Meta Business Manager.
            </p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Creando...' : 'Crear canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

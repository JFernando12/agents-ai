'use client';

import { useState, useEffect } from 'react';
import { Agent, WhatsAppChannel, WhatsAppChannelCreate } from '@/types';
import { X, Eye, EyeOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WhatsAppChannelCreate) => Promise<void>;
  agents: Agent[];
  channel: WhatsAppChannel | null;
  isLoading: boolean;
}

export default function ModalEditChannel({ isOpen, onClose, onSave, agents, channel, isLoading }: Props) {
  const [form, setForm] = useState<WhatsAppChannelCreate>({
    name: '', agent_id: '', phone_number_id: '', wa_token: '', app_secret: '', verify_token: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (channel) {
      setForm({
        name: channel.name,
        agent_id: channel.agent_id,
        phone_number_id: channel.phone_number_id,
        wa_token: channel.wa_token,
        app_secret: channel.app_secret ?? '',
        verify_token: channel.verify_token,
      });
    }
    setError('');
  }, [channel, isOpen]);

  const set = (field: keyof WhatsAppChannelCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.agent_id || !form.phone_number_id || !form.wa_token || !form.verify_token) {
      setError('Completa todos los campos requeridos.');
      return;
    }
    setError('');
    await onSave({ ...form, app_secret: form.app_secret || null });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#18181B] rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-white/[0.08]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Editar canal de WhatsApp</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={set('name')} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Agente <span className="text-red-500">*</span></label>
            <select value={form.agent_id} onChange={set('agent_id')} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111111] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              <option value="">Seleccionar agente...</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number ID <span className="text-red-500">*</span></label>
            <input value={form.phone_number_id} onChange={set('phone_number_id')} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Access Token <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showToken ? 'text' : 'password'} value={form.wa_token} onChange={set('wa_token')} className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              <button type="button" onClick={() => setShowToken((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Verify Token <span className="text-red-500">*</span></label>
            <input value={form.verify_token} onChange={set('verify_token')} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">Cancelar</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

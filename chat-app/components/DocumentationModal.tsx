import React, { useState } from 'react';
import { CloseIcon } from './Icons';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const templateOptions = ['SRS (Software Requirements Specification)', 'API Documentation', 'ADR (Architecture Decision Record)'];

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [template, setTemplate] = useState(templateOptions[0]);
  const [scope, setScope] = useState('');
  const [architecture, setArchitecture] = useState('');
  const [endpoints, setEndpoints] = useState('');
  const [dataContracts, setDataContracts] = useState('');
  const [nfrs, setNfrs] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [constraints, setConstraints] = useState('');
  const [references, setReferences] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      template,
      scope,
      architecture,
      endpoints,
      dataContracts,
      nfrs,
      acceptanceCriteria,
      constraints,
      references,
    };
    onSubmit(submissionData);
  };

  const commonTextareaProps = {
    className: "w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
    rows: 2,
  };

  const commonLabelProps = {
    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="relative flex items-center justify-center p-4 border-b border-slate-700 bg-[#232A37]">
          <h2 className="text-lg font-semibold text-gray-100 uppercase font-oswald">Generar Documentación Técnica</h2>
          <button onClick={onClose} className="absolute p-1 rounded-full right-4 top-1/2 -translate-y-1/2 hover:bg-slate-700">
            <CloseIcon className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
                 <label htmlFor="template" {...commonLabelProps}>Tipo de Plantilla</label>
                 <select id="template" value={template} onChange={e => setTemplate(e.target.value)} className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {templateOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </select>
            </div>
            
            <div>
                <label htmlFor="scope" {...commonLabelProps}>Alcance</label>
                <textarea id="scope" value={scope} onChange={(e) => setScope(e.target.value)} {...commonTextareaProps} />
            </div>
            
            <div>
                <label htmlFor="architecture" {...commonLabelProps}>Arquitectura Actual</label>
                <textarea id="architecture" value={architecture} onChange={(e) => setArchitecture(e.target.value)} {...commonTextareaProps} />
            </div>

            <div>
                <label htmlFor="endpoints" {...commonLabelProps}>Endpoints (si aplica)</label>
                <textarea id="endpoints" value={endpoints} onChange={(e) => setEndpoints(e.target.value)} {...commonTextareaProps} />
            </div>

            <div>
                <label htmlFor="dataContracts" {...commonLabelProps}>Contratos de Datos</label>
                <textarea id="dataContracts" value={dataContracts} onChange={(e) => setDataContracts(e.target.value)} {...commonTextareaProps} />
            </div>

            <div>
                <label htmlFor="nfrs" {...commonLabelProps}>Requisitos No Funcionales (Rendimiento, Seguridad, etc.)</label>
                <textarea id="nfrs" value={nfrs} onChange={(e) => setNfrs(e.target.value)} {...commonTextareaProps} />
            </div>

            <div>
                <label htmlFor="acceptanceCriteria" {...commonLabelProps}>Criterios de Aceptación</label>
                <textarea id="acceptanceCriteria" value={acceptanceCriteria} onChange={(e) => setAcceptanceCriteria(e.target.value)} {...commonTextareaProps} />
            </div>

            <div>
                <label htmlFor="constraints" {...commonLabelProps}>Restricciones (Seguridad, Compliance)</label>
                <textarea id="constraints" value={constraints} onChange={(e) => setConstraints(e.target.value)} {...commonTextareaProps} />
            </div>

            <div>
                <label htmlFor="references" {...commonLabelProps}>Referencias (User stories, Jira, etc.)</label>
                <textarea id="references" value={references} onChange={(e) => setReferences(e.target.value)} {...commonTextareaProps} />
            </div>
        </form>

        <footer className="flex justify-end p-4 border-t border-gray-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-slate-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 mr-3"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Generar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DocumentationModal;
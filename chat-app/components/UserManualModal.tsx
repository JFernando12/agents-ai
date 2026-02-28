import React, { useState, useRef } from 'react';
import { CloseIcon, TrashIcon } from './Icons';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [userProfiles, setUserProfiles] = useState('');
  const [frequentTasks, setFrequentTasks] = useState('');
  const [policies, setPolicies] = useState('');
  const [faqs, setFaqs] = useState('');
  const [accessibilityNotes, setAccessibilityNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setUploadedFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setUploadedFiles(uploadedFiles.filter(file => file !== fileToRemove));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      userProfiles,
      frequentTasks,
      policies,
      faqs,
      accessibilityNotes,
      screenshots: uploadedFiles.map(f => f.name).join(', '),
    };
    onSubmit(submissionData);
  };

  const commonTextareaProps = {
    className: "w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
    rows: 3,
  };

  const commonLabelProps = {
    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="relative flex items-center justify-center p-4 border-b border-slate-700 bg-[#232A37]">
          <h2 className="text-lg font-semibold text-gray-100 uppercase font-oswald">Generar Manual de Usuario</h2>
          <button onClick={onClose} className="absolute p-1 rounded-full right-4 top-1/2 -translate-y-1/2 hover:bg-slate-700">
            <CloseIcon className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
                <label htmlFor="userProfiles" {...commonLabelProps}>Perfiles de Usuario</label>
                <textarea id="userProfiles" value={userProfiles} onChange={(e) => setUserProfiles(e.target.value)} {...commonTextareaProps} />
            </div>
            
            <div>
                <label htmlFor="frequentTasks" {...commonLabelProps}>Tareas Frecuentes</label>
                <textarea id="frequentTasks" value={frequentTasks} onChange={(e) => setFrequentTasks(e.target.value)} {...commonTextareaProps} />
            </div>

            <div>
                 <label {...commonLabelProps}>Capturas / Mockups</label>
                 <div className="flex flex-col items-center justify-center w-full">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 text-sm text-center text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900">
                       Subir archivos
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                 </div>
                 {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-1 text-sm">
                        {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-slate-700 p-2 rounded">
                                <span className="text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                                <button type="button" onClick={() => handleRemoveFile(file)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
            
            <div>
                <label htmlFor="policies" {...commonLabelProps}>Políticas</label>
                <textarea id="policies" value={policies} onChange={(e) => setPolicies(e.target.value)} {...commonTextareaProps} />
            </div>

            <div>
                <label htmlFor="faqs" {...commonLabelProps}>FAQs</label>
                <textarea id="faqs" value={faqs} onChange={(e) => setFaqs(e.target.value)} {...commonTextareaProps} />
            </div>

            <div>
                <label htmlFor="accessibilityNotes" {...commonLabelProps}>Notas de Accesibilidad</label>
                <textarea id="accessibilityNotes" value={accessibilityNotes} onChange={(e) => setAccessibilityNotes(e.target.value)} {...commonTextareaProps} />
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

export default UserManualModal;

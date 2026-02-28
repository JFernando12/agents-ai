import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, TrashIcon } from './Icons';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const audienceOptions = [
    'Directivos / Alta gerencia: esperan una visión estratégica, impacto económico y toma de decisiones.',
    'Mandos medios: buscan procesos, eficiencia y cómo implementar lo presentado.',
    'Operativos / Técnicos: se enfocan en detalles prácticos, instrucciones y herramientas.',
    'Clientes: quieren entender beneficios, soluciones y valor agregado.',
    'Proveedores / Socios: se centran en colaboración, expectativas y acuerdos.',
    'Académicos / Estudiantes: interesados en fundamentos, investigación y aprendizaje.'
];

const typographyOptions = [
    { name: "Helvetica Neue / Arial", value: "'Helvetica Neue', Arial, sans-serif" },
    { name: "Georgia / Times New Roman", value: "Georgia, Times, 'Times New Roman', serif" },
    { name: "Verdana / Geneva", value: "Verdana, Geneva, Tahoma, sans-serif" },
    { name: "Calibri / Candara", value: "Calibri, Candara, Segoe, 'Segoe UI', Optima, Arial, sans-serif" }
];

interface TypographySelection {
  role: string;
  name: string;
  font: string;
}

const typographyRoles = ['Títulos', 'Subtítulos', 'Contenido general'];


const PresentationModal: React.FC<PresentationModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [objective, setObjective] = useState('');
  const [audience, setAudience] = useState(audienceOptions[0]);
  const [keyMessages, setKeyMessages] = useState('');
  const [duration, setDuration] = useState('15 minutos / 10 diapositivas');
  
  const [typographies, setTypographies] = useState<TypographySelection[]>([
    { role: 'Títulos', name: typographyOptions[0].name, font: typographyOptions[0].value },
  ]);
  const [newTypoRole, setNewTypoRole] = useState('Subtítulos');
  const [newTypoFont, setNewTypoFont] = useState(typographyOptions[1].value);

  const [colors, setColors] = useState<string[]>(['#003366', '#F5F5F5']);
  const [newColor, setNewColor] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usedRoles = typographies.map(t => t.role);
  const availableRoles = typographyRoles.filter(r => !usedRoles.includes(r));

  useEffect(() => {
    // Ensure the dropdown for new role selection always shows a valid (available) role
    if (!availableRoles.includes(newTypoRole) && availableRoles.length > 0) {
        setNewTypoRole(availableRoles[0]);
    } else if (availableRoles.length === 0) {
        setNewTypoRole('');
    }
  }, [typographies]);


  if (!isOpen) {
    return null;
  }

  const handleAddColor = () => {
    if (newColor && newColor.match(/^#[0-9a-fA-F]{6}$/)) {
        if (!colors.includes(newColor)) {
            setColors([...colors, newColor]);
        }
        setNewColor('');
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
    setColors(colors.filter(color => color !== colorToRemove));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setUploadedFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setUploadedFiles(uploadedFiles.filter(file => file !== fileToRemove));
  };

  const handleAddTypography = () => {
    const selectedFontOption = typographyOptions.find(opt => opt.value === newTypoFont);
    if (!selectedFontOption || !newTypoRole || usedRoles.includes(newTypoRole)) return;

    setTypographies([
        ...typographies,
        { role: newTypoRole, name: selectedFontOption.name, font: selectedFontOption.value }
    ]);
  };

  const handleRemoveTypography = (roleToRemove: string) => {
    setTypographies(typographies.filter(t => t.role !== roleToRemove));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const typographyString = typographies.map(t => `${t.role}: ${t.name}`).join(', ');
    const submissionData = {
        objective,
        audience,
        keyMessages,
        duration,
        typography: typographyString,
        colors: colors.join(', '),
        sources: uploadedFiles.map(f => f.name).join(', '),
    };
    onSubmit(submissionData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="relative flex items-center justify-center p-4 border-b border-slate-700 bg-[#232A37]">
          <h2 className="text-lg font-semibold text-gray-100 uppercase font-oswald">Generar Presentación Ejecutiva</h2>
          <button onClick={onClose} className="absolute p-1 rounded-full right-4 top-1/2 -translate-y-1/2 hover:bg-slate-700">
            <CloseIcon className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
                <label htmlFor="objective" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Objetivo de Negocio</label>
                <textarea id="objective" value={objective} onChange={(e) => setObjective(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div>
                 <label htmlFor="audience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Público</label>
                 <select id="audience" value={audience} onChange={e => setAudience(e.target.value)} className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {audienceOptions.map(opt => <option key={opt} value={opt}>{opt.split(':')[0]}</option>)}
                 </select>
            </div>
            
            <div>
                <label htmlFor="keyMessages" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3–5 Mensajes Clave (separados por comas)</label>
                <textarea id="keyMessages" value={keyMessages} onChange={(e) => setKeyMessages(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fuentes de Respaldo</label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Colores de Marca</label>
                    <div className="flex">
                        <input type="text" value={newColor} onChange={e => setNewColor(e.target.value)} placeholder="#RRGGBB" className="flex-grow px-3 py-2 text-sm rounded-l-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        <button type="button" onClick={handleAddColor} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-r-md hover:bg-blue-700">
                            Añadir
                        </button>
                    </div>
                     <div className="mt-2 flex flex-wrap gap-2">
                        {colors.map((color, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 p-1.5 rounded">
                                <div className="w-5 h-5 rounded border border-gray-300 dark:border-slate-600" style={{ backgroundColor: color }}></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{color}</span>
                                <button type="button" onClick={() => handleRemoveColor(color)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500">
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipografías de Marca</label>
                  <div className="space-y-2">
                    {typographies.map((typo) => (
                      <div key={typo.role} className="flex items-center justify-between bg-gray-100 dark:bg-slate-700 p-2 rounded">
                        <div>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{typo.role}: </span>
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{typo.name}</span>
                        </div>
                        <button type="button" onClick={() => handleRemoveTypography(typo.role)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {availableRoles.length > 0 && (
                    <div className="mt-3 flex items-end gap-2">
                        <div className="flex-grow">
                            <label htmlFor="newTypoRole" className="block text-xs font-medium text-gray-600 dark:text-gray-400">Rol</label>
                            <select id="newTypoRole" value={newTypoRole} onChange={e => setNewTypoRole(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {availableRoles.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                        <div className="flex-grow">
                            <label htmlFor="newTypoFont" className="block text-xs font-medium text-gray-600 dark:text-gray-400">Tipografía</label>
                             <select id="newTypoFont" value={newTypoFont} onChange={e => setNewTypoFont(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {typographyOptions.map(opt => <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>{opt.name}</option>)}
                             </select>
                        </div>
                        <button type="button" onClick={handleAddTypography} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 shrink-0">
                            Añadir
                        </button>
                    </div>
                  )}
                </div>
            </div>
             <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (min/diapositivas)</label>
                <input type="text" id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

export default PresentationModal;
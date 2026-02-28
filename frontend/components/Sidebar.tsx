
import React, { useState } from 'react';
import type { Agent } from '@/types';
import { 
    MenuIcon, 
    SearchIcon, 
    PencilAltIcon, 
    FolderAddIcon, 
    ChevronUpIcon, 
    ChevronDownIcon, 
    ChevronRightIcon, 
    CogIcon 
} from './icons';
import { AgentIcon } from './AgentIcon';

interface SidebarProps {
    agents: Agent[];
}

const Sidebar: React.FC<SidebarProps> = ({ agents }) => {
    const [isSpecializedOpen, setIsSpecializedOpen] = useState(true);
    const [isGroupersOpen, setIsGroupersOpen] = useState(false);

    return (
        <div className="w-72 bg-[#232A37] text-gray-300 flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-6">
                <button className="p-1 hover:bg-gray-700 rounded"><MenuIcon className="w-6 h-6" /></button>
                <button className="p-1 hover:bg-gray-700 rounded"><SearchIcon className="w-6 h-6" /></button>
            </div>
            
            <div className="flex flex-col space-y-3 mb-6">
                <button className="flex items-center space-x-3 px-2 py-2 text-left hover:bg-gray-700 rounded-md">
                    <PencilAltIcon className="w-5 h-5" />
                    <span>Nuevo Chat</span>
                </button>
                <button className="flex items-center space-x-3 px-2 py-2 text-left hover:bg-gray-700 rounded-md">
                    <FolderAddIcon className="w-5 h-5" />
                    <span>Nuevo Agrupador</span>
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2">
                <div className="mb-4">
                    <button onClick={() => setIsSpecializedOpen(!isSpecializedOpen)} className="flex justify-between items-center w-full text-sm font-bold text-[#8A91A0] mb-2">
                        <span>ESPECIALIZADOS</span>
                        <span className="p-1 bg-gray-700 rounded-full">
                           {isSpecializedOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                        </span>
                    </button>
                    {isSpecializedOpen && (
                        <div className="flex flex-col space-y-1">
                            {agents.map(agent => (
                                <button key={agent.id} className="flex items-center space-x-3 px-2 py-2 text-left hover:bg-gray-700 rounded-md w-full">
                                    {/* Fix: Removed non-existent 'color' prop. AgentIcon now uses a default color. */}
                                    <AgentIcon name={agent.icon} className="w-5 h-5 flex-shrink-0" />
                                    <span className="truncate">{agent.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <button onClick={() => setIsGroupersOpen(!isGroupersOpen)} className="flex justify-between items-center w-full text-sm font-bold text-[#8A91A0] mb-2">
                        <span>AGRUPADORES</span>
                        <ChevronRightIcon className={`w-4 h-4 transition-transform ${isGroupersOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {isGroupersOpen && (
                         <div className="flex flex-col space-y-1">
                            {['Grupo 5', 'Grupo 4', 'Grupo 3'].map(group => (
                                <button key={group} className="px-2 py-2 text-left hover:bg-gray-700 rounded-md w-full">{group}</button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <h3 className="text-sm font-bold text-[#8A91A0] mb-2">CHATS RECIENTES</h3>
                    <div className="flex flex-col space-y-1">
                        {['Chat 5', 'Chat 4', 'Chat 3', 'Chat 2', 'Chat 1'].map(chat => (
                             <button key={chat} className="px-2 py-2 text-left hover:bg-gray-700 rounded-md w-full truncate">{chat}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <button className="flex items-center space-x-3 px-2 py-2 text-left hover:bg-gray-700 rounded-md w-full">
                    <CogIcon className="w-6 h-6" />
                    <span>Configuración</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
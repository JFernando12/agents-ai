'use client';

import { useUser } from '@/contexts/UserContext';
import { CpaVisionIcon, SearchIcon } from './icons';

const Header: React.FC = () => {
  const { user } = useUser();

  return (
    <header className="bg-[#232A37] text-white shadow-md sticky top-0 z-20">
      <div className="mx-auto px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center">
            <CpaVisionIcon className="h-8 w-8 mr-4" />
            <h1 className="text-xl font-bold uppercase text-white">
              CPA Vision IA
            </h1>
          </div>
          <div className="flex items-center space-x-4 relative">
            <button className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold hover:bg-blue-700 transition-colors">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

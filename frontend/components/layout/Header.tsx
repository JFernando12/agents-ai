'use client';

import { useUser } from '@/contexts/UserContext';

const Header: React.FC = () => {
  const { user } = useUser();

  return (
    <header className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-white/[0.06] sticky top-0 z-20 transition-colors duration-300">
      <div className="mx-auto px-8">
        <div className="flex items-center justify-end h-12">
          <div className="flex items-center space-x-4">
            <button className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

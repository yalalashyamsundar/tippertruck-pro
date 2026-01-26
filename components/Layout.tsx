
import React from 'react';
import { Home, ClipboardList, Fuel, Settings, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'trips', label: 'Trips', icon: ClipboardList },
    { id: 'expenses', label: 'Expenses', icon: Fuel },
    { id: 'maintenance', label: 'Maintenance', icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <header className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800 p-4 shadow-lg flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-black uppercase tracking-tighter text-safety-yellow flex items-center gap-2 leading-none">
            <div className="w-2 h-6 bg-safety-yellow"></div>
            Tipperlog
          </h1>
          <span className="text-[9px] font-typewriter text-zinc-500 uppercase tracking-[0.2em] ml-4 mt-1">
            powered by Sundar
          </span>
        </div>
        <button 
          onClick={() => setActiveTab('admin')}
          className={`p-2.5 rounded-xl border transition-all ${activeTab === 'admin' ? 'bg-safety-yellow text-zinc-950 border-safety-yellow' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
        >
          <ShieldCheck size={22} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex justify-around items-center h-20 px-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors relative ${
                isActive ? 'text-safety-yellow' : 'text-zinc-500'
              }`}
            >
              <Icon size={isActive ? 28 : 24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-safety-yellow rounded-t-full"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;

import React from 'react';
import { User, UserRole } from '../types';
import { UI_ICONS, COMPANY_NAME } from '../constants';

interface SidebarProps {
  user: User;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, currentView, onViewChange, onLogout }) => {
  const isManagement = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SITE_MANAGER;
  const isFinancialAuth = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: UI_ICONS.Dashboard },
    ...(isManagement ? [
      { id: 'members', label: 'Workers', icon: UI_ICONS.Users },
      { id: 'attendance', label: 'Attn.', icon: UI_ICONS.Attendance },
      // Only show Salary (Pay) to Admins, not Site Managers
      ...(isFinancialAuth ? [{ id: 'salary', label: 'Pay', icon: UI_ICONS.Salary }] : []),
      { id: 'inventory', label: 'Stock', icon: UI_ICONS.Inventory },
      { id: 'projects', label: 'Sites', icon: UI_ICONS.Projects },
    ] : []),
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:flex w-72 bg-construction-dark flex-col h-full shadow-2xl transition-all flex-shrink-0 border-r border-white/5 relative z-50">
        <div className="p-10 border-b border-white/5 flex items-center space-x-4 shrink-0">
          <div className="bg-construction-yellow p-2 rounded-xl shadow-lg shadow-construction-yellow/20">
            {UI_ICONS.Construction}
          </div>
          <div>
            <span className="font-oswald text-2xl font-bold text-white tracking-widest block leading-none">{COMPANY_NAME.split(' ')[0]}</span>
            <span className="text-[10px] font-black text-construction-yellow uppercase tracking-[0.3em]">{COMPANY_NAME.split(' ')[1]}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar px-6 py-10 space-y-4">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] mb-6 px-4">Management Portal</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                currentView === item.id 
                  ? 'bg-construction-yellow text-construction-dark font-black shadow-xl shadow-construction-yellow/10' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="font-bold text-sm tracking-wide">{item.label === 'Attn.' ? 'Attendance' : item.label === 'Stock' ? 'Inventory' : item.label === 'Sites' ? 'Projects' : item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all group"
          >
            <span className="group-hover:rotate-12 transition-transform">
              {UI_ICONS.Logout}
            </span>
            <span className="font-black text-xs uppercase tracking-widest">Log Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Floating Dock Navigation */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-[100]">
        <div className="bg-construction-dark/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl shadow-black/40 flex justify-between items-center px-6 py-4 relative">
            {navItems.map((item) => (
            <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center w-12 transition-all duration-300 ${
                currentView === item.id ? 'text-construction-yellow -translate-y-1' : 'text-gray-500'
                }`}
            >
                <div className={`p-2 rounded-2xl transition-all duration-300 ${currentView === item.id ? 'bg-white/10 shadow-lg shadow-white/5 scale-110' : ''}`}>
                 {item.icon}
                </div>
                {currentView === item.id && (
                    <span className="absolute -bottom-2 text-[8px] font-black uppercase tracking-widest text-construction-yellow animate-pulse">
                        •
                    </span>
                )}
            </button>
            ))}
            <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center w-12 text-red-500/80 active:scale-95 transition-transform"
            >
             <div className="p-2">
                {UI_ICONS.Logout}
             </div>
            </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

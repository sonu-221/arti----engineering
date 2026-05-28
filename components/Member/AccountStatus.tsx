
import React from 'react';
import { User, UserStatus } from '../../types';

interface AccountStatusProps {
  user: User;
  onLogout: () => void;
  onRefresh: () => void;
}

const AccountStatus: React.FC<AccountStatusProps> = ({ user, onLogout, onRefresh }) => {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl p-6 md:p-10 text-center space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Status Icon - Optimized for mobile size */}
        <div className="flex justify-center">
          <div className="w-20 h-20 md:w-32 md:h-32 bg-yellow-50 rounded-full flex items-center justify-center shadow-inner relative group">
            <div className="absolute inset-0 bg-yellow-400 opacity-10 rounded-full scale-110 group-hover:scale-125 transition-transform duration-700"></div>
            <div className="w-12 h-12 md:w-20 md:h-20 bg-construction-yellow/20 rounded-full flex items-center justify-center text-construction-yellow">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 md:w-12 md:h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
               </svg>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3 md:space-y-4">
          <h2 className="text-2xl md:text-4xl font-oswald font-bold text-construction-yellow uppercase tracking-tight">
            Approval Pending
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600 text-sm md:text-lg leading-relaxed font-medium">
              Your registration has been received! Our site administrators are currently reviewing your profile.
            </p>
            <p className="text-gray-500 text-xs md:text-sm font-medium">
              You will be able to access the dashboard once approved.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 md:pt-8 space-y-3 md:space-y-4">
          <button
            onClick={onRefresh}
            className="w-full py-4 md:py-5 bg-construction-dark text-construction-yellow font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            <span>Check Status Now</span>
          </button>
          
          <button
            onClick={onLogout}
            className="w-full py-4 md:py-5 bg-gray-50 text-slate-500 font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] rounded-2xl border border-gray-100 hover:bg-gray-100 hover:text-slate-800 transition-all active:scale-95"
          >
            Sign Out / Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountStatus;

import React, { useState, useEffect } from 'react';
import { COMPANY_NAME, UI_ICONS } from '../../constants';
import { loginUser, saveUserToStorage } from '../../services/authService';
import AuthInfoSlider from './AuthInfoSlider';
import { motion, useAnimation } from 'framer-motion';

interface AdminLoginProps {
  onLogin: (user: any) => void;
  onSwitchToSignup: () => void;
  onBackToLanding: () => void;
  adminType?: 'admin' | 'site-manager';
}

const AdminLogin: React.FC<AdminLoginProps> = ({ 
  onLogin, 
  onSwitchToSignup,
  onBackToLanding,
  adminType = 'admin'
}) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const controls = useAnimation();

  useEffect(() => {
    if (error) {
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      });
    }
  }, [error, controls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await loginUser({
        email: formData.email,
        password: formData.password,
        role: adminType === 'admin' ? 'ADMIN' : 'SITE_MANAGER'
      });

      // Verify user has admin role
      if (response.user.role !== 'ADMIN' && response.user.role !== 'SITE_MANAGER') {
        throw new Error('This account does not have admin access');
      }

      saveUserToStorage(response.user);
      onLogin(response.user);
      setFormData({ email: '', password: '' });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all duration-300 transform focus:scale-[1.01] focus:shadow-md text-xs sm:text-sm";

  const title = adminType === 'admin' ? 'ADMIN LOGIN' : 'SITE MANAGER LOGIN';
  const subtitle = adminType === 'admin' ? 'Admin Portal Access' : 'Site Manager Portal';

  return (
    <div className="min-h-screen flex items-center justify-center bg-construction-dark px-4 py-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] border-[50px] border-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] border-[30px] border-red-500/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <motion.div 
        animate={controls}
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6 bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden border-t-8 border-red-600 mx-auto"
      >
        <div className="text-center">
          {/* Home Icon */}
          <button 
            onClick={onBackToLanding}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-slate-800 transition-colors z-20"
            title="Return to Home"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          </button>

          <div className="flex justify-center mb-3 sm:mb-4 mt-2 sm:mt-0">
            <div 
              className="bg-red-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-white shadow-lg"
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-oswald font-bold text-red-600 uppercase tracking-tighter">
            {title}
          </h2>
          <p className="mt-1 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 sm:mb-6">
            {COMPANY_NAME} - {subtitle}
          </p>
        </div>

        <div className="hidden sm:block">
          <AuthInfoSlider />
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-2.5 sm:p-3 rounded-xl text-center border border-red-100 animate-pulse">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
        )}

        <form className="mt-2 sm:mt-4 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Admin Email</label>
              <input
                type="email"
                required
                className={inputClasses}
                placeholder="admin@email.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
              </div>
              <input
                type="password"
                required
                className={inputClasses}
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 sm:py-4 px-4 border border-transparent text-xs sm:text-sm font-black rounded-xl text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/10 active:scale-95 transition-all uppercase tracking-widest"
          >
            {isLoading ? "Authenticating..." : "Admin Login"}
          </button>
        </form>

        <div className="text-center pt-4 sm:pt-6 border-t border-gray-100">
          <button 
            onClick={onSwitchToSignup}
            className="text-[10px] sm:text-[11px] font-black text-slate-500 hover:text-red-600 uppercase tracking-[0.1em] transition-colors"
          >
            New Admin? Create Account
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

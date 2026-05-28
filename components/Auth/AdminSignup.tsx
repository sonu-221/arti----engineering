
import React, { useState, useEffect } from 'react';
import { UserRole, UserStatus, User } from '../../types';
import { db } from '../../services/db';
import bcrypt from 'bcryptjs';
import AuthInfoSlider from './AuthInfoSlider';
import { motion, useAnimation } from 'framer-motion';

// SECURITY KEYS
const ADMIN_AUTH_KEY = "ARRKPAPA";
const SITE_MANAGER_AUTH_KEY = "SITE2026";

interface AdminSignupProps {
  onSwitchToLogin: () => void;
  onSwitchToMemberSignup: () => void;
  onBackToLanding: () => void;
  defaultRole?: UserRole.ADMIN | UserRole.SITE_MANAGER;
}

const AdminSignup: React.FC<AdminSignupProps> = ({ 
  onSwitchToLogin, 
  onSwitchToMemberSignup, 
  onBackToLanding,
  defaultRole = UserRole.ADMIN 
}) => {
  const [roleType, setRoleType] = useState<UserRole.ADMIN | UserRole.SITE_MANAGER>(defaultRole);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityCode: '',
    aadharNumber: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const controls = useAnimation();

  useEffect(() => {
    setRoleType(defaultRole);
  }, [defaultRole]);

  useEffect(() => {
    if (error) {
      controls.start({ opacity: 1, y: 0 });
    }
  }, [error, controls]);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Capitalize the first letter of each word
    const value = e.target.value;
    const formattedValue = value.replace(/\b\w/g, (char) => char.toUpperCase());
    setFormData({ ...formData, fullName: formattedValue });
  };

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 12) {
      value = value.substring(0, 12);
    }
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setFormData({ ...formData, aadharNumber: formattedValue });
  };

  const handleSecurityCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow letters and numbers, remove spaces for processing
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Limit to 8 characters
    if (value.length > 8) {
      value = value.substring(0, 8);
    }

    // Add space after 4 characters
    const formattedValue = value.replace(/([A-Z0-9]{4})(?=[A-Z0-9])/, '$1 ');
    
    setFormData({ ...formData, securityCode: formattedValue });
  };

  const triggerShake = () => {
    controls.start({
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Email Validation
    if (!validateEmail(formData.email)) {
      setError("INVALID EMAIL: Please provide a proper email format.");
      triggerShake();
      return;
    }

    // 2. Aadhar Length Check
    const rawAadhar = formData.aadharNumber.replace(/\s/g, '');
    if (rawAadhar.length > 0 && rawAadhar.length !== 12) {
      setError("AADHAR ERROR: Aadhar number must be exactly 12 digits.");
      triggerShake();
      return;
    }

    // 3. Validate Security Key (Strip spaces before comparing)
    const cleanCode = formData.securityCode.replace(/\s/g, '').toUpperCase();
    
    if (roleType === UserRole.ADMIN && cleanCode !== ADMIN_AUTH_KEY) {
      setError("AUTHENTICATION ERROR: Invalid Admin Security Key.");
      triggerShake();
      return;
    }

    if (roleType === UserRole.SITE_MANAGER && cleanCode !== SITE_MANAGER_AUTH_KEY) {
      setError("AUTHENTICATION ERROR: Invalid Site Manager Key.");
      triggerShake();
      return;
    }

    // 4. Password Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      triggerShake();
      return;
    }

    if (formData.password.length < 8) {
      setError("Security Policy: Passwords must be at least 8 characters.");
      triggerShake();
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const users = db.users.getAll();
      const existingEmail = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
      
      if (existingEmail) {
        setError("Account Conflict: This email is already registered.");
        setIsLoading(false);
        triggerShake();
        return;
      }

      // We only check for duplicate Aadhar for admins/site-managers, because they don't input mobile in this screen
      if (rawAadhar.length > 0) {
        const existingAadhar = users.find(u => u.aadharNumber === rawAadhar);
        if (existingAadhar) {
          setError("Account Conflict: This Aadhar number is already registered.");
          setIsLoading(false);
          triggerShake();
          return;
        }
      }

      const salt = bcrypt.genSaltSync(12);
      const hashedPassword = bcrypt.hashSync(formData.password, salt);

      const newUser: User = {
        id: `mgmt-${Date.now()}`,
        fullName: formData.fullName,
        email: formData.email,
        password: hashedPassword,
        mobile: 'SECURE_MGMT',
        role: roleType,
        status: UserStatus.APPROVED, 
        workType: roleType === UserRole.ADMIN ? 'Administrator' : 'Site Manager',
        dailySalary: 0,
        createdAt: new Date().toISOString(),
        aadharNumber: rawAadhar
      };

      db.users.save(newUser);
      
      setIsSuccess(true);
      setIsLoading(false);
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    }, 1200);
  };

  const inputClasses = "w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-opacity-50 outline-none transition-all duration-300 text-sm font-medium text-slate-700 placeholder:text-slate-300 shadow-sm";
  
  // Dynamic Styles based on Role
  const isSiteManager = roleType === UserRole.SITE_MANAGER;
  const themeColorText = isSiteManager ? 'text-blue-600' : 'text-red-600';
  const themeBgLight = isSiteManager ? 'bg-blue-600/10' : 'bg-red-600/10';
  const themeBgMain = isSiteManager ? 'bg-blue-600' : 'bg-red-600';
  const themeShadow = isSiteManager ? 'shadow-blue-600/20' : 'shadow-red-600/20';
  const focusRing = isSiteManager ? 'focus:ring-blue-600' : 'focus:ring-red-600';
  const buttonColor = isSiteManager ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-[#EF4444] hover:bg-red-700 shadow-red-600/30';
  
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-construction-dark px-4">
        <div className="max-w-xs md:max-w-md w-full bg-white p-8 md:p-12 rounded-3xl md:rounded-[3rem] shadow-2xl text-center space-y-4 md:space-y-6">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 md:w-12 md:h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-2xl md:text-4xl font-oswald font-bold text-construction-dark uppercase tracking-tight">Access Granted</h2>
          <p className="text-gray-500 text-sm md:text-base font-medium">{roleType === UserRole.ADMIN ? 'Administrator' : 'Site Manager'} account created. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-12 relative overflow-hidden">
      <div className={`absolute top-1/4 left-0 w-96 h-96 ${themeBgLight} rounded-full blur-[120px] pointer-events-none`}></div>
      <div className={`absolute bottom-1/4 right-0 w-96 h-96 ${themeBgLight} rounded-full blur-[120px] pointer-events-none`}></div>

      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center"
      >
        <div className={`absolute top-0 left-0 w-full h-1.5 ${themeBgMain}`}></div>

        {/* Home Icon */}
        <button 
          onClick={onBackToLanding}
          className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-slate-800 transition-colors z-20"
          title="Return to Home"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        </button>

        <div className="w-full px-8 pt-10 pb-12 flex flex-col items-center space-y-6">
          <div className={`w-16 h-16 ${themeBgMain} rounded-2xl flex items-center justify-center text-white shadow-xl ${themeShadow} transform -rotate-3 hover:rotate-0 transition-transform duration-300`}>
             {isSiteManager ? (
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
             ) : (
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
             )}
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-oswald font-bold text-[#0F172A] uppercase tracking-tighter leading-none">
              {isSiteManager ? 'Site Manager' : 'Administrator'}
            </h1>
            <p className={`mt-2 text-[10px] font-bold ${themeColorText} uppercase tracking-[0.2em]`}>
              Authorized Registration
            </p>
          </div>

          <AuthInfoSlider />

          {error && (
            <motion.div 
              animate={controls}
              initial={{ opacity: 0, y: -10 }} 
              className={`w-full ${themeBgMain} p-4 rounded-xl shadow-lg ${themeShadow}`}
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-white shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2"/></svg>
                <p className="text-[11px] font-black text-white uppercase tracking-widest leading-tight">{error}</p>
              </div>
            </motion.div>
          )}

          <form className="w-full space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              required
              className={`${inputClasses} ${focusRing}`}
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleNameChange}
            />
            
            <input
              type="email"
              required
              className={`${inputClasses} ${focusRing}`}
              placeholder="Email Address"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />

            <div className="relative group">
               <label className="absolute -top-2 left-4 bg-white px-2 text-[8px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-slate-800 transition-colors z-10">AADHAR CARD</label>
               <input
                type="text"
                className={`${inputClasses} ${focusRing}`}
                placeholder="XXXX XXXX XXXX"
                value={formData.aadharNumber}
                onChange={handleAadharChange}
              />
            </div>

            <div className="relative group">
               <label className={`absolute -top-2 left-4 bg-white px-2 text-[8px] font-black ${themeColorText} uppercase tracking-widest z-10`}>
                 {isSiteManager ? 'SITE MANAGER KEY' : 'ADMIN KEY'}
               </label>
               <input
                type="password"
                required
                maxLength={9}
                className={`${inputClasses} font-mono tracking-[0.2em] ${themeColorText} border-red-100 ${isSiteManager ? 'bg-blue-50/30' : 'bg-red-50/20'} uppercase focus:bg-white`}
                placeholder="ENTER CODE"
                value={formData.securityCode}
                onChange={handleSecurityCodeChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="password"
                required
                className={`${inputClasses} ${focusRing}`}
                placeholder="Set Password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <input
                type="password"
                required
                className={`${inputClasses} ${focusRing}`}
                placeholder="Confirm"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-5 ${buttonColor} text-white text-[11px] font-black rounded-2xl shadow-2xl active:scale-[0.98] transition-all uppercase tracking-[0.2em] flex items-center justify-center overflow-hidden relative group`}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span className="relative">Create Account</span>
                )}
              </button>
            </div>
          </form>

          <div className="w-full flex flex-col space-y-4 text-center pt-2">
            <button 
              onClick={onSwitchToLogin}
              className={`text-[11px] font-black ${themeColorText} hover:underline uppercase tracking-widest`}
            >
              Back to Management Login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSignup;

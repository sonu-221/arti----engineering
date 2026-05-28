
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { UI_ICONS, COMPANY_NAME } from '../../constants';
import { UserRole } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import AuthInfoSlider from './AuthInfoSlider';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
  onSuccess: (user: any) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'RESET'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const generateAndSendOtp = (targetEmail: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    
    // Virtual Inbox simulation for browser testing
    setShowSimulator(true);
    setResendTimer(30);
    
    // Fallback for developer testing
    console.info(`[ARTI SECURITY] OTP for ${targetEmail}: ${otp}`);
    return otp;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      const user = db.users.getByEmail(email);
      if (!user) {
        alert("This email is not registered in the Arti Engineering database. Please check for typos.");
        setIsLoading(false);
        return;
      }

      generateAndSendOtp(email);
      setStep('OTP');
      setIsLoading(false);
    }, 800);
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      generateAndSendOtp(email);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === generatedOtp) {
      setStep('RESET');
      setShowSimulator(false);
    } else {
      alert("Verification Failed. Please check the Virtual Inbox notification at the top of your screen.");
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      alert("Security Requirement: Password must be at least 4 characters long.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const updatedUser = db.users.updatePasswordByEmail(email, newPassword);
      if (updatedUser) {
        onSuccess(updatedUser);
      } else {
        alert("A system error occurred. Please try again later.");
      }
      setIsLoading(false);
    }, 1000);
  };

  const inputClasses = "w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-construction-yellow focus:bg-white outline-none transition-all duration-300 transform focus:scale-[1.01] text-sm font-bold";

  return (
    <div className="min-h-screen flex items-center justify-center bg-construction-dark px-4 py-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-construction-yellow z-50"></div>
      
      {/* SECURITY SIMULATOR: High-visibility notification */}
      <AnimatePresence>
        {showSimulator && (
          <motion.div 
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -150, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[300] w-[95%] max-w-md"
          >
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-construction-yellow p-5 flex items-center space-x-5">
              <div className="bg-red-500 text-white p-3 rounded-2xl shadow-lg animate-pulse">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Dispatch (Virtual Inbox)</p>
                <p className="text-sm font-bold text-slate-900 mt-1">Reset Code for <span className="text-construction-yellow">{email}</span></p>
                <p className="text-2xl font-black text-red-600 font-oswald mt-1 tracking-[0.2em]">{generatedOtp}</p>
              </div>
              <button onClick={() => setShowSimulator(false)} className="text-slate-300 hover:text-slate-900 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <p className="text-center text-white/50 text-[10px] font-bold uppercase tracking-widest mt-4">Note: Real Gmail API requires backend integration.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-md w-full space-y-6 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-construction-yellow p-4 rounded-2xl text-construction-dark shadow-xl ring-8 ring-construction-yellow/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            </div>
          </div>
          <h2 className="text-3xl font-oswald font-bold text-construction-dark uppercase tracking-tight">
            Account Recovery
          </h2>
          <p className="mt-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">
            Secure Identity Protocol
          </p>
        </div>

        <AuthInfoSlider />

        <AnimatePresence mode="wait">
          {step === 'EMAIL' && (
            <motion.form 
              key="email"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleEmailSubmit} 
              className="space-y-5"
            >
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Registered Personnel Email</label>
                <input
                  type="email"
                  required
                  className={inputClasses}
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-5 bg-construction-yellow text-construction-dark font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] hover:bg-yellow-500 shadow-xl active:scale-95 transition-all"
              >
                {isLoading ? "Validating Registry..." : "Dispatch Recovery Code"}
              </button>
            </motion.form>
          )}

          {step === 'OTP' && (
            <motion.form 
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleOtpSubmit} 
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-[11px] text-gray-500 font-bold uppercase mb-6 tracking-wide leading-relaxed">
                  Enter the 6-digit verification code visible in the simulation box above.
                </p>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  className="w-full text-center text-4xl tracking-[0.4em] font-oswald font-bold py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-construction-yellow outline-none transition-all"
                  placeholder="------"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              
              <div className="flex flex-col space-y-4">
                <button
                  type="submit"
                  className="w-full flex justify-center py-5 bg-construction-dark text-construction-yellow font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-xl active:scale-95 transition-all"
                >
                  Verify Access Code
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  className={`text-[10px] font-black uppercase tracking-widest ${resendTimer > 0 ? 'text-gray-300' : 'text-construction-yellow hover:underline'}`}
                >
                  {resendTimer > 0 ? `Wait ${resendTimer}s to Resend` : "Resend New Code"}
                </button>
              </div>
            </motion.form>
          )}

          {step === 'RESET' && (
            <motion.form 
              key="reset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleResetSubmit} 
              className="space-y-5"
            >
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  className={inputClasses}
                  placeholder="Create strong password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-5 bg-green-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] hover:bg-green-700 shadow-xl active:scale-95 transition-all"
              >
                {isLoading ? "Saving..." : "Update Credentials"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="text-center pt-6 border-t border-slate-50">
          <button 
            onClick={onSwitchToLogin}
            className="text-[10px] font-black text-gray-400 hover:text-construction-dark uppercase tracking-widest transition-colors flex items-center justify-center mx-auto space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span>Return to Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

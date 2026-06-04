
import React, { useState } from 'react';
import { UserRole, UserStatus } from '../../types';
import { COMPANY_NAME, UI_ICONS } from '../../constants';
import { signupUser } from '../../services/authService';
import AuthInfoSlider from './AuthInfoSlider';
import { motion } from 'framer-motion';

interface SignupProps {
  onSwitchToLogin: () => void;
  onBackToLanding: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin, onBackToLanding }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    workType: 'Helper',
    age: '',
    aadharNumber: '',
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [generalError, setGeneralError] = useState('');

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

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, mobile: val });
    if (val.length === 10) {
      setMobileError('');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMobileError('');
    setGeneralError('');

    try {
      // 1. Validate Password Match
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // 2. Validate Password Length
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // 3. Validate Email Format
      if (!validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // 4. Validate Mobile
      if (formData.mobile.length < 10) {
        setMobileError('Mobile number must be 10 digits');
        setIsLoading(false);
        return;
      }

      // 5. Call backend signup API
      const response = await signupUser({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        mobile: formData.mobile,
        workType: formData.workType,
        age: formData.age,
        aadharNumber: formData.aadharNumber.replace(/\s/g, ''),
      });

      // Show success message
      alert('Registration successful! Your account has been created.');

      // Reset form
      setFormData({
        fullName: '',
        mobile: '',
        email: '',
        workType: 'Helper',
        age: '',
        aadharNumber: '',
        password: '',
        confirmPassword: ''
      });

      // Switch to login
      onSwitchToLogin();
    } catch (err: any) {
      setGeneralError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-construction-yellow focus:bg-white outline-none transition-all duration-300 transform focus:scale-[1.01] text-xs sm:text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center bg-construction-dark px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-3xl bg-construction-yellow"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl bg-construction-yellow"></div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6 bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden border-t-8 border-construction-yellow mx-auto"
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
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-construction-yellow text-construction-dark shadow-lg shadow-construction-yellow/20 scale-90 sm:scale-100">
              {UI_ICONS.Construction}
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-oswald font-bold text-construction-dark uppercase tracking-tighter leading-none">
            Worker Registration
          </h2>
          <p className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4 sm:mb-6 text-gray-400">
            ARTI ENGINEERING MANAGEMENT
          </p>
        </div>

        <div className="hidden sm:block">
          <AuthInfoSlider />
        </div>

        <form 
            className="mt-2 sm:mt-4 space-y-3 sm:space-y-4" 
            onSubmit={handleSignup}
        >
        <div className="space-y-2 sm:space-y-3">
            {generalError && (
              <div className="bg-red-50 text-red-600 text-xs sm:text-sm font-bold p-3 rounded-xl border border-red-200 shadow-sm flex items-start gap-2">
                 <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 <span>{generalError}</span>
              </div>
            )}

            <input
            type="text"
            required
            className={inputClasses}
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleNameChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <input
                    type="tel"
                    required
                    className={`${inputClasses} ${mobileError ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Mobile Number"
                    value={formData.mobile}
                    onChange={handleMobileChange}
                />
                {mobileError && (
                    <p className="absolute -bottom-4 left-1 text-[9px] font-bold text-red-500">{mobileError}</p>
                )}
              </div>
              <input
                  type="email"
                  required
                  className={inputClasses}
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
            <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-gray-400 uppercase z-10">Trade</label>
                <select
                className={inputClasses}
                value={formData.workType}
                onChange={e => setFormData({...formData, workType: e.target.value})}
                >
                <option value="Helper">Helper</option>
                <option value="Fitter">Fitter</option>
                <option value="Electrician">Electrician</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Rigger">Rigger</option>
                <option value="Welder">Welder</option>
                <option value="Grander">Grander</option>
                <option value="Khalashi">Khalashi</option>
                <option value="Sefty officer">Sefty officer</option>
                </select>
            </div>
            <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-gray-400 uppercase z-10">Age</label>
                <input
                type="text"
                inputMode="numeric"
                required
                className={inputClasses}
                placeholder="Years"
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value.replace(/\D/g, '').slice(0, 3)})}
                />
            </div>
            </div>

            <div className="relative group">
               <label className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-gray-400 uppercase z-10">AADHAR NUMBER</label>
               <input
                type="text"
                required
                className={inputClasses}
                placeholder="XXXX XXXX XXXX"
                value={formData.aadharNumber}
                onChange={handleAadharChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                  type="password"
                  required
                  className={inputClasses}
                  placeholder="Set Password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <input
                  type="password"
                  required
                  className={inputClasses}
                  placeholder="Confirm"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
        </div>

        <div className="pt-2">
            <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 sm:py-4 px-4 border border-transparent text-xs sm:text-sm font-black rounded-xl text-white bg-construction-dark hover:bg-black shadow-lg shadow-construction-dark/20 transition-all uppercase tracking-widest active:scale-95"
            >
            {isLoading ? "Registering..." : "Submit Registration"}
            </button>
        </div>
        </form>

        <div className="pt-4 sm:pt-6 border-t border-gray-100 flex flex-col space-y-3 text-center">
          <button 
            onClick={onSwitchToLogin}
            className="text-[9px] sm:text-[10px] font-black text-gray-400 hover:text-construction-dark uppercase tracking-widest"
          >
            Return to Management Login
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;

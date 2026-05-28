
import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { UserRole, UserStatus, AttendanceStatus } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

const SalaryManagement: React.FC = () => {
  const workers = db.users.getAll().filter(u => u.role === UserRole.MEMBER && u.status === UserStatus.APPROVED);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  const calculateDues = (userId: string) => {
    const u = db.users.getById(userId);
    if (!u) return { earned: 0, paid: 0, due: 0 };
    
    const userAttendance = db.attendance.getByUser(userId);
    const earned = userAttendance.reduce((acc, curr) => {
      const mult = curr.status === AttendanceStatus.PRESENT ? 1 : curr.status === AttendanceStatus.HALF_DAY ? 0.5 : 0;
      const effectiveDailyRate = curr.dailySalarySnapshot !== undefined && curr.dailySalarySnapshot > 0 
        ? curr.dailySalarySnapshot 
        : u.dailySalary;
        
      return acc + (effectiveDailyRate * mult) + (curr.overtimeHours * (effectiveDailyRate / 12));
    }, 0);
    
    const paid = db.payments.getByUser(userId).reduce((acc, curr) => acc + curr.amount, 0);
    return { earned, paid, due: Math.max(0, earned - paid) };
  };

  const dashboardMetrics = useMemo(() => {
    let totalLiabilities = 0;
    let totalDisbursed = 0;
    let totalEarned = 0;

    workers.forEach(w => {
      const { earned, paid, due } = calculateDues(w.id);
      totalLiabilities += due;
      totalDisbursed += paid;
      totalEarned += earned;
    });

    return { totalLiabilities, totalDisbursed, totalEarned };
  }, [workers]);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || !paymentAmount) return;

    const newPayment = {
      id: `pay-${Date.now()}`,
      userId: selectedWorkerId,
      amount: Number(paymentAmount),
      date: new Date().toISOString().split('T')[0],
      month: month,
      notes
    };

    db.payments.save(newPayment);
    alert("Payment recorded successfully!");
    
    // Reset Form
    setPaymentAmount('');
    setNotes('');
    setSelectedWorkerId('');
  };

  const handleQuickFill = (amount: number) => {
    setPaymentAmount(Math.floor(amount).toString());
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="font-oswald font-bold uppercase text-3xl text-slate-900 tracking-tight">Finance & Payroll</h2>
           <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Manage Settlements & Dues</p>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Company Dues</p>
                <p className="text-4xl font-oswald text-red-600 font-bold">₹{dashboardMetrics.totalLiabilities.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
             </div>
             <div className="absolute right-[-10px] bottom-[-20px] opacity-5">
                <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Disbursed (Lifetime)</p>
                <p className="text-4xl font-oswald text-construction-yellow font-bold">₹{dashboardMetrics.totalDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
             </div>
             <div className="absolute right-[-10px] bottom-[-20px] opacity-10 text-white">
                <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
             </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Active Payroll Count</p>
                <p className="text-4xl font-oswald text-slate-800 font-bold">{workers.length}</p>
             </div>
             <div className="absolute right-[-10px] bottom-[-20px] opacity-5">
                <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
             </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Payment Entry Form (Left / Top) */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-8 relative overflow-hidden"
          >
            {/* Background Decor */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-construction-yellow/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <h3 className="font-oswald font-bold uppercase text-2xl mb-8 flex items-center gap-3 text-construction-dark">
              <span className="p-2 bg-construction-dark text-construction-yellow rounded-xl shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              Transfer
            </h3>

            <form onSubmit={handlePayment} className="space-y-6 relative z-10">
              
              {/* Select Worker */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Select User</label>
                <div className="relative">
                    <select 
                        required
                        className="w-full pl-4 pr-10 py-3.5 bg-gray-50 border border-gray-200 text-sm font-bold text-slate-800 rounded-xl appearance-none focus:ring-2 focus:ring-construction-yellow focus:bg-white outline-none transition-all shadow-sm"
                        value={selectedWorkerId}
                        onChange={e => {
                          setSelectedWorkerId(e.target.value);
                          setPaymentAmount(''); // Reset amount when switching workers
                        }}
                    >
                        <option value="" disabled className="text-gray-400">Choose Personnel...</option>
                        {workers.map(w => (
                        <option key={w.id} value={w.id}>{w.fullName} • {w.workType}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
              </div>
              
              {/* Animated Dues Card */}
              <AnimatePresence mode="popLayout">
                {selectedWorkerId && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                     <div className="bg-slate-800 p-5 rounded-2xl flex justify-between items-center shadow-inner relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/20 to-transparent"></div>
                        <div className="relative z-10 w-full">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pending Dues</p>
                                    <p className="text-3xl font-oswald text-construction-yellow font-bold tracking-tight">₹{calculateDues(selectedWorkerId).due.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Lifetime Paid</p>
                                    <p className="text-lg font-oswald text-white font-medium">₹{calculateDues(selectedWorkerId).paid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>
                            
                            {calculateDues(selectedWorkerId).due > 0 && (
                              <div className="flex gap-2 mt-4">
                                <button 
                                  type="button" 
                                  onClick={() => handleQuickFill(calculateDues(selectedWorkerId).due)}
                                  className="text-[10px] uppercase font-bold tracking-widest bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                                >
                                  SETTLE FULL
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleQuickFill(calculateDues(selectedWorkerId).due / 2)}
                                  className="text-[10px] uppercase font-bold tracking-widest bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                                >
                                  PAY 50%
                                </button>
                              </div>
                            )}
                        </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transfer Amount</label>
                  <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-oswald font-bold text-gray-400 text-lg">₹</span>
                      <input 
                          required
                          type="number"
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-construction-yellow focus:bg-white outline-none transition-all font-bold text-lg shadow-sm"
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                      />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Applicable Period</label>
                  <input 
                    type="month"
                    required
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-construction-yellow focus:bg-white outline-none transition-all font-bold text-sm shadow-sm"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transaction Notes</label>
                <div className="relative">
                    <textarea 
                        placeholder="Advance, Bank Transfer, UPI..."
                        className="w-full p-4 bg-gray-50 border border-gray-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-construction-yellow focus:bg-white outline-none transition-all font-medium text-sm shadow-sm placeholder:text-gray-400 resize-none h-24"
                        value={notes}
                        onChange={e => {
                          const val = e.target.value;
                          setNotes(val.charAt(0).toUpperCase() + val.slice(1));
                        }}
                    />
                </div>
              </div>

              <button 
                type="submit"
                disabled={!selectedWorkerId || !paymentAmount}
                className="w-full bg-construction-dark text-construction-yellow font-black py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span>Payment</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              </button>
            </form>
          </motion.div>
        </div>

        {/* Live Ledger / Summary Roster (Right / Bottom) */}
        <div className="lg:col-span-7">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col h-[700px] relative"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-gray-100 bg-slate-50/50 shrink-0 flex items-center justify-between">
                <div>
                   <h3 className="font-oswald font-bold uppercase text-xl text-slate-800">Financial Ledger</h3>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Live Balance Overview across {workers.length} Personnel</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm border border-blue-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-hidden flex flex-col relative bg-white">
                <div className="flex text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 md:px-8 py-4 bg-white border-b border-gray-50 shrink-0 shadow-sm z-10 relative">
                     <div className="flex-1">User</div>
                     <div className="w-24 text-right hidden sm:block">Net Accrued</div>
                     <div className="w-24 text-right">Total Paid</div>
                     <div className="w-24 text-right text-red-500">Dues</div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-2 custom-scrollbar">
                    <div className="space-y-2 pb-10">
                        {workers.map((w, idx) => {
                            const { earned, paid, due } = calculateDues(w.id);
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    key={w.id} 
                                    onClick={() => setSelectedWorkerId(w.id)} 
                                    className={`flex items-center px-4 py-3 rounded-xl transition-all cursor-pointer border ${selectedWorkerId === w.id ? 'bg-construction-yellow/10 border-construction-yellow shadow-md transform scale-[1.01]' : 'bg-transparent border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}
                                >
                                    <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs uppercase border border-slate-200">
                                            {w.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800 truncate">{w.fullName}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{w.workType}</p>
                                        </div>
                                    </div>
                                    <div className="w-24 text-right hidden sm:block">
                                        <p className="text-sm font-medium text-slate-600">₹{earned.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                    </div>
                                    <div className="w-24 text-right">
                                        <p className="text-sm font-bold text-green-600">₹{paid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                    </div>
                                    <div className="w-24 text-right">
                                        <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-black font-mono tracking-tight ${due > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                            ₹{due.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}

                        {workers.length === 0 && (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                     <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                </div>
                                <p className="text-sm font-bold text-slate-500">No active personnel found.</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Approve workers in Personnel Registry first</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fade out gradient at bottom of scroll list */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-[2rem]"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SalaryManagement;

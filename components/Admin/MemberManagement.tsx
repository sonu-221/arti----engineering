
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { UserRole, UserStatus, DutyStatus, User } from '../../types';
import { API_BASE_URL } from '../../services/authService';
import { motion, AnimatePresence } from 'framer-motion';

const MemberManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL');
  const [tradeFilter, setTradeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch pending members from backend
  const fetchPendingMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/members/pending`);
      const data = await response.json();
      if (data.members) {
        // Transform backend response to match UI expectations
        const transformedMembers = data.members.map((m: any) => ({
          id: m.id,
          fullName: m.name,
          email: m.email,
          status: m.status,
          role: m.role,
          mobile: '---',
          workType: 'Pending',
          dailySalary: 0,
          age: 0,
          gender: '',
          dob: '',
          aadharNumber: '',
          pancard: '',
          village: '',
          city: '',
          accountNumber: '',
          ifscCode: '',
          profilePhoto: ''
        }));
        setUsers(transformedMembers);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending members on component mount and set up auto-refresh
  useEffect(() => {
    fetchPendingMembers();
    
    // Auto-refresh every 5 seconds to catch new signups
    const interval = setInterval(fetchPendingMembers, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Edit State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ 
    dailySalary: '', 
    workType: ''
  });

  // Viewing Detail State
  const [viewingUser, setViewingUser] = useState<any | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = db.attendance.getByDate(todayStr);

  const trades = [
    'Helper', 
    'Fitter', 
    'Electrician', 
    'Supervisor', 
    'Rigger', 
    'Welder', 
    'Grander', 
    'Khalashi', 
    'Sefty officer'
  ];

  const handleStatusChange = async (id: string, status: UserStatus) => {
    try {
      const endpoint = status === UserStatus.APPROVED ? 'approve' : 'reject';
      const response = await fetch(`${API_BASE_URL}/members/${id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: id })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update local state
        setUsers(users.map(u => u.id === id ? { ...u, status } : u));
      }
    } catch (error) {
      console.error('Error updating member status:', error);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setEditForm({
      dailySalary: user.dailySalary?.toString() || '',
      workType: user.workType || ''
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    // Edit functionality for local member data (not from backend pending list)
    // This can be extended if needed
    setEditingUser(null);
  };
  
  const filteredUsers = users.filter(u => {
    const sMatch = statusFilter === 'ALL' || u.status === statusFilter;
    const tMatch = tradeFilter === 'ALL' || u.workType === tradeFilter;
    const qMatch = searchQuery === '' || 
                  u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.mobile.includes(searchQuery);
    return sMatch && tMatch && qMatch;
  });

  const getTradeCount = (trade: string) => users.filter(u => u.workType === trade).length;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-construction-yellow rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-gray-400">Loading pending approvals...</p>
          </div>
        </div>
      )}
      
      {!loading && (
      <>
      {/* Personnel Registry Area */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-oswald font-bold uppercase text-2xl text-slate-900 tracking-tight">Pending Approvals</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Worker Signup Requests • {users.length} pending</p>
            </div>
            {/* Refresh Button */}
            <button
              onClick={fetchPendingMembers}
              disabled={loading}
              className="p-2.5 bg-construction-yellow text-black rounded-lg hover:bg-yellow-500 disabled:opacity-50 font-bold text-xs uppercase tracking-widest transition-all"
              title="Refresh pending approvals"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            {/* SEARCH BAR */}
            <div className="relative w-full md:w-64 group">
              <input 
                type="text"
                placeholder="Search member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-construction-yellow outline-none transition-all group-focus-within:bg-white"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-construction-yellow transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5"/></svg>
            </div>

            {/* Slider/Tab Filter Style */}
            <div className="flex items-center bg-black/5 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
              {['ALL', 'APPROVED', 'PENDING', 'BLOCKED'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as any)}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    statusFilter === s ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-black/5'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Filter Row */}
        <div className="flex flex-wrap items-center gap-2 py-4 border-y border-gray-100">
           <span className="text-[10px] font-black text-gray-400 uppercase mr-2 flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
             Trade:
           </span>
           <button 
             onClick={() => setTradeFilter('ALL')}
             className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
               tradeFilter === 'ALL' ? 'bg-construction-yellow border-construction-yellow text-black' : 'bg-white border-gray-100 text-gray-400'
             }`}
           >
             All
           </button>
           {trades.map(t => (
             <button
               key={t}
               onClick={() => setTradeFilter(t)}
               className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                 tradeFilter === t ? 'bg-construction-yellow border-construction-yellow text-black' : 'bg-white border-gray-100 text-gray-400'
               }`}
             >
               {t} ({getTradeCount(t)})
             </button>
           ))}
        </div>

        {/* Table Registry */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 hidden md:table-header-group">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="p-5">Personnel Details</th>
                <th className="p-5">Duty Status</th>
                <th className="p-5">Trade & Age</th>
                <th className="p-5">Standard Rate</th>
                <th className="p-5 text-center">Access Status</th>
                <th className="p-5 text-right">System Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 block md:table-row-group">
              {filteredUsers.map(u => {
                const workerRecord = todayAttendance.find(a => a.userId === u.id);
                const isOnDuty = workerRecord?.dutyStatus === DutyStatus.ON;

                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors block md:table-row relative group">
                    {/* Mobile Card Layout */}
                    <div className="md:hidden p-3">
                      <div className="flex items-center space-x-3 mb-3">
                        <div 
                          onClick={() => setViewingUser(u)}
                          className="relative p-[2px] rounded-2xl active:bg-gradient-to-tr active:from-green-400 active:to-green-600 transition-all duration-300 shrink-0"
                        >
                            <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center font-bold text-lg cursor-pointer border shadow-sm bg-white ${
                                u.status === UserStatus.PENDING ? 'text-orange-600 border-orange-100' : 'text-green-600 border-green-100'
                            }`}>
                            {u.profilePhoto ? (
                                <img src={u.profilePhoto} alt={u.fullName} className="w-full h-full object-cover" />
                            ) : (
                                u.fullName.charAt(0)
                            )}
                            </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                             <p className="font-bold text-slate-900 text-sm uppercase truncate pr-2" onClick={() => setViewingUser(u)}>{u.fullName}</p>
                             
                             {/* Mobile Edit Rate Button */}
                             <div 
                                onClick={(e) => { e.stopPropagation(); handleEditClick(u); }} 
                                className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 active:bg-gray-100 cursor-pointer"
                             >
                                <p className="font-oswald font-black text-slate-800 text-sm shrink-0">₹{u.dailySalary}</p>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[9px] text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded">{u.workType}</span>
                             {u.status === UserStatus.PENDING ? (
                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Waitlist</span>
                             ) : (
                                <span className={`text-[9px] font-black uppercase ${isOnDuty ? 'text-green-600' : 'text-gray-400'}`}>{isOnDuty ? 'ON DUTY' : 'OFF DUTY'}</span>
                             )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 border-t border-gray-50 pt-2">
                         {u.status === UserStatus.PENDING ? (
                            <>
                                <button 
                                  onClick={() => handleStatusChange(u.id, UserStatus.APPROVED)}
                                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-sm"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(u.id, UserStatus.REJECTED)}
                                  className="flex-1 py-2 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                                >
                                  Reject
                                </button>
                            </>
                         ) : u.status === UserStatus.APPROVED ? (
                            <button 
                              onClick={() => handleStatusChange(u.id, UserStatus.BLOCKED)}
                              className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                            >
                              Block Access
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleStatusChange(u.id, UserStatus.APPROVED)}
                              className="flex-1 py-2 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors"
                            >
                              Re-Approve
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Desktop Table Layout */}
                    <td className="p-5 hidden md:table-cell">
                      <div className="flex items-center space-x-4">
                        <div 
                          onClick={() => setViewingUser(u)}
                          className="relative p-[2px] rounded-xl hover:bg-gradient-to-tr hover:from-green-400 hover:to-green-600 transition-all duration-300 shrink-0 cursor-pointer group-avatar"
                        >
                            <div className={`w-10 h-10 rounded-[10px] overflow-hidden flex items-center justify-center font-bold text-lg bg-white ${
                                u.status === UserStatus.PENDING ? 'text-orange-600' : 'text-green-600'
                            }`}>
                            {u.profilePhoto ? (
                                <img src={u.profilePhoto} alt={u.fullName} className="w-full h-full object-cover" />
                            ) : (
                                u.fullName.charAt(0)
                            )}
                            </div>
                        </div>
                        <div className="min-w-0 max-w-[140px] md:max-w-xs">
                          <div className="overflow-x-auto whitespace-nowrap pb-1">
                            <p className="font-bold text-slate-800 text-sm cursor-pointer hover:underline" onClick={() => setViewingUser(u)}>{u.fullName}</p>
                          </div>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                {u.mobile}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isOnDuty ? 'text-green-600' : 'text-gray-400'}`}>
                          {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <div className="flex flex-col items-start gap-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-md">
                            {u.workType}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 ml-1">
                            Age: {u.age || '--'} Yrs
                          </span>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handleEditClick(u)}>
                        <p className="font-oswald font-black text-2xl text-slate-800 group-hover:text-construction-dark">₹{u.dailySalary}</p>
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Click to Promote/Edit</p>
                    </td>
                    <td className="p-5 text-center hidden md:table-cell">
                      <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                        u.status === UserStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-100' :
                        u.status === UserStatus.PENDING ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-2 hidden md:table-cell">
                      {u.status === UserStatus.PENDING ? (
                        <>
                            <button 
                              onClick={() => handleStatusChange(u.id, UserStatus.APPROVED)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-[10px] font-black uppercase hover:bg-green-700 shadow-sm"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleStatusChange(u.id, UserStatus.REJECTED)}
                              className="px-3 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-black uppercase hover:bg-gray-200"
                            >
                              Reject
                            </button>
                        </>
                      ) : u.status === UserStatus.APPROVED ? (
                        <button 
                          onClick={() => handleStatusChange(u.id, UserStatus.BLOCKED)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded text-[10px] font-black uppercase hover:bg-red-100"
                        >
                          Block
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStatusChange(u.id, UserStatus.APPROVED)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-[10px] font-black uppercase hover:bg-green-700"
                        >
                          Re-Approve
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-300 font-black uppercase text-xs">No personnel matched your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Detail View Modal (Full Details) */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]"
            >
               {/* Close Button */}
               <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => setViewingUser(null)} className="p-2 bg-white/30 backdrop-blur-md rounded-full text-white hover:bg-white/50 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
               </div>

               {/* Profile Header Image Area */}
               <div className="h-32 bg-construction-yellow relative overflow-hidden shrink-0">
                   <div className="absolute inset-0 bg-construction-dark/10"></div>
                   <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
               </div>
               
               {/* Avatar */}
               <div className="px-6 relative -mt-12 flex flex-col items-center shrink-0">
                   <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl bg-gray-100 overflow-hidden">
                      {viewingUser.profilePhoto ? (
                          <img src={viewingUser.profilePhoto} alt={viewingUser.fullName} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">{viewingUser.fullName.charAt(0)}</div>
                      )}
                   </div>
                   <h2 className="mt-3 text-xl font-oswald font-bold text-slate-900 uppercase text-center leading-tight px-4">{viewingUser.fullName}</h2>
                   <span className="text-[10px] font-black text-white bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest mt-1.5 shadow-sm">{viewingUser.workType}</span>
               </div>

               {/* Details List */}
               <div className="p-8 space-y-4 overflow-y-auto custom-scrollbar">
                   <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Rate</span>
                       <span className="font-oswald font-bold text-xl text-green-600">₹{viewingUser.dailySalary}</span>
                   </div>

                   {/* Bank Details Section for Admin View */}
                   <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-2">Bank Account Details</h4>
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Account Number</span>
                                <p className="text-sm font-bold text-slate-800 font-mono tracking-wide">{viewingUser.accountNumber || 'Not Provided'}</p>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">IFSC Code</span>
                                <p className="text-sm font-bold text-slate-800 font-mono tracking-wide">{viewingUser.ifscCode || 'Not Provided'}</p>
                            </div>
                        </div>
                   </div>

                   <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile</span>
                       <span className="font-bold text-slate-800 text-sm font-mono tracking-tight">{viewingUser.mobile}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4 border-b border-gray-50 pb-2">
                       <div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Age</span>
                          <span className="font-bold text-slate-800 text-sm">{viewingUser.age || '--'} Yrs</span>
                       </div>
                       <div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Gender</span>
                          <span className="font-bold text-slate-800 text-sm">{viewingUser.gender || '--'}</span>
                       </div>
                   </div>
                   <div className="border-b border-gray-50 pb-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Date of Birth</span>
                       <span className="font-bold text-slate-800 text-sm">{viewingUser.dob || '--'}</span>
                   </div>
                   
                   <div className="space-y-4 pt-1">
                       <div className="relative pl-4 border-l-2 border-slate-200">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Aadhar Number</span>
                           <span className="font-oswald font-medium text-lg tracking-[0.15em] text-slate-800 block">
                               {viewingUser.aadharNumber ? viewingUser.aadharNumber.match(/.{1,4}/g)?.join(' ') : 'NOT VERIFIED'}
                           </span>
                       </div>
                       
                       <div className="relative pl-4 border-l-2 border-slate-200">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Pan Card</span>
                           <span className="font-oswald font-medium text-lg tracking-[0.15em] text-slate-800 uppercase block">
                               {viewingUser.pancard || 'NOT PROVIDED'}
                           </span>
                       </div>
                   </div>

                   {/* Address Details Section */}
                   <div className="bg-gray-50 p-4 rounded-xl space-y-3 mt-2">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-2">Residential Address</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Village</span>
                                <p className="text-xs font-bold text-slate-800">{viewingUser.village || '--'}</p>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">City</span>
                                <p className="text-xs font-bold text-slate-800">{viewingUser.city || '--'}</p>
                            </div>
                            
                            <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Block</span>
                                <p className="text-xs font-bold text-slate-800">{viewingUser.block || '--'}</p>
                            </div>
                             <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">District</span>
                                <p className="text-xs font-bold text-slate-800">{viewingUser.district || '--'}</p>
                            </div>

                            <div className="col-span-2">
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Police Station</span>
                                <p className="text-xs font-bold text-slate-800">{viewingUser.policeStation || '--'}</p>
                            </div>

                            <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">State</span>
                                <p className="text-xs font-bold text-slate-800 uppercase">{viewingUser.state || '--'}</p>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Pin Code</span>
                                <p className="text-xs font-bold text-slate-800 font-mono">{viewingUser.pincode || '--'}</p>
                            </div>
                        </div>
                   </div>
               </div>

               {/* Back Button Action */}
               <div className="p-8 pt-0 shrink-0">
                   <button onClick={() => setViewingUser(null)} className="w-full py-4 bg-gray-100 text-slate-600 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-gray-200 transition-colors active:scale-95">
                       Close File
                   </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal (Restricted to Rate & Trade) */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                 <div>
                    <h3 className="font-oswald font-bold text-xl uppercase text-slate-800">Promote / Edit Worker</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{editingUser.fullName}</p>
                 </div>
                 <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-slate-800">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
                 </button>
              </div>
              
              <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                   <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                   <p className="text-[10px] font-medium text-blue-800 leading-relaxed">
                     <span className="font-bold uppercase block mb-1">Effective Date Policy</span>
                     Changes to Rate or Trade will apply to <span className="underline font-bold">future attendance</span> marked from this moment onwards. Past financial records will remain unchanged to preserve history.
                   </p>
                </div>

                <form id="editWorkerForm" onSubmit={handleSaveEdit} className="space-y-6">
                  <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Daily Salary Rate (₹)</label>
                      <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-oswald font-bold text-gray-400 text-lg">₹</span>
                          <input 
                              type="text"
                              inputMode="decimal"
                              required
                              className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-construction-yellow focus:bg-white outline-none font-bold text-lg transition-all"
                              value={editForm.dailySalary}
                              onChange={e => {
                                  // Allow digits and dots
                                  let val = e.target.value.replace(/[^0-9.]/g, '');
                                  // Prevent more than one dot
                                  if ((val.match(/\./g) || []).length > 1) {
                                      return;
                                  }
                                  // Limit to 8 characters max
                                  if (val.length > 8) {
                                      val = val.slice(0, 8);
                                  }
                                  setEditForm({...editForm, dailySalary: val});
                              }}
                          />
                      </div>
                      <p className="text-[9px] text-orange-500 font-bold mt-2">Note: Changing this affects future salary calculations.</p>
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Trade Assignment</label>
                      <select 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-construction-yellow outline-none text-sm font-bold"
                          value={editForm.workType}
                          onChange={e => setEditForm({...editForm, workType: e.target.value})}
                      >
                          {trades.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                  </div>
                </form>
              </div>

              <div className="p-6 pt-2 flex gap-3 shrink-0 bg-white border-t border-gray-50">
                <button 
                    type="button" 
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-4 bg-white border border-gray-200 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    form="editWorkerForm"
                    className="flex-1 py-4 bg-construction-dark text-construction-yellow font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
                >
                    Save Promotion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
};

export default MemberManagement;

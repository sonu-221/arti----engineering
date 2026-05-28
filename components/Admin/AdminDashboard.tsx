
import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../../services/db';
import { UserRole, UserStatus, AttendanceStatus, User, AttendanceRecord, SalaryPayment } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const AdminDashboard: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [customFileName, setCustomFileName] = useState('');

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);

  // Interactive Modal States
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listModalTitle, setListModalTitle] = useState('');
  const [listModalContent, setListModalContent] = useState<any[]>([]);
  const [listModalType, setListModalType] = useState<'VIEW' | 'APPROVALS'>('VIEW');

  const refreshData = () => {
      setUsers(db.users.getAll().filter(u => u.role === UserRole.MEMBER));
      setAttendance(db.attendance.getByDate(new Date().toISOString().split('T')[0]));
      setPayments(db.payments.getAll());
  };

  useEffect(() => {
    refreshData();
    setCustomFileName(`Site_Report_${selectedMonth}`);
  }, [selectedMonth]);
  
  // Filtered payments for the selected month
  const filteredPayments = useMemo(() => {
    return payments.filter(p => p.date.startsWith(selectedMonth));
  }, [payments, selectedMonth]);

  const totalMonthDisbursed = useMemo(() => {
    const total = filteredPayments.reduce((acc, curr) => acc + curr.amount, 0);
    return Number(total.toFixed(2));
  }, [filteredPayments]);

  // Metric Calculations
  const approvedMembers = users.filter(u => u.status === UserStatus.APPROVED).length;
  const pendingApprovals = users.filter(u => u.status === UserStatus.PENDING).length;
  const presentToday = attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;

  // Financial Calculations (Overall)
  const totalPaid = Number(payments.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2));
  let totalPendingDues = 0;
  users.forEach(u => {
    if (u.status !== UserStatus.APPROVED) return;
    const userAttendance = db.attendance.getByUser(u.id);
    const earned = userAttendance.reduce((acc, curr) => {
      const mult = curr.status === AttendanceStatus.PRESENT ? 1 : curr.status === AttendanceStatus.HALF_DAY ? 0.5 : 0;
      
      // HISTORICAL RATE LOGIC: Use Snapshot if available
      const effectiveRate = curr.dailySalarySnapshot !== undefined && curr.dailySalarySnapshot > 0 
        ? curr.dailySalarySnapshot 
        : u.dailySalary;

      // Overtime calculated as (Daily Rate / 12 hours) * OT Hours
      return acc + (effectiveRate * mult) + (curr.overtimeHours * (effectiveRate / 12));
    }, 0);
    const paid = db.payments.getByUser(u.id).reduce((acc, curr) => acc + curr.amount, 0);
    
    // Ensure precision before diffing
    const earnedFixed = Number(earned.toFixed(2));
    const paidFixed = Number(paid.toFixed(2));
    totalPendingDues += Math.max(0, earnedFixed - paidFixed);
  });
  totalPendingDues = Number(totalPendingDues.toFixed(2));

  const handleShowTotalWorkers = () => {
    const list = users.map(u => ({
        id: u.id,
        name: u.fullName,
        sub: u.workType,
        status: u.status
    }));
    setListModalTitle('Total Registered Workforce');
    setListModalType('VIEW');
    setListModalContent(list);
    setListModalOpen(true);
  };

  const handleShowApproved = () => {
    const list = users
        .filter(u => u.status === UserStatus.APPROVED)
        .map(u => ({
            id: u.id,
            name: u.fullName,
            sub: u.workType,
            status: 'ACTIVE'
        }));
    setListModalTitle('Verified Active Personnel');
    setListModalType('VIEW');
    setListModalContent(list);
    setListModalOpen(true);
  };

  const handleShowPresent = () => {
    const presentRecords = attendance.filter(a => a.status === AttendanceStatus.PRESENT);
    const list = presentRecords.map(r => {
        const u = users.find(user => user.id === r.userId);
        return {
            id: r.userId,
            name: u ? u.fullName : 'Unknown',
            sub: u ? u.workType : 'N/A',
            status: r.dutyOnTime ? `IN: ${r.dutyOnTime}` : 'PRESENT'
        };
    });
    setListModalTitle(`Present Today (${new Date().toISOString().split('T')[0]})`);
    setListModalType('VIEW');
    setListModalContent(list);
    setListModalOpen(true);
  };

  const handleShowApprovals = () => {
      const list = users.filter(u => u.status === UserStatus.PENDING).map(u => ({
          id: u.id,
          name: u.fullName,
          sub: u.workType,
          status: 'PENDING'
      }));
      setListModalTitle('Pending Approvals');
      setListModalType('APPROVALS');
      setListModalContent(list);
      setListModalOpen(true);
  };

  const handleApproveUser = (id: string) => {
      db.users.update(id, { status: UserStatus.APPROVED });
      refreshData();
      setListModalContent(prev => prev.filter(u => u.id !== id));
  };

  const handleRejectUser = (id: string) => {
      db.users.update(id, { status: UserStatus.REJECTED });
      refreshData();
      setListModalContent(prev => prev.filter(u => u.id !== id));
  };

  const handleDownloadReport = async () => {
    const element = document.getElementById('salary-slip-printable');
    if (!element) return;

    const btn = document.getElementById('download-btn-admin');
    if (btn) btn.innerText = "Generating...";

    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.height = 'auto';
    clone.style.width = '800px';
    clone.style.position = 'absolute';
    clone.style.top = '-10000px';
    clone.style.left = '0';
    clone.style.zIndex = '-1';
    clone.style.overflow = 'visible';
    clone.style.background = 'white';
    
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = customFileName || `Site_Report_${selectedMonth}.pdf`;
      pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);

    } catch (error) {
      console.error('PDF Download Failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      document.body.removeChild(clone);
      if (btn) btn.innerText = "Download PDF";
    }
  };

  const TechnicalCard = ({ label, value, sub, colorClass, badgeCount, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 md:h-44 transition-all hover:shadow-md group relative overflow-hidden ${onClick ? 'cursor-pointer hover:border-construction-yellow/30 active:scale-95' : ''}`}
    >
      <div>
        <p className="text-[8px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest truncate">{label}</p>
        <h3 className={`text-lg md:text-4xl font-oswald font-bold mt-1 md:mt-2 ${colorClass} truncate leading-tight`}>{value}</h3>
      </div>
      <div className="flex justify-between items-end">
          <p className="text-[9px] md:text-[12px] text-gray-400 font-bold truncate uppercase tracking-tighter">{sub}</p>
          {onClick && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-construction-yellow">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </div>
          )}
      </div>
      {badgeCount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-lg shadow-red-500/30 animate-pulse border border-white">
              New +{badgeCount}
          </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-10">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        <TechnicalCard 
          label="Total Workers" 
          value={users.length} 
          sub="Registered" 
          colorClass="text-slate-800"
          onClick={handleShowTotalWorkers}
        />
        <TechnicalCard 
          label="Approvals" 
          value={pendingApprovals} 
          sub="In Queue" 
          colorClass="text-orange-500"
          badgeCount={pendingApprovals}
          onClick={handleShowApprovals}
        />
        <TechnicalCard 
          label="Approved" 
          value={approvedMembers} 
          sub="Verified" 
          colorClass="text-green-600"
          onClick={handleShowApproved}
        />
        <TechnicalCard 
          label="Attendance" 
          value={presentToday} 
          sub="Present Today" 
          colorClass="text-construction-yellow" 
          onClick={handleShowPresent}
        />
        <TechnicalCard 
          label="Disbursed (Lifetime)" 
          value={`₹${totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} 
          sub="Paid Amount" 
          colorClass="text-blue-600" 
        />
        <TechnicalCard 
          label="Site Dues" 
          value={`₹${totalPendingDues.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} 
          sub="Outstanding" 
          colorClass="text-red-600" 
        />
      </div>

      {/* Salary Registry Table - Scrollable Horizontal Layout */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px] md:h-[600px]">
        <div className="p-5 md:p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between shrink-0 bg-white z-20 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-1 md:w-1.5 h-6 md:h-8 bg-construction-yellow rounded-full"></div>
            <h3 className="font-oswald font-bold uppercase text-base md:text-xl text-slate-900 tracking-tight">Financial Log</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-construction-yellow"
            />
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 bg-construction-yellow text-construction-dark rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-construction-yellow/20 hover:bg-yellow-500 transition-all active:scale-95"
            >
              Download Report
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
          <div className="min-w-[700px] md:min-w-full">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100">
                  <th className="pl-6 pr-4 py-4 w-1/4">Worker Details</th>
                  <th className="px-4 py-4 w-1/4">Amount</th>
                  <th className="px-4 py-4 w-1/4">Date</th>
                  <th className="px-4 pr-6 py-4 w-1/4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPayments.length > 0 ? [...filteredPayments].reverse().map((pay) => {
                  const user = db.users.getById(pay.userId);
                  return (
                    <tr key={pay.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="pl-6 pr-4 py-4">
                        <p className="font-bold text-slate-800 text-sm truncate">{user?.fullName || 'Unknown'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{user?.workType}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-oswald font-bold text-slate-900 text-base md:text-lg">
                            <span className="text-gray-400 text-xs mr-1">₹</span>
                            {pay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                            <span className="text-gray-500 font-bold text-xs">{pay.date}</span>
                            <span className="text-[10px] text-gray-400 font-bold tracking-widest mt-0.5 uppercase">
                                {pay.id.includes('-') && !isNaN(Number(pay.id.split('-')[1])) 
                                    ? new Date(Number(pay.id.split('-')[1])).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
                                    : '--:--'}
                            </span>
                        </div>
                      </td>
                      <td className="px-4 pr-6 py-4">
                        <p className="text-gray-400 italic text-xs truncate max-w-[200px]">
                          {pay.notes || 'Direct Transfer'}
                        </p>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">No entries found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail List Modal */}
      <AnimatePresence>
        {listModalOpen && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-oswald font-bold text-lg uppercase text-slate-800">{listModalTitle}</h3>
                    <button onClick={() => setListModalOpen(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-slate-800 shadow-sm border border-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {listModalContent.length > 0 ? (
                        <div className="space-y-2">
                            {listModalContent.map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm">
                                                {item.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.sub}</p>
                                            </div>
                                        </div>
                                        {listModalType === 'VIEW' && (
                                            <div>
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                                                    item.status === 'PENDING' ? 'bg-orange-100 text-orange-600' :
                                                    item.status === 'BLOCKED' ? 'bg-red-100 text-red-600' :
                                                    'bg-green-100 text-green-600'
                                                }`}>
                                                    {item.status || 'ACTIVE'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {listModalType === 'APPROVALS' && (
                                        <div className="flex gap-2 mt-1">
                                            <button 
                                                onClick={() => handleApproveUser(item.id)}
                                                className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleRejectUser(item.id)}
                                                className="flex-1 bg-gray-100 text-gray-500 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-200"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <p className="text-xs font-bold uppercase tracking-widest">No records found</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total Count: {listModalContent.length}</p>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Monthly Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-construction-dark/60 backdrop-blur-md no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-oswald font-bold text-xl uppercase">Monthly Financial Report</h3>
                <button onClick={() => setIsReportModalOpen(false)} className="text-gray-400 hover:text-black p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
                </button>
              </div>

               <div className="px-8 pt-4">
                  <div className="relative">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-gray-400 uppercase">Save As (Filename)</label>
                    <input 
                      type="text" 
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-1 focus:ring-construction-yellow outline-none"
                    />
                  </div>
              </div>

              <div id="salary-slip-printable" className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 bg-white">
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8">
                  <div>
                    <h1 className="text-4xl font-oswald font-bold text-construction-dark tracking-tighter">ARTI ENGINEERING</h1>
                    <p className="text-[10px] font-black text-construction-yellow uppercase tracking-[0.4em] mt-1">Infrastructure & Engineering Excellence</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 uppercase">Financial Statement</p>
                    <p className="text-xs font-bold text-slate-400">Month: {selectedMonth}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <div className="bg-slate-50 p-6 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Disbursed</p>
                    <p className="text-2xl font-oswald font-bold text-green-600">₹{totalMonthDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Transactions</p>
                    <p className="text-2xl font-oswald font-bold text-slate-900">{filteredPayments.length}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Report Date</p>
                    <p className="text-sm font-bold text-slate-900 mt-2">{new Date().toISOString().split('T')[0]}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Transaction History</p>
                  <table className="w-full text-left border-collapse">
                    <thead className="border-b-2 border-slate-100">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="py-4">Worker</th>
                        <th className="py-4">Date</th>
                        <th className="py-4">Method/Note</th>
                        <th className="py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredPayments.map(p => {
                        const u = db.users.getById(p.userId);
                        return (
                          <tr key={p.id} className="text-xs font-bold">
                            <td className="py-4 text-slate-900">{u?.fullName || 'N/A'}</td>
                            <td className="py-4 text-slate-500">{p.date}</td>
                            <td className="py-4 text-slate-400 italic">{p.notes || 'Direct Transfer'}</td>
                            <td className="py-4 text-right text-slate-900 font-black">₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-20 flex justify-between items-end border-t border-dashed border-slate-200">
                  <div className="text-center">
                    <div className="w-40 h-0.5 bg-slate-200 mb-2"></div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Prepared By</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 h-0.5 bg-slate-200 mb-2"></div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Authorized Site Manager Signature</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  id="download-btn-admin"
                  onClick={handleDownloadReport}
                  className="flex-1 py-4 bg-construction-dark text-construction-yellow font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2.5"/></svg>
                  Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;

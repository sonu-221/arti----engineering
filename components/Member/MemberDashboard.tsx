
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { db } from '../../services/db';
import { User, AttendanceStatus, DutyStatus, AttendanceRecord, SalaryPayment } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { UI_ICONS } from '../../constants';

interface MemberDashboardProps {
  user: User;
  onLogout?: () => void;
}

type SortOrder = 'asc' | 'desc';
type AttSortKey = 'date' | 'earned';
type PaySortKey = 'date' | 'amount';
type SlipRange = 'MONTH' | 'WEEK';

const MemberDashboard: React.FC<MemberDashboardProps> = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState(initialUser);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showWelcomePopUp, setShowWelcomePopUp] = useState(false);
  const [slipRange, setSlipRange] = useState<SlipRange>('MONTH');
  const [customFileName, setCustomFileName] = useState('');
  
  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    dob: '',
    gender: '',
    aadharNumber: '',
    pancard: '',
    state: '',
    pincode: '',
    village: '',
    city: '',
    district: '',
    block: '',
    policeStation: '',
    accountNumber: '',
    ifscCode: ''
  });

  // Data States (Live Sync)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);

  // Scroll & Pagination States
  const [attendanceLimit, setAttendanceLimit] = useState(20); 
  const [paymentLimit, setPaymentLimit] = useState(10);
  
  // Sorting States
  const [attSort, setAttSort] = useState<{ key: AttSortKey; order: SortOrder }>({ key: 'date', order: 'desc' });
  const [paySort, setPaySort] = useState<{ key: PaySortKey; order: SortOrder }>({ key: 'date', order: 'desc' });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attendanceContainerRef = useRef<HTMLDivElement>(null);
  const paymentContainerRef = useRef<HTMLDivElement>(null);

  // LIVE DATA LOADING
  const refreshData = useCallback(() => {
    setAttendance(db.attendance.getByUser(user.id));
    setPayments(db.payments.getByUser(user.id));
  }, [user.id]);

  useEffect(() => {
    refreshData();
    const handleStorageChange = () => refreshData();
    window.addEventListener('storage', handleStorageChange);
    const pollInterval = setInterval(() => {
        refreshData();
    }, 2000); // Polling every 2s

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(pollInterval);
    };
  }, [refreshData]);

  useEffect(() => {
    if (!initialUser.hasSeenWelcome) {
      setShowWelcomePopUp(true);
    }
    // Initialize profile form
    setProfileForm({
        dob: initialUser.dob || '',
        gender: initialUser.gender || '',
        aadharNumber: initialUser.aadharNumber || '',
        pancard: initialUser.pancard || '',
        state: initialUser.state || '',
        pincode: initialUser.pincode || '',
        village: initialUser.village || '',
        city: initialUser.city || '',
        district: initialUser.district || '',
        block: initialUser.block || '',
        policeStation: initialUser.policeStation || '',
        accountNumber: initialUser.accountNumber || '',
        ifscCode: initialUser.ifscCode || ''
    });
  }, [initialUser]);

  useEffect(() => {
    setCustomFileName(`Salary_Slip_${user.fullName.replace(/\s+/g, '_')}_${selectedMonth}_${slipRange}`);
  }, [selectedMonth, slipRange, user.fullName]);

  const handleCloseWelcome = () => {
    setShowWelcomePopUp(false);
    const updatedUser = { ...user, hasSeenWelcome: true };
    db.users.update(user.id, { hasSeenWelcome: true });
    setUser(updatedUser);
    localStorage.setItem('current_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('storage'));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
      e.preventDefault();
      const updates = {
          dob: profileForm.dob,
          gender: profileForm.gender as any,
          aadharNumber: profileForm.aadharNumber,
          pancard: profileForm.pancard,
          state: profileForm.state,
          pincode: profileForm.pincode,
          village: profileForm.village,
          city: profileForm.city,
          district: profileForm.district,
          block: profileForm.block,
          policeStation: profileForm.policeStation,
          accountNumber: profileForm.accountNumber,
          ifscCode: profileForm.ifscCode
      };
      
      db.users.update(user.id, updates);
      
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
      
      setIsProfileModalOpen(false);
  };

  const todayDate = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(a => a.date === todayDate);

  const calculateRecordEarnings = (record: AttendanceRecord) => {
    if (record.status === AttendanceStatus.ABSENT) {
        return 0;
    }
    const mult = record.status === AttendanceStatus.HALF_DAY ? 0.5 : 1;
    
    // HISTORICAL RATE LOGIC: Use Snapshot if available
    const effectiveRate = record.dailySalarySnapshot !== undefined && record.dailySalarySnapshot > 0 
        ? record.dailySalarySnapshot 
        : user.dailySalary;

    // Overtime calculated as (Daily Rate / 12 hours) * OT Hours
    const otPay = record.overtimeHours ? (record.overtimeHours * (effectiveRate / 12)) : 0;
    return (effectiveRate * mult) + otPay;
  };

  const getDayAndMonth = (isoDate: string) => {
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return { day, month };
  };

  const formatDateDDMMYYYY = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
  };

  const monthData = useMemo(() => {
    let monthAttendance = attendance.filter(a => a.date.startsWith(selectedMonth));
    let monthPayments = payments.filter(p => p.month === selectedMonth);

    const monthWorkingDays = monthAttendance.filter(a => a.status !== AttendanceStatus.ABSENT).length;
    const monthEarned = monthAttendance.reduce((acc, curr) => acc + calculateRecordEarnings(curr), 0);
    const monthPaid = monthPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Sorting Logic
    monthAttendance = [...monthAttendance].sort((a, b) => {
      if (attSort.key === 'date') {
        return attSort.order === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      } else {
        const valA = calculateRecordEarnings(a);
        const valB = calculateRecordEarnings(b);
        return attSort.order === 'asc' ? valA - valB : valB - valA;
      }
    });

    monthPayments = [...monthPayments].sort((a, b) => {
      if (paySort.key === 'date') {
        return paySort.order === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      } else {
        return paySort.order === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
    });

    return {
      monthWorkingDays,
      monthEarned,
      monthPaid,
      monthDue: monthEarned - monthPaid,
      attendance: monthAttendance,
      payments: monthPayments
    };
  }, [attendance, payments, selectedMonth, user.dailySalary, attSort, paySort]);

  // Scroll Handler for Attendance
  const handleAttendanceScroll = () => {
    if (attendanceContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = attendanceContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 50) {
        setAttendanceLimit(prev => Math.min(prev + 5, monthData.attendance.length));
      }
    }
  };

  // Scroll Handler for Payments
  const handlePaymentScroll = () => {
    if (paymentContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = paymentContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 50) {
        setPaymentLimit(prev => Math.min(prev + 5, monthData.payments.length));
      }
    }
  };

  const toggleAttSort = (key: AttSortKey) => {
    setAttSort(prev => ({
      key,
      order: prev.key === key && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOpen(true);
    } catch (err) {
      alert("Camera access denied.");
    }
  };

  const savePhoto = (photoData: string) => {
    db.users.update(user.id, { profilePhoto: photoData });
    const updatedUser = { ...user, profilePhoto: photoData };
    setUser(updatedUser);
    localStorage.setItem('current_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('storage'));
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        savePhoto(canvasRef.current.toDataURL('image/jpeg', 0.8));
        handleCloseCamera();
      }
    }
  };

  const handleCloseCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        savePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadSlip = async () => {
    const element = document.getElementById('salary-slip-printable');
    if (!element) return;

    const btn = document.getElementById('download-btn');
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

      const fileName = customFileName || `Salary_Slip_${user.fullName}_${selectedMonth}.pdf`;
      pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);

    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      document.body.removeChild(clone);
      if (btn) btn.innerText = "Download PDF";
    }
  };

  const getSlipData = () => {
    if (slipRange === 'MONTH') {
      return monthData;
    } else {
      const sortedAtt = [...monthData.attendance].sort((a,b) => b.date.localeCompare(a.date));
      const weeklyAtt = sortedAtt.slice(0, 7); 
      
      const wWorkingDays = weeklyAtt.filter(a => a.status !== AttendanceStatus.ABSENT).length;
      const wEarned = weeklyAtt.reduce((acc, curr) => acc + calculateRecordEarnings(curr), 0);
      
      let wPayments: SalaryPayment[] = [];
      if (weeklyAtt.length > 0) {
          const maxDate = weeklyAtt[0].date;
          const minDate = weeklyAtt[weeklyAtt.length - 1].date;
          wPayments = monthData.payments.filter(p => p.date >= minDate && p.date <= maxDate);
      }
      
      const wPaid = wPayments.reduce((acc, curr) => acc + curr.amount, 0);

      return {
        ...monthData,
        monthWorkingDays: wWorkingDays,
        monthEarned: wEarned,
        monthPaid: wPaid,
        monthDue: wEarned - wPaid, 
        attendance: weeklyAtt,
        payments: wPayments
      };
    }
  };

  const slipData = getSlipData();

  const MetricCard = ({ label, value, icon, colorClass, bgClass }: any) => (
    <div className={`p-5 rounded-[1.5rem] border border-white/50 shadow-lg flex flex-col justify-between h-28 md:h-36 relative overflow-hidden group ${bgClass}`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
        <h3 className={`text-2xl md:text-3xl font-oswald font-bold ${colorClass} tracking-tight`}>{value}</h3>
      </div>
      <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden relative z-10">
         <div className={`h-full ${colorClass.replace('text', 'bg')} opacity-30 w-2/3 rounded-full`}></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 max-w-7xl mx-auto pb-10">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Welcome Pop-up */}
      <AnimatePresence>
        {showWelcomePopUp && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-construction-dark/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="max-w-xs md:max-w-md w-full bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl p-6 md:p-10 text-center space-y-4 md:space-y-6"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-construction-yellow/10 rounded-full flex items-center justify-center mx-auto text-construction-yellow">
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" strokeWidth="2"/></svg>
              </div>
              <h2 className="text-xl md:text-2xl font-oswald font-bold text-slate-900 uppercase">Welcome Worker!</h2>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Your portal to Arti Engineering management is now active.</p>
              <button onClick={handleCloseWelcome} className="w-full py-3 md:py-4 bg-construction-dark text-construction-yellow font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl active:scale-95 transition-transform">Start Work</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl md:rounded-[3rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/30 border border-white/5">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-construction-yellow/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-12">
          <div className="flex items-center gap-5 md:gap-8">
            <div className="relative group shrink-0">
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl md:rounded-[1.5rem] overflow-hidden border-2 md:border-4 border-white/20 shadow-2xl bg-slate-800 flex items-center justify-center relative">
                {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-3xl md:text-6xl font-oswald font-bold text-white/20">{user.fullName.charAt(0)}</div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                    <button onClick={handleOpenCamera} className="p-2 bg-construction-yellow text-construction-dark rounded-xl shadow-lg hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg></button>
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white text-construction-dark rounded-xl shadow-lg hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg></button>
                </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-construction-yellow text-construction-dark text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-lg">
                    ID: {user.id.slice(-4)}
                </div>
            </div>
            
            <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-5xl font-oswald font-bold uppercase tracking-tight mb-2 truncate text-white leading-none drop-shadow-md cursor-pointer hover:text-construction-yellow transition-colors" onClick={() => setIsProfileModalOpen(true)}>
                    {user.fullName}
                </h1>
                <div className="flex flex-wrap gap-2 md:gap-3 items-center">
                     <span className="bg-white/10 px-3 py-1 md:py-1.5 rounded-lg border border-white/10 text-[10px] md:text-xs font-bold text-white/90 backdrop-blur-md">{user.workType}</span>
                     <span className="bg-construction-yellow/20 px-3 py-1 md:py-1.5 rounded-lg border border-construction-yellow/20 text-[10px] md:text-xs font-bold text-construction-yellow backdrop-blur-md">₹{user.dailySalary}/Day</span>
                     <button onClick={() => setIsProfileModalOpen(true)} className="text-[10px] font-bold text-slate-400 hover:text-white underline decoration-slate-500 underline-offset-4 transition-all">Edit Details</button>
                </div>
            </div>
          </div>
          
           <div className="md:ml-auto w-full md:w-auto">
              <div 
                className={`w-full md:w-auto px-4 py-3 md:px-6 md:py-4 rounded-2xl border flex items-center justify-between md:justify-center gap-4 transition-all ${
                  todayRecord?.dutyStatus === DutyStatus.ON 
                    ? 'bg-green-500/20 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="text-left">
                    <p className="text-[9px] font-black uppercase text-white/50 tracking-widest">Current Status</p>
                    <p className={`font-oswald font-bold text-sm md:text-xl uppercase tracking-wide ${todayRecord?.dutyStatus === DutyStatus.ON ? 'text-green-400' : 'text-slate-400'}`}>
                        {todayRecord?.dutyStatus === DutyStatus.ON ? 'On Duty' : 'Off Duty'}
                    </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${todayRecord?.dutyStatus === DutyStatus.ON ? 'bg-green-400 animate-ping' : 'bg-slate-600'}`}></div>
              </div>
            </div>
        </div>
      </div>

      {/* Month Filter Bar */}
      <div className="bg-white rounded-2xl p-2 md:p-3 border border-gray-100 shadow-sm flex flex-row items-center justify-between gap-3 sticky top-[72px] z-30 md:static">
        <div className="flex-1 relative">
            <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-slate-700 outline-none text-xs focus:ring-2 focus:ring-construction-yellow/50 transition-all uppercase tracking-wider"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </div>
        <button 
        onClick={() => setIsSlipModalOpen(true)}
        className="shrink-0 bg-construction-dark text-construction-yellow px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-construction-dark/20 active:scale-95 transition-all flex items-center gap-2"
        >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <span className="hidden md:inline">Get </span>Slip
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <MetricCard 
            label="Working Days" 
            value={monthData.monthWorkingDays} 
            colorClass="text-slate-800" 
            bgClass="bg-white"
            icon={<svg className="w-12 h-12 text-slate-100" fill="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
        />
        <MetricCard 
            label="Total Earned" 
            value={`₹${monthData.monthEarned.toFixed(0)}`} 
            colorClass="text-blue-600" 
            bgClass="bg-gradient-to-br from-white to-blue-50/50"
            icon={<svg className="w-12 h-12 text-blue-100" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <MetricCard 
            label="Received" 
            value={`₹${monthData.monthPaid.toFixed(0)}`} 
            colorClass="text-green-600" 
            bgClass="bg-gradient-to-br from-white to-green-50/50"
            icon={<svg className="w-12 h-12 text-green-100" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <MetricCard 
            label="Pending Due" 
            value={`₹${monthData.monthDue.toFixed(0)}`} 
            colorClass="text-red-600" 
            bgClass="bg-gradient-to-br from-white to-red-50/50"
            icon={<svg className="w-12 h-12 text-red-100" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* ATTENDANCE SECTION */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="font-oswald font-bold uppercase text-lg text-slate-800 tracking-tight">Attendance Log</h3>
             <button onClick={() => toggleAttSort('date')} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1">
                 Sort by Date <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
             </button>
          </div>
          
          <div 
            ref={attendanceContainerRef}
            onScroll={handleAttendanceScroll}
            className="flex flex-col space-y-3 h-[500px] md:h-[600px] overflow-y-auto custom-scrollbar pb-10 pr-1"
          >
            <AnimatePresence initial={false}>
                {monthData.attendance.slice(0, attendanceLimit).map((a, i) => {
                  const isPresent = a.status === AttendanceStatus.PRESENT;
                  const isHalf = a.status === AttendanceStatus.HALF_DAY;
                  const { day, month } = getDayAndMonth(a.date);
                  const shouldAnimate = monthData.attendance.length > 7;
                  
                  return (
                    <motion.div 
                        key={a.id}
                        initial={shouldAnimate ? { opacity: 0, y: 30, scale: 0.95 } : { opacity: 0, y: 10 }}
                        whileInView={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
                        animate={!shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                        viewport={shouldAnimate ? { once: false, margin: "-10%" } : undefined}
                        transition={{ duration: 0.3, delay: shouldAnimate ? 0 : i * 0.05 }}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-construction-yellow/30 transition-all"
                    >
                        {/* Date Block */}
                        <div className="flex flex-col items-center justify-center bg-gray-50 w-14 h-14 rounded-xl shrink-0 border border-gray-100 group-hover:bg-construction-yellow group-hover:text-construction-dark transition-colors">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-construction-dark/70">{month}</span>
                            <span className="text-xl font-oswald font-bold text-slate-800 group-hover:text-construction-dark">{day}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                    isPresent ? 'text-green-700 bg-green-100' : 
                                    isHalf ? 'text-orange-700 bg-orange-100' : 
                                    'text-red-700 bg-red-100'
                                }`}>
                                    {a.status.replace('_', ' ')}
                                </span>
                                {a.overtimeHours > 0 && (
                                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                        +{a.overtimeHours} HRS OT
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Earnings */}
                        <div className="text-right shrink-0">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Earned</p>
                            <p className="text-lg font-oswald font-bold text-slate-900">₹{calculateRecordEarnings(a).toFixed(0)}</p>
                        </div>
                    </motion.div>
                  )
                })}
            </AnimatePresence>
            {monthData.attendance.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
                    <p className="text-xs font-bold uppercase tracking-widest">No records found</p>
                </div>
            )}
          </div>
        </div>

        {/* PAYMENTS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-oswald font-bold uppercase text-lg text-slate-800 tracking-tight">Recent Payments</h3>
          </div>
          <div 
            ref={paymentContainerRef}
            onScroll={handlePaymentScroll}
            className="flex flex-col space-y-3 h-[500px] md:h-[600px] overflow-y-auto custom-scrollbar pb-10 pr-1"
          >
            <AnimatePresence initial={false}>
              {monthData.payments.slice(0, paymentLimit).map((p, i) => {
                const shouldAnimate = monthData.payments.length >= 10;
                
                return (
                <motion.div 
                  key={p.id} 
                  initial={shouldAnimate ? { opacity: 0, y: 30, scale: 0.95 } : { opacity: 0, scale: 0.95 }}
                  whileInView={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
                  animate={!shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
                  viewport={shouldAnimate ? { once: false, margin: "-10%" } : undefined}
                  transition={{ duration: 0.3, delay: shouldAnimate ? 0 : i * 0.05 }}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Received</p>
                        <p className="text-xs font-bold text-slate-700">{formatDateDDMMYYYY(p.date)}</p>
                      </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-oswald font-bold text-slate-900 group-hover:text-green-600 transition-colors">₹{p.amount.toLocaleString()}</p>
                    <p className="text-[9px] font-medium text-gray-400 italic truncate max-w-[80px]">{p.notes || 'Transfer'}</p>
                  </div>
                </motion.div>
              )})}
            </AnimatePresence>
            {monthData.payments.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
                  <p className="text-xs font-bold uppercase tracking-widest">No payments this month</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Salary Slip Modal & Edit Profile Modal Code remains similar but with updated classes where necessary */}
      
      {/* Salary Slip Modal */}
      <AnimatePresence>
        {isSlipModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-construction-dark/60 backdrop-blur-md no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]"
            >
              {/* Slip Content ... */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-oswald font-bold text-xl uppercase">Earnings Statement</h3>
                <button onClick={() => setIsSlipModalOpen(false)} className="text-gray-400 hover:text-black p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
                </button>
              </div>

              <div className="px-8 pt-4 space-y-3">
                 <div className="flex gap-2">
                  <button 
                    onClick={() => setSlipRange('MONTH')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${slipRange === 'MONTH' ? 'bg-construction-dark text-construction-yellow border-construction-dark' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                  >
                    Full Month
                  </button>
                  <button 
                    onClick={() => setSlipRange('WEEK')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${slipRange === 'WEEK' ? 'bg-construction-dark text-construction-yellow border-construction-dark' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                  >
                    Last 7 Days
                  </button>
                </div>
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-gray-400 uppercase">File Name (Save As)</label>
                  <input 
                    type="text" 
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-1 focus:ring-construction-yellow outline-none"
                  />
                </div>
              </div>

              <div id="salary-slip-printable" className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 bg-white">
                <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-100 pb-8 gap-4">
                  <div>
                    <h1 className="text-4xl font-oswald font-bold text-construction-dark tracking-tighter">ARTI ENGINEERING</h1>
                    <p className="text-[10px] font-black text-construction-yellow uppercase tracking-[0.4em] mt-1">Infrastructure & Engineering Excellence</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm font-black text-slate-900 uppercase">Salary Slip ({slipRange})</p>
                    <p className="text-xs font-bold text-slate-400">{selectedMonth}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Personnel Details</p>
                    <p className="font-bold text-slate-900 text-lg uppercase">{user.fullName}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">{user.workType}</p>
                    {user.village && <p className="text-[10px] text-gray-400 mt-1 uppercase">{user.village}, {user.city}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Base Terms</p>
                    <p className="font-bold text-slate-900">₹{user.dailySalary.toLocaleString()} / Day</p>
                  </div>
                </div>

                 <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Earnings Breakdown ({slipRange === 'WEEK' ? 'Week View' : 'Month View'})</p>
                  <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-600">Base Earnings ({slipData.monthWorkingDays} Days)</span>
                      <span className="font-black text-slate-900">₹{(slipData.monthEarned).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg border-t-2 border-construction-yellow pt-4">
                      <span className="font-oswald font-bold uppercase">Total Earned</span>
                      <span className="font-oswald font-bold text-construction-dark">₹{slipData.monthEarned.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Payment Received History</p>
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="py-2 px-4 text-[9px] font-black text-gray-500 uppercase">Date</th>
                                    <th className="py-2 px-4 text-[9px] font-black text-gray-500 uppercase">Note</th>
                                    <th className="py-2 px-4 text-[9px] font-black text-gray-500 uppercase text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {slipData.payments.length > 0 ? (
                                    slipData.payments.map((p) => (
                                        <tr key={p.id}>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{formatDateDDMMYYYY(p.date)}</td>
                                            <td className="py-3 px-4 text-xs text-gray-500">{p.notes || '-'}</td>
                                            <td className="py-3 px-4 text-xs font-black text-green-600 text-right">₹{p.amount.toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-4 text-center text-[10px] italic text-gray-400">No payments received in this period.</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-100">
                                <tr>
                                    <td colSpan={2} className="py-3 px-4 text-xs font-black text-slate-700 text-right uppercase">Total Received</td>
                                    <td className="py-3 px-4 text-sm font-black text-green-700 text-right">₹{slipData.monthPaid.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="text-right">
                         <p className="text-xs font-bold text-slate-500 uppercase">Balance Due: <span className="text-red-500">₹{slipData.monthDue.toLocaleString()}</span></p>
                    </div>
                </div>

                 <div className="pt-10 flex justify-between items-end border-t border-dashed border-slate-200">
                  <div className="text-center">
                    <div className="w-32 h-0.5 bg-slate-200 mb-2"></div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Worker Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="w-32 h-0.5 bg-slate-200 mb-2"></div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Admin Authorized Stamp</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 no-print">
                <button 
                  id="download-btn"
                  onClick={handleDownloadSlip}
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

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-construction-dark/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-oswald font-bold text-xl uppercase">Edit Profile & Details</h3>
                <button onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-black p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                  <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-8">
                     {/* Basic Info */}
                     <div>
                         <h4 className="text-sm font-bold text-construction-dark uppercase tracking-wider mb-4 pb-2 border-b">Personal Information</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date of Birth</label>
                                <input type="date" value={profileForm.dob} onChange={(e) => setProfileForm({...profileForm, dob: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-construction-yellow outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender</label>
                                <select value={profileForm.gender} onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-construction-yellow outline-none">
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aadhar Number</label>
                                <input type="text" value={profileForm.aadharNumber} onChange={(e) => setProfileForm({...profileForm, aadharNumber: e.target.value.replace(/[^0-9]/g, '')})} placeholder="12-digit Aadhar Number" maxLength={12} className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-construction-yellow outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pancard Number</label>
                                <input type="text" value={profileForm.pancard} onChange={(e) => setProfileForm({...profileForm, pancard: e.target.value})} placeholder="ABCDE1234F" className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold uppercase focus:ring-2 focus:ring-construction-yellow outline-none" />
                            </div>
                         </div>
                     </div>

                     {/* Address Info */}
                     <div>
                         <h4 className="text-sm font-bold text-construction-dark uppercase tracking-wider mb-4 pb-2 border-b">Address Details</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Village/Street</label>
                                <input type="text" value={profileForm.village} onChange={(e) => setProfileForm({...profileForm, village: e.target.value})} placeholder="Village name" className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-construction-yellow outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Block/Tehsil</label>
                                <input type="text" value={profileForm.block} onChange={(e) => setProfileForm({...profileForm, block: e.target.value})} placeholder="Block" className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-construction-yellow outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Police Station</label>
                                <input type="text" value={profileForm.policeStation} onChange={(e) => setProfileForm({...profileForm, policeStation: e.target.value})} placeholder="Police Station" className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-construction-yellow outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">City</label>
                                <input type="text" value={profileForm.city} onChange={(e) => setProfileForm({...profileForm, city: e.target.value})} placeholder="City" className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-construction-yellow outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">District</label>
                                <input type="text" value={profileForm.district} onChange={(e) => setProfileForm({...profileForm, district: e.target.value})} placeholder="District" className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-construction-yellow outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">State</label>
                                <input type="text" value={profileForm.state} onChange={(e) => setProfileForm({...profileForm, state: e.target.value})} placeholder="State" className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-construction-yellow outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pincode</label>
                                <input type="text" value={profileForm.pincode} onChange={(e) => setProfileForm({...profileForm, pincode: e.target.value})} placeholder="Pincode" maxLength={6} className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-construction-yellow outline-none" />
                            </div>
                         </div>
                     </div>

                     {/* Bank Info */}
                     <div>
                         <h4 className="text-sm font-bold text-construction-dark uppercase tracking-wider mb-4 pb-2 border-b">Bank Account Details <span className="text-[10px] text-gray-400 font-normal lowercase">(only visible to you & admin)</span></h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 relative">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Number</label>
                                <div className="relative">
                                    <input type="password" value={profileForm.accountNumber} onChange={(e) => setProfileForm({...profileForm, accountNumber: e.target.value})} placeholder="Account Number" className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-construction-yellow outline-none" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">IFSC Code</label>
                                <input type="text" value={profileForm.ifscCode} onChange={(e) => setProfileForm({...profileForm, ifscCode: e.target.value})} placeholder="IFSC Code" className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold uppercase focus:ring-2 focus:ring-construction-yellow outline-none" />
                            </div>
                         </div>
                     </div>
                  </form>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-[2.5rem]">
                  <button onClick={() => setIsProfileModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                  <button form="profile-form" type="submit" className="px-8 py-3 bg-construction-dark text-construction-yellow font-black uppercase text-xs tracking-widest rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all">Save Profile</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MemberDashboard;

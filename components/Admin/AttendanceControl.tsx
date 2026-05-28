
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { UserRole, UserStatus, AttendanceStatus, DutyStatus, AttendanceRecord, User } from '../../types';

const AttendanceControl: React.FC = () => {
  const getLocalTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getLocalTodayStr();
  const [date, setDate] = useState(todayStr);
  const [workers, setWorkers] = useState(db.users.getAll().filter(u => u.role === UserRole.MEMBER && u.status === UserStatus.APPROVED));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [submitSummary, setSubmitSummary] = useState<{ present: number, absent: number, halfDay: number, absentUsers: User[] } | null>(null);

  const [monthViewDate, setMonthViewDate] = useState(new Date(todayStr));
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [hasSavedRecords, setHasSavedRecords] = useState(false);

  useEffect(() => {
    const year = monthViewDate.getFullYear();
    const month = String(monthViewDate.getMonth() + 1).padStart(2, '0');
    const allAtt = db.attendance.getAll().filter(r => r.date.startsWith(`${year}-${month}`));
    setMonthRecords(allAtt);
  }, [monthViewDate, records]);

  useEffect(() => {
    // Load current user to check permissions
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const dailyRecords = db.attendance.getByDate(date);
    
    if (dailyRecords.length > 0) {
      setHasSavedRecords(true);
      setRecords(dailyRecords);
    } else {
      setHasSavedRecords(false);
      // Auto-tick defaults for the current day if not yet submitted
      if (date === todayStr) {
        const prefilled = workers.map(w => ({
          id: `att-${w.id}-${date}`,
          userId: w.id,
          date: date,
          status: AttendanceStatus.PRESENT,
          dutyStatus: DutyStatus.OFF,
          overtimeHours: 0,
          dailySalarySnapshot: w.dailySalary || 0,
          workTypeSnapshot: w.workType || ''
        }));
        setRecords(prefilled);
      } else {
        setRecords([]);
      }
    }
  }, [date, workers, todayStr]);

  // LOCK LOGIC
  const isFutureDate = date > todayStr;
  const isPastDate = date < todayStr;

  let isLocked = false;
  let lockMessage = '';

  if (isFutureDate) {
      isLocked = true;
      lockMessage = "Attendance cannot be marked for future dates.";
  } else if (isPastDate) {
      isLocked = true;
      lockMessage = "Past records are permanently locked (Day has passed).";
  }

  const getCurrentTime = () => {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
  };

  const updateAttendance = (userId: string, updates: Partial<AttendanceRecord>) => {
    if (isLocked) {
        alert(lockMessage);
        return;
    }

    const user = workers.find(u => u.id === userId);
    
    const existing = records.find(r => r.userId === userId) || {
      id: `att-${userId}-${date}`,
      userId,
      date,
      status: AttendanceStatus.ABSENT,
      dutyStatus: DutyStatus.OFF,
      overtimeHours: 0,
      // Initialize snapshots if creating new record
      dailySalarySnapshot: user?.dailySalary || 0,
      workTypeSnapshot: user?.workType || ''
    };

    // Auto-catch time if dutyStatus is changing
    if (updates.dutyStatus) {
      if (updates.dutyStatus === DutyStatus.ON) {
        updates.dutyOnTime = getCurrentTime();
        // Force status to PRESENT if marking ON duty, ensuring consistency
        updates.status = AttendanceStatus.PRESENT;
      } else if (updates.dutyStatus === DutyStatus.OFF) {
        updates.dutyOffTime = getCurrentTime();
      }
    }

    // CRITICAL: When status changes to PRESENT or HALF_DAY, update the snapshot to Current User Rate
    // This ensures if they were promoted today, today's record reflects the new rate.
    if (updates.status && updates.status !== AttendanceStatus.ABSENT) {
        updates.dailySalarySnapshot = user?.dailySalary || 0;
        updates.workTypeSnapshot = user?.workType || '';
    }

    const newRecord = { ...existing, ...updates } as AttendanceRecord;
    
    // Safety check: ensure snapshot exists if present
    if (newRecord.status !== AttendanceStatus.ABSENT && (!newRecord.dailySalarySnapshot || newRecord.dailySalarySnapshot === 0)) {
        newRecord.dailySalarySnapshot = user?.dailySalary || 0;
        newRecord.workTypeSnapshot = user?.workType || '';
    }

    setRecords(prev => {
        const idx = prev.findIndex(r => r.userId === userId);
        if (idx > -1) {
            const next = [...prev];
            next[idx] = newRecord;
            return next;
        }
        return [...prev, newRecord];
    });
  };

  const bulkUpdateAttendance = (status: AttendanceStatus) => {
    if (isLocked) {
        alert(lockMessage);
        return;
    }
    if (!window.confirm(`Are you sure you want to mark ALL listed workers as ${status.replace('_', ' ')} for ${date}?`)) {
        return;
    }

    const newRecords: AttendanceRecord[] = workers.map(user => {
        const existing = records.find(r => r.userId === user.id) || {
            id: `att-${user.id}-${date}`,
            userId: user.id,
            date,
            status: AttendanceStatus.ABSENT,
            dutyStatus: DutyStatus.OFF,
            overtimeHours: 0,
            dailySalarySnapshot: user.dailySalary || 0,
            workTypeSnapshot: user.workType || ''
        };

        const updates: Partial<AttendanceRecord> = { status };

        if (status !== AttendanceStatus.ABSENT && (!existing.dailySalarySnapshot || existing.dailySalarySnapshot === 0)) {
            updates.dailySalarySnapshot = user.dailySalary || 0;
            updates.workTypeSnapshot = user.workType || '';
        }

        return { ...existing, ...updates } as AttendanceRecord;
    });

    setRecords(newRecords);
  };

  const submitToDatabase = () => {
     if (isLocked) return;
     
     // Automatic Duty ON logic
     const finalRecords = records.map(r => {
        if ((r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.HALF_DAY) && 
            r.dutyStatus !== DutyStatus.ON && 
            !r.dutyOnTime) {
            return {
                ...r,
                dutyStatus: DutyStatus.ON,
                dutyOnTime: getCurrentTime(),
            };
        }
        return r;
     });

     db.attendance.saveBulk(finalRecords);
     setRecords(finalRecords);
     
     // Update month records so calendar goes green
     const year = monthViewDate.getFullYear();
     const month = String(monthViewDate.getMonth() + 1).padStart(2, '0');
     const allAtt = db.attendance.getAll().filter(r => r.date.startsWith(`${year}-${month}`));
     setMonthRecords(allAtt);
     
     // Calculate summary
     const present = finalRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
     const halfDay = finalRecords.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
     const absentRecords = finalRecords.filter(r => r.status === AttendanceStatus.ABSENT);
     
     const absentUsers = absentRecords.map(r => workers.find(w => w.id === r.userId)).filter(Boolean) as User[];
     
     setHasSavedRecords(true);
     setSubmitSummary({ present, absent: absentRecords.length, halfDay, absentUsers });
  };

  const getWhatsAppLink = (user: User) => {
    if (!user.mobile) return '#';
    let phone = user.mobile.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    const msg = `Hello ${user.fullName}, you have been marked ABSENT at the site today front Admin. If this is a mistake, please inform the Site Manager immediately.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  // CALENDAR GENERATION
  const year = monthViewDate.getFullYear();
  const month = monthViewDate.getMonth();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysArray = Array.from({ length: daysCount }, (_, i) => {
     const dayNum = i + 1;
     const d = new Date(year, month, dayNum);
     return {
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
        dayName: dayNames[d.getDay()],
        dayNumber: dayNum
     };
  });

  useEffect(() => {
      if (scrollRef.current) {
         // Auto-scroll to selected date gently
         const selectedElement = scrollRef.current.querySelector('.selected-date') as HTMLElement;
         if (selectedElement) {
             const scrollPosition = selectedElement.offsetLeft - scrollRef.current.clientWidth / 2 + selectedElement.clientWidth / 2;
             scrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
         }
      }
  }, [monthViewDate, date]);

  return (
    <div className="space-y-6">
      {/* Custom Date Strip Calendar */}
      <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden fade-in relative">
         <div className="bg-[#1ea1ed] text-white flex items-center justify-between p-3.5 shadow-md z-10 relative">
            <button 
               onClick={() => setMonthViewDate(new Date(year, month - 1, 1))} 
               className="p-1.5 hover:bg-white/20 rounded-full transition-colors focus:outline-none"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="font-medium text-lg tracking-wide">
               {monthNames[month]} {year}
            </span>
            <button 
               onClick={() => setMonthViewDate(new Date(year, month + 1, 1))}
               className="p-1.5 hover:bg-white/20 rounded-full transition-colors focus:outline-none"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
         </div>

         <div className="flex overflow-x-auto custom-scrollbar scroll-smooth border-b border-[#1ea1ed]" ref={scrollRef}>
            {daysArray.map(d => {
               const isToday = d.dateStr === todayStr;
               const isSelected = d.dateStr === date;
               // Date has ANY attendance marked
               const hasAttendance = monthRecords.some(r => r.date === d.dateStr);

               let contentBgClass = "bg-white text-gray-800";
               if (hasAttendance) {
                  // After submitting, color change to green
                  contentBgClass = "bg-green-500 text-white font-medium";
               } else if (isToday) {
                  // Present day showing orange before updating
                  contentBgClass = "bg-[#faa232] text-white font-medium"; 
               } else if (isSelected) {
                  // Subtle highlight if you click on a day that is not today and has no attendance
                  contentBgClass = "bg-blue-50 text-[#1ea1ed] font-medium shadow-inner";
               }

               return (
                  <div 
                     key={d.dateStr} 
                     onClick={() => setDate(d.dateStr)}
                     className={`flex-shrink-0 w-[55px] md:w-[65px] flex flex-col items-center cursor-pointer border-r border-[#1ea1ed]/10 transition-all ${isSelected ? 'selected-date border-b-[3px] border-b-[#1ea1ed]' : 'border-b-[3px] border-b-transparent hover:bg-gray-50'}`}
                  >
                     <div className="w-full bg-[#1ea1ed] text-center py-1 text-white text-[11px] font-medium border-b border-blue-400">
                       {d.dayName.substring(0, 3)}
                     </div>
                     <div className={`w-full py-2.5 text-center text-[16px] md:text-[18px] transition-colors ${contentBgClass}`}>
                       {d.dayNumber}
                     </div>
                  </div>
               )
            })}
         </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 fade-in">
        <div>
          <h3 className="font-oswald font-bold uppercase text-lg">Mark Daily Attendance</h3>
          <p className="text-xs text-gray-400 font-bold mt-1">Rates are locked upon marking attendance.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          {!isLocked && (
            <>
              <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 shadow-sm">
                <button
                  onClick={() => bulkUpdateAttendance(AttendanceStatus.PRESENT)}
                  disabled={workers.length === 0}
                  className="px-4 py-2 text-[10px] font-black rounded-md text-gray-500 hover:bg-white hover:text-construction-dark hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                >
                  MARK ALL PRESENT
                </button>
                <button
                  onClick={() => bulkUpdateAttendance(AttendanceStatus.ABSENT)}
                  disabled={workers.length === 0}
                  className="px-4 py-2 text-[10px] font-black rounded-md text-gray-500 hover:bg-white hover:text-red-600 hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                >
                  MARK ALL ABSENT
                </button>
              </div>
              <button 
                onClick={submitToDatabase}
                className="bg-[#1ea1ed] hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-xs font-bold tracking-widest uppercase shadow-md transition-all active:scale-95 border-b-4 border-blue-600 hover:translate-y-[-2px] hover:shadow-lg"
              >
                 {hasSavedRecords ? 'Update Attendance' : 'Submit Attendance'}
              </button>
            </>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-center gap-3 shadow-sm animate-pulse">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <p className="text-xs font-black text-red-600 uppercase tracking-widest">{lockMessage}</p>
        </div>
      )}

      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px] md:h-[600px] ${isLocked ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <th className="p-4 whitespace-nowrap">Worker Profile</th>
                <th className="p-4 whitespace-nowrap">Daily Status</th>
                <th className="p-4 whitespace-nowrap">
                  <div className="flex flex-col leading-tight">
                    <span>DUTY</span>
                    <span className="text-[10px] opacity-70">(AUTO-TIME)</span>
                  </div>
                </th>
                <th className="p-4 text-center whitespace-nowrap">Overtime (Hrs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workers.map(u => {
                const record = records.find(r => r.userId === u.id);
                return (
                  <tr key={u.id} className="hover:bg-gray-50 group">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-500 overflow-hidden border border-gray-200 shrink-0">
                          {u.profilePhoto ? (
                            <img src={u.profilePhoto} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            u.fullName.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-construction-dark uppercase whitespace-nowrap">{u.fullName}</p>
                          <div className="flex items-center gap-2">
                              <p className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{u.workType}</p>
                              <span className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded">₹{u.dailySalary}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        {isLocked ? (
                           <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${record?.status === AttendanceStatus.PRESENT ? 'text-green-600' : record?.status === AttendanceStatus.ABSENT ? 'text-red-500' : 'text-gray-400'}`}>
                             {record?.status === AttendanceStatus.PRESENT ? 'PRESENT' : record?.status === AttendanceStatus.ABSENT ? 'ABSENT' : 'UNMARKED'}
                           </span>
                        ) : (
                          <>
                            <button
                               onClick={() => updateAttendance(u.id, { status: record?.status === AttendanceStatus.PRESENT ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT })}
                               className={`w-7 h-7 flex shrink-0 items-center justify-center rounded border-2 transition-all ${
                                   record?.status === AttendanceStatus.PRESENT 
                                     ? 'bg-[#1ea1ed] border-[#1ea1ed] text-white' 
                                     : 'bg-white border-gray-300 text-transparent hover:border-[#1ea1ed]'
                               }`}
                            >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <span className={`ml-3 text-[10px] sm:text-xs font-black uppercase tracking-wider ${record?.status === AttendanceStatus.PRESENT ? 'text-construction-dark' : record?.status === AttendanceStatus.ABSENT ? 'text-red-500' : 'text-gray-400'}`}>
                              {record?.status === AttendanceStatus.PRESENT ? 'PRESENT' : record?.status === AttendanceStatus.ABSENT ? 'ABSENT' : 'UNMARKED'}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {isLocked ? (
                        <div className="flex flex-col space-y-1">
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block w-max">
                            {record?.dutyStatus === DutyStatus.ON ? `ON ${record?.dutyOnTime ? `(${record?.dutyOnTime})` : ''}` : record?.dutyStatus === DutyStatus.OFF ? `OFF ${record?.dutyOffTime ? `(${record?.dutyOffTime})` : ''}` : 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => updateAttendance(u.id, { dutyStatus: DutyStatus.ON })}
                              className={`w-12 py-1.5 text-[10px] font-black rounded border transition-all ${
                                record?.dutyStatus === DutyStatus.ON 
                                  ? 'bg-green-600 text-white border-green-600 shadow-sm' 
                                  : 'bg-white text-gray-400 border-gray-200'
                              }`}
                            >
                              ON
                            </button>
                            {record?.dutyOnTime && (
                              <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded">
                                {record.dutyOnTime}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => updateAttendance(u.id, { dutyStatus: DutyStatus.OFF })}
                              className={`w-12 py-1.5 text-[10px] font-black rounded border transition-all ${
                                record?.dutyStatus === DutyStatus.OFF 
                                  ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                                  : 'bg-white text-gray-400 border-gray-200'
                              }`}
                            >
                              OFF
                            </button>
                            {record?.dutyOffTime && (
                              <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded">
                                {record.dutyOffTime}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {isLocked ? (
                        <span className="text-xs font-bold text-gray-500">{record?.overtimeHours || 0} Hrs</span>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 whitespace-nowrap">
                          <input 
                            type="number"
                            min="0"
                            max="12"
                            className="w-14 border border-gray-200 rounded-lg px-2 py-2 text-xs text-center font-bold focus:ring-1 focus:ring-construction-yellow outline-none"
                            value={record?.overtimeHours || 0}
                            onChange={e => updateAttendance(u.id, { overtimeHours: Number(e.target.value) })}
                          />
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Hrs</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {workers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-400 italic font-medium">No active site personnel found to mark attendance.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {submitSummary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white text-center relative shrink-0">
              <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold">Attendance Submitted!</h3>
              <p className="text-green-50 text-sm mt-1">{date} records saved to database</p>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-center w-1/2 border-r border-gray-200">
                  <div className="text-3xl font-black text-green-600">{submitSummary.present}</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Present</div>
                </div>
                <div className="text-center w-1/2">
                  <div className="text-3xl font-black text-red-500">{submitSummary.absent}</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Absent</div>
                </div>
              </div>

              {submitSummary.absentUsers.length > 0 && (
                <div>
                  <div className="flex justify-between items-end mb-3 border-b pb-2">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Absent Workers (Notify via WhatsApp)</h4>
                    {submitSummary.absentUsers.filter(u => u.mobile).length > 1 && (
                      <a 
                        href={`https://wa.me/?text=${encodeURIComponent(`Hello everyone, this is from Admin. The following workers have been marked ABSENT at the site today:\n\n${submitSummary.absentUsers.map(u => `- ${u.fullName}`).join('\n')}\n\nIf this is a mistake, please inform the Site Manager immediately.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-colors shadow-none"
                      >
                        Notify Group/Broadcast
                      </a>
                    )}
                  </div>
                  <div className="space-y-3">
                    {submitSummary.absentUsers.map(u => (
                      <div key={u.id} className="flex justify-between items-center p-3 bg-red-50/50 rounded-lg border border-red-100">
                        <div>
                          <div className="text-sm font-bold text-gray-800">{u.fullName}</div>
                          <div className="text-xs font-medium text-gray-500">{u.mobile || 'No mobile number'}</div>
                        </div>
                        <a 
                          href={getWhatsAppLink(u)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#25D366] hover:bg-[#1ebd5b] text-white px-3 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition-transform active:scale-95 shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                          </svg>
                          WhatsApp
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end shrink-0">
              <button 
                onClick={() => setSubmitSummary(null)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-bold text-sm transition-colors"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceControl;

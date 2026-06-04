
import React, { useState, useEffect } from 'react';
import { AuthState, UserRole, UserStatus, DutyStatus } from './types';
import { db } from './services/db';
import { getUserFromStorage } from './services/authService';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './components/Auth/LandingPage';
import Signup from './components/Auth/Signup';
import AdminSignup from './components/Auth/AdminSignup';
import Login from './components/Auth/Login';
import ForgotPassword from './components/Auth/ForgotPassword';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/Admin/AdminDashboard';
import MemberManagement from './components/Admin/MemberManagement';
import AttendanceControl from './components/Admin/AttendanceControl';
import SalaryManagement from './components/Admin/SalaryManagement';
import InventoryManagement from './components/Admin/InventoryManagement';
import ProjectManagement from './components/Admin/ProjectManagement';
import MemberDashboard from './components/Member/MemberDashboard';
import AccountStatus from './components/Member/AccountStatus';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [authState, setAuthState] = useState<'LANDING' | 'SIGNUP' | 'ADMIN_SIGNUP' | 'LOGIN' | 'FORGOT_PASSWORD'>('LANDING');
  const [initialAdminRole, setInitialAdminRole] = useState<UserRole.ADMIN | UserRole.SITE_MANAGER>(UserRole.ADMIN);

  const syncUserData = () => {
    const storedUser = getUserFromStorage();
    if (!storedUser) {
      return;
    }

    const users = db.users.getAll();
    const latestUser = users.find(u => u.id === storedUser.id);

    if (latestUser) {
      setAuth({ user: latestUser, isAuthenticated: true });
      localStorage.setItem('current_user', JSON.stringify(latestUser));
    } else {
      setAuth({ user: storedUser, isAuthenticated: true });
      localStorage.setItem('current_user', JSON.stringify(storedUser));
    }
  };

  useEffect(() => {
    db.init();

    // Check specific URL routes for Admin / Site Manager to skip landing
    const path = window.location.pathname;
    if (path === '/admin') {
      setInitialAdminRole(UserRole.ADMIN);
      setAuthState('ADMIN_SIGNUP');
    } else if (path === '/site-manager') {
      setInitialAdminRole(UserRole.SITE_MANAGER);
      setAuthState('ADMIN_SIGNUP');
    }

    // AUTO-CLOSE DUTY AFTER 8 PM
    const sanitizeAttendance = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const recordsToUpdate = db.attendance.getAll();
      let changed = false;

      recordsToUpdate.forEach(record => {
        // If the record is still ON duty, and it's either a past date OR it's today and past 8 PM (20:00)
        if (record.dutyStatus === DutyStatus.ON) {
          if (record.date < todayStr || (record.date === todayStr && now.getHours() >= 20)) {
            record.dutyStatus = DutyStatus.OFF;
            record.dutyOffTime = "20:00";
            changed = true;
          }
        }
      });

      if (changed) {
        db.attendance.saveBulk(recordsToUpdate);
      }
    };
    
    sanitizeAttendance();
    syncUserData();

    // Listener for instant UI sync when profile photo is updated in MemberDashboard
    window.addEventListener('storage', syncUserData);
    
    // Set up a minute-by-minute interval to check for 8 PM auto-close if app is left open
    const interval = setInterval(() => {
      sanitizeAttendance();
    }, 60000);

    return () => {
      window.removeEventListener('storage', syncUserData);
      clearInterval(interval);
    };
  }, []);

  const handleLogin = (user: any) => {
    setCurrentView('dashboard');
    setAuth({ user, isAuthenticated: true });
    localStorage.setItem('current_user', JSON.stringify(user));
    if (user && user.id) {
      db.users.save({
        id: String(user.id),
        fullName: user.fullName || user.name || '',
        email: user.email,
        role: user.role || 'MEMBER',
        mobile: user.mobile || '',
        workType: user.workType || user.work_type || '',
        dailySalary: user.dailySalary ?? user.daily_salary ?? 0,
        status: user.status || 'PENDING',
        createdAt: user.createdAt || new Date().toISOString(),
        aadharNumber: user.aadharNumber || user.aadhar_number || '',
      });
    }
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('current_user');
    setAuthState('LANDING');
    setCurrentView('dashboard');
  };

  const handleRefreshStatus = () => {
    if (auth.user) {
      const users = db.users.getAll();
      const latestUser = users.find(u => u.id === auth.user?.id);
      if (latestUser) {
        setAuth({ ...auth, user: latestUser });
        localStorage.setItem('current_user', JSON.stringify(latestUser));
      }
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={authState}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen"
        >
          {authState === 'LANDING' && (
            <LandingPage 
              onSelectWorker={() => setAuthState('LOGIN')}
            />
          )}
          {authState === 'ADMIN_SIGNUP' && (
            <AdminSignup 
              onSwitchToLogin={() => setAuthState('LOGIN')} 
              onSwitchToMemberSignup={() => setAuthState('SIGNUP')}
              onBackToLanding={() => setAuthState('LANDING')}
              defaultRole={initialAdminRole}
            />
          )}
          {authState === 'LOGIN' && (
            <Login 
              onLogin={handleLogin} 
              onSwitchToSignup={() => setAuthState('SIGNUP')} 
              onSwitchToForgotPassword={() => setAuthState('FORGOT_PASSWORD')}
              onSwitchToAdminSignup={() => setAuthState('ADMIN_SIGNUP')}
              onBackToLanding={() => setAuthState('LANDING')}
            />
          )}
          {authState === 'SIGNUP' && (
            <Signup 
              onSwitchToLogin={() => setAuthState('LOGIN')} 
              onBackToLanding={() => setAuthState('LANDING')}
            />
          )}
          {authState === 'FORGOT_PASSWORD' && (
            <ForgotPassword onSwitchToLogin={() => setAuthState('LOGIN')} onSuccess={handleLogin} />
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  const isManagement = auth.user?.role === UserRole.ADMIN || auth.user?.role === UserRole.SUPER_ADMIN || auth.user?.role === UserRole.SITE_MANAGER;
  const isApproved = auth.user?.status === UserStatus.APPROVED;

  const renderContent = () => {
    if (isManagement) {
      switch (currentView) {
        case 'dashboard': return <AdminDashboard />;
        case 'members': return <MemberManagement />;
        case 'attendance': return <AttendanceControl />;
        case 'salary': 
            // Prevent Site Manager from accessing Salary view even if they try to navigate manually
            return auth.user?.role === UserRole.SITE_MANAGER ? <AdminDashboard /> : <SalaryManagement />;
        case 'inventory': return <InventoryManagement />;
        case 'projects': return <ProjectManagement />;
        default: return <AdminDashboard />;
      }
    } else {
      if (!isApproved) {
        return <AccountStatus user={auth.user!} onLogout={handleLogout} onRefresh={handleRefreshStatus} />;
      }
      return <MemberDashboard user={auth.user!} />;
    }
  };

  if (!isManagement && !isApproved) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        {renderContent()}
      </div>
    );
  }

  const displayRole = (role?: UserRole) => {
    if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) return 'Admin';
    if (role === UserRole.SITE_MANAGER) return 'Site Manager';
    return 'Member';
  };

  const getPageTitle = (view: string) => {
    const titles: Record<string, string> = {
        'dashboard': 'Dashboard',
        'members': 'Workers',
        'attendance': 'Attendance',
        'salary': 'Payroll',
        'inventory': 'Inventory',
        'projects': 'Projects'
    };
    return titles[view] || view;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden relative">
      <Sidebar 
        user={auth.user!} 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onLogout={handleLogout} 
      />
      {/* Increased bottom padding for mobile to accommodate floating dock */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar flex flex-col">
        {currentView !== 'salary' && (
          <header className="flex flex-row justify-between items-center gap-2 sticky top-0 z-50 px-5 py-4 md:px-8 md:py-6 bg-gray-50/95 backdrop-blur-md border-b border-gray-200/50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.05)]">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="shrink-0"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-construction-dark font-oswald uppercase tracking-wider">
                {getPageTitle(currentView)}
              </h1>
              <div className="flex items-center space-x-2">
                <span className="w-8 h-1 bg-construction-yellow rounded-full"></span>
                <p className="hidden md:block text-xs text-gray-400 font-bold tracking-widest uppercase">ARTI ENGINEERING</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-3 bg-white p-1.5 pr-4 rounded-full shadow-sm border border-gray-100"
            >
              <div className="relative shrink-0">
                {auth.user?.profilePhoto ? (
                  <img 
                    src={auth.user.profilePhoto} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-construction-yellow flex items-center justify-center font-bold text-construction-dark shadow-md text-sm border-2 border-white">
                    {auth.user?.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 hidden md:block">
                <p className="text-sm font-black text-construction-dark truncate max-w-[150px]">{auth.user?.fullName}</p>
                <p className={`text-[10px] font-bold tracking-tighter uppercase ${isManagement ? 'text-red-500' : 'text-green-600'}`}>
                  {displayRole(auth.user?.role)}
                </p>
              </div>
            </motion.div>
          </header>
        )}

        <div className="px-5 py-6 pb-32 md:p-8 md:pb-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default App;

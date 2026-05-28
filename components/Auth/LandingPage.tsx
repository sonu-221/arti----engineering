
import React from 'react';
import { motion } from 'framer-motion';
import { COMPANY_NAME, UI_ICONS } from '../../constants';

interface LandingPageProps {
  onSelectWorker: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectWorker }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col relative overflow-x-hidden overflow-y-auto custom-scrollbar font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        {/* Glowing orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-construction-yellow/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[150px]"></div>
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 py-[8vh] min-h-screen relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-6 flex flex-col items-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-2">
            <span className="w-2 h-2 rounded-full bg-construction-yellow animate-pulse"></span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-300">Pioneering Infrastructure</span>
          </div>

          <div className="w-20 h-20 bg-gradient-to-br from-construction-yellow to-yellow-600 rounded-[1.8rem] flex items-center justify-center text-construction-dark mx-auto shadow-[0_0_40px_rgba(255,204,0,0.3)] transform rotate-3 ring-4 ring-white/5 overflow-hidden relative">
             <div className="absolute inset-0 bg-white/20 blur-md transform -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
            {UI_ICONS.Construction}
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-oswald font-black uppercase tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-500">
            Welcome to <br />
            <span className="text-construction-yellow drop-shadow-[0_0_20px_rgba(255,204,0,0.2)]">{COMPANY_NAME}</span>
          </h1>
          <p className="text-gray-400 font-medium text-xs sm:text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Enterprise-grade workforce management, precise salary tracking, and real-time operational oversight.
          </p>
        </motion.div>

        {/* Worker Portal Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex justify-center w-full px-4 max-w-[320px] sm:max-w-[420px] mx-auto mt-10 mb-8 relative"
        >
          <div className="absolute inset-0 bg-construction-yellow/20 blur-3xl rounded-full translate-y-4"></div>
          <motion.button
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelectWorker}
            className="group w-full relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 sm:p-6 rounded-2xl text-left overflow-hidden transition-all hover:bg-white/[0.08] hover:border-construction-yellow/50 hover:shadow-[0_0_30px_rgba(255,204,0,0.15)] flex flex-col sm:flex-row items-center gap-4 sm:gap-5 z-10"
          >
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 p-4 opacity-5 group-hover:opacity-10 transition-opacity hidden sm:block transform group-hover:scale-110 duration-500">
              <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="1.5"/><circle cx="9" cy="7" r="4" strokeWidth="1.5"/></svg>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white group-hover:bg-construction-yellow group-hover:text-construction-dark transition-all duration-300 shadow-lg group-hover:shadow-[0_0_20px_rgba(255,204,0,0.4)] transform group-hover:-translate-y-1 relative z-10">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2.5"/></svg>
            </div>
            <div className="flex-1 flex flex-col text-center sm:text-left relative z-10">
              <h3 className="text-xl sm:text-2xl font-oswald font-bold text-white uppercase tracking-tight">Worker Portal</h3>
              <p className="text-gray-400 mt-1 text-[11px] sm:text-xs font-medium leading-[1.5] max-w-[240px]">
                Access attendance, salary details, and generate pay slips.
              </p>
              <div className="mt-4 flex items-center justify-center sm:justify-start text-construction-yellow font-black text-[10px] uppercase tracking-widest gap-2">
                <span>Authenticate</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="3"/></svg>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Info Stats Row */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.6, duration: 0.8 }}
           className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-4"
        >
           {[
             { label: "Active Project Sites", val: "12+" },
             { label: "Registered Workers", val: "500+" },
             { label: "Safety Compliance", val: "100%" }
           ].map((stat, i) => (
             <div key={i} className="flex flex-col items-center">
               <span className="text-white font-oswald font-bold text-lg sm:text-xl">{stat.val}</span>
               <span className="text-gray-500 text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold">{stat.label}</span>
             </div>
           ))}
        </motion.div>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1.2, duration: 1 }}
           className="mt-auto pt-12 flex flex-col items-center"
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-construction-yellow to-transparent mb-4"></div>
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-construction-yellow animate-pulse">Discover More</span>
        </motion.div>
      </div>

      {/* Bento Grid Information Sections */}
      <div className="relative z-10 w-full py-24 px-4 sm:px-6 md:px-12 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* About Box - Spans 1 column on desktop, but large */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-1 bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 p-8 rounded-[2rem] overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-construction-yellow/10 blur-[80px] -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-150"></div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 bg-construction-yellow/20 rounded-2xl flex items-center justify-center text-construction-yellow mb-6">
                  {UI_ICONS.Location}
                </div>
                <h2 className="text-2xl sm:text-3xl font-oswald font-bold uppercase tracking-wide text-white mb-4">
                  About <br/><span className="text-construction-yellow">{COMPANY_NAME}</span>
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 flex-1">
                  At ARTI ENGINEERING, we don't just build structures; we forge the foundations of the future. With unmatched expertise in heavy civil construction and mega-project management, we stand as a beacon of structural integrity. Our unwavering commitment to premium quality, flawless execution, and the absolute safety of our workforce makes us the industry leaders.
                </p>
                <div className="w-full h-[1px] bg-gradient-to-r from-construction-yellow/50 to-transparent mt-auto"></div>
              </div>
            </motion.div>

            {/* Safety Protocols - Bento Box - Spans 2 columns */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px", amount: 0.2 }}
              className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
            >
              <div className="md:col-span-2 bg-red-500/5 border border-red-500/20 p-6 sm:p-8 rounded-[2rem] flex flex-col sm:flex-row gap-6 items-center sm:items-start relative overflow-hidden">
                 <div className="absolute -right-20 -top-20 w-48 h-48 bg-red-500/20 blur-[50px]"></div>
                 <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shrink-0 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                 </div>
                 <div className="relative z-10 text-center sm:text-left">
                   <h2 className="text-xl sm:text-2xl font-oswald font-bold uppercase tracking-wide text-white mb-2">Zero Tolerance Safety</h2>
                   <p className="text-red-200/70 text-xs sm:text-sm leading-relaxed">
                     Safety is not just a rule—it's our primary culture. We strictly enforce crucial safety guidelines across all active operational zones.
                   </p>
                 </div>
              </div>

               {/* Left Column: Required PPE Visuals */}
               <div className="md:col-span-1 border border-white/10 rounded-[2rem] p-4 flex flex-col gap-3 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
                 <h3 className="text-white font-oswald font-bold text-base sm:text-lg uppercase tracking-wider mb-2 relative z-10 px-2">अनिवार्य सुरक्षा उपकरण</h3>
                 
                 {/* Helmet Icon Card */}
                 <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4 group/item hover:bg-white/10 transition-colors">
                   <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_20px_rgba(250,204,21,0.2)] group-hover/item:scale-110 transition-transform duration-500 relative border-b-4 border-yellow-700">
                     <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 rounded-t-xl pointer-events-none"></div>
                     <svg className="w-8 h-8 sm:w-10 sm:h-10 text-construction-dark relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/>
                        <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/>
                        <path d="M4 15v-3a6 6 0 0 1 6-6h0"/>
                        <path d="M14 6h0a6 6 0 0 1 6 6v3"/>
                     </svg>
                   </div>
                   <div className="flex-1">
                     <span className="text-construction-yellow font-black uppercase tracking-widest text-xs sm:text-sm">Hard Hat</span>
                     <p className="text-gray-400 text-[10px] sm:text-xs font-medium mt-1">सुरक्षा हेलमेट पहनें</p>
                   </div>
                 </div>

                 {/* Vest Icon Card */}
                 <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4 group/item hover:bg-white/10 transition-colors">
                   <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_20px_rgba(249,115,22,0.2)] group-hover/item:scale-110 transition-transform duration-500 relative border-b-4 border-orange-700 overflow-hidden">
                     <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-white/40 pointer-events-none"></div>
                     <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 bg-white/40 pointer-events-none"></div>
                     <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
                     </svg>
                   </div>
                   <div className="flex-1">
                     <span className="text-orange-400 font-black uppercase tracking-widest text-xs sm:text-sm">High-Vis Vest</span>
                     <p className="text-gray-400 text-[10px] sm:text-xs font-medium mt-1">रिफ्लेक्टिव जैकेट अनिवार्य</p>
                   </div>
                 </div>

                 {/* Gloves Icon Card */}
                 <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4 group/item hover:bg-white/10 transition-colors">
                   <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_20px_rgba(59,130,246,0.2)] group-hover/item:scale-110 transition-transform duration-500 relative border-b-4 border-blue-700">
                     <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 rounded-t-xl pointer-events-none"></div>
                     <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                       <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
                       <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
                       <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                     </svg>
                   </div>
                   <div className="flex-1">
                     <span className="text-blue-400 font-black uppercase tracking-widest text-xs sm:text-sm">Safety Gloves</span>
                     <p className="text-gray-400 text-[10px] sm:text-xs font-medium mt-1">सेफ्टी दस्ताने इस्तेमाल करें</p>
                   </div>
                 </div>
               </div>

               {/* Right Column: Rules List (Hindi 10 points) */}
               <div className="md:col-span-1 flex flex-col justify-center sm:pl-4 mt-6 sm:mt-0">
                 <h3 className="text-white font-oswald font-bold text-xl sm:text-2xl uppercase tracking-wider mb-6 pb-2 border-b border-white/10">कार्यस्थल सुरक्षा नियम</h3>
                 <ul className="space-y-4">
                   {[
                     "⛑️ हेलमेट पहनना अनिवार्य है।",
                     "👷 हाई-विजिबिलिटी जैकेट पहनें।",
                     "👢 सुरक्षा जूते पहनें।",
                     "🪢 ऊँचाई पर काम करते समय सुरक्षा बेल्ट पहनें।",
                     "🧤 दस्ताने और सुरक्षा उपकरण पहनें।",
                     "⚡ बिजली सुरक्षा पर ध्यान दें।",
                     "🚧 चेतावनी संकेतों का पालन करें।",
                     "🛠️ औजारों को सही जगह पर रखें।",
                     "🏥 प्राथमिक चिकित्सा किट तैयार रखें।"
                   ].map((point, idx) => (
                     <li key={idx} className="flex items-start gap-3 group">
                       <span className="text-construction-yellow font-black text-sm mt-1 opacity-70 group-hover:opacity-100 transition-opacity">›</span>
                       <span className="text-gray-300 font-medium text-[13px] sm:text-[15px] tracking-wide leading-relaxed group-hover:text-white transition-colors">{point}</span>
                     </li>
                   ))}
                 </ul>
               </div>
            </motion.div>
          </div>

          {/* Support Information Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 sm:mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden border border-orange-400"
          >
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            {/* Left section: Heading */}
            <div className="flex items-center gap-4 z-10">
               <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white shrink-0 shadow-inner">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.36 6.64a9 9 0 1 1-12.73 0M21 12a9 9 0 0 0-9-9m0 0v2m0 0H9m3 0h3"/>
                 </svg>
               </div>
               <div>
                  <h4 className="text-white font-bold text-lg sm:text-xl font-oswald tracking-wide uppercase">Support & Assistance</h4>
                  <p className="text-orange-100 text-xs sm:text-sm">Need help? Contact our site administration.</p>
               </div>
            </div>

            {/* Right section: Info items */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8 z-10 w-full md:w-auto">
               
               {/* Contact details */}
               <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-white">
                   <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                   </svg>
                   <span className="text-sm font-medium tracking-wide">admin@artiengineering.com</span>
                 </div>
                 <div className="flex items-center gap-2 text-white">
                   <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                   </svg>
                   <span className="text-sm sm:text-base font-bold tracking-wide">+91 98765 43210</span>
                 </div>
               </div>

               {/* Divider */}
               <div className="hidden sm:block w-[1px] h-10 bg-white/30"></div>
               <div className="block sm:hidden w-full h-[1px] bg-white/30"></div>

               {/* Working Hours */}
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                   <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                   </svg>
                 </div>
                 <div className="flex flex-col text-white">
                   <span className="text-[10px] sm:text-xs uppercase tracking-wider text-orange-100 font-bold">Working Time</span>
                   <span className="text-sm font-bold whitespace-nowrap">Monday - Saturday</span>
                   <span className="text-xs font-bold text-orange-100">8:00 AM - 8:00 PM</span>
                 </div>
               </div>

            </div>
          </motion.div>

        </div>
      </div>

      {/* Developer Credit Footer */}
      <footer className="relative z-10 w-full bg-[#050505] border-t border-white/5 py-12 mt-auto overflow-hidden">
        {/* Glow behind footer text */}
        <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-construction-yellow/20 blur-[100px] pointer-events-none"></div>

        <motion.div 
           initial={{ opacity: 0, y: 10 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center flex flex-col items-center justify-center relative z-10"
        >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-gray-600"></div>
              <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase font-black">
                  Designed & Developed By
              </p>
              <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-gray-600"></div>
            </div>
            
            <div className="relative group cursor-default">
              <span className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-600 font-oswald tracking-[0.3em] pl-[0.3em] relative z-10 transition-all duration-500 group-hover:text-white">
                  SONU YADAV
              </span>
              {/* Animated underline */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-construction-yellow group-hover:w-full transition-all duration-500 ease-out"></div>
            </div>
        </motion.div>
      </footer>
    </div>
  );
};

export default LandingPage;

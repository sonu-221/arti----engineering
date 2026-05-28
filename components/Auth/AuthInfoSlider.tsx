
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INFO_MESSAGES = [
  { id: 1, text: "SAFETY FIRST: Always wear your hard hat and high-vis vest on site.", icon: "👷" },
  { id: 2, text: "PRECISION: Track your work hours and overtime with second-level accuracy.", icon: "⏱️" },
  { id: 3, text: "TRANSPARENCY: Real-time salary calculations and instant pay-slips.", icon: "💰" },
  { id: 4, text: "ARTI ENGINEERING: Building the future of infrastructure together.", icon: "🏗️" },
  { id: 5, text: "SUPPORT: Need help? Contact your site supervisor or system admin.", icon: "📞" }
];

const AuthInfoSlider: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % INFO_MESSAGES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full mb-6 overflow-hidden">
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative shadow-inner">
        <div className="absolute top-0 left-0 w-1 h-full bg-construction-yellow rounded-l-2xl"></div>
        <div className="flex items-center space-x-4 h-12">
          <span className="text-xl flex-shrink-0 bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
            {INFO_MESSAGES[index].icon}
          </span>
          <div className="flex-1 relative h-full flex items-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={INFO_MESSAGES[index].id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="text-[10px] font-black uppercase tracking-widest text-construction-gray leading-tight"
              >
                {INFO_MESSAGES[index].text}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthInfoSlider;

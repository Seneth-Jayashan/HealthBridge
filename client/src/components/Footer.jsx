import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Footer = ({ isDark }) => {
  return (
    <footer className={`border-t pt-20 pb-10 px-6 md:px-12 ${isDark ? 'border-white/10 bg-[#0B1120]' : 'border-slate-200 bg-[#FAFAFA]'}`}>
      
      {/* Top Section: CTA */}
      <div className="mx-auto w-full max-w-4xl text-center mb-20">
        <Activity size={48} className="mx-auto text-blue-600 mb-6" />
        <h3 className={`text-4xl font-black md:text-5xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Take control of your health.
        </h3>
        <p className={`mx-auto mt-6 max-w-xl text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Join the secure platform connecting patients and top-tier physicians through cutting-edge microservices.
        </p>
        <div className="mt-10">
          <Link to="/register" className="inline-block rounded-2xl bg-red-600 px-12 py-5 font-bold text-white shadow-xl shadow-red-600/20 transition-all hover:-translate-y-1 hover:bg-red-700 hover:shadow-red-600/30 text-lg">
            Create Patient Account
          </Link>
        </div>
      </div>
      
      {/* Bottom Section: Links & Copyright */}
      <div className={`mx-auto w-full max-w-7xl border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <p className={`text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          © {new Date().getFullYear()} HealthBridge Medical Platform. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link to="#" className={`text-sm font-bold hover:text-blue-600 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Privacy Policy</Link>
          <Link to="#" className={`text-sm font-bold hover:text-blue-600 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Terms of Service</Link>
          <Link to="#" className={`text-sm font-bold hover:text-blue-600 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>System Status</Link>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
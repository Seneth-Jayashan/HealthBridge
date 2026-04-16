import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import { 
  CalendarCheck2, Clock3, FileCheck2, UsersRound, 
  Calendar, ArrowRight, Loader2, Plus 
} from 'lucide-react';

import { getDoctorProfile } from '../../services/doctor.service'; 
import UpdateAvailabilityModal from '../../components/doctor/UpdateAvailabilityModal';

// Static metrics to use until your backend dashboard endpoint is ready
const fallbackMetrics = [
  { label: 'Today Consultations', value: '0', icon: CalendarCheck2 },
  { label: 'Waiting Patients', value: '0', icon: UsersRound },
  { label: 'Pending Notes', value: '0', icon: FileCheck2 },
  { label: 'Average Wait Time', value: '0m', icon: Clock3 },
];

const DoctorDashboard = () => {
  const { isDark = false } = useOutletContext() || {};
  const [metrics] = useState(fallbackMetrics); 
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const doctorProfile = await getDoctorProfile();
      
      if (doctorProfile) {
        setProfile(doctorProfile);
        
        // Auto-open modal if availability is missing
        const hasNoAvailability = 
          !doctorProfile.isAvailabilitySet || 
          !doctorProfile.availability || 
          doctorProfile.availability.length === 0;

        if (hasNoAvailability) {
          setIsModalOpen(true);
        }
      }
    } catch (error) {
      console.error("Failed to load profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Run initial mount animations
  useEffect(() => {
    if (!isLoading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate('.hb-dash-item', {
        y: [20, 0],
        opacity: [0, 1],
        ease: 'outCubic',
        duration: 800,
        delay: stagger(100)
      });
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-[#0B1120]' : 'bg-[#FAFAFA]'}`}>
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading your workspace...</p>
      </div>
    );
  }

  return (
    <section className={`min-h-screen p-6 md:p-10 font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className={`hb-dash-item opacity-0 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 rounded-3xl shadow-lg border ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
          <div>
            <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Welcome back, Dr. {profile?.userId?.name || profile?.name || 'Doctor'}
            </h1>
            <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Manage consultations, queues, and patient care workflows.
            </p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all border shadow-sm ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-800/50' : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'}`}
          >
            <Calendar size={18} />
            Update Schedule
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((card, index) => {
            const Icon = card.icon || CalendarCheck2;
            return (
              <article 
                key={card.label || index} 
                className={`hb-dash-item opacity-0 relative overflow-hidden rounded-3xl border p-6 shadow-lg transition-all group ${isDark ? 'bg-[#131C31] border-slate-800 hover:border-slate-600 shadow-black/20' : 'bg-white border-slate-100 hover:border-blue-100 shadow-blue-900/5'}`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{card.label}</p>
                    <p className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.value}</p>
                  </div>
                  <div className={`p-3.5 rounded-2xl group-hover:scale-110 transition-all duration-300 ${isDark ? 'bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-700' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}></div>
              </article>
            );
          })}
        </div>

        {/* Bottom Sections */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Appointments Section */}
          <div className={`hb-dash-item opacity-0 md:col-span-2 p-6 md:p-8 rounded-3xl shadow-lg border ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Today's Appointments</h2>
              <button className={`text-sm font-bold flex items-center gap-1 transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                View All <ArrowRight size={16} />
              </button>
            </div>
            
            <div className={`flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-2xl ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
              <CalendarCheck2 size={48} className={`mb-3 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
              <h3 className={`font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No appointments yet</h3>
              <p className={`text-sm max-w-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Your schedule is clear for now. New bookings will appear here automatically.</p>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className={`hb-dash-item opacity-0 p-6 md:p-8 rounded-3xl shadow-lg border ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
            <h2 className={`text-xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Actions</h2>
            <div className="space-y-3">
              <button className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-colors text-left border ${isDark ? 'bg-slate-900/50 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'}`}>
                <div className={`p-2 rounded-xl shadow-sm ${isDark ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600'}`}>
                  <Plus size={18} />
                </div>
                Add Patient Note
              </button>
              <button className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-colors text-left border ${isDark ? 'bg-slate-900/50 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'}`}>
                <div className={`p-2 rounded-xl shadow-sm ${isDark ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600'}`}>
                  <FileCheck2 size={18} />
                </div>
                Review Lab Reports
              </button>
            </div>
          </div>
        </div>

        {/* The Availability Modal */}
        <UpdateAvailabilityModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchDashboardData}
          initialAvailability={profile?.availability || []}
        />
      </div>
    </section>
  );
};

export default DoctorDashboard;
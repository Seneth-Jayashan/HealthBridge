import React, { useEffect, useState } from 'react';
import { 
  CalendarCheck2, Clock3, FileCheck2, UsersRound, 
  Calendar, ArrowRight, Loader2, Plus 
} from 'lucide-react';

// Notice we are importing getDoctorProfile now, NOT getDoctorDashboard
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
  // Use static metrics for now
  const [metrics] = useState(fallbackMetrics); 
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from the existing Profile endpoint instead
      const doctorProfile = await getDoctorProfile();
      
      if (doctorProfile) {
        setProfile(doctorProfile);
        
        // 2. Run the robust check to auto-open the modal
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-slate-500 font-medium">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Welcome back, Dr. {profile?.userId?.name || profile?.name || 'Doctor'}
          </h1>
          <p className="mt-2 text-slate-600 font-medium">
            Manage consultations, queues, and patient care workflows.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-5 py-3 rounded-xl font-bold hover:bg-blue-100 transition-colors border border-blue-100"
        >
          <Calendar size={18} />
          Update Schedule
        </button>
      </div>

      {/* Metrics Grid (Static for now) */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((card, index) => {
          const Icon = card.icon || CalendarCheck2;
          return (
            <article 
              key={card.label || index} 
              className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-100 group"
            >
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{card.value}</p>
                </div>
                <div className="bg-blue-50 p-3.5 rounded-2xl text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Icon size={24} strokeWidth={2.5} />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            </article>
          );
        })}
      </div>

      {/* Bottom Sections */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-900">Today's Appointments</h2>
            <button className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:text-blue-800">
              View All <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
            <CalendarCheck2 size={48} className="text-slate-300 mb-3" />
            <h3 className="text-slate-700 font-bold mb-1">No appointments yet</h3>
            <p className="text-slate-500 text-sm max-w-xs">Your schedule is clear for now. New bookings will appear here automatically.</p>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-black text-slate-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors text-left border border-slate-100">
              <div className="bg-white p-2 rounded-xl shadow-sm text-blue-600">
                <Plus size={18} />
              </div>
              Add Patient Note
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors text-left border border-slate-100">
              <div className="bg-white p-2 rounded-xl shadow-sm text-blue-600">
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
    </section>
  );
};

export default DoctorDashboard;
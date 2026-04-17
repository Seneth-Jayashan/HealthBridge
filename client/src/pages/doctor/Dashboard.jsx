import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import {
  ArrowRight,
  Calendar,
  CalendarCheck2,
  Clock3,
  FileCheck2,
  Loader2,
  Plus,
  UsersRound,
  Video,
} from 'lucide-react';

import { getDoctorAppointmentsRequest } from '../../services/appointment.service';
import UpdateAvailabilityModal from '../../components/doctor/UpdateAvailabilityModal';
import { getDoctorProfile, getPatientListForDoctor } from '../../services/doctor.service';
import { getMyDoctorPayments } from '../../services/payment.service';
import { getDoctorOnlineAppointments } from '../../services/telemedicine.service';

const statusBadgeClass = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  rejected: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const formatMoney = (amount, currency = 'LKR') => {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

const DoctorDashboard = () => {
  const { isDark = false } = useOutletContext() || {};

  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [onlineAppointments, setOnlineAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const doctorProfile = await getDoctorProfile();
      setProfile(doctorProfile || null);

      const hasNoAvailability =
        !doctorProfile?.isAvailabilitySet ||
        !doctorProfile?.availability ||
        doctorProfile.availability.length === 0;

      if (hasNoAvailability) {
        setIsModalOpen(true);
      }

      const doctorId = doctorProfile?._id;

      const [appointmentsResult, paymentsResult, onlineResult, patientsResult] = await Promise.allSettled([
        doctorId ? getDoctorAppointmentsRequest(doctorId) : Promise.resolve([]),
        doctorId ? getMyDoctorPayments(doctorId) : Promise.resolve([]),
        getDoctorOnlineAppointments(),
        getPatientListForDoctor(),
      ]);

      if (appointmentsResult.status === 'fulfilled') {
        setAppointments(Array.isArray(appointmentsResult.value) ? appointmentsResult.value : []);
      } else {
        setAppointments([]);
      }

      if (paymentsResult.status === 'fulfilled') {
        setPayments(Array.isArray(paymentsResult.value) ? paymentsResult.value : []);
      } else {
        setPayments([]);
      }

      if (onlineResult.status === 'fulfilled') {
        setOnlineAppointments(Array.isArray(onlineResult.value) ? onlineResult.value : []);
      } else {
        setOnlineAppointments([]);
      }

      if (patientsResult.status === 'fulfilled') {
        const payload = patientsResult.value;
        const extractedPatients = Array.isArray(payload)
          ? payload.flatMap((entry) => entry?.patients || [])
          : Array.isArray(payload?.patients)
            ? payload.patients
            : [];

        const uniquePatients = Array.from(new Map(extractedPatients.map((p) => [p.patientId, p])).values());
        setPatients(uniquePatients);
      } else {
        setPatients([]);
      }

      const allCriticalFailed =
        appointmentsResult.status === 'rejected' &&
        paymentsResult.status === 'rejected' &&
        patientsResult.status === 'rejected';

      if (allCriticalFailed) {
        setError('Unable to load dashboard data right now. Please refresh.');
      }
    } catch (requestError) {
      setError('Failed to load doctor profile. Please try again.');
      setProfile(null);
      setAppointments([]);
      setPayments([]);
      setOnlineAppointments([]);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!isLoading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate('.hb-dash-item', {
        y: [20, 0],
        opacity: [0, 1],
        ease: 'outCubic',
        duration: 800,
        delay: stagger(100),
      });
    }
  }, [isLoading]);

  const pendingAppointments = useMemo(
    () => appointments.filter((item) => normalizeStatus(item?.status) === 'pending'),
    [appointments]
  );

  const upcomingAppointments = useMemo(
    () => appointments.filter((item) => {
      const status = normalizeStatus(item?.status);
      return status === 'pending' || status === 'accepted';
    }),
    [appointments]
  );

  const averageWaitMins = useMemo(() => {
    if (!pendingAppointments.length) return '0m';

    const nowMs = Date.now();
    const waits = pendingAppointments
      .map((item) => {
        const createdMs = new Date(item?.createdAt || 0).getTime();
        if (!createdMs) return null;
        return Math.max(0, Math.round((nowMs - createdMs) / 60000));
      })
      .filter((value) => Number.isFinite(value));

    if (!waits.length) return '0m';

    const avg = Math.round(waits.reduce((sum, value) => sum + value, 0) / waits.length);
    return `${avg}m`;
  }, [pendingAppointments]);

  const pendingNotesCount = useMemo(
    () => appointments.filter((item) => {
      const status = normalizeStatus(item?.status);
      const note = String(item?.doctorDecisionNote || item?.notes || '').trim();
      return (status === 'accepted' || status === 'completed') && !note;
    }).length,
    [appointments]
  );

  const completedPayments = useMemo(
    () => payments.filter((item) => normalizeStatus(item?.status) === 'completed'),
    [payments]
  );

  const todayList = useMemo(() => {
    return [...upcomingAppointments].sort((a, b) => String(a?.startTime || '').localeCompare(String(b?.startTime || '')));
  }, [upcomingAppointments]);

  const cards = [
    { label: 'Upcoming Consultations', value: String(upcomingAppointments.length), icon: CalendarCheck2 },
    { label: 'Waiting Patients', value: String(pendingAppointments.length), icon: UsersRound },
    { label: 'Pending Notes', value: String(pendingNotesCount), icon: FileCheck2 },
    { label: 'Average Wait Time', value: averageWaitMins, icon: Clock3 },
  ];

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

        {error && (
          <div className="hb-dash-item opacity-0 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className={`hb-dash-item opacity-0 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 rounded-3xl shadow-lg border ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
          <div>
            <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Welcome back, Dr. {profile?.userId?.name || profile?.name || 'Doctor'}
            </h1>
            <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Live overview of consultations, telehealth activity, and revenue performance.
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => {
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

        <div className="grid md:grid-cols-3 gap-6">
          <div className={`hb-dash-item opacity-0 md:col-span-2 p-6 md:p-8 rounded-3xl shadow-lg border ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Upcoming Appointments</h2>
              <Link to="/doctor/appointment" className={`text-sm font-bold flex items-center gap-1 transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                View All <ArrowRight size={16} />
              </Link>
            </div>

            {todayList.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-2xl ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                <CalendarCheck2 size={48} className={`mb-3 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                <h3 className={`font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No upcoming appointments</h3>
                <p className={`text-sm max-w-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>New consultation requests will appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayList.slice(0, 5).map((appointment) => {
                  const status = normalizeStatus(appointment?.status);
                  return (
                    <article
                      key={appointment?._id || `${appointment?.patientName}-${appointment?.startTime}`}
                      className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{appointment?.patientName || 'Patient'}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusBadgeClass[status] || statusBadgeClass.rejected}`}>
                          {status || 'unknown'}
                        </span>
                      </div>
                      <p className={`mt-2 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {appointment?.startTime || '--:--'} - {appointment?.endTime || '--:--'}
                      </p>
                      {appointment?.reason && (
                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{appointment.reason}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`hb-dash-item opacity-0 p-6 md:p-8 rounded-3xl shadow-lg border ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
            <h2 className={`text-xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/doctor/prescriptions/new"
                className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-colors text-left border ${isDark ? 'bg-slate-900/50 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'}`}
              >
                <div className={`p-2 rounded-xl shadow-sm ${isDark ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600'}`}>
                  <Plus size={18} />
                </div>
                Add Prescription
              </Link>

              <Link
                to="/doctor/patients"
                className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-colors text-left border ${isDark ? 'bg-slate-900/50 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'}`}
              >
                <div className={`p-2 rounded-xl shadow-sm ${isDark ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600'}`}>
                  <UsersRound size={18} />
                </div>
                Open Patient Directory
              </Link>

              <Link
                to="/doctor/telehealth"
                className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-colors text-left border ${isDark ? 'bg-slate-900/50 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'}`}
              >
                <div className={`p-2 rounded-xl shadow-sm ${isDark ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600'}`}>
                  <Video size={18} />
                </div>
                Live Telehealth
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className={`hb-dash-item opacity-0 rounded-3xl border p-5 shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Active Patients</p>
            <p className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{patients.length}</p>
          </article>

          <article className={`hb-dash-item opacity-0 rounded-3xl border p-5 shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Online Appointments</p>
            <p className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{onlineAppointments.length}</p>
          </article>

          <article className={`hb-dash-item opacity-0 rounded-3xl border p-5 shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Completed Revenue</p>
            <p className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatMoney(completedPayments.reduce((sum, item) => sum + Number(item?.amount || 0), 0), completedPayments[0]?.payhere_currency || 'LKR')}
            </p>
          </article>
        </div>

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

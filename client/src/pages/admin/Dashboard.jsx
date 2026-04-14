import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock3, Server, Shield, Stethoscope, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminDashboardMetrics, getAllDoctors } from '../../services/admin.service';

const initialMetrics = {
  totalUsers: 0,
  totalPatients: 0,
  totalDoctors: 0,
  totalAdmins: 0,
};

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [verificationStats, setVerificationStats] = useState({
    Review: 0,
    Pending: 0,
    Approved: 0,
    Rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [platformMetrics, doctorsResponse] = await Promise.all([
          getAdminDashboardMetrics(),
          getAllDoctors({ page: 1, limit: 200 }),
        ]);

        setMetrics(platformMetrics);

        const doctors = doctorsResponse?.doctors || [];
        const aggregated = doctors.reduce(
          (accumulator, doctor) => {
            const key = doctor?.verificationStatus;
            if (accumulator[key] !== undefined) {
              accumulator[key] += 1;
            }
            return accumulator;
          },
          { Review: 0, Pending: 0, Approved: 0, Rejected: 0 },
        );
        setVerificationStats(aggregated);
      } catch {
        setMetrics(initialMetrics);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    { label: 'Registered Users', value: metrics.totalUsers, icon: Users, tone: 'text-blue-700' },
    { label: 'Total Doctors', value: metrics.totalDoctors, icon: Stethoscope, tone: 'text-cyan-700' },
    { label: 'Total Patients', value: metrics.totalPatients, icon: Activity, tone: 'text-emerald-700' },
    { label: 'Admins', value: metrics.totalAdmins, icon: Shield, tone: 'text-violet-700' },
  ];

  const queueCards = [
    { label: 'Under Review', value: verificationStats.Review, icon: Clock3, tone: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Pending Drafts', value: verificationStats.Pending, icon: AlertCircle, tone: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
    { label: 'Approved', value: verificationStats.Approved, icon: CheckCircle2, tone: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Rejected', value: verificationStats.Rejected, icon: AlertCircle, tone: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  ];

  return (
    <section className="pb-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin Command Center</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Platform Overview</h1>
        <p className="mt-2 text-slate-600">Track user growth, review doctor verification flow, and jump into operational actions.</p>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Icon size={20} className={card.tone} />
                <p className="mt-3 text-2xl font-black text-slate-900">{loading ? '...' : card.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">{card.label}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Doctor Verification Queue</h2>
              <p className="text-sm text-slate-600">Real-time status from provider onboarding pipeline.</p>
            </div>
            <Link
              to="/admin/providers"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-800"
            >
              Open Provider Network
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {queueCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className={`rounded-xl border p-4 ${item.bg}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                    <Icon size={18} className={item.tone} />
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-900">{loading ? '...' : item.value}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <Server size={18} className="text-slate-700" />
            <h3 className="mt-3 text-base font-black text-slate-900">Service Health</h3>
            <p className="mt-1 text-sm text-slate-600">Core service status is available from deployment and log monitors.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <Shield size={18} className="text-slate-700" />
            <h3 className="mt-3 text-base font-black text-slate-900">Security Posture</h3>
            <p className="mt-1 text-sm text-slate-600">Role-gated workflows are active for Admin, Doctor, and Patient surfaces.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <Activity size={18} className="text-slate-700" />
            <h3 className="mt-3 text-base font-black text-slate-900">Notification Pipeline</h3>
            <p className="mt-1 text-sm text-slate-600">In-app, SMS, and Email notification flow is centralized in notification-service.</p>
          </article>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;

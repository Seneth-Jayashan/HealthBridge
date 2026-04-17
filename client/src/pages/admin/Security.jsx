import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Lock,
  Clock
} from 'lucide-react';
import httpClient from '../../api/Axios';

// Define your microservices and their respective health check routes.
// Adjust the 'endpoint' paths based on how your API Gateway routes traffic to them.
const MICROSERVICES = [
  { id: 'api-gateway', name: 'API Gateway', endpoint: '/health' },
  { id: 'auth', name: 'Auth Service', endpoint: '/auth/health' },
  { id: 'doctor', name: 'Doctor Service', endpoint: '/doctors/health' },
  { id: 'patient', name: 'Patient Service', endpoint: '/patients/health' },
  { id: 'appointment', name: 'Appointment Service', endpoint: '/appointments/health' },
  { id: 'payment', name: 'Payment Service', endpoint: '/payments/health' },
  { id: 'notification', name: 'Notification Service', endpoint: '/notifications/health' },
  { id: 'telemedicine', name: 'Telemedicine Service', endpoint: '/telemedicine/health' }
];

const Security = () => {
  const [services, setServices] = useState(
    MICROSERVICES.map(s => ({ ...s, status: 'Checking', latency: 0 }))
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const checkSystemHealth = useCallback(async () => {
    setIsRefreshing(true);
    
    const healthChecks = MICROSERVICES.map(async (service) => {
      const startTime = Date.now();
      try {
        // Send a fast timeout so a dead service doesn't hang the whole dashboard
        await httpClient.get(service.endpoint, { timeout: 5000 });
        const latency = Date.now() - startTime;
        
        return {
          ...service,
          status: latency > 2000 ? 'Degraded' : 'Operational',
          latency
        };
      } catch (error) {
        return {
          ...service,
          status: 'Down',
          latency: 0,
          error: error.message
        };
      }
    });

    const results = await Promise.all(healthChecks);
    setServices(results);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, []);

  // Run on mount and set up an interval to poll every 30 seconds
  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, [checkSystemHealth]);

  // Calculate overall system status
  const downServices = services.filter(s => s.status === 'Down').length;
  const degradedServices = services.filter(s => s.status === 'Degraded').length;
  
  let overallStatus = 'Operational';
  let statusColor = 'text-emerald-600';
  let bannerBg = 'bg-emerald-50 border-emerald-200';

  if (downServices > 0) {
    overallStatus = 'Major Outage';
    statusColor = 'text-rose-600';
    bannerBg = 'bg-rose-50 border-rose-200';
  } else if (degradedServices > 0) {
    overallStatus = 'Degraded Performance';
    statusColor = 'text-amber-600';
    bannerBg = 'bg-amber-50 border-amber-200';
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Security & Health</h1>
          <p className="mt-1 text-slate-600">Monitor microservice uptime, latency, and system security.</p>
        </div>
        <button 
          onClick={checkSystemHealth}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-70"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? 'Pinging Servers...' : 'Refresh Status'}
        </button>
      </div>

      {/* Overall Status Banner */}
      <div className={`mt-8 flex items-center justify-between rounded-2xl border p-5 ${bannerBg}`}>
        <div className="flex items-center gap-4">
          <div className={`rounded-full bg-white p-3 shadow-sm ${statusColor}`}>
            {overallStatus === 'Operational' ? <ShieldCheck size={28} /> : <AlertTriangle size={28} />}
          </div>
          <div>
            <h2 className={`text-xl font-black ${statusColor}`}>System Status: {overallStatus}</h2>
            <p className="text-sm font-medium text-slate-700 mt-0.5">
              {downServices} offline, {degradedServices} degraded out of {services.length} total services.
            </p>
          </div>
        </div>
        {lastUpdated && (
          <div className="text-right text-sm font-semibold text-slate-500">
            Last checked:<br/>
            <span className="text-slate-700">{lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Microservices Grid */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-bold text-slate-900 flex items-center gap-2">
          <Server size={20} className="text-blue-600" /> Endpoint Health Matrix
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <article 
              key={service.id} 
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="font-bold text-slate-900">{service.name}</div>
                {service.status === 'Operational' && <CheckCircle2 size={20} className="text-emerald-500" />}
                {service.status === 'Degraded' && <AlertTriangle size={20} className="text-amber-500" />}
                {service.status === 'Down' && <XCircle size={20} className="text-rose-500" />}
                {service.status === 'Checking' && <RefreshCw size={20} className="text-slate-400 animate-spin" />}
              </div>
              
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  service.status === 'Operational' ? 'bg-emerald-100 text-emerald-700' :
                  service.status === 'Degraded' ? 'bg-amber-100 text-amber-700' :
                  service.status === 'Down' ? 'bg-rose-100 text-rose-700' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  {service.status}
                </span>
                
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Clock size={14} />
                  {service.latency > 0 ? `${service.latency}ms` : '--'}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Security Metrics (Static Placeholders for Future Implementation) */}
      <div className="mt-8 border-t border-slate-100 pt-8">
        <h3 className="mb-4 text-lg font-bold text-slate-900 flex items-center gap-2">
          <Lock size={20} className="text-blue-600" /> Active Security Posture
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-500">Failed Login Attempts (24h)</p>
            <p className="mt-2 text-2xl font-black text-slate-900">24</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-500">Active Admin Sessions</p>
            <p className="mt-2 text-2xl font-black text-slate-900">3</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-500">SSL/TLS Certificates</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-black text-emerald-600">
              <CheckCircle2 size={20} /> Valid & Secured
            </p>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Security;
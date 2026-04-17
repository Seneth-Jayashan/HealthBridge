import React, { useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import {
  BrainCircuit,
  Video,
  FileText,
  ShieldCheck,
  ArrowRight,
  HeartPulse,
  Star,
  UserPlus,
  Calendar,
  CheckCircle2,
  Activity,
  Stethoscope,
  Clock,
  MessageSquare,
  Globe2,
  ShieldAlert
} from 'lucide-react';

const Index = () => {
  const { isDark = false } = useOutletContext() || {};

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Choreographed Entry Timeline
    animate('.hb-fade-up', {
      y: [40, 0],
      opacity: [0, 1],
      ease: 'outExpo',
      duration: 1200,
      delay: stagger(100)
    });

    animate('.hb-mockup-card', {
      y: [60, 0],
      opacity: [0, 1],
      rotateX: [-15, 0],
      rotateY: [15, 0],
      scale: [0.9, 1],
      ease: 'outElastic(1, .8)',
      duration: 1500,
      delay: stagger(150, { start: 400 })
    });

    // Continuous float for the mockups
    animate('.hb-float', {
      y: [-12, 12],
      duration: 4000,
      ease: 'inOutSine',
      loop: true,
      alternate: true
    });

    animate('.hb-float-delayed', {
      y: [-8, 8],
      duration: 3500,
      ease: 'inOutSine',
      loop: true,
      alternate: true,
      delay: 1000
    });

  }, []);

  const features = [
    {
      icon: BrainCircuit,
      title: 'AI Clinical Triage',
      text: 'Our proprietary engine analyzes symptoms against millions of data points to ensure you see the right specialist, instantly.',
    },
    {
      icon: Video,
      title: 'Zero-Latency Telehealth',
      text: 'Encrypted, HD video consultations directly in your browser powered by WebRTC. No downloads required. Fully HIPAA compliant.',
    },
    {
      icon: FileText,
      title: 'Automated E-Prescriptions',
      text: 'Prescriptions are cryptographically verified and sent directly to your local pharmacy before your call even ends.',
    },
    {
      icon: ShieldCheck,
      title: 'Bank-Grade Security',
      text: 'Your health records are secured with AES-256 encryption, ensuring total privacy, data sovereignty, and regulatory compliance.',
    }
  ];

  const steps = [
    { icon: UserPlus, title: "Create Profile", desc: "Sign up securely and complete your digital medical history in under 2 minutes." },
    { icon: BrainCircuit, title: "AI Symptom Match", desc: "Tell us how you feel. Our AI matches you with an available, board-certified specialist." },
    { icon: Calendar, title: "Instant Consult", desc: "Book a specific time or join the live queue for an immediate HD video consultation." }
  ];

  return (
    <div className={`w-full overflow-hidden font-sans selection:bg-blue-500/30 ${isDark ? 'bg-[#0B1120]' : 'bg-[#FAFAFA]'}`}>
      
      {/* --- HERO SECTION --- */}
      <header className="relative w-full pt-20 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-blue-500/20 via-indigo-500/5 to-transparent blur-3xl -z-10 pointer-events-none rounded-full opacity-70" />
        
        <div className="mx-auto w-full max-w-7xl px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Hero Text */}
            <div className="relative z-10 max-w-2xl">
              <div className={`hb-fade-up mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest ${isDark ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'}`}>
                <HeartPulse size={16} className={isDark ? "text-red-400" : "text-red-500"} />
                The Future of Telemedicine
              </div>

              <h1 className={`hb-fade-up text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Exceptional Care. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400">Zero Waiting.</span>
              </h1>

              <p className={`hb-fade-up mt-6 text-lg sm:text-xl font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                HealthBridge connects you with top-tier, board-certified physicians instantly. We utilize advanced microservices to triage, connect, and prescribe with unprecedented speed and security.
              </p>

              <div className="hb-fade-up mt-10 flex flex-col sm:flex-row gap-4 items-center sm:items-stretch">
                <Link to="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-blue-600/40 active:scale-95">
                  Start Consultation <ArrowRight size={18} />
                </Link>
                <Link to="/login" className={`w-full sm:w-auto flex items-center justify-center rounded-2xl border px-8 py-4 font-bold transition-all hover:-translate-y-1 active:scale-95 ${isDark ? 'border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:shadow-md'}`}>
                  Patient Login
                </Link>
              </div>

              <div className="hb-fade-up mt-10 flex items-center gap-4 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className={`h-10 w-10 rounded-full border-2 bg-slate-200 ${isDark ? 'border-[#0B1120]' : 'border-[#FAFAFA]'} overflow-hidden shadow-sm`}>
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=doctor${i}&backgroundColor=e2e8f0`} alt="avatar" />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex text-amber-400 mb-0.5">
                    <Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/>
                  </div>
                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Trusted by 10,000+ Patients</span>
                </div>
              </div>
            </div>

            {/* Hero Visuals - Floating UI Mockups */}
            <div className="relative hidden lg:block h-[600px] perspective-1000">
              
              {/* Main Dashboard Mockup */}
              <div className={`hb-mockup-card absolute right-0 top-10 w-[400px] rounded-[2rem] border p-4 shadow-2xl ${isDark ? 'border-white/10 bg-[#131C31]/90 shadow-black/60 backdrop-blur-2xl' : 'border-white bg-white/80 shadow-blue-900/10 backdrop-blur-2xl'}`} style={{ transformStyle: 'preserve-3d' }}>
                {/* Mockup Header */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 dark:border-slate-700/50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">SJ</div>
                    <div>
                      <div className={`h-2.5 w-20 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                      <div className={`h-2 w-12 rounded-full mt-1.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  </div>
                </div>

                {/* Video Call Area */}
                <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-900 mb-4 shadow-inner">
                  <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80" alt="Doctor Consultation" className="object-cover w-full h-full opacity-90" />
                  
                  {/* PiP Patient Video */}
                  <div className="absolute top-3 right-3 w-20 h-28 rounded-xl overflow-hidden border-2 border-white/20 bg-slate-800 shadow-lg">
                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80" alt="Patient" className="object-cover w-full h-full opacity-90" />
                  </div>

                  {/* Controls */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><Video size={14} /></div>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">⋯</div>
                    <div className="w-10 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">End</div>
                  </div>
                </div>

                {/* Patient Vitals Mockup */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-1 text-rose-500">
                      <Activity size={14} /> <span className="text-[10px] font-bold uppercase tracking-wider">Heart Rate</span>
                    </div>
                    <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>82 <span className="text-xs text-slate-500 font-medium">bpm</span></div>
                  </div>
                  <div className={`p-3 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-1 text-blue-500">
                      <Stethoscope size={14} /> <span className="text-[10px] font-bold uppercase tracking-wider">Diagnosis</span>
                    </div>
                    <div className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>Analyzing...</div>
                  </div>
                </div>
              </div>

              {/* Floating Element 1: Secure Badge */}
              <div className={`hb-mockup-card hb-float absolute -left-4 top-24 w-48 rounded-2xl border p-4 shadow-xl z-20 ${isDark ? 'border-white/10 bg-[#1E293B] shadow-black/40' : 'border-slate-100 bg-white shadow-slate-200/50'}`}>
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-500"><ShieldCheck size={20} /></div>
                  <div>
                    <h5 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Connection</h5>
                    <p className={`font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Secured E2E</p>
                  </div>
                </div>
              </div>

              {/* Floating Element 2: Notification */}
              <div className={`hb-mockup-card hb-float-delayed absolute left-6 bottom-32 w-64 rounded-2xl border p-4 shadow-xl z-20 ${isDark ? 'border-white/10 bg-[#0F172A] shadow-black/40' : 'border-slate-100 bg-white shadow-blue-900/5'}`}>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 p-2 rounded-full text-white shadow-md shadow-blue-600/30 mt-1"><FileText size={14} /></div>
                  <div>
                    <h5 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>E-Prescription Ready</h5>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Amoxicillin 500mg has been securely routed to CVS Pharmacy (Main St).
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* --- TECH STACK / TRUSTED BY BANNER --- */}
      <section className={`border-y py-10 flex flex-col items-center justify-center ${isDark ? 'border-slate-800 bg-[#131C31]/50' : 'border-slate-200 bg-white'}`}>
        <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Powered by Enterprise Microservices</p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2"><Globe2 size={24} className="text-blue-500" /><span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Kubernetes</span></div>
          <div className="flex items-center gap-2"><BoxIcon size={24} className="text-sky-500" /><span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Docker</span></div>
          <div className="flex items-center gap-2"><ServerIcon size={24} className="text-green-500" /><span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Node.js</span></div>
          <div className="flex items-center gap-2"><DatabaseIcon size={24} className="text-emerald-500" /><span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>MongoDB</span></div>
          <div className="flex items-center gap-2"><CodeIcon size={24} className="text-cyan-400" /><span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>React</span></div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Patient Journey) --- */}
      <section className="mx-auto w-full max-w-7xl px-6 py-24 md:px-12">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className={`text-sm font-bold uppercase tracking-widest text-blue-500 mb-3`}>How It Works</h2>
          <h3 className={`text-3xl font-black md:text-5xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Care in Three Simple Steps</h3>
          <p className={`mt-6 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>We abstracted the complexity of traditional healthcare so you can focus entirely on your recovery.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Desktop connecting line */}
          <div className={`hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed ${isDark ? 'border-slate-800' : 'border-slate-200'} -z-10`}></div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative text-center group">
              <div className="mx-auto w-24 h-24 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 mb-8 transform transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-110 group-hover:shadow-blue-600/40 group-hover:bg-blue-500">
                <step.icon size={40} strokeWidth={1.5} />
              </div>
              <div className={`absolute top-0 right-1/2 translate-x-14 -translate-y-6 text-7xl font-black opacity-5 pointer-events-none transition-opacity duration-300 group-hover:opacity-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                0{idx + 1}
              </div>
              <h4 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h4>
              <p className={`font-medium leading-relaxed px-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- ENTERPRISE FEATURES --- */}
      <section className={`px-6 py-24 md:px-12 rounded-[3rem] mx-4 md:mx-8 lg:mx-12 mb-24 overflow-hidden relative ${isDark ? 'bg-[#131C31]' : 'bg-slate-900'}`}>
        
        {/* Background Gradients for the dark section */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent pointer-events-none"></div>

        <div className="mx-auto w-full max-w-7xl relative z-10">
          <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end border-b border-slate-700/50 pb-12">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2">
                <ServerIcon size={16} /> Platform Capabilities
              </p>
              <h3 className="text-4xl font-black md:text-6xl text-white tracking-tight leading-[1.1]">
                Engineered for <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">modern digital care.</span>
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
               <Link to="/register?role=doctor" className="w-full sm:w-auto text-center border border-slate-600 hover:border-slate-400 bg-slate-800/50 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:bg-slate-700 backdrop-blur-md">
                Join as a Provider
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <article
                key={idx}
                className="group rounded-3xl border border-slate-700/50 bg-slate-800/40 p-8 transition-all duration-300 hover:bg-slate-800 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50 backdrop-blur-md hover:border-slate-600"
              >
                <div className="mb-8 inline-flex rounded-2xl bg-blue-500/10 p-4 text-blue-400 border border-blue-500/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/20">
                  <feature.icon size={32} strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-bold text-white mb-4">{feature.title}</h4>
                <p className="leading-relaxed text-slate-400 font-medium text-sm group-hover:text-slate-300 transition-colors">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- DUAL SIDED MARKETPLACE / CTA --- */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-32 md:px-12">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Patient CTA */}
          <div className={`p-10 md:p-14 rounded-[2.5rem] border relative overflow-hidden group ${isDark ? 'bg-[#1E293B] border-slate-800' : 'bg-blue-50 border-blue-100'}`}>
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <UserPlus size={200} />
            </div>
            <div className="relative z-10">
              <h3 className={`text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Need a Doctor?</h3>
              <p className={`text-lg mb-10 max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Stop waiting in clinic lobbies. Get diagnosed, treated, and prescribed from the comfort of your bed.
              </p>
              <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                Register as Patient <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Doctor CTA */}
          <div className={`p-10 md:p-14 rounded-[2.5rem] border relative overflow-hidden group ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Stethoscope size={200} />
            </div>
            <div className="relative z-10">
              <h3 className={`text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Are you a Provider?</h3>
              <p className={`text-lg mb-10 max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Join our network of elite specialists. Manage your schedule, see patients remotely, and guarantee payments.
              </p>
              <Link to="/register?role=doctor" className={`inline-flex items-center gap-2 border-2 px-8 py-4 rounded-2xl font-bold transition-colors ${isDark ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-300 text-slate-800 hover:bg-white hover:border-slate-400'}`}>
                Apply to Network <ArrowRight size={18} />
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

// Helper mockup icons for the tech stack
const BoxIcon = ({size, className}) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className={className}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>);
const ServerIcon = ({size, className}) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className={className}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>);
const DatabaseIcon = ({size, className}) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className={className}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>);
const CodeIcon = ({size, className}) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className={className}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>);

export default Index;
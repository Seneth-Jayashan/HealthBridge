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
  CheckCircle2
} from 'lucide-react';

const Index = () => {
  const { isDark = false } = useOutletContext() || {};

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Choreographed Entry Timeline
    animate('.hb-fade-up', {
      y: [30, 0],
      opacity: [0, 1],
      ease: 'outExpo',
      duration: 1000,
      delay: stagger(100)
    });

    animate('.hb-mockup-card', {
      y: [40, 0],
      opacity: [0, 1],
      scale: [0.95, 1],
      ease: 'outElastic(1, .8)',
      duration: 1200,
      delay: stagger(150, { start: 400 })
    });

    // Continuous float for the mockups
    animate('.hb-float', {
      y: [-8, 8],
      duration: 3000,
      ease: 'inOutSine',
      loop: true,
      alternate: true
    });

    animate('.hb-float-delayed', {
      y: [-6, 6],
      duration: 3500,
      ease: 'inOutSine',
      loop: true,
      alternate: true,
      delay: 500
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
      text: 'Encrypted, HD video consultations directly in your browser. No downloads required. Fully HIPAA compliant.',
    },
    {
      icon: FileText,
      title: 'Automated E-Prescriptions',
      text: 'Prescriptions are cryptographically verified and sent directly to your local pharmacy before your call even ends.',
    },
    {
      icon: ShieldCheck,
      title: 'Bank-Grade Security',
      text: 'Your health records are secured with AES-256 encryption, ensuring total privacy and regulatory compliance.',
    }
  ];

  const steps = [
    { icon: UserPlus, title: "Create Profile", desc: "Sign up securely and complete your digital medical history in under 2 minutes." },
    { icon: BrainCircuit, title: "AI Symptom Match", desc: "Tell us how you feel. Our AI matches you with an available specialist." },
    { icon: Calendar, title: "Instant Consult", desc: "Book a time or join the live queue for an immediate HD video consultation." }
  ];

  return (
    <div className="w-full">
      
      {/* --- HERO SECTION --- */}
      <header className="relative mx-auto w-full max-w-7xl px-6 pt-12 pb-24 md:px-12 md:pt-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Hero Text */}
          <div className="relative z-10">
            <div className={`hb-fade-up mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <HeartPulse size={16} />
              The Future of Telemedicine
            </div>

            <h2 className={`hb-fade-up text-5xl font-black leading-[1.1] md:text-6xl lg:text-7xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Exceptional Care. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Zero Waiting.</span>
            </h2>

            <p className={`hb-fade-up mt-6 max-w-xl text-lg font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Connect with top-tier, board-certified physicians instantly. HealthBridge utilizes advanced AI microservices to triage, connect, and prescribe with unprecedented speed and security.
            </p>

            <div className="hb-fade-up mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1 hover:bg-blue-700">
                Start Consultation <ArrowRight size={18} />
              </Link>
              <div className="flex items-center gap-4 px-4 py-2">
                <div className="flex -space-x-3">
                  {[1,2,3].map((i) => (
                    <div key={i} className={`h-10 w-10 rounded-full border-2 bg-slate-200 ${isDark ? 'border-[#0B1120]' : 'border-white'} overflow-hidden`}>
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i}&backgroundColor=e2e8f0`} alt="avatar" />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex text-yellow-400"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/></div>
                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>500+ Doctors</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Visuals - Floating UI Mockups */}
          <div className="relative hidden lg:block h-[500px]">
            {/* Main Video Call Mockup */}
            <div className={`hb-mockup-card hb-float absolute right-10 top-10 w-80 rounded-3xl border p-2 shadow-2xl ${isDark ? 'border-white/10 bg-[#1E293B]/80 shadow-black/50 backdrop-blur-xl' : 'border-slate-200 bg-white/90 shadow-blue-900/10 backdrop-blur-xl'}`}>
              <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-800">
                <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80" alt="Doctor" className="object-cover w-full h-full opacity-80" />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <div className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Live
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Dr. Sarah Jenkins</h4>
                <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cardiology Specialist</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm">End Call</button>
                  <button className={`p-2.5 rounded-xl border ${isDark ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><FileText size={20}/></button>
                </div>
              </div>
            </div>

            {/* Floating Prescription Mockup */}
            <div className={`hb-mockup-card hb-float-delayed absolute left-0 bottom-20 w-64 rounded-2xl border p-4 shadow-xl ${isDark ? 'border-white/10 bg-[#0F172A] shadow-black/40' : 'border-slate-100 bg-white shadow-slate-200/50'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-500/20 p-2 rounded-lg text-green-500"><CheckCircle2 size={20} /></div>
                <h5 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>E-Prescription Sent</h5>
              </div>
              <div className={`text-xs p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/50 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                Amoxicillin 500mg has been securely routed to CVS Pharmacy (Main St).
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* --- TRUSTED BY BANNER --- */}
      <section className={`border-y py-8 flex flex-col items-center justify-center ${isDark ? 'border-white/5 bg-[#0B1120]/50' : 'border-slate-200 bg-white/50'}`}>
        <p className={`text-xs font-bold uppercase tracking-widest mb-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Powered by robust Microservices</p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale">
          <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Kubernetes</div>
          <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Docker</div>
          <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Node.js</div>
          <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>MongoDB</div>
          <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>React</div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Patient Journey) --- */}
      <section className="mx-auto w-full max-w-7xl px-6 py-24 md:px-12">
        <div className="text-center mb-16">
          <h3 className={`text-3xl font-black md:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>Care in Three Simple Steps</h3>
          <p className={`mt-4 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>We abstracted the complexity of healthcare so you can focus on healing.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Desktop connecting line */}
          <div className={`hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed ${isDark ? 'border-slate-800' : 'border-slate-200'} -z-10`}></div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative text-center">
              <div className="mx-auto w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 mb-6 transform transition hover:-translate-y-2">
                <step.icon size={40} strokeWidth={1.5} />
              </div>
              <div className="absolute top-0 right-1/2 translate-x-12 -translate-y-4 text-6xl font-black opacity-10 text-slate-500 pointer-events-none">0{idx + 1}</div>
              <h4 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h4>
              <p className={`font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- ENTERPRISE FEATURES --- */}
      <section className={`px-6 py-24 md:px-12 rounded-[3rem] mx-4 md:mx-12 mb-24 ${isDark ? 'bg-[#131C31]' : 'bg-slate-900'}`}>
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-2">Platform Capabilities</p>
              <h3 className="text-3xl font-black md:text-5xl text-white">Built for modern <br/>digital care.</h3>
            </div>
            <Link to="/register" className="border border-slate-700 hover:border-slate-500 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-colors">
              Explore Architecture
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <article
                key={idx}
                className="group rounded-3xl border border-slate-700/50 bg-slate-800/50 p-8 transition-all hover:bg-slate-800 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50 backdrop-blur-sm"
              >
                <div className="mb-6 inline-flex rounded-2xl bg-blue-500/10 p-4 text-blue-400 border border-blue-500/20 transition-transform group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white">
                  <feature.icon size={28} />
                </div>
                <h4 className="text-xl font-bold text-white">{feature.title}</h4>
                <p className="mt-4 leading-relaxed text-slate-400 font-medium">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Index;
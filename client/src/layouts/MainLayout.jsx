import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

// Import your reusable components
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = () => {
  // Manage Dark Mode state (defaults to false for the clinical white look)
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  // Sync with Tailwind's global 'dark' class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    // flex and flex-col ensure the page takes up the full height, 
    // and the footer gets pushed to the very bottom.
    <div className={`relative min-h-screen flex flex-col font-sans transition-colors duration-300 selection:bg-blue-200 selection:text-blue-900 ${isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'}`}>
      
      {/* Floating Theme Toggle (Great for testing your UI themes) */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-[999] flex h-12 w-12 items-center justify-center rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        title="Toggle Theme"
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      {/* 1. The Top Navigation */}
      <Navbar isDark={isDark} />

      {/* 2. The Main Page Content */}
      <main className="flex-grow">
        {/* The Outlet renders whatever page matches the URL (Index, Login, etc.)
            We pass down the context so those pages know what theme is active! */}
        <Outlet context={{ isDark, toggleTheme }} />
      </main>

      {/* 3. The Bottom Footer */}
      <Footer isDark={isDark} />
      
    </div>
  );
};

export default MainLayout;
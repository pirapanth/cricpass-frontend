import React, { useState } from 'react';
import {
  Search,
  ArrowLeftRight,
  UserPlus,
  UserCircle2,
  Menu,
  X,
  MessageSquare
} from 'lucide-react';
import cricPassLogo from '../assets/Cric Pass logo.svg';

export default function Navbar({ activeTab, setActiveTab, onOpenContactUs }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Master Admin is intentionally hidden from public navbar.
  // It is accessed securely via Team Admin login with 'cricpass' / 'cricpass@4599'.
  const navItems = [
    { id: 'search', label: 'Search Player', icon: Search },
    { id: 'transfer', label: 'Team Transfer', icon: ArrowLeftRight },
    { id: 'register', label: 'Register Player', icon: UserPlus },
    { id: 'team-admin', label: 'Team Admin', icon: UserCircle2 },
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div
            onClick={() => handleSelectTab('search')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 bg-slate-800/90 border border-emerald-500/40 flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-500/20 group-hover:scale-105 group-hover:border-emerald-400 transition-all duration-200">
              <img
                src={cricPassLogo}
                alt="CricPass Logo"
                className="w-full h-full object-contain scale-105"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  CricPass
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Cricket Player Registry & Transfer Protocol
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-800/60 p-1.5 rounded-xl border border-slate-700/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Global Contact Us Trigger */}
            {onOpenContactUs && (
              <button
                type="button"
                onClick={onOpenContactUs}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-teal-300 hover:text-white hover:bg-teal-900/30 border border-teal-500/20 transition-all cursor-pointer ml-1"
                title="Contact Support"
              >
                <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                <span>Contact Us</span>
              </button>
            )}
          </nav>

          {/* Connection Status indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-emerald-400 border-emerald-800/40 px-3 py-1.5 rounded-full">
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-3 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {onOpenContactUs && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContactUs();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-teal-300 hover:bg-teal-950/40 border border-teal-500/20 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <span>Contact Us & Support</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}

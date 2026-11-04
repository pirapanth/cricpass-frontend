import React, { useState } from 'react';
import Navbar from './components/Navbar';
import PlayerSearch from './components/PlayerSearch';
import TeamTransfer from './components/TeamTransfer';
import PlayerRegister from './components/PlayerRegister';
import TeamAdminPortal from './components/TeamAdminPortal';
import ContactUsModal from './components/ContactUsModal';
import { MessageSquare } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenContactUs={() => setShowContactModal(true)}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'search' && <PlayerSearch />}
        {activeTab === 'transfer' && <TeamTransfer />}
        {activeTab === 'register' && (
          <PlayerRegister onPlayerRegistered={() => setActiveTab('search')} />
        )}
        {activeTab === 'team-admin' && <TeamAdminPortal />}
      </main>

      {/* Global Floating Contact Us Trigger Button */}
      <button
        type="button"
        onClick={() => setShowContactModal(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold rounded-full shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-emerald-400/30 text-xs sm:text-sm backdrop-blur-sm"
        title="Open Support & Issue Reporting"
      >
        <MessageSquare className="w-4 h-4 text-white" />
        <span className="font-semibold tracking-wide">Contact Us</span>
      </button>

      {/* Contact Us Modal Dialog */}
      <ContactUsModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </div>
  );
}

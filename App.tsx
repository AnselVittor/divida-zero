import React, { useState, useEffect } from 'react';
import { Bill, DashboardStats, UserSettings } from './types';
import { Dashboard } from './components/Dashboard';
import { BillList } from './components/BillList';
import { CalendarView } from './components/CalendarView';
import { Profile } from './components/Profile';
import confetti from 'canvas-confetti';
import { LayoutDashboard, List, Calendar as CalendarIcon, WalletMinimal, User } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bills' | 'calendar' | 'profile'>('dashboard');
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    userName: '',
    monthlyIncome: 0
  });
  const [extraIncome, setExtraIncome] = useState<number>(0);

  // Calculate Stats
  const totalIncome = settings.monthlyIncome + extraIncome;
  
  const stats: DashboardStats = {
    totalPending: bills.filter(b => b.status === 'pending').length,
    totalPaid: bills.filter(b => b.status === 'paid').reduce((acc, curr) => acc + curr.value, 0),
    totalValue: bills.reduce((acc, curr) => acc + curr.value, 0),
    remainingValue: bills.filter(b => b.status === 'pending').reduce((acc, curr) => acc + curr.value, 0),
    percentComplete: 0,
    leftover: totalIncome - bills.reduce((acc, curr) => acc + curr.value, 0)
  };

  stats.percentComplete = stats.totalValue > 0 ? (stats.totalPaid / stats.totalValue) * 100 : 0;

  // Effects
  useEffect(() => {
    // Load from local storage (Simulation)
    const saved = localStorage.getItem('fin-bills');
    const savedSettings = localStorage.getItem('fin-settings');
    const savedExtra = localStorage.getItem('fin-extra-income');
    
    if (saved) setBills(JSON.parse(saved));
    
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      // If no username is set, force profile view
      if (!parsedSettings.userName) {
        setActiveTab('profile');
      }
    } else {
      // First time user, force profile
      setActiveTab('profile');
    }

    if (savedExtra) {
        setExtraIncome(Number(savedExtra));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fin-bills', JSON.stringify(bills));
    localStorage.setItem('fin-settings', JSON.stringify(settings));
    localStorage.setItem('fin-extra-income', extraIncome.toString());
  }, [bills, settings, extraIncome]);

  const addBill = (bill: Bill) => {
    setBills(prev => [...prev, bill]);
  };

  const updateBill = (bill: Bill) => {
    setBills(prev => prev.map(b => b.id === bill.id ? bill : b));
  };

  const deleteBill = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      setBills(prev => prev.filter(b => b.id !== id));
    }
  };

  const payBill = (id: string) => {
    setBills(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, status: 'paid' };
      }
      return b;
    }));

    // Trigger Confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#fcd34d']
    });

    // Optional: Show toast message
    const msg = document.createElement('div');
    msg.innerText = "Parabéns! Mais uma etapa concluída! 🎉";
    msg.className = "fixed top-10 right-10 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce z-50";
    document.body.appendChild(msg);
    setTimeout(() => document.body.removeChild(msg), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar / Mobile Nav */}
      <nav className="fixed bottom-0 w-full md:w-64 md:h-screen md:top-0 md:left-0 bg-white border-t md:border-r border-slate-200 z-40 flex md:flex-col justify-around md:justify-start p-2 md:p-6">
        <div className="hidden md:flex items-center gap-3 mb-10 px-2">
          <div className="bg-slate-900 text-white p-2 rounded-lg">
            <WalletMinimal size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Dívida Zero</h1>
        </div>

        <button 
          onClick={() => setActiveTab('dashboard')}
          disabled={!settings.userName} // Disable other tabs if no user
          className={`flex flex-col md:flex-row items-center md:gap-3 p-3 rounded-xl transition w-full ${activeTab === 'dashboard' ? 'bg-slate-100 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'} ${!settings.userName ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <LayoutDashboard size={22} />
          <span className="text-xs md:text-base mt-1 md:mt-0">Painel</span>
        </button>

        <button 
          onClick={() => setActiveTab('bills')}
          disabled={!settings.userName}
          className={`flex flex-col md:flex-row items-center md:gap-3 p-3 rounded-xl transition w-full ${activeTab === 'bills' ? 'bg-slate-100 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'} ${!settings.userName ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <List size={22} />
          <span className="text-xs md:text-base mt-1 md:mt-0">Minhas Contas</span>
        </button>

        <button 
          onClick={() => setActiveTab('calendar')}
          disabled={!settings.userName}
          className={`flex flex-col md:flex-row items-center md:gap-3 p-3 rounded-xl transition w-full ${activeTab === 'calendar' ? 'bg-slate-100 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'} ${!settings.userName ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <CalendarIcon size={22} />
          <span className="text-xs md:text-base mt-1 md:mt-0">Calendário</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col md:flex-row items-center md:gap-3 p-3 rounded-xl transition w-full ${activeTab === 'profile' ? 'bg-slate-100 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <User size={22} />
          <span className="text-xs md:text-base mt-1 md:mt-0">Perfil</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                {activeTab === 'dashboard' && `Olá, ${settings.userName || 'Visitante'}`}
                {activeTab === 'bills' && 'Gerenciar Contas'}
                {activeTab === 'calendar' && 'Calendário de Pagamentos'}
                {activeTab === 'profile' && 'Meu Perfil'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            
            <div 
              onClick={() => setActiveTab('profile')}
              className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 cursor-pointer hover:bg-indigo-200 transition"
            >
                {settings.userName ? settings.userName.charAt(0).toUpperCase() : 'U'}
            </div>
        </header>

        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats} 
            settings={settings} 
            extraIncome={extraIncome}
            onUpdateExtraIncome={setExtraIncome}
          />
        )}
        
        {activeTab === 'bills' && (
          <BillList 
            bills={bills}
            onAddBill={addBill}
            onUpdateBill={updateBill}
            onDeleteBill={deleteBill}
            onPayBill={payBill}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView bills={bills} />
        )}

        {activeTab === 'profile' && (
          <Profile 
            settings={settings}
            onUpdateSettings={setSettings}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
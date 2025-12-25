import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Bill, UserSettings } from './types';
import { Dashboard } from './components/Dashboard';
import { BillList } from './components/BillList';
import { CalendarView } from './components/CalendarView';
import { Profile } from './components/Profile';
import confetti from 'canvas-confetti';
import { LayoutDashboard, List, Calendar as CalendarIcon, WalletMinimal, User, LogOut, Lock } from 'lucide-react';

const App: React.FC = () => {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bills' | 'calendar' | 'profile'>('dashboard');
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    userName: '',
    monthlyIncome: 0
  });
  const [extraIncome, setExtraIncome] = useState<number>(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Storage Keys based on User ID
  const getStorageKey = (key: string) => {
      if (!user?.sub) return null;
      return `${user.sub}-${key}`;
  };

  // Load Data Effect
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
        const billsKey = getStorageKey('fin-bills');
        const settingsKey = getStorageKey('fin-settings');
        const extraKey = getStorageKey('fin-extra-income');

        if (billsKey) {
            const savedBills = localStorage.getItem(billsKey);
            if (savedBills) setBills(JSON.parse(savedBills));
            else setBills([]); // Reset if new user
        }

        if (settingsKey) {
            const savedSettings = localStorage.getItem(settingsKey);
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            } else {
                // Initialize defaults for new user
                setSettings({ userName: user.name || '', monthlyIncome: 0 });
                setActiveTab('profile');
            }
        }

        if (extraKey) {
            const savedExtra = localStorage.getItem(extraKey);
            if (savedExtra) setExtraIncome(Number(savedExtra));
            else setExtraIncome(0);
        }
        
        setDataLoaded(true);
    }
  }, [isAuthenticated, user]);

  // Save Data Effect
  useEffect(() => {
    if (isAuthenticated && user?.sub && dataLoaded) {
        const billsKey = getStorageKey('fin-bills');
        const settingsKey = getStorageKey('fin-settings');
        const extraKey = getStorageKey('fin-extra-income');

        if (billsKey) localStorage.setItem(billsKey, JSON.stringify(bills));
        if (settingsKey) localStorage.setItem(settingsKey, JSON.stringify(settings));
        if (extraKey) localStorage.setItem(extraKey, extraIncome.toString());
    }
  }, [bills, settings, extraIncome, isAuthenticated, user, dataLoaded]);

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

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#059669', '#34d399', '#064e3b']
    });

    const msg = document.createElement('div');
    msg.innerText = "Parabéns! Mais uma etapa concluída! 🎉";
    msg.className = "fixed top-10 right-10 bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce z-50";
    document.body.appendChild(msg);
    setTimeout(() => document.body.removeChild(msg), 3000);
  };

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
    );
  }

  if (!isAuthenticated) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-center p-8 animate-fadeIn">
                  <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                      <WalletMinimal size={40} />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">Dívida Zero</h1>
                  <p className="text-slate-500 mb-8">
                      Organize suas finanças, controle seus boletos e alcance a liberdade financeira.
                  </p>
                  
                  <div className="space-y-4">
                      <button 
                          onClick={() => loginWithRedirect()}
                          className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                      >
                          <Lock size={20} />
                          Entrar / Criar Conta
                      </button>
                      <p className="text-xs text-slate-400">
                          Seu progresso será salvo de forma segura.
                      </p>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar / Mobile Nav */}
      <nav className="fixed bottom-0 w-full md:w-64 md:h-screen md:top-0 md:left-0 bg-white border-t md:border-r border-slate-200 z-40 flex md:flex-col justify-around md:justify-start p-2 md:p-6">
        <div className="hidden md:flex items-center gap-3 mb-10 px-2">
          <div className="bg-emerald-900 text-white p-2 rounded-lg">
            <WalletMinimal size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-950">Dívida Zero</h1>
        </div>

        <div className="flex-1 md:space-y-2 flex md:block justify-around w-full">
            <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col md:flex-row items-center md:gap-3 p-3 rounded-xl transition w-full ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
            >
            <LayoutDashboard size={22} />
            <span className="text-xs md:text-base mt-1 md:mt-0">Painel</span>
            </button>

            <button 
            onClick={() => setActiveTab('bills')}
            className={`flex flex-col md:flex-row items-center md:gap-3 p-3 rounded-xl transition w-full ${activeTab === 'bills' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
            >
            <List size={22} />
            <span className="text-xs md:text-base mt-1 md:mt-0">Minhas Contas</span>
            </button>

            <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col md:flex-row items-center md:gap-3 p-3 rounded-xl transition w-full ${activeTab === 'calendar' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
            >
            <CalendarIcon size={22} />
            <span className="text-xs md:text-base mt-1 md:mt-0">Calendário</span>
            </button>

            <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col md:flex-row items-center md:gap-3 p-3 rounded-xl transition w-full ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
            >
            <User size={22} />
            <span className="text-xs md:text-base mt-1 md:mt-0">Perfil</span>
            </button>
        </div>

        {/* Desktop Logout Button */}
        <div className="hidden md:block pt-6 border-t border-slate-100 mt-auto">
             <button 
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="flex items-center gap-3 p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition w-full"
            >
                <LogOut size={20} />
                <span className="font-medium">Sair</span>
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                {activeTab === 'dashboard' && `Olá, ${settings.userName || user?.given_name || 'Visitante'}`}
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
              className="relative w-10 h-10 rounded-full border border-emerald-200 cursor-pointer hover:ring-2 hover:ring-emerald-300 transition overflow-hidden"
            >
                {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                        {settings.userName ? settings.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                )}
            </div>
        </header>

        {activeTab === 'dashboard' && (
          <Dashboard 
            settings={settings} 
            extraIncome={extraIncome}
            onUpdateExtraIncome={setExtraIncome}
            bills={bills}
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
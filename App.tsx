import React, { useState, useEffect } from 'react';
import { ClerkProvider, SignedIn, SignedOut, SignIn, UserButton, useUser } from '@clerk/clerk-react';
import { ptBR } from '@clerk/localizations';
import { Bill, UserSettings } from './types';
import { Dashboard } from './components/Dashboard';
import { BillList } from './components/BillList';
import { CalendarView } from './components/CalendarView';
import { Profile } from './components/Profile';
import { db, supabase } from './services/supabase'; // Importação do serviço Supabase
import confetti from 'canvas-confetti';
import { LayoutDashboard, List, Calendar as CalendarIcon, WalletMinimal, User, Loader2, Database } from 'lucide-react';

const AuthenticatedApp: React.FC = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bills' | 'calendar' | 'profile'>('dashboard');
  
  // Data States
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    userName: '',
    monthlyIncome: 0
  });
  const [extraIncome, setExtraIncome] = useState<number>(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load Data
  useEffect(() => {
    if (!isUserLoaded || !user) return;

    const loadData = async () => {
        setIsSyncing(true);
        const userId = user.id;

        // 1. Tenta carregar do Supabase se estiver configurado
        if (supabase) {
            try {
                const dbBills = await db.getBills(userId);
                const dbSettings = await db.getUserSettings(userId);

                if (dbBills) setBills(dbBills);
                if (dbSettings) {
                    setSettings(dbSettings.settings);
                    setExtraIncome(dbSettings.extraIncome);
                } else {
                    // Se não tiver settings no banco, tenta pegar o nome do Clerk
                    setSettings(prev => ({ ...prev, userName: user.firstName || '' }));
                }
                
                // Se conseguimos conectar, finaliza aqui
                setDataLoaded(true);
                setIsSyncing(false);
                return; 
            } catch (err) {
                console.error("Erro ao conectar Supabase, usando LocalStorage", err);
            }
        }

        // 2. Fallback para LocalStorage (Se Supabase não configurado ou erro)
        const billsKey = `fin-bills-${userId}`;
        const settingsKey = `fin-settings-${userId}`;
        const extraKey = `fin-extra-income-${userId}`;

        const savedBills = localStorage.getItem(billsKey);
        if (savedBills) setBills(JSON.parse(savedBills));

        const savedSettings = localStorage.getItem(settingsKey);
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        } else {
            setSettings(prev => ({ ...prev, userName: user.firstName || '' }));
        }

        const savedExtra = localStorage.getItem(extraKey);
        if (savedExtra) setExtraIncome(Number(savedExtra));
        
        setDataLoaded(true);
        setIsSyncing(false);
    };

    loadData();
  }, [isUserLoaded, user]);

  // Save Data Logic
  const saveData = async (newBills: Bill[], newSettings: UserSettings, newExtra: number) => {
      if (!user) return;
      const userId = user.id;

      // Update State
      setBills(newBills);
      setSettings(newSettings);
      setExtraIncome(newExtra);

      // Save to Supabase
      if (supabase) {
          // Salvamos de forma assíncrona sem bloquear a UI (Fire and Forget)
          db.saveUserSettings(userId, newSettings, newExtra);
          // Para bills, idealmente salvaríamos apenas o alterado, mas por simplicidade aqui salvamos no componente específico
      }

      // Save to LocalStorage (Always keep a local backup)
      localStorage.setItem(`fin-bills-${userId}`, JSON.stringify(newBills));
      localStorage.setItem(`fin-settings-${userId}`, JSON.stringify(newSettings));
      localStorage.setItem(`fin-extra-income-${userId}`, newExtra.toString());
  };

  const addBill = async (bill: Bill) => {
    const updatedBills = [...bills, bill];
    setBills(updatedBills); // UI Update instantâneo
    
    if (user) {
        localStorage.setItem(`fin-bills-${user.id}`, JSON.stringify(updatedBills));
        if (supabase) await db.saveBill(user.id, bill);
    }
  };

  const updateBill = async (bill: Bill) => {
    const updatedBills = bills.map(b => b.id === bill.id ? bill : b);
    setBills(updatedBills);

    if (user) {
        localStorage.setItem(`fin-bills-${user.id}`, JSON.stringify(updatedBills));
        if (supabase) await db.saveBill(user.id, bill);
    }
  };

  const deleteBill = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      const updatedBills = bills.filter(b => b.id !== id);
      setBills(updatedBills);

      if (user) {
          localStorage.setItem(`fin-bills-${user.id}`, JSON.stringify(updatedBills));
          if (supabase) await db.deleteBill(id);
      }
    }
  };

  const payBill = async (id: string) => {
    const targetBill = bills.find(b => b.id === id);
    if (!targetBill) return;

    const updatedBill = { ...targetBill, status: 'paid' as const };
    await updateBill(updatedBill);

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

  const handleUpdateSettings = (newSettings: UserSettings) => {
      saveData(bills, newSettings, extraIncome);
  };

  const handleUpdateExtra = (newExtra: number) => {
      saveData(bills, settings, newExtra);
  };

  if (!isUserLoaded || !dataLoaded) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
            <Loader2 className="animate-spin text-emerald-600 w-10 h-10" />
            <p className="text-slate-500 font-medium animate-pulse">Carregando suas finanças...</p>
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

        <div className="hidden md:flex flex-col gap-2 pt-4 border-t border-slate-100">
            {/* Database Indicator */}
            {supabase && (
                <div className="flex items-center gap-2 px-3 py-1 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] text-slate-400 font-medium">Supabase Conectado</span>
                </div>
            )}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                <UserButton afterSignOutUrl="/" showName />
                <div className="flex flex-col">
                     <span className="text-xs font-semibold text-slate-700">Conta</span>
                </div>
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                {activeTab === 'dashboard' && `Olá, ${settings.userName || user?.firstName || 'Visitante'}`}
                {activeTab === 'bills' && 'Gerenciar Contas'}
                {activeTab === 'calendar' && 'Calendário de Pagamentos'}
                {activeTab === 'profile' && 'Meu Perfil'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            
            {/* Mobile User Button */}
            <div className="md:hidden">
                <UserButton />
            </div>

            {/* Desktop Quick Profile Access */}
            <div className="hidden md:block relative w-10 h-10 cursor-pointer">
                <div className="absolute right-0">
                    <UserButton />
                </div>
            </div>
        </header>

        {activeTab === 'dashboard' && (
          <Dashboard 
            settings={settings} 
            extraIncome={extraIncome}
            onUpdateExtraIncome={handleUpdateExtra}
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
            onUpdateSettings={handleUpdateSettings}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        )}
      </main>
    </div>
  );
};

const App = () => {
    // CHAVE CLERK HARDCODED (Mantida conforme solicitado)
    const clerkPubKey = "pk_test_anVzdC1mYXduLTk3LmNsZXJrLmFjY291bnRzLmRldiQ";

    return (
        <ClerkProvider publishableKey={clerkPubKey} localization={ptBR}>
            <SignedOut>
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                    <div className="mb-8 text-center animate-fadeIn">
                         <div className="inline-flex bg-emerald-900 p-4 rounded-2xl mb-4 shadow-xl">
                            <WalletMinimal size={40} className="text-white" />
                         </div>
                         <h1 className="text-3xl font-bold text-slate-800">Dívida Zero</h1>
                         <p className="text-slate-500 mt-2">Organize suas finanças em um só lugar.</p>
                    </div>
                    <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-100">
                        <SignIn routing="hash" />
                    </div>
                </div>
            </SignedOut>
            <SignedIn>
                <AuthenticatedApp />
            </SignedIn>
        </ClerkProvider>
    );
};

export default App;
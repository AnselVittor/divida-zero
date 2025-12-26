import React, { useState, useEffect } from 'react';
import { Bill, UserSettings } from './types';
import { Dashboard } from './components/Dashboard';
import { BillList } from './components/BillList';
import { CalendarView } from './components/CalendarView';
import { Profile } from './components/Profile';
import { Auth } from './components/Auth';
import { supabase } from './services/supabase';
import confetti from 'canvas-confetti';
import { LayoutDashboard, List, Calendar as CalendarIcon, WalletMinimal, User, LogOut } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bills' | 'calendar' | 'profile'>('dashboard');
  
  // Data States
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    userName: '',
    monthlyIncome: 0
  });
  const [extraIncome, setExtraIncome] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Auth & Data Initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData(session.user.id);
      else {
          setBills([]);
          setSettings({ userName: '', monthlyIncome: 0 });
          setExtraIncome(0);
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async (userId: string) => {
      setLoading(true);
      try {
        // Fetch Settings (Profile)
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (profile) {
            setSettings({
                userName: profile.user_name || '',
                monthlyIncome: Number(profile.monthly_income) || 0
            });
        }

        // Fetch Bills
        const { data: billsData } = await supabase
            .from('bills')
            .select('*')
            .eq('user_id', userId);
        
        if (billsData) {
            const formattedBills: Bill[] = billsData.map((b: any) => ({
                id: b.id,
                title: b.title,
                value: Number(b.value),
                dueDate: b.due_date,
                status: b.status as 'pending' | 'paid',
                barcode: b.barcode,
                receiptAttachment: b.receipt_attachment,
                notificationSet: b.notification_set
            }));
            setBills(formattedBills);
        }

      } catch (error) {
          console.error("Error fetching data:", error);
      } finally {
          setLoading(false);
      }
  };

  const addBill = async (bill: Bill) => {
    if (!session) return;
    
    // Optimistic UI update
    setBills(prev => [...prev, bill]);

    // DB Update
    const { error } = await supabase.from('bills').insert({
        id: bill.id,
        user_id: session.user.id,
        title: bill.title,
        value: bill.value,
        due_date: bill.dueDate,
        status: bill.status,
        barcode: bill.barcode,
        receipt_attachment: bill.receiptAttachment,
        notification_set: bill.notificationSet
    });

    if (error) console.error("Error adding bill:", error);
  };

  const updateBill = async (bill: Bill) => {
    if (!session) return;

    setBills(prev => prev.map(b => b.id === bill.id ? bill : b));

    const { error } = await supabase.from('bills').update({
        title: bill.title,
        value: bill.value,
        due_date: bill.dueDate,
        status: bill.status,
        barcode: bill.barcode,
        receipt_attachment: bill.receiptAttachment,
        notification_set: bill.notificationSet
    }).eq('id', bill.id);

    if (error) console.error("Error updating bill:", error);
  };

  const deleteBill = async (id: string) => {
    if (!session) return;

    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      setBills(prev => prev.filter(b => b.id !== id));
      
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) console.error("Error deleting bill:", error);
    }
  };

  const payBill = async (id: string) => {
    if (!session) return;

    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    const updatedBill = { ...bill, status: 'paid' as const };

    setBills(prev => prev.map(b => b.id === id ? updatedBill : b));
    
    // DB Update
    await supabase.from('bills').update({ status: 'paid' }).eq('id', id);

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

  const handleUpdateSettings = async (newSettings: UserSettings) => {
      if (!session) return;
      
      setSettings(newSettings);

      // Check if profile exists
      const { data: existing } = await supabase.from('profiles').select('id').eq('id', session.user.id).single();

      if (existing) {
          await supabase.from('profiles').update({
              user_name: newSettings.userName,
              monthly_income: newSettings.monthlyIncome
          }).eq('id', session.user.id);
      } else {
          await supabase.from('profiles').insert({
              id: session.user.id,
              user_name: newSettings.userName,
              monthly_income: newSettings.monthlyIncome
          });
      }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-emerald-900 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
      );
  }

  if (!session) {
      return <Auth />;
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

        <div className="hidden md:block pt-4 border-t border-slate-100">
             <button 
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition w-full"
            >
                <LogOut size={20} />
                <span>Sair</span>
            </button>
        </div>
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
            
            <div className="flex items-center gap-4">
                 <button 
                    onClick={handleLogout}
                    className="md:hidden text-slate-400 hover:text-red-600 transition"
                    title="Sair"
                >
                    <LogOut size={24} />
                </button>
                <div 
                onClick={() => setActiveTab('profile')}
                className="relative w-10 h-10 rounded-full border border-emerald-200 cursor-pointer hover:ring-2 hover:ring-emerald-300 transition overflow-hidden"
                >
                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                        {settings.userName ? settings.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>
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
            onUpdateSettings={handleUpdateSettings}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
import React, { useState } from 'react';
import { UserSettings } from '../types';
import { User, Wallet, Save, MessageCircleHeart } from 'lucide-react';

interface ProfileProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onNavigateToDashboard: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ settings, onUpdateSettings, onNavigateToDashboard }) => {
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if it's the first time (old setting has no name)
    const isFirstTime = !settings.userName;

    onUpdateSettings(formData);
    setSaved(true);

    if (isFirstTime) {
      setShowWelcome(true);
    } else {
      setTimeout(() => {
        setSaved(false);
        onNavigateToDashboard();
      }, 1000);
    }
  };

  const getSalaryFeedback = (value: number) => {
    if (!value) return null;
    if (value <= 1600) return "Foco total na organização!";
    if (value <= 2000) return "Ótimo começo, vamos otimizar.";
    if (value <= 4000) return "Estabilidade à vista!";
    if (value >= 10000) return "Excelente potencial de investimento.";
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn relative pb-10">
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dados Financeiros</h2>
            <p className="text-slate-500">Personalize como o app te chama e sua base de cálculo.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Apelido / Nome de Exibição</label>
            <div className="relative">
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full pl-10 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="Seu nome"
                required
              />
              <User className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Renda Mensal (Salário Líquido)</label>
            <div className="relative">
              <input
                type="number"
                value={formData.monthlyIncome}
                onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                className="w-full pl-10 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="0,00"
                required
              />
              <Wallet className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
            </div>
            
            {/* Real-time Feedback */}
            {formData.monthlyIncome > 0 && (
                <div className="mt-2 text-sm font-medium text-emerald-600 animate-fadeIn">
                    {getSalaryFeedback(formData.monthlyIncome)}
                </div>
            )}
            
            <p className="text-xs text-slate-500 mt-2">Usado para calcular a projeção de sobra no painel.</p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full bg-emerald-900 text-white p-4 rounded-lg hover:bg-emerald-800 transition font-medium text-lg"
            >
              {saved ? <span className="text-emerald-200 font-bold">Salvo com Sucesso!</span> : (
                <>
                  <Save size={20} />
                  Salvar Preferências
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative transform transition-all scale-100">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full mb-2">
                <MessageCircleHeart size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Seja bem-vindo(a)!</h3>
              <p className="text-slate-600 leading-relaxed">
                Conta configurada com sucesso! Seus dados estão salvos neste dispositivo.
              </p>
              <button 
                onClick={() => {
                  setShowWelcome(false);
                  onNavigateToDashboard();
                }}
                className="w-full py-3 px-6 bg-emerald-900 text-white rounded-xl font-semibold hover:bg-emerald-800 transition mt-4"
              >
                Vamos começar!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
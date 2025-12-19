import React, { useState } from 'react';
    import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
    import { DashboardStats, UserSettings } from '../types';
    import { TrendingUp, Wallet, CheckCircle, AlertCircle, PlusCircle, X } from 'lucide-react';
    
    interface DashboardProps {
      stats: DashboardStats;
      settings: UserSettings;
      extraIncome: number;
      onUpdateExtraIncome: (val: number) => void;
    }
    
    const COLORS = ['#10b981', '#ef4444']; // Emerald (Paid), Red (Pending)
    
    export const Dashboard: React.FC<DashboardProps> = ({ stats, settings, extraIncome, onUpdateExtraIncome }) => {
      const [showExtraModal, setShowExtraModal] = useState(false);
      const [tempExtra, setTempExtra] = useState(extraIncome.toString());

      const data = [
        { name: 'Pago', value: stats.totalPaid },
        { name: 'Pendente', value: stats.totalPending },
      ];
    
      const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
      
      const totalAvailable = settings.monthlyIncome + extraIncome;

      const handleSaveExtra = () => {
          onUpdateExtraIncome(Number(tempExtra));
          setShowExtraModal(false);
      };
    
      return (
        <div className="space-y-6 animate-fadeIn relative">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 relative overflow-hidden group">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full z-10">
                <Wallet size={24} />
              </div>
              <div className="z-10 flex-1">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-500 font-medium">Renda Mensal Total</p>
                    <button 
                        onClick={() => setShowExtraModal(true)}
                        className="text-blue-600 hover:bg-blue-50 p-1 rounded-full transition"
                        title="Adicionar valor extra este mês"
                    >
                        <PlusCircle size={18} />
                    </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold text-slate-800">{formatCurrency(totalAvailable)}</p>
                </div>
                {extraIncome > 0 && (
                    <p className="text-xs text-emerald-600 font-medium">
                        + {formatCurrency(extraIncome)} extra
                    </p>
                )}
                {extraIncome === 0 && (
                    <p className="text-xs text-slate-400">Salário Base: {formatCurrency(settings.monthlyIncome)}</p>
                )}
              </div>
            </div>
    
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">A Pagar</p>
                <p className="text-xl font-bold text-rose-600">{formatCurrency(stats.remainingValue)}</p>
              </div>
            </div>
    
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Já Pago</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats.totalPaid)}</p>
              </div>
            </div>
    
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className={`p-3 rounded-full ${stats.leftover >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Projeção de Sobra</p>
                <p className={`text-xl font-bold ${stats.leftover >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.leftover)}
                </p>
              </div>
            </div>
          </div>
    
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Progresso de Pagamentos</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={[
                        { name: 'Total', value: stats.totalValue },
                        { name: 'Pago', value: stats.totalPaid }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                        {
                            [
                                { name: 'Total', value: stats.totalValue },
                                { name: 'Pago', value: stats.totalPaid }
                            ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#e2e8f0' : '#10b981'} />
                            ))
                        }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-sm text-slate-500 mt-2">
                Você já pagou {stats.percentComplete.toFixed(1)}% das suas dívidas.
              </p>
            </div>
    
            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Distribuição</h3>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Extra Income Modal */}
          {showExtraModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">Adicionar Renda Extra</h3>
                        <button onClick={() => setShowExtraModal(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-slate-600">
                            Recebeu um valor inesperado este mês? Adicione aqui para recalcular sua sobra sem alterar seu salário fixo.
                        </p>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Extra</label>
                            <input 
                                type="number" 
                                value={tempExtra} 
                                onChange={(e) => setTempExtra(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-semibold text-indigo-600"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => {
                                    setTempExtra('0');
                                    onUpdateExtraIncome(0);
                                    setShowExtraModal(false);
                                }}
                                className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
                            >
                                Limpar
                            </button>
                            <button 
                                onClick={handleSaveExtra}
                                className="flex-1 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>
      );
    };
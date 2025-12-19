import React, { useState } from 'react';
    import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
    import { DashboardStats, UserSettings, Bill } from '../types';
    import { TrendingUp, Wallet, CheckCircle, AlertCircle, PlusCircle, X, Check, Clock } from 'lucide-react';
    
    interface DashboardProps {
      stats: DashboardStats;
      settings: UserSettings;
      extraIncome: number;
      onUpdateExtraIncome: (val: number) => void;
      bills: Bill[];
    }
    
    const COLORS = ['#10b981', '#ef4444']; // Emerald (Paid), Red (Pending)
    
    export const Dashboard: React.FC<DashboardProps> = ({ stats, settings, extraIncome, onUpdateExtraIncome, bills }) => {
      const [showExtraModal, setShowExtraModal] = useState(false);
      const [tempExtra, setTempExtra] = useState(extraIncome.toString());

      const data = [
        { name: 'Pago', value: stats.totalPaid },
        { name: 'Pendente', value: stats.totalPending },
      ];
    
      const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

      const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
      };
      
      const totalAvailable = settings.monthlyIncome + extraIncome;

      const handleSaveExtra = () => {
          onUpdateExtraIncome(Number(tempExtra));
          setShowExtraModal(false);
      };

      // Filter Current Month Bills
      const today = new Date();
      const currentMonthIndex = today.getMonth(); // 0-based
      const currentYear = today.getFullYear();

      const currentMonthBills = bills.filter(b => {
        const [y, m] = b.dueDate.split('-').map(Number);
        // m is 1-based from string split
        return y === currentYear && (m - 1) === currentMonthIndex;
      }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(today);
      const displayMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    
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
    
          {/* Main Content Row: Chart + List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Pie Chart Column (1/3 width on desktop) */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Distribuição de Gastos</h3>
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
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Current Month Bills List Column (2/3 width on desktop) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="text-lg font-bold text-slate-800">Contas de {displayMonth}</h3>
                   <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                       {currentMonthBills.length} contas
                   </span>
               </div>
               
               <div className="overflow-x-auto flex-1">
                   {currentMonthBills.length > 0 ? (
                      <table className="w-full text-left">
                          <thead>
                              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold tracking-wider">
                                  <th className="p-4">Vencimento</th>
                                  <th className="p-4">Descrição</th>
                                  <th className="p-4">Valor</th>
                                  <th className="p-4 text-center">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                              {currentMonthBills.map(bill => (
                                  <tr key={bill.id} className={`hover:bg-slate-50 transition ${bill.status === 'paid' ? 'opacity-60' : ''}`}>
                                      <td className="p-4 text-slate-600 font-medium whitespace-nowrap">
                                          {formatDate(bill.dueDate)}
                                      </td>
                                      <td className="p-4 text-slate-800 font-semibold">
                                          {bill.title}
                                      </td>
                                      <td className={`p-4 font-bold whitespace-nowrap ${bill.status === 'paid' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                          {formatCurrency(bill.value)}
                                      </td>
                                      <td className="p-4 text-center">
                                          {bill.status === 'paid' ? (
                                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">
                                                  <Check size={12} /> Pago
                                              </span>
                                          ) : (
                                              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-bold">
                                                  <Clock size={12} /> Pendente
                                              </span>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                   ) : (
                       <div className="p-8 text-center text-slate-400 h-full flex items-center justify-center">
                           <p>Nenhuma conta encontrada para {displayMonth.toLowerCase()}.</p>
                       </div>
                   )}
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
import React from 'react';
import { Bill } from '../types';

interface CalendarViewProps {
  bills: Bill[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ bills }) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const getDayBills = (day: number) => {
    return bills.filter(b => {
      const bDate = new Date(b.dueDate + 'T12:00:00'); // Normalize timezone issues roughly
      return bDate.getDate() === day && 
             bDate.getMonth() === currentDate.getMonth() && 
             bDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">Anterior</button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">Próximo</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="text-center text-sm font-semibold text-slate-400 uppercase">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/50 rounded-lg" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayBills = getDayBills(day);
          const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

          return (
            <div 
              key={day} 
              className={`min-h-[100px] p-2 rounded-lg border transition ${
                isToday ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>{day}</span>
              </div>
              <div className="mt-2 space-y-1">
                {dayBills.map(bill => (
                  <div 
                    key={bill.id} 
                    className={`text-xs p-1 rounded truncate ${
                      bill.status === 'paid' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : (new Date(bill.dueDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700')
                    }`}
                    title={`${bill.title} - R$ ${bill.value}`}
                  >
                    {bill.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex gap-4 mt-6 text-sm text-slate-500 justify-center">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-100 rounded-full"></div>Pago</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-100 rounded-full"></div>Pendente</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 rounded-full"></div>Atrasado</div>
      </div>
    </div>
  );
};

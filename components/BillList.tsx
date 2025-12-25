import React, { useState, useRef } from 'react';
import { Bill } from '../types';
import { Trash2, Check, FileText, Bell, Paperclip, Upload, Download, Copy, Repeat } from 'lucide-react';

interface BillListProps {
  bills: Bill[];
  onAddBill: (bill: Bill) => void;
  onUpdateBill: (bill: Bill) => void;
  onDeleteBill: (id: string) => void;
  onPayBill: (id: string) => void;
}

export const BillList: React.FC<BillListProps> = ({
  bills,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
  onPayBill
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [selectedBillIdForReceipt, setSelectedBillIdForReceipt] = useState<string | null>(null);

  const [newBill, setNewBill] = useState({
    title: '',
    value: 0,
    dueDate: '',
    isRecurring: false,
    recurrenceCount: 12
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBill.title || !newBill.value || !newBill.dueDate) return;

    const baseDate = new Date(newBill.dueDate);
    const billsToAdd = [];

    // Logic for single or recurring bills
    const count = newBill.isRecurring ? newBill.recurrenceCount : 1;

    for (let i = 0; i < count; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setMonth(baseDate.getMonth() + i);
        // Handle month overflow edge cases (e.g. Jan 31 -> Feb 28)
        if (currentDate.getDate() !== baseDate.getDate()) {
            currentDate.setDate(0);
        }

        billsToAdd.push({
            id: crypto.randomUUID(),
            title: newBill.isRecurring ? `${newBill.title} (${i + 1}/${count})` : newBill.title,
            value: Number(newBill.value),
            dueDate: currentDate.toISOString().split('T')[0],
            status: 'pending' as const,
            notificationSet: false
        });
    }

    billsToAdd.forEach(bill => onAddBill(bill));

    setNewBill({ 
        title: '', 
        value: 0, 
        dueDate: '', 
        isRecurring: false, 
        recurrenceCount: 12 
    });
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        alert("Por favor, salve sua planilha como arquivo CSV antes de importar.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/);
        
        // Detect delimiter (naive check on first valid line)
        const firstLine = lines.find(l => l.trim().length > 0) || '';
        // If semicolon count > comma count, likely semicolon (common in BR)
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        const commaCount = (firstLine.match(/,/g) || []).length;
        const delimiter = semicolonCount >= commaCount ? ';' : ',';

        // Headers normalization map to identify columns
        const headerMap: {[key: string]: string[]} = {
            title: ['descricao', 'descrição', 'título', 'titulo', 'nome', 'loja', 'estabelecimento', 'historico'],
            value: ['valor', 'preço', 'preco', 'total', 'quantia', 'debito'],
            dueDate: ['vencimento', 'data', 'dia', 'dt_venc', 'venc'],
            barcode: ['codigo', 'código', 'barras', 'linha', 'boleto']
        };

        // Default indices (Standard: Desc, Value, Date, Barcode)
        let indices: {[key: string]: number} = { title: 0, value: 1, dueDate: 2, barcode: 3 };
        let startIndex = 0;

        // Intelligent Header Detection
        for(let i=0; i<Math.min(10, lines.length); i++) {
             const line = lines[i].toLowerCase();
             const columns = line.split(delimiter).map(c => c.trim().replace(/^['"]|['"]$/g, ''));
             
             // Check if this line looks like a header
             const foundTitle = columns.findIndex(c => headerMap.title.some(h => c.includes(h)));
             const foundValue = columns.findIndex(c => headerMap.value.some(h => c.includes(h)));
             const foundDate = columns.findIndex(c => headerMap.dueDate.some(h => c.includes(h)));

             if (foundTitle !== -1 || foundValue !== -1 || foundDate !== -1) {
                 if (foundTitle !== -1) indices.title = foundTitle;
                 if (foundValue !== -1) indices.value = foundValue;
                 if (foundDate !== -1) indices.dueDate = foundDate;
                 
                 const foundBarcode = columns.findIndex(c => headerMap.barcode.some(h => c.includes(h)));
                 if (foundBarcode !== -1) indices.barcode = foundBarcode;
                 
                 startIndex = i + 1; // Start data after header
                 break;
             }
        }

        let addedCount = 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const columns = line.split(delimiter).map(c => c.trim().replace(/^['"]|['"]$/g, ''));
            
            if (columns.length < 2) continue; // Skip malformed lines

            const title = columns[indices.title] || 'Conta Importada';
            const valueStr = columns[indices.value];
            const dateStr = columns[indices.dueDate];
            const barcode = columns[indices.barcode] || '';

            if (!title || !valueStr || !dateStr) continue;

            // Parse Value (Handle R$, dots and commas for BR vs US)
            let value = 0;
            try {
                let cleanValue = valueStr.replace(/[R$\s]/g, '');
                
                // Heuristic: If comma is after dot, or comma exists but no dot -> BR format (1.000,00 or 100,00)
                // If dot is after comma -> US format (1,000.00)
                const lastDotIndex = cleanValue.lastIndexOf('.');
                const lastCommaIndex = cleanValue.lastIndexOf(',');

                if (lastCommaIndex > lastDotIndex) {
                    // BR Format: 1.234,56 -> remove dots, replace comma with dot
                    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
                } else if (lastCommaIndex !== -1 && lastDotIndex === -1) {
                    // BR Format simple: 100,50 -> 100.50
                    cleanValue = cleanValue.replace(',', '.');
                } else {
                     // US Format or Clean: 1,234.56 or 1234.56 -> remove commas
                     cleanValue = cleanValue.replace(/,/g, '');
                }
                
                value = parseFloat(cleanValue);
            } catch (e) {
                continue;
            }

            // Parse Date (Handle DD/MM/YYYY or YYYY-MM-DD)
            let dueDate = '';
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                // Assume DD/MM/YYYY for slash format
                if (parts.length === 3) {
                     // Check if first part looks like year (YYYY/MM/DD) vs (DD/MM/YYYY)
                    if (parts[0].length === 4) {
                         dueDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
                    } else {
                         dueDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }
            } else {
                // Assume ISO YYYY-MM-DD
                dueDate = dateStr;
            }

            // Basic validation
            if (!isNaN(value) && dueDate.length >= 8 && title.length > 0) {
                 onAddBill({
                    id: crypto.randomUUID(),
                    title,
                    value,
                    dueDate,
                    status: 'pending',
                    barcode,
                    notificationSet: false
                });
                addedCount++;
            }
        }

        if (addedCount > 0) {
            alert(`${addedCount} contas importadas com sucesso!`);
        } else {
            alert("Não foi possível importar contas. Verifique o formato do CSV (esperado: Descrição; Valor; Vencimento).");
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBillIdForReceipt) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        const bill = bills.find(b => b.id === selectedBillIdForReceipt);
        if (bill) {
            onUpdateBill({ ...bill, receiptAttachment: base64String });
        }
        setSelectedBillIdForReceipt(null);
    }
    reader.readAsDataURL(file);
  };

  const toggleNotification = (bill: Bill) => {
      if (!bill.notificationSet) {
          alert(`Lembrete definido! Você será notificado 3 dias antes de ${bill.dueDate}`);
      }
      onUpdateBill({...bill, notificationSet: !bill.notificationSet});
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
  }

  return (
    <div className="space-y-6">
      {/* Input Area */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Adicionar Contas
                </h3>
                <p className="text-xs text-slate-500 mt-1">Insira manualmente ou importe de uma planilha CSV.</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8,Descricao;Valor;Vencimento;CodigoBarras\nEnergia;150,50;10/12/2024;\nInternet;99,90;15/12/2024;";
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "modelo_divida_zero.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition text-sm"
                >
                    <Download className="w-4 h-4"/>
                    Modelo CSV
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
                >
                    <Upload className="w-4 h-4"/>
                    Importar Planilha
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv,.txt" 
                    onChange={handleCSVUpload}
                />
            </div>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Descrição</label>
                <input
                    type="text"
                    placeholder="Ex: Aluguel"
                    value={newBill.title}
                    onChange={e => setNewBill({ ...newBill, title: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Valor</label>
                <input
                    type="number"
                    placeholder="0.00"
                    value={newBill.value || ''}
                    onChange={e => setNewBill({ ...newBill, value: Number(e.target.value) })}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    step="0.01"
                    required
                />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">1º Vencimento</label>
                <input
                    type="date"
                    value={newBill.dueDate}
                    onChange={e => setNewBill({ ...newBill, dueDate: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
             <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="recurring"
                    checked={newBill.isRecurring}
                    onChange={e => setNewBill({...newBill, isRecurring: e.target.checked})}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-slate-500"/>
                    Repetir pagamento (Parcelado/Mensal)
                </label>
             </div>
             
             {newBill.isRecurring && (
                 <div className="flex items-center gap-2 animate-fadeIn">
                    <span className="text-sm text-slate-600">por</span>
                    <input 
                        type="number" 
                        min="2" 
                        max="360"
                        value={newBill.recurrenceCount}
                        onChange={e => setNewBill({...newBill, recurrenceCount: Number(e.target.value)})}
                        className="w-20 p-2 text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="text-sm text-slate-600">meses</span>
                 </div>
             )}

             <button
                type="submit"
                className="ml-auto bg-emerald-900 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-800 transition font-medium w-full md:w-auto"
            >
                Adicionar Conta(s)
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Vencimento</th>
                <th className="p-4 font-semibold">Descrição</th>
                <th className="p-4 font-semibold">Valor</th>
                <th className="p-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map((bill) => (
                <tr key={bill.id} className={`hover:bg-slate-50 transition group ${bill.status === 'paid' ? 'opacity-60 bg-slate-50' : ''}`}>
                  <td className="p-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        {formatDate(bill.dueDate)}
                        {bill.status === 'pending' && new Date(bill.dueDate) < new Date() && (
                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Atrasado</span>
                        )}
                      </div>
                  </td>
                  <td className="p-4 text-slate-800 font-semibold">
                    {bill.title}
                    {bill.barcode && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 font-mono">
                            <span className="truncate max-w-[150px]">{bill.barcode}</span>
                            <button 
                                onClick={() => navigator.clipboard.writeText(bill.barcode || '')}
                                className="hover:text-emerald-500"
                                title="Copiar código de barras"
                            >
                                <Copy size={12} />
                            </button>
                        </div>
                    )}
                  </td>
                  <td className={`p-4 font-bold ${bill.status === 'paid' ? 'text-emerald-600 decoration-emerald-600' : 'text-slate-800'}`}>
                    {formatCurrency(bill.value)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {bill.status === 'pending' ? (
                        <button
                          onClick={() => onPayBill(bill.id)}
                          className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition"
                          title="Dar baixa"
                        >
                          <Check size={18} />
                        </button>
                      ) : (
                          <div className="p-2 text-emerald-600 font-bold text-sm bg-emerald-50 rounded-lg">Pago</div>
                      )}

                      <button
                        onClick={() => toggleNotification(bill)}
                        className={`p-2 rounded-lg transition ${bill.notificationSet ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                        title="Notificar vencimento"
                      >
                        <Bell size={18} />
                      </button>

                      <div className="relative">
                          <button
                            onClick={() => {
                                if (bill.receiptAttachment) {
                                    const win = window.open();
                                    win?.document.write(`<iframe src="${bill.receiptAttachment}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                } else {
                                    setSelectedBillIdForReceipt(bill.id);
                                    receiptInputRef.current?.click();
                                }
                            }}
                            className={`p-2 rounded-lg transition ${bill.receiptAttachment ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                            title={bill.receiptAttachment ? "Ver Comprovante" : "Anexar Comprovante"}
                          >
                            <Paperclip size={18} />
                          </button>
                      </div>

                      <button
                        onClick={() => onDeleteBill(bill.id)}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition opacity-0 group-hover:opacity-100"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Nenhum boleto cadastrado. Adicione manualmente ou importe um CSV.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Hidden input for receipt upload attached to specific bill context */}
      <input 
          type="file" 
          ref={receiptInputRef} 
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleReceiptUpload}
      />
    </div>
  );
};
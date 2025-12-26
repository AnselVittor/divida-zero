import { createClient } from '@supabase/supabase-js';
import { Bill, UserSettings } from '../types';

// Configuração do Supabase (Chaves inseridas diretamente)
const supabaseUrl = "https://nrklfdkpqjpatpnyecrt.supabase.co";
const supabaseKey = "sb_publishable_WDZxNoSuiUmf9rcycCCXow_4mgLhsQl";

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- Funções Auxiliares para Banco de Dados ---

export const db = {
  // Configurações do Usuário
  async getUserSettings(userId: string): Promise<{ settings: UserSettings, extraIncome: number } | null> {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      settings: {
        userName: data.user_name,
        monthlyIncome: Number(data.monthly_income)
      },
      extraIncome: Number(data.extra_income || 0)
    };
  },

  async saveUserSettings(userId: string, settings: UserSettings, extraIncome: number) {
    if (!supabase) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        user_name: settings.userName,
        monthly_income: settings.monthlyIncome,
        extra_income: extraIncome
      }, { onConflict: 'user_id' });

    if (error) console.error('Erro ao salvar configurações:', error);
  },

  // Contas (Bills)
  async getBills(userId: string): Promise<Bill[] | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao buscar contas:', error);
      return null;
    }

    // Mapeia do formato snake_case (banco) para camelCase (app)
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      value: Number(item.value),
      dueDate: item.due_date,
      status: item.status as 'pending' | 'paid',
      barcode: item.barcode,
      notificationSet: item.notification_set,
      receiptAttachment: item.receipt_attachment
    }));
  },

  async saveBill(userId: string, bill: Bill) {
    if (!supabase) return;

    const { error } = await supabase
      .from('bills')
      .upsert({
        id: bill.id,
        user_id: userId,
        title: bill.title,
        value: bill.value,
        due_date: bill.dueDate,
        status: bill.status,
        barcode: bill.barcode,
        notification_set: bill.notificationSet,
        receipt_attachment: bill.receiptAttachment
      });

    if (error) console.error('Erro ao salvar conta:', error);
  },

  async deleteBill(billId: string) {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', billId);

    if (error) console.error('Erro ao deletar conta:', error);
  }
};
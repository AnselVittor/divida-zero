import { createClient } from '@supabase/supabase-js';

// Assegure-se de definir estas variáveis no seu ambiente (.env ou painel do Netlify)
// Formato no .env:
// SUPABASE_URL=https://seu-projeto.supabase.co
// SUPABASE_KEY=sua-chave-anon-publica

const supabaseUrl = process.env.SUPABASE_URL=https://nrklfdkpqjpatpnyecrt.supabase.co;
const supabaseKey = process.env.SUPABASE_KEY=sb_publishable_WDZxNoSuiUmf9rcycCCXow_4mgLhsQl;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL e Key são obrigatórios. Verifique seu arquivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
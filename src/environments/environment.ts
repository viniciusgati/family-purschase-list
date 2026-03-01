// Configuração do Supabase
// Para desenvolvimento, crie um arquivo .env.local com as seguintes variáveis:
// SUPABASE_URL=https://seu-projeto.supabase.co
// SUPABASE_ANONKEY=sua-chave
//
// Ou configure manualmente abaixo para desenvolvimento local

export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANONKEY',
  },
};

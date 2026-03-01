// Configuração de desenvolvimento
// Este arquivo é usado automaticamente em modo desenvolvimento
// Para desenvolvimento local com credenciais reais, use:
// 1. Copie .env.local.example para .env.local
// 2. Execute: npm run start:local

export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANONKEY',
  },
};

# 🛒 Family Purchase List

Aplicativo PWA para controle de compras e orçamento familiar. Cada membro da família possui suas próprias listas de compras com prioridades, fotos e links de onde comprar.

## 🛠️ Stack

| Tecnologia | Uso |
|-----------|-----|
| **Angular 19** | Framework frontend com standalone components e signals |
| **Angular Material** | Componentes UI mobile-first |
| **Angular CDK** | Drag-and-drop para reordenar prioridades |
| **Supabase** | Backend (PostgreSQL, Auth, Storage, Realtime) |
| **Chart.js + ng2-charts** | Gráficos de relatórios de orçamento |
| **@angular/pwa** | Service Worker e manifest para PWA |

## 🔐 Variáveis de Ambiente e Credenciais do Supabase

### Sobre a Anonymous Key

No Supabase, a **anon key** é uma chave pública destinada ao uso no frontend. Diferente de apps tradicionais com backend dedicado, o Supabase usa **RLS (Row Level Security)** para proteger os dados no nível do banco de dados.

- ✅ A `anonKey` **pode** estar no código frontend
- ❌ A `service_role` key **não deve** ser usada no frontend
- ✅ A segurança vem do RLS configurado em `supabase/schema.sql`

### Configuração

**Desenvolvimento:**
1. Copie o template: `cp .env.local.example .env.local`
2. Preencha com suas credenciais do Supabase:
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANONKEY=sua-chave-anon
   ```
3. Execute: `npm run start:local`

**Produção:**
Configure as variáveis de ambiente no painel do seu servidor de deploy (Vercel/Netlify):
- `SUPABASE_URL`
- `SUPABASE_ANONKEY`

O Angular substitui essas variáveis em tempo de build.

**Nota:** Os arquivos `src/environments/environment.local.ts` e `.env.local` estão no `.gitignore` e não serão commitados.

## 📱 Funcionalidades

- ✅ **Login com Google** via Supabase Auth
- ✅ **Grupos familiares** com código de convite
- ✅ **Listas de compras** pessoais e compartilhadas
- ✅ **Itens com prioridade** reordenáveis via drag-and-drop
- ✅ **Upload de fotos** dos itens
- ✅ **Links de lojas** para cada item
- ✅ **Orçamento mensal** com categorias
- ✅ **Registro de gastos** com relatórios
- ✅ **PWA instalável** com suporte offline

## 🚀 Setup

### Pré-requisitos

- Node.js 18+
- npm 9+
- Conta no [Supabase](https://supabase.com)

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd family-purchase-list
npm install
```

### 2. Configurar Supabase

1. Crie um projeto no [Supabase Dashboard](https://app.supabase.com)
2. Execute o script SQL em `supabase/schema.sql` no SQL Editor
3. Configure a autenticação Google:
   - Vá em **Authentication > Providers > Google**
   - Adicione seu Google Client ID e Secret
   - Configure o redirect URL: `https://SEU-PROJETO.supabase.co/auth/v1/callback`
4. Copie a URL e Anon Key do projeto

### 3. Configurar variáveis de ambiente

O projeto suporta diferentes ambientes de configuração:

**Para desenvolvimento (padrão):**
Edite `src/environments/environment.development.ts` com suas credenciais do Supabase:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://SEU-PROJETO.supabase.co',
    anonKey: 'SUA-ANON-KEY',
  },
};
```

**Nota:** A anon key é pública e pode estar no código. A segurança vem do RLS no banco Supabase.

### 4. Rodar em desenvolvimento

```bash
npm start
```

Acesse `http://localhost:4200`

### 5. Build para produção

```bash
npm run build
```

Os arquivos serão gerados em `dist/family-purchase-list/`

## 📁 Estrutura do Projeto

```
src/app/
├── core/                    # Serviços e modelos globais
│   ├── guards/              # Auth guard
│   ├── models/              # Interfaces TypeScript
│   └── services/            # Supabase, Auth, Config
├── features/                # Módulos de funcionalidades
│   ├── auth/                # Login e callback
│   ├── budget/              # Orçamento e gastos
│   ├── family/              # Dashboard da família
│   ├── items/               # Formulário de itens
│   ├── lists/               # Listas de compras
│   └── profile/             # Perfil do usuário
└── shared/                  # Componentes compartilhados
    └── components/          # Bottom nav, etc.
```

## ⚙️ Configuração

O arquivo `src/assets/config.json` contém configurações do app:

- **Limites**: max foto (5MB), max itens por lista (100), max listas (50)
- **Features**: habilitar/desabilitar notificações, offline, listas compartilhadas, orçamento
- **Categorias de orçamento**: Alimentação, Casa, Transporte, Saúde, etc.
- **UI**: tema, cores, itens por página

## 🗄️ Banco de Dados

O schema SQL está em `supabase/schema.sql` e inclui:

- **8 tabelas**: profiles, families, members, lists, items, budgets, budget_categories, expenses
- **Row Level Security (RLS)**: cada família só vê seus próprios dados
- **Índices**: otimizados para as queries mais comuns
- **Triggers**: atualização automática de `updated_at`
- **Storage bucket**: para fotos dos itens

## 📋 Plano de Arquitetura

Documentação detalhada em `plans/architecture.md` com:
- Diagramas ER (Mermaid)
- Arquitetura de componentes
- Fluxo do usuário
- Políticas de segurança RLS

## 🧪 Testes

```bash
npm test
```

## 📦 Deploy

Recomendado: **Vercel** ou **Netlify**

```bash
npm run build
# Deploy a pasta dist/family-purchase-list/
```

Lembre-se de configurar as variáveis de ambiente de produção em `src/environments/environment.prod.ts`.

## 📄 Licença

MIT

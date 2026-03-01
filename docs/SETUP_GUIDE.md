# 🔧 Guia Completo de Configuração

## Passo 1: Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faça login (pode usar sua conta Google)
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `family-purchase-list`
   - **Database Password**: crie uma senha forte (guarde-a)
   - **Region**: `South America (São Paulo)` (mais próximo de você)
4. Clique em **"Create new project"** e aguarde ~2 minutos

## Passo 2: Pegar URL e Anon Key do Supabase

1. No dashboard do projeto, vá em **Settings** (ícone de engrenagem) → **API**
2. Copie:
   - **Project URL**: algo como `https://xyzxyz.supabase.co`
   - **anon public key**: uma string longa que começa com `eyJ...`

## Passo 3: Executar o Schema SQL

1. No dashboard do Supabase, vá em **SQL Editor** (ícone de código no menu lateral)
2. Clique em **"New query"**
3. Copie TODO o conteúdo do arquivo `supabase/schema.sql` e cole no editor
4. Clique em **"Run"** (ou Ctrl+Enter)
5. Deve aparecer "Success. No rows returned" - isso é normal!

## Passo 4: Configurar Google OAuth

### 4.1 - Criar credenciais no Google Cloud Console

1. Acesse [https://console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. No menu lateral, vá em **APIs & Services** → **Credentials**
4. Clique em **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Se pedir para configurar a tela de consentimento:
   - Escolha **"External"**
   - Preencha o nome do app: `Family Purchase List`
   - Email de suporte: seu email
   - Domínios autorizados: adicione `supabase.co`
   - Clique em **"Save and Continue"** até finalizar
6. Volte em **Credentials** → **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
7. Preencha:
   - **Application type**: `Web application`
   - **Name**: `Family Purchase List`
   - **Authorized JavaScript origins**: 
     - `http://localhost:4200` (para desenvolvimento)
   - **Authorized redirect URIs**:
     - `https://SEU-PROJETO-ID.supabase.co/auth/v1/callback`
     - (substitua `SEU-PROJETO-ID` pelo ID do seu projeto Supabase, visível na URL do dashboard)
8. Clique em **"Create"**
9. **COPIE** o **Client ID** e o **Client Secret** que aparecem

### 4.2 - Configurar no Supabase

1. No dashboard do Supabase, vá em **Authentication** → **Providers**
2. Encontre **Google** e clique para expandir
3. Ative o toggle **"Enable Sign in with Google"**
4. Cole:
   - **Client ID**: o que você copiou do Google Cloud
   - **Client Secret**: o que você copiou do Google Cloud
5. Clique em **"Save"**

## Passo 5: Configurar o Projeto Angular

Edite o arquivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://SEU-PROJETO-ID.supabase.co',     // ← Cole a Project URL aqui
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',    // ← Cole a anon key aqui
  },
};
```

E também `src/environments/environment.prod.ts` com os mesmos valores (para produção).

## Passo 6: Rodar o Projeto

```bash
npm start
```

Acesse `http://localhost:4200` no navegador.

## Passo 7: Testar

1. Clique em **"Entrar com Google"**
2. Faça login com sua conta Google
3. Crie uma família
4. Compartilhe o código de convite com outros membros
5. Crie listas e adicione itens!

---

## ❓ Problemas Comuns

### "redirect_uri_mismatch" ao fazer login
- Verifique se a URL de redirect no Google Cloud Console está correta:
  `https://SEU-PROJETO-ID.supabase.co/auth/v1/callback`

### "Invalid API key" 
- Verifique se a `anonKey` no `environment.ts` está correta (copie novamente do Supabase)

### Tabelas não encontradas
- Execute novamente o `supabase/schema.sql` no SQL Editor

### Fotos não fazem upload
- Verifique se o bucket `item-photos` foi criado (deve ter sido criado pelo schema.sql)
- Vá em **Storage** no Supabase e confirme que o bucket existe

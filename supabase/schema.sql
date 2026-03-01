-- ============================================
-- Family Purchase List - Schema SQL
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Tabela de perfis (sincronizada com auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de famílias
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de membros (relação N:N entre profiles e families)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, family_id)
);

-- Tabela de listas de compras
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  estimated_price NUMERIC(10, 2),
  priority_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_cart', 'purchased', 'cancelled')),
  photo_url TEXT,
  purchase_url TEXT,
  store_name TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_by UUID REFERENCES profiles(id),
  actual_price NUMERIC(10, 2),
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de orçamentos mensais
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_budget NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, year, month)
);

-- Tabela de categorias do orçamento
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  allocated_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de gastos
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'Outros',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_family_id ON members(family_id);
CREATE INDEX IF NOT EXISTS idx_lists_family_id ON lists(family_id);
CREATE INDEX IF NOT EXISTS idx_lists_owner_id ON lists(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_list_id ON items(list_id);
CREATE INDEX IF NOT EXISTS idx_items_priority ON items(list_id, priority_order);
CREATE INDEX IF NOT EXISTS idx_budgets_family_month ON budgets(family_id, year, month);
CREATE INDEX IF NOT EXISTS idx_expenses_family_date ON expenses(family_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(family_id, category);

-- ============================================
-- Funções Helper para evitar Recursão RLS
-- ============================================

-- Função que retorna os IDs das famílias do usuário atual
-- SECURITY DEFINER executa com privilégios do owner, ignorando RLS
CREATE OR REPLACE FUNCTION user_family_ids()
RETURNS TABLE(family_id UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT m.family_id
  FROM members m
  WHERE m.user_id = auth.uid();
END;
$$;

-- Função helper para verificar se usuário é membro de uma família
CREATE OR REPLACE FUNCTION is_user_in_family(p_family_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members m
    WHERE m.family_id = p_family_id
    AND m.user_id = auth.uid()
  );
END;
$$;

-- Função helper para verificar se usuário é admin de uma família
CREATE OR REPLACE FUNCTION is_user_admin_in_family(p_family_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members m
    WHERE m.family_id = p_family_id
    AND m.user_id = auth.uid()
    AND m.role = 'admin'
  );
END;
$$;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário pode ver todos, mas só editar o próprio
CREATE POLICY "Profiles são visíveis para todos autenticados"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuário pode editar próprio perfil"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Families: membros podem ver (usando função helper)
CREATE POLICY "Membros podem ver sua família"
  ON families FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT user_family_ids())
  );

CREATE POLICY "Qualquer autenticado pode criar família"
  ON families FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin pode atualizar família"
  ON families FOR UPDATE
  TO authenticated
  USING (
    is_user_admin_in_family(id)
  );

-- Members: membros da família podem ver (CORRIGIDO - sem recursão)
CREATE POLICY "Membros podem ver outros membros"
  ON members FOR SELECT
  TO authenticated
  USING (
    is_user_in_family(family_id)
  );

CREATE POLICY "Autenticado pode se adicionar como membro"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin pode remover membros"
  ON members FOR DELETE
  TO authenticated
  USING (
    is_user_admin_in_family(family_id)
    OR user_id = auth.uid()
  );

-- Lists: membros da família podem ver
CREATE POLICY "Membros podem ver listas da família"
  ON lists FOR SELECT
  TO authenticated
  USING (
    is_user_in_family(family_id)
  );

CREATE POLICY "Membros podem criar listas"
  ON lists FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_in_family(family_id)
    AND owner_id = auth.uid()
  );

CREATE POLICY "Dono pode editar lista"
  ON lists FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Dono pode deletar lista"
  ON lists FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Items: membros da família podem ver
CREATE POLICY "Membros podem ver itens"
  ON items FOR SELECT
  TO authenticated
  USING (
    list_id IN (
      SELECT l.id FROM lists l
      WHERE is_user_in_family(l.family_id)
    )
  );

CREATE POLICY "Membros podem criar itens"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (
    added_by = auth.uid()
    AND list_id IN (
      SELECT l.id FROM lists l
      WHERE is_user_in_family(l.family_id)
    )
  );

CREATE POLICY "Membros podem atualizar itens"
  ON items FOR UPDATE
  TO authenticated
  USING (
    list_id IN (
      SELECT l.id FROM lists l
      WHERE is_user_in_family(l.family_id)
    )
  );

CREATE POLICY "Quem adicionou pode deletar item"
  ON items FOR DELETE
  TO authenticated
  USING (added_by = auth.uid());

-- Budgets: membros podem ver
CREATE POLICY "Membros podem ver orçamentos"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    is_user_in_family(family_id)
  );

CREATE POLICY "Admin pode criar orçamento"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_in_family(family_id)
  );

CREATE POLICY "Admin pode atualizar orçamento"
  ON budgets FOR UPDATE
  TO authenticated
  USING (
    is_user_admin_in_family(family_id)
  );

-- Budget Categories
CREATE POLICY "Membros podem ver categorias"
  ON budget_categories FOR SELECT
  TO authenticated
  USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      WHERE is_user_in_family(b.family_id)
    )
  );

CREATE POLICY "Admin pode gerenciar categorias"
  ON budget_categories FOR ALL
  TO authenticated
  USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      WHERE is_user_admin_in_family(b.family_id)
    )
  );

-- Expenses: membros podem ver
CREATE POLICY "Membros podem ver gastos"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    is_user_in_family(family_id)
  );

CREATE POLICY "Membros podem criar gastos"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id = auth.uid()
    AND is_user_in_family(family_id)
  );

CREATE POLICY "Quem criou pode deletar gasto"
  ON expenses FOR DELETE
  TO authenticated
  USING (member_id = auth.uid());

-- ============================================
-- Storage Bucket para fotos
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Autenticados podem fazer upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'item-photos');

CREATE POLICY "Todos podem ver fotos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'item-photos');

CREATE POLICY "Dono pode deletar foto"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- Trigger para atualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

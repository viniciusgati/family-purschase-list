-- ============================================
-- Correção do Schema SQL - RLS Recursion Fix
-- Execute este script no SQL Editor do Supabase
-- para corrigir o erro de recursão infinita
-- ============================================

-- ============================================
-- Funções Helper para evitar Recursão RLS
-- ============================================

-- Drop functions if exists (for fresh install)
DROP FUNCTION IF EXISTS user_family_ids();
DROP FUNCTION IF EXISTS is_user_in_family(UUID);
DROP FUNCTION IF EXISTS is_user_admin_in_family(UUID);

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
-- Atualizar Políticas RLS Corrigidas
-- ============================================

-- Families: membros podem ver
DROP POLICY IF EXISTS "Membros podem ver sua família" ON families;
CREATE POLICY "Membros podem ver sua família"
  ON families FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT user_family_ids())
  );

-- Admin pode atualizar família
DROP POLICY IF EXISTS "Admin pode atualizar família" ON families;
CREATE POLICY "Admin pode atualizar família"
  ON families FOR UPDATE
  TO authenticated
  USING (
    is_user_admin_in_family(id)
  );

-- Members: membros da família podem ver (CORRIGIDO)
DROP POLICY IF EXISTS "Membros podem ver outros membros" ON members;
CREATE POLICY "Membros podem ver outros membros"
  ON members FOR SELECT
  TO authenticated
  USING (
    is_user_in_family(family_id)
  );

-- Admin pode remover membros
DROP POLICY IF EXISTS "Admin pode remover membros" ON members;
CREATE POLICY "Admin pode remover membros"
  ON members FOR DELETE
  TO authenticated
  USING (
    is_user_admin_in_family(family_id)
    OR user_id = auth.uid()
  );

-- Lists: membros da família podem ver
DROP POLICY IF EXISTS "Membros podem ver listas da família" ON lists;
CREATE POLICY "Membros podem ver listas da família"
  ON lists FOR SELECT
  TO authenticated
  USING (
    is_user_in_family(family_id)
  );

-- Membros podem criar listas
DROP POLICY IF EXISTS "Membros podem criar listas" ON lists;
CREATE POLICY "Membros podem criar listas"
  ON lists FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_in_family(family_id)
    AND owner_id = auth.uid()
  );

-- Budgets: membros podem ver
DROP POLICY IF EXISTS "Membros podem ver orçamentos" ON budgets;
CREATE POLICY "Membros podem ver orçamentos"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    is_user_in_family(family_id)
  );

-- Admin pode criar orçamento
DROP POLICY IF EXISTS "Admin pode criar orçamento" ON budgets;
CREATE POLICY "Admin pode criar orçamento"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_in_family(family_id)
  );

-- Admin pode atualizar orçamento
DROP POLICY IF EXISTS "Admin pode atualizar orçamento" ON budgets;
CREATE POLICY "Admin pode atualizar orçamento"
  ON budgets FOR UPDATE
  TO authenticated
  USING (
    is_user_admin_in_family(family_id)
  );

-- Expenses: membros podem ver
DROP POLICY IF EXISTS "Membros podem ver gastos" ON expenses;
CREATE POLICY "Membros podem ver gastos"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    is_user_in_family(family_id)
  );

-- Membros podem criar gastos
DROP POLICY IF EXISTS "Membros podem criar gastos" ON expenses;
CREATE POLICY "Membros podem criar gastos"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id = auth.uid()
    AND is_user_in_family(family_id)
  );

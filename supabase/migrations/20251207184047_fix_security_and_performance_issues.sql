/*
  # Correction des problèmes de sécurité et de performance

  ## Modifications

  1. **Index manquants**
     - Ajout d'un index sur `phones.purchase_account_id` pour améliorer les performances des jointures

  2. **Optimisation des politiques RLS**
     - Remplacement de `auth.uid()` par `(select auth.uid())` dans toutes les politiques
     - Évite la réévaluation de la fonction pour chaque ligne
     - Améliore considérablement les performances des requêtes à grande échelle

  3. **Correction du search_path des fonctions**
     - Sécurisation des fonctions avec un search_path explicite
     - Protection contre les attaques par injection de schéma

  ## Tables affectées
  - `users` - Politiques RLS optimisées
  - `purchase_accounts` - Politiques RLS optimisées
  - `phones` - Index ajouté + politiques RLS optimisées
  - `repairs` - Politiques RLS optimisées
  - `audit_logs` - Politiques RLS optimisées
  - `stock_pieces` - Politiques RLS optimisées
  - `materiel_expenses` - Politiques RLS optimisées
  - `repair_parts` - Politiques RLS optimisées
*/

-- Étape 1 : Ajouter l'index manquant sur la clé étrangère
CREATE INDEX IF NOT EXISTS idx_phones_purchase_account_id 
ON phones(purchase_account_id);

-- Étape 2 : Recréer toutes les politiques RLS avec (select auth.uid())

-- Table: users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Table: purchase_accounts
DROP POLICY IF EXISTS "Users can view own purchase accounts" ON purchase_accounts;
DROP POLICY IF EXISTS "Users can create own purchase accounts" ON purchase_accounts;
DROP POLICY IF EXISTS "Users can update own purchase accounts" ON purchase_accounts;
DROP POLICY IF EXISTS "Users can delete own purchase accounts" ON purchase_accounts;

CREATE POLICY "Users can view own purchase accounts"
  ON purchase_accounts FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own purchase accounts"
  ON purchase_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own purchase accounts"
  ON purchase_accounts FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own purchase accounts"
  ON purchase_accounts FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Table: phones
DROP POLICY IF EXISTS "Users can view own phones" ON phones;
DROP POLICY IF EXISTS "Users can create own phones" ON phones;
DROP POLICY IF EXISTS "Users can update own phones" ON phones;
DROP POLICY IF EXISTS "Users can delete own phones" ON phones;

CREATE POLICY "Users can view own phones"
  ON phones FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own phones"
  ON phones FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own phones"
  ON phones FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own phones"
  ON phones FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Table: repairs
DROP POLICY IF EXISTS "Users can view own repairs" ON repairs;
DROP POLICY IF EXISTS "Users can create own repairs" ON repairs;
DROP POLICY IF EXISTS "Users can update own repairs" ON repairs;
DROP POLICY IF EXISTS "Users can delete own repairs" ON repairs;

CREATE POLICY "Users can view own repairs"
  ON repairs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own repairs"
  ON repairs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own repairs"
  ON repairs FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own repairs"
  ON repairs FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Table: audit_logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can create own audit logs" ON audit_logs;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Table: stock_pieces
DROP POLICY IF EXISTS "Users can view own stock pieces" ON stock_pieces;
DROP POLICY IF EXISTS "Users can insert own stock pieces" ON stock_pieces;
DROP POLICY IF EXISTS "Users can update own stock pieces" ON stock_pieces;
DROP POLICY IF EXISTS "Users can delete own stock pieces" ON stock_pieces;

CREATE POLICY "Users can view own stock pieces"
  ON stock_pieces FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own stock pieces"
  ON stock_pieces FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own stock pieces"
  ON stock_pieces FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own stock pieces"
  ON stock_pieces FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Table: materiel_expenses
DROP POLICY IF EXISTS "Users can view own materiel expenses" ON materiel_expenses;
DROP POLICY IF EXISTS "Users can insert own materiel expenses" ON materiel_expenses;
DROP POLICY IF EXISTS "Users can update own materiel expenses" ON materiel_expenses;
DROP POLICY IF EXISTS "Users can delete own materiel expenses" ON materiel_expenses;

CREATE POLICY "Users can view own materiel expenses"
  ON materiel_expenses FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own materiel expenses"
  ON materiel_expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own materiel expenses"
  ON materiel_expenses FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own materiel expenses"
  ON materiel_expenses FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Table: repair_parts
DROP POLICY IF EXISTS "Users can view repair parts for own repairs" ON repair_parts;
DROP POLICY IF EXISTS "Users can insert repair parts for own repairs" ON repair_parts;
DROP POLICY IF EXISTS "Users can update repair parts for own repairs" ON repair_parts;
DROP POLICY IF EXISTS "Users can delete repair parts for own repairs" ON repair_parts;

CREATE POLICY "Users can view repair parts for own repairs"
  ON repair_parts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_parts.repair_id
      AND repairs.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert repair parts for own repairs"
  ON repair_parts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_parts.repair_id
      AND repairs.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update repair parts for own repairs"
  ON repair_parts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_parts.repair_id
      AND repairs.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_parts.repair_id
      AND repairs.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete repair parts for own repairs"
  ON repair_parts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_parts.repair_id
      AND repairs.user_id = (select auth.uid())
    )
  );

-- Étape 3 : Corriger le search_path des fonctions
-- On doit d'abord supprimer les triggers qui dépendent de la fonction
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_phones_updated_at ON phones;
DROP TRIGGER IF EXISTS update_repairs_updated_at ON repairs;
DROP TRIGGER IF EXISTS update_stock_pieces_updated_at ON stock_pieces;

-- Maintenant on peut recréer la fonction avec le search_path sécurisé
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Recréer les triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phones_updated_at
  BEFORE UPDATE ON phones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repairs_updated_at
  BEFORE UPDATE ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_pieces_updated_at
  BEFORE UPDATE ON stock_pieces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Corriger la fonction create_user_with_pin
DROP FUNCTION IF EXISTS create_user_with_pin(uuid, text);
CREATE FUNCTION create_user_with_pin(
  p_user_id uuid,
  p_pin_hash text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO users (id, pin_hash, created_at, updated_at)
  VALUES (p_user_id, p_pin_hash, now(), now())
  ON CONFLICT (id) DO NOTHING;
END;
$$;
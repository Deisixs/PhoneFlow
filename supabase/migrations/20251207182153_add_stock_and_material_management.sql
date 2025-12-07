/*
  # Système de gestion de stock et matériel

  1. Nouvelles Tables
    - `stock_pieces`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers users)
      - `name` (text) - Nom de la pièce
      - `description` (text) - Description optionnelle
      - `purchase_price` (decimal) - Prix d'achat
      - `supplier` (text) - Nom du fournisseur
      - `supplier_link` (text) - Lien vers le produit
      - `quantity` (integer) - Quantité en stock
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `materiel_expenses`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers users)
      - `description` (text) - Description de la dépense (colle, outils, etc.)
      - `amount` (decimal) - Montant de la dépense
      - `category` (text) - Catégorie (outils, consommables, etc.)
      - `purchase_date` (date) - Date d'achat
      - `created_at` (timestamptz)

    - `repair_parts`
      - `id` (uuid, clé primaire)
      - `repair_id` (uuid, référence vers repairs)
      - `stock_piece_id` (uuid, référence vers stock_pieces)
      - `quantity_used` (integer) - Quantité utilisée
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les nouvelles tables
    - Politiques pour que les utilisateurs ne voient que leurs propres données
*/

-- Table des pièces en stock
CREATE TABLE IF NOT EXISTS stock_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  purchase_price decimal(10,2) NOT NULL DEFAULT 0,
  supplier text DEFAULT '',
  supplier_link text DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stock_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stock pieces"
  ON stock_pieces FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock pieces"
  ON stock_pieces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stock pieces"
  ON stock_pieces FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock pieces"
  ON stock_pieces FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table des dépenses de matériel
CREATE TABLE IF NOT EXISTS materiel_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  category text DEFAULT 'autres',
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE materiel_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own materiel expenses"
  ON materiel_expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own materiel expenses"
  ON materiel_expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own materiel expenses"
  ON materiel_expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own materiel expenses"
  ON materiel_expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table de liaison réparations-pièces
CREATE TABLE IF NOT EXISTS repair_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id uuid REFERENCES repairs(id) ON DELETE CASCADE NOT NULL,
  stock_piece_id uuid REFERENCES stock_pieces(id) ON DELETE CASCADE NOT NULL,
  quantity_used integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE repair_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view repair parts for own repairs"
  ON repair_parts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_parts.repair_id
      AND repairs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert repair parts for own repairs"
  ON repair_parts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_parts.repair_id
      AND repairs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update repair parts for own repairs"
  ON repair_parts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_parts.repair_id
      AND repairs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_parts.repair_id
      AND repairs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete repair parts for own repairs"
  ON repair_parts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repairs
      WHERE repairs.id = repair_parts.repair_id
      AND repairs.user_id = auth.uid()
    )
  );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_stock_pieces_user_id ON stock_pieces(user_id);
CREATE INDEX IF NOT EXISTS idx_materiel_expenses_user_id ON materiel_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_materiel_expenses_date ON materiel_expenses(purchase_date);
CREATE INDEX IF NOT EXISTS idx_repair_parts_repair_id ON repair_parts(repair_id);
CREATE INDEX IF NOT EXISTS idx_repair_parts_stock_piece_id ON repair_parts(stock_piece_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_pieces_updated_at
  BEFORE UPDATE ON stock_pieces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
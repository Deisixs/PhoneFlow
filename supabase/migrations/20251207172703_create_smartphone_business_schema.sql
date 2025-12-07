/*
  # Smartphone Business Management System - Complete Schema

  ## Overview
  Complete database schema for an enterprise-grade smartphone buy/repair/sell business management SaaS.

  ## New Tables

  ### 1. `users`
  User authentication and profile management
  - `id` (uuid, primary key) - User unique identifier
  - `email` (text, unique) - User email
  - `pin_hash` (text) - Hashed PIN for authentication
  - `display_name` (text) - User display name
  - `session_timeout_minutes` (integer) - Inactivity timeout setting
  - `last_activity` (timestamptz) - Last activity timestamp
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `purchase_accounts`
  Accounts used for purchasing phones (Vinted, eBay, Leboncoin, etc.)
  - `id` (uuid, primary key) - Account unique identifier
  - `user_id` (uuid, foreign key) - Owner user
  - `name` (text) - Account name/platform
  - `color` (text) - UI color for the account
  - `icon` (text) - Icon identifier
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. `phones`
  iPhone inventory management
  - `id` (uuid, primary key) - Phone unique identifier
  - `user_id` (uuid, foreign key) - Owner user
  - `model` (text) - iPhone model (e.g., "iPhone 14 Pro")
  - `storage` (text) - Storage capacity
  - `color` (text) - Phone color
  - `imei` (text, unique) - IMEI number
  - `condition` (text) - Phone condition
  - `purchase_price` (decimal) - Purchase price
  - `purchase_date` (date) - Purchase date
  - `purchase_account_id` (uuid, foreign key) - Account used for purchase
  - `notes` (text) - Additional notes
  - `sale_price` (decimal, nullable) - Sale price if sold
  - `sale_date` (date, nullable) - Sale date if sold
  - `is_sold` (boolean) - Sale status
  - `qr_code` (text) - Generated QR code data
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `repairs`
  Repair tracking for phones
  - `id` (uuid, primary key) - Repair unique identifier
  - `phone_id` (uuid, foreign key) - Associated phone
  - `user_id` (uuid, foreign key) - Owner user
  - `description` (text) - Repair description
  - `repair_list` (text) - Detailed list of repairs
  - `cost` (decimal) - Repair cost
  - `status` (text) - Status: pending, in_progress, completed, failed
  - `technician` (text, nullable) - Assigned technician
  - `photo_url` (text, nullable) - Photo/screenshot URL
  - `started_at` (timestamptz, nullable) - Start timestamp
  - `completed_at` (timestamptz, nullable) - Completion timestamp
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. `audit_logs`
  Security audit trail for authentication events
  - `id` (uuid, primary key) - Log entry unique identifier
  - `user_id` (uuid, foreign key) - User who performed the action
  - `action` (text) - Action type (login, logout, pin_change, etc.)
  - `ip_address` (text, nullable) - IP address
  - `user_agent` (text, nullable) - User agent string
  - `metadata` (jsonb, nullable) - Additional metadata
  - `created_at` (timestamptz) - Action timestamp

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Audit logs are read-only after creation
  - IMEI uniqueness enforced at database level
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  pin_hash text NOT NULL,
  display_name text NOT NULL,
  session_timeout_minutes integer DEFAULT 30,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_accounts table
CREATE TABLE IF NOT EXISTS purchase_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  icon text DEFAULT 'shopping-bag',
  created_at timestamptz DEFAULT now()
);

-- Create phones table
CREATE TABLE IF NOT EXISTS phones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  model text NOT NULL,
  storage text NOT NULL,
  color text NOT NULL,
  imei text UNIQUE NOT NULL,
  condition text NOT NULL,
  purchase_price decimal(10, 2) NOT NULL,
  purchase_date date NOT NULL,
  purchase_account_id uuid REFERENCES purchase_accounts(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  sale_price decimal(10, 2),
  sale_date date,
  is_sold boolean DEFAULT false,
  qr_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create repairs table
CREATE TABLE IF NOT EXISTS repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id uuid REFERENCES phones(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  repair_list text NOT NULL,
  cost decimal(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  technician text,
  photo_url text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phones_user_id ON phones(user_id);
CREATE INDEX IF NOT EXISTS idx_phones_imei ON phones(imei);
CREATE INDEX IF NOT EXISTS idx_phones_is_sold ON phones(is_sold);
CREATE INDEX IF NOT EXISTS idx_repairs_phone_id ON repairs(phone_id);
CREATE INDEX IF NOT EXISTS idx_repairs_user_id ON repairs(user_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_purchase_accounts_user_id ON purchase_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for purchase_accounts table
CREATE POLICY "Users can view own purchase accounts"
  ON purchase_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchase accounts"
  ON purchase_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchase accounts"
  ON purchase_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchase accounts"
  ON purchase_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for phones table
CREATE POLICY "Users can view own phones"
  ON phones FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own phones"
  ON phones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phones"
  ON phones FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own phones"
  ON phones FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for repairs table
CREATE POLICY "Users can view own repairs"
  ON repairs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own repairs"
  ON repairs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repairs"
  ON repairs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own repairs"
  ON repairs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for audit_logs table
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_phones_updated_at ON phones;
CREATE TRIGGER update_phones_updated_at
  BEFORE UPDATE ON phones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_repairs_updated_at ON repairs;
CREATE TRIGGER update_repairs_updated_at
  BEFORE UPDATE ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
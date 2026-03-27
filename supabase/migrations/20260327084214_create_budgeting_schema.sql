/*
  # Budgeting App Schema

  ## Overview
  Complete database schema for a self-hosted budgeting application with multi-instance support.

  ## Tables Created
  
  ### 1. admin_users
  Single admin account for authentication
  - `id` (uuid, primary key)
  - `username` (text, unique)
  - `password_hash` (text) - bcrypt hashed password
  - `created_at` (timestamptz)
  
  ### 2. instances
  Organizations/youth movements that manage budgets
  - `id` (uuid, primary key)
  - `name` (text) - name of the instance
  - `description` (text) - optional description
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 3. categories
  Transaction categories for organizing expenses/income
  - `id` (uuid, primary key)
  - `instance_id` (uuid, foreign key)
  - `name` (text) - category name
  - `type` (text) - 'income' or 'expense'
  - `color` (text) - hex color for UI
  - `created_at` (timestamptz)
  
  ### 4. people
  People associated with instances (members, contacts, etc.)
  - `id` (uuid, primary key)
  - `instance_id` (uuid, foreign key)
  - `name` (text)
  - `email` (text)
  - `phone` (text)
  - `role` (text) - their role in the instance
  - `created_at` (timestamptz)
  
  ### 5. transactions
  Income and expense records
  - `id` (uuid, primary key)
  - `instance_id` (uuid, foreign key)
  - `category_id` (uuid, foreign key)
  - `person_id` (uuid, foreign key, nullable)
  - `type` (text) - 'income' or 'expense'
  - `amount` (decimal) - transaction amount
  - `description` (text)
  - `date` (date) - transaction date
  - `imported_from_csv` (boolean) - flag for imported transactions
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies created for authenticated admin access only
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create instances table
CREATE TABLE IF NOT EXISTS instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES instances(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text DEFAULT '#1976d2',
  created_at timestamptz DEFAULT now()
);

-- Create people table
CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES instances(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  role text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES instances(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  person_id uuid REFERENCES people(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount decimal(12, 2) NOT NULL,
  description text DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  imported_from_csv boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Admin users can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin users can update own data"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for instances
CREATE POLICY "Authenticated users can view instances"
  ON instances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create instances"
  ON instances FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update instances"
  ON instances FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete instances"
  ON instances FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for categories
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for people
CREATE POLICY "Authenticated users can view people"
  ON people FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create people"
  ON people FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update people"
  ON people FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete people"
  ON people FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for transactions
CREATE POLICY "Authenticated users can view transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_instance ON categories(instance_id);
CREATE INDEX IF NOT EXISTS idx_people_instance ON people(instance_id);
CREATE INDEX IF NOT EXISTS idx_transactions_instance ON transactions(instance_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
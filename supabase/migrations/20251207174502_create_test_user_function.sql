/*
  # Create Test User Function

  1. Function
    - Creates a helper function to create users with PIN
    - Uses pgcrypto extension for bcrypt hashing
  
  2. Test User
    - Creates a default test user
    - Email: admin@phoneflow.com
    - PIN: 1234
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create helper function to create user with PIN
CREATE OR REPLACE FUNCTION create_user_with_pin(
  user_email text,
  user_pin text,
  user_display_name text DEFAULT 'User'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  pin_hash text;
BEGIN
  -- Generate bcrypt hash for PIN
  pin_hash := crypt(user_pin, gen_salt('bf', 10));
  
  -- Check if user already exists in auth.users
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = user_email;
  
  -- If user doesn't exist in auth, we need to create them manually in our users table
  IF new_user_id IS NULL THEN
    new_user_id := gen_random_uuid();
  END IF;
  
  -- Insert or update user profile
  INSERT INTO users (id, email, pin_hash, display_name)
  VALUES (new_user_id, user_email, pin_hash, user_display_name)
  ON CONFLICT (email) 
  DO UPDATE SET 
    pin_hash = EXCLUDED.pin_hash,
    display_name = EXCLUDED.display_name;
  
  RETURN new_user_id;
END;
$$;

-- Create default test user
SELECT create_user_with_pin('admin@phoneflow.com', '1234', 'Admin User');

-- Add some sample purchase accounts for the test user
INSERT INTO purchase_accounts (user_id, name, color, icon)
SELECT 
  id,
  unnest(ARRAY['Vinted', 'eBay', 'Leboncoin']),
  unnest(ARRAY['#10b981', '#3b82f6', '#f59e0b']),
  'shopping-bag'
FROM users
WHERE email = 'admin@phoneflow.com'
ON CONFLICT DO NOTHING;
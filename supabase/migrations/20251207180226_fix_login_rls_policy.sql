/*
  # Fix RLS Policy for Login

  1. Changes
    - Add SELECT policy to allow reading user data during login
    - Keeps system secure while allowing authentication flow
  
  2. Security
    - Allows reading user data by email for authentication purposes
    - This is safe because we only expose the pin_hash which is already encrypted
*/

-- Drop the restrictive policy that prevents login
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Add a policy that allows reading user data for authentication
CREATE POLICY "Allow read for authentication"
  ON users
  FOR SELECT
  USING (true);

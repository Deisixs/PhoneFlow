/*
  # Fix RLS Policy for User Registration

  1. Changes
    - Add INSERT policy to allow authenticated users to create their own profile
    - This allows the signup process to work correctly
  
  2. Security
    - Users can only insert a row with their own auth.uid()
    - Prevents users from creating profiles for other users
*/

-- Add INSERT policy for users table
CREATE POLICY "Users can create own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

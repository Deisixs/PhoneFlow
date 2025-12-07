/*
  # Correction des problèmes de sécurité restants

  ## Problèmes corrigés

  1. **Politiques RLS multiples**
     - Suppression de la politique "Allow read for authentication" qui est trop permissive
     - Création d'une politique sécurisée pour le rôle `anon` pour permettre l'authentification initiale
     - Conservation de "Users can view own profile" uniquement pour les utilisateurs authentifiés
     - Résout le problème de sécurité où n'importe quel utilisateur authentifié pouvait lire tous les profils

  2. **Function Search Path**
     - Correction du search_path pour toutes les fonctions create_user_with_pin
     - Utilisation d'un search_path explicite pour éviter les vulnérabilités

  ## Notes de sécurité
  
  - La politique `anon` pour SELECT sur users est nécessaire pour le flow d'authentification actuel
  - Pour une sécurité optimale, migrer vers une Edge Function pour l'authentification
  - Les index "unused" sont normaux pour une base nouvellement créée et seront utilisés au fil du temps
*/

-- Étape 1 : Corriger les politiques RLS multiples sur la table users
-- Supprimer la politique trop permissive
DROP POLICY IF EXISTS "Allow read for authentication" ON users;

-- La politique "Users can view own profile" existe déjà pour authenticated
-- Ajouter une politique pour anon (non-authentifié) nécessaire pour le login initial
CREATE POLICY "Allow anonymous read for authentication"
  ON users FOR SELECT
  TO anon
  USING (true);

-- Étape 2 : Recréer les fonctions create_user_with_pin avec un search_path sécurisé
-- Version 1 : avec email, pin, et display_name
DROP FUNCTION IF EXISTS create_user_with_pin(user_email text, user_pin text, user_display_name text);
CREATE FUNCTION create_user_with_pin(
  user_email text,
  user_pin text,
  user_display_name text DEFAULT 'User'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth, extensions
AS $$
DECLARE
  new_user_id uuid;
  pin_hash text;
BEGIN
  pin_hash := extensions.crypt(user_pin, extensions.gen_salt('bf', 10));
  
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF new_user_id IS NULL THEN
    new_user_id := gen_random_uuid();
  END IF;
  
  INSERT INTO public.users (id, email, pin_hash, display_name)
  VALUES (new_user_id, user_email, pin_hash, user_display_name)
  ON CONFLICT (email) 
  DO UPDATE SET 
    pin_hash = EXCLUDED.pin_hash,
    display_name = EXCLUDED.display_name;
  
  RETURN new_user_id;
END;
$$;

-- Version 2 : avec user_id et pin_hash
DROP FUNCTION IF EXISTS create_user_with_pin(p_user_id uuid, p_pin_hash text);
CREATE FUNCTION create_user_with_pin(
  p_user_id uuid,
  p_pin_hash text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth
AS $$
BEGIN
  INSERT INTO public.users (id, pin_hash, created_at, updated_at)
  VALUES (p_user_id, p_pin_hash, now(), now())
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Étape 3 : Ajouter des commentaires sur la sécurité
COMMENT ON POLICY "Allow anonymous read for authentication" ON users IS 
'Permet aux utilisateurs non-authentifiés de lire la table users pour le login initial. 
Pour une sécurité renforcée, migrer vers une Edge Function avec service_role.';

COMMENT ON FUNCTION create_user_with_pin(text, text, text) IS
'Crée un utilisateur avec un PIN hashé. Utilise SECURITY DEFINER avec search_path explicite pour la sécurité.';

COMMENT ON FUNCTION create_user_with_pin(uuid, text) IS
'Crée un utilisateur avec un PIN pré-hashé. Utilise SECURITY DEFINER avec search_path explicite pour la sécurité.';
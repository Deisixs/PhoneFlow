# Troubleshooting - PhoneFlow Pro

## Problème : "User not found" après inscription

### Cause
Supabase a la confirmation d'email activée par défaut. Vous devez soit :
1. Confirmer votre email avant de vous connecter
2. Désactiver la confirmation d'email dans Supabase

### Solution 1 : Désactiver la confirmation d'email (Recommandé)

1. Allez dans votre dashboard Supabase
2. Allez dans **Authentication** > **Providers**
3. Cliquez sur **Email**
4. Désactivez l'option **"Confirm email"**
5. Sauvegardez

Maintenant, créez un nouveau compte et vous pourrez vous connecter immédiatement.

### Solution 2 : Confirmer votre email

1. Après avoir créé votre compte, vérifiez votre boîte email
2. Cliquez sur le lien de confirmation
3. Retournez sur la page de login
4. Connectez-vous avec votre email et PIN

### Solution 3 : Créer un utilisateur manuellement via SQL

Si vous voulez bypasser complètement l'email, exécutez cette commande dans l'éditeur SQL de Supabase :

```sql
-- Remplacez les valeurs par les vôtres
SELECT create_user_with_pin('votre@email.com', '1234', 'Votre Nom');
```

Ensuite, créez manuellement l'utilisateur dans Supabase Auth :
1. Allez dans **Authentication** > **Users**
2. Cliquez sur **"Add user"**
3. Email : votre@email.com
4. Password : 1234votre@email.com (format : PIN + email)
5. Cochez **"Auto Confirm User"**
6. Créez l'utilisateur

Maintenant vous pouvez vous connecter avec :
- Email : votre@email.com
- PIN : 1234

## Problème : "Invalid PIN"

### Causes possibles
- Vous avez oublié votre PIN
- Le PIN a été mal saisi lors de l'inscription

### Solution
Recréez votre compte avec un nouveau PIN, ou exécutez cette commande SQL pour changer votre PIN :

```sql
-- Remplacez par votre email et nouveau PIN
SELECT create_user_with_pin('votre@email.com', 'nouveau_pin', 'Votre Nom');
```

## Problème : L'application ne charge pas

### Vérifications
1. Vérifiez que les variables d'environnement sont correctes dans `.env` :
   ```
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_clé_anon
   ```

2. Vérifiez que les migrations ont été appliquées dans Supabase

3. Ouvrez la console du navigateur (F12) pour voir les erreurs

## Problème : "Failed to load phones" ou autres erreurs de base de données

### Cause
Les migrations n'ont pas été appliquées correctement

### Solution
1. Allez dans **SQL Editor** dans Supabase
2. Exécutez toutes les migrations dans l'ordre :
   - `supabase/migrations/20251207172703_create_smartphone_business_schema.sql`
   - `supabase/migrations/20251207174502_create_test_user_function.sql`

## Problème : Scanner QR ne fonctionne pas

### Causes possibles
1. Permissions caméra non accordées
2. Utilisation en HTTP au lieu de HTTPS
3. Navigateur non compatible

### Solutions
1. Accordez les permissions caméra quand le navigateur le demande
2. Utilisez HTTPS en production (HTTP fonctionne uniquement sur localhost)
3. Utilisez un navigateur moderne (Chrome, Firefox, Safari récents)

## Besoin d'aide ?

Si le problème persiste :
1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez les logs dans Supabase Dashboard > Logs
3. Vérifiez que toutes les tables existent dans Database > Tables

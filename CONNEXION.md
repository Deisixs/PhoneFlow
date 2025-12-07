# Guide de Connexion - PhoneFlow Pro

## Comment se connecter

### Option 1 : Créer un nouveau compte (Recommandé)

1. Sur la page de connexion, cliquez sur **"Create one"** en bas
2. Remplissez le formulaire :
   - **Nom d'affichage** : Votre nom (ex: "Admin")
   - **Email** : Votre email (ex: "votre@email.com")
   - **PIN** : 4 à 6 chiffres (ex: "1234")
   - **Confirmer PIN** : Répétez le même PIN
3. Cliquez sur **"Create Account"**
4. Vous serez redirigé vers la page de connexion
5. Connectez-vous avec votre email et votre PIN

### Option 2 : Utiliser le compte de test

Un compte de test a été créé automatiquement :

- **Email** : `admin@phoneflow.com`
- **PIN** : `1234`

⚠️ **Note importante** : Ce compte de test fonctionne UNIQUEMENT si vous avez créé un utilisateur dans Supabase Auth avec cet email. Sinon, utilisez l'Option 1.

## Comment créer un compte manuellement via Supabase (si nécessaire)

Si vous préférez créer un compte manuellement dans Supabase :

1. Allez dans votre dashboard Supabase
2. Allez dans **Authentication** > **Users**
3. Cliquez sur **"Add user"**
4. Entrez :
   - Email : votre email
   - Password : utilisez le format `[VOTRE_PIN][VOTRE_EMAIL]` (ex: si PIN=1234 et email=test@test.com, password = "1234test@test.com")
   - Désactivez "Auto Confirm User" si nécessaire
5. Ensuite, exécutez cette requête SQL dans l'éditeur SQL de Supabase :

```sql
SELECT create_user_with_pin('votre@email.com', 'votre_pin', 'Votre Nom');
```

Par exemple :
```sql
SELECT create_user_with_pin('john@example.com', '1234', 'John Doe');
```

## Problèmes courants

### "User not found"
- Vous devez d'abord créer un compte via l'Option 1 (page d'inscription)
- Ou créer manuellement l'utilisateur dans Supabase Auth

### "Invalid PIN"
- Vérifiez que vous entrez le bon PIN (4-6 chiffres)
- Les PINs sont sensibles, assurez-vous de bien les retenir

### "Login failed"
- Vérifiez votre connexion internet
- Vérifiez que les variables d'environnement Supabase sont correctement configurées

## Première utilisation

Une fois connecté :

1. Allez dans **Paramètres** pour :
   - Ajouter vos comptes d'achat (Vinted, eBay, Leboncoin, etc.)
   - Configurer votre profil

2. Allez dans **Inventaire** pour :
   - Ajouter vos premiers téléphones

3. Explorez les autres fonctionnalités :
   - **Réparations** : Suivez vos réparations
   - **Analytics** : Visualisez vos statistiques
   - **Scanner** : Scannez les QR codes

## Support

En cas de problème persistant, vérifiez :
- La console du navigateur (F12) pour les erreurs
- Les logs Supabase dans le dashboard
- Que votre base de données est bien configurée avec les migrations

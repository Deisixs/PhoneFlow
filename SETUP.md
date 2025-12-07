# PhoneFlow Pro - Setup Guide

## Initial Setup

### 1. Create a Test User

To test the application, you need to create a user in Supabase. Run this SQL in your Supabase SQL Editor:

```sql
-- First, create the auth user (replace with your email)
-- Go to Authentication > Users in Supabase Dashboard and add a user manually:
-- Email: admin@phoneflow.com
-- Password: 1234admin@phoneflow.com (PIN + email)

-- Then, insert the user profile with hashed PIN
-- The PIN "1234" is hashed using bcrypt
INSERT INTO users (id, email, pin_hash, display_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@phoneflow.com'),
  'admin@phoneflow.com',
  '$2a$10$YourBcryptHashHere',
  'Admin User'
);

-- Or you can sign up through the app which will handle this automatically
```

### 2. Test Credentials

After setting up, you can login with:
- **Email**: admin@phoneflow.com
- **PIN**: 1234

### 3. Add Sample Data

```sql
-- Add sample purchase accounts
INSERT INTO purchase_accounts (user_id, name, color, icon)
VALUES
  ((SELECT id FROM auth.users WHERE email = 'admin@phoneflow.com'), 'Vinted', '#10b981', 'shopping-bag'),
  ((SELECT id FROM auth.users WHERE email = 'admin@phoneflow.com'), 'eBay', '#3b82f6', 'shopping-cart'),
  ((SELECT id FROM auth.users WHERE email = 'admin@phoneflow.com'), 'Leboncoin', '#f59e0b', 'store');

-- Add sample phones
INSERT INTO phones (user_id, model, storage, color, imei, condition, purchase_price, purchase_date, purchase_account_id, notes, qr_code)
VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'admin@phoneflow.com'),
    'iPhone 14 Pro',
    '256GB',
    'Space Black',
    '123456789012345',
    'Excellent',
    800.00,
    '2024-01-15',
    (SELECT id FROM purchase_accounts WHERE name = 'Vinted' LIMIT 1),
    'Perfect condition, no scratches',
    '{"phoneId": "xxx", "imei": "123456789012345"}'
  );
```

## Features

### Security
- PIN-based authentication (4-6 digits)
- Auto-lock after 30 minutes of inactivity
- Session management
- Audit logging

### Inventory Management
- Complete CRUD operations for phones
- Search and advanced filters
- QR code generation
- Auto-generate listings for Vinted/Leboncoin/eBay
- Duplicate phones
- Track purchase accounts

### Repairs
- Track all repairs per phone
- Status workflow: Pending → In Progress → Completed/Failed
- Cost tracking
- Technician assignment
- Photo attachments

### Analytics
- Comprehensive business intelligence
- Profit/loss tracking
- ROI calculations
- Monthly performance charts
- Top performing models
- Account-based analysis

### Settings
- Change PIN
- Manage purchase accounts
- CSV import/export
- Data management

### QR Scanner
- Scan phone QR codes
- Quick access to phone details
- Camera integration

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Charts**: Recharts
- **QR Codes**: qrcode.react + html5-qrcode
- **CSV**: PapaParse
- **Security**: bcrypt.js

## Design Features

- Dark AMOLED theme (#000000 base)
- Violet/Fuchsia/Blue gradients
- Glassmorphism effects
- GPU-optimized animations
- Responsive design
- Premium UI components

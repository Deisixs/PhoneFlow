# PhoneFlow Pro

Enterprise-grade SaaS platform for managing a smartphone buy/repair/sell business.

## Features

### Authentication & Security
- **PIN-based Authentication**: 4-6 digit PIN for secure access
- **Auto-lock Session**: Automatically locks after 30 minutes of inactivity
- **Audit Logging**: Complete trail of all login/logout events
- **Session Management**: Lock/unlock functionality

### Inventory Management
- **Complete CRUD Operations**: Add, edit, delete, and duplicate phones
- **Advanced Search & Filters**: Search by model, IMEI, color with status filters
- **QR Code Generation**: Automatic QR code for each phone
- **Listing Generator**: Auto-generate listings for Vinted, Leboncoin, eBay
- **Purchase Account Tracking**: Track which account was used for each purchase
- **Financial Tracking**: Track purchase price, sale price, and profit per phone
- **Detailed Phone View**: Complete timeline and repair history

### Repairs Management
- **Full Repair Tracking**: Description, repair list, cost, technician
- **Status Workflow**: Pending → In Progress → Completed/Failed
- **Photo Attachments**: Optional photo/screenshot upload
- **Cost Auto-calculation**: Automatic total repair cost per phone
- **Timeline View**: Complete repair history per phone

### Analytics Dashboard
- **Key Metrics**: Total profit, revenue, ROI, margins
- **Visual Charts**: Monthly performance, revenue trends
- **Top Models Analysis**: Most profitable phone models
- **Account Analysis**: Performance per purchase account
- **Financial Summary**: Complete breakdown of costs and profits

### QR Scanner
- **Camera Integration**: Scan QR codes using device camera
- **Quick Access**: Instant navigation to phone details
- **Real-time Detection**: Fast and accurate scanning

### Settings
- **Change PIN**: Update authentication PIN anytime
- **Purchase Accounts**: Add/remove accounts with custom colors
- **CSV Export**: Export all data (phones + repairs)
- **CSV Import**: Import phone data (template provided)
- **Session Timeout**: Configurable auto-lock duration

## Design

### Visual Identity
- **Dark AMOLED Theme**: Pure black (#000000) background
- **Aurora Gradient**: Violet/Fuchsia/Blue/Magenta gradients
- **Glassmorphism**: Premium frosted glass effects
- **GPU-Optimized Animations**: Smooth, performant transitions
- **Responsive Design**: Mobile-first, works on all devices

### UI Components
- **Professional Layout**: Fixed sidebar, intelligent topbar
- **Interactive Cards**: Hover effects, smooth transitions
- **Empty States**: Beautiful placeholder states
- **Loading Skeletons**: Smooth loading experiences
- **Toast Notifications**: Non-intrusive feedback system

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom animations
- **Backend**: Supabase (PostgreSQL + Auth)
- **Charts**: Recharts
- **QR Codes**: qrcode.react + html5-qrcode
- **CSV**: PapaParse
- **Routing**: React Router v6
- **Security**: bcrypt.js for PIN hashing

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Modern web browser with camera access (for QR scanner)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run migrations in Supabase SQL Editor (see SETUP.md)

5. Start development server:
```bash
npm run dev
```

6. Build for production:
```bash
npm run build
```

## First Login

Since this uses a custom PIN authentication system, you need to create a user first:

1. Create an auth user in Supabase Dashboard (Authentication > Users)
2. Insert user profile with hashed PIN (see SETUP.md)
3. Login with email and PIN

Or use the test credentials:
- **Email**: admin@phoneflow.com
- **PIN**: 1234

## Usage

### Adding a Phone
1. Go to Inventory
2. Click "Add Phone"
3. Fill in all details (model, storage, IMEI, etc.)
4. Select purchase account
5. Add notes if needed
6. Save

### Tracking Repairs
1. Click on a phone in Inventory
2. View details modal
3. Add repair via Repairs page
4. Update status as work progresses
5. Mark as completed when done

### Viewing Analytics
1. Navigate to Analytics
2. View key metrics at the top
3. Explore monthly charts
4. Check top performing models
5. Analyze account performance

### Scanning QR Codes
1. Go to Scanner page
2. Click "Start Scanning"
3. Allow camera access
4. Point camera at QR code
5. Automatically redirects to phone details

## Database Schema

### Tables
- **users**: User profiles with PIN authentication
- **purchase_accounts**: Platforms used for purchases
- **phones**: Complete phone inventory
- **repairs**: Repair tracking per phone
- **audit_logs**: Security audit trail

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- PIN hashed with bcrypt
- Automatic session timeout

## Performance Optimizations

- **Code Splitting**: Dynamic imports for routes
- **Lazy Loading**: Load components as needed
- **GPU Acceleration**: Transform-based animations
- **Memoization**: React hooks optimization
- **Efficient Queries**: Optimized Supabase queries
- **Index Coverage**: Database indexes on key columns

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with camera API support

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact support.

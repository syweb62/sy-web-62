# Sushi Yaki Restaurant - Complete Website Backup
**Generated on:** January 15, 2025  
**Domain:** sushiyakiresto.com  
**Project:** Complete Restaurant Management System with Admin Dashboard

## 🏗️ PROJECT STRUCTURE

### Core Application Files
- **app/page.tsx** - Main homepage with hero section, gallery, testimonials
- **app/layout.tsx** - Root layout with metadata and SEO configuration
- **app/loading.tsx** - Global loading animation with sushi video
- **app/globals.css** - Global styles and custom CSS variables
- **app/client.tsx** - Client-side wrapper component

### Authentication System
- **app/signin/page.tsx** - User sign-in page
- **app/signup/page.tsx** - User registration page
- **app/reset-password/page.tsx** - Password reset request
- **app/reset-password/[token]/page.tsx** - Password reset with token
- **app/account/profile/page.tsx** - User profile management
- **app/account/security/page.tsx** - Password change and security

### Main Application Pages
- **app/menu/page.tsx** - Menu display with categories and ordering
- **app/cart/page.tsx** - Shopping cart with guest checkout
- **app/book/page.tsx** - Table reservation system
- **app/contact/page.tsx** - Contact information and form
- **app/gallery/page.tsx** - Image gallery with lightbox

### Admin Dashboard System
- **app/dashboard/layout.tsx** - Dashboard layout with admin authentication
- **app/dashboard/page.tsx** - Dashboard overview with statistics
- **app/dashboard/menu/page.tsx** - Menu management (CRUD operations)
- **app/dashboard/menu/new/page.tsx** - Add new menu items
- **app/dashboard/menu/[id]/edit/page.tsx** - Edit existing menu items
- **app/dashboard/orders/page.tsx** - Order management and status updates
- **app/dashboard/orders/[id]/page.tsx** - Individual order details
- **app/dashboard/customers/page.tsx** - Customer management and profiles
- **app/dashboard/reservations/page.tsx** - Reservation management
- **app/dashboard/analytics/page.tsx** - Business analytics and reports
- **app/dashboard/settings/page.tsx** - System configuration panel

### API Routes
- **app/api/auth/signin/route.ts** - User authentication endpoint
- **app/api/auth/signup/route.ts** - User registration endpoint
- **app/api/auth/signout/route.ts** - User logout endpoint
- **app/api/auth/session/route.ts** - Session management
- **app/api/auth/change-password/route.ts** - Password change
- **app/api/auth/reset-password/route.ts** - Password reset request
- **app/api/auth/reset-password-with-token/route.ts** - Password reset with token
- **app/api/orders/route.ts** - Order management API
- **app/api/reservations/route.ts** - Reservation management API

### Core Components
- **components/navbar.tsx** - Main navigation with mobile menu
- **components/footer.tsx** - Site footer with social links
- **components/loading-spinner.tsx** - Reusable loading component
- **components/loading-fallback.tsx** - Fallback loading states
- **components/global-loading-indicator.tsx** - Global loading overlay
- **components/optimized-image.tsx** - Performance-optimized images
- **components/image-fallback.tsx** - Image error handling
- **components/whatsapp-chat.tsx** - WhatsApp integration
- **components/responsive-grid.tsx** - Responsive layout grid

### Dashboard Components
- **components/dashboard/dashboard-sidebar.tsx** - Admin sidebar navigation
- **components/admin/admin-guard.tsx** - Admin access control
- **components/admin/role-manager.tsx** - User role management

### Menu System Components
- **components/menu/menu-client.tsx** - Client-side menu display
- **components/menu/menu-item-card.tsx** - Individual menu item display
- **components/menu/category-filter.tsx** - Menu category filtering

### UI Components (Shadcn/UI)
- **components/ui/button.tsx** - Button component with variants
- **components/ui/card.tsx** - Card layout component
- **components/ui/input.tsx** - Form input component
- **components/ui/select.tsx** - Dropdown select component
- **components/ui/dialog.tsx** - Modal dialog component
- **components/ui/toast.tsx** - Notification toast system
- **components/ui/skeleton.tsx** - Loading skeleton placeholders
- **components/ui/chart.tsx** - Chart components for analytics
- **components/ui/order-button.tsx** - Add to cart button
- **components/ui/cart-button.tsx** - Cart icon with item count
- **components/ui/navigation-menu.tsx** - Navigation menu component

### Utility Libraries
- **lib/supabase.ts** - Client-side Supabase configuration
- **lib/supabase-server.ts** - Server-side Supabase client
- **lib/auth.ts** - Authentication utilities
- **lib/auth-utils.ts** - Additional auth helper functions
- **lib/utils.ts** - General utility functions
- **lib/constants.ts** - Application constants
- **lib/performance-monitor.ts** - Performance monitoring
- **lib/performance-utils.ts** - Performance optimization utilities

### Custom Hooks
- **hooks/use-auth.tsx** - Authentication state management
- **hooks/use-order-system.tsx** - Order management logic
- **hooks/use-location.tsx** - Location services
- **hooks/use-mobile.tsx** - Mobile device detection
- **hooks/use-toast.ts** - Toast notification system

### Configuration Files
- **next.config.mjs** - Next.js configuration with optimizations
- **tailwind.config.ts** - Tailwind CSS configuration
- **tsconfig.json** - TypeScript configuration
- **package.json** - Dependencies and scripts
- **vercel.json** - Vercel deployment configuration
- **middleware.ts** - Next.js middleware for auth and routing

### Database Scripts
- **scripts/safe-supabase-setup.sql** - Complete database setup
- **scripts/admin-role-setup.sql** - Admin role configuration
- **scripts/database-optimization-dhaka-timezone.sql** - Timezone optimization
- **scripts/insert-sample-data.sql** - Sample data insertion
- **scripts/maintenance-cleanup.sql** - Database maintenance

### SEO and Performance Files
- **robots.txt** - Search engine crawling rules
- **sitemap.xml** - Site structure for search engines
- **next-sitemap.config.js** - Automated sitemap generation

### Static Assets
- **public/images/sushiyaki-logo.png** - Restaurant logo
- **publichttps://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sushi-WzZ2UHMg1btadwhv7RV7IOmU32iVTF.webm** - Loading animation video
- **public/placeholder.svg** - Placeholder images

## 🗄️ DATABASE SCHEMA

### Tables Structure
1. **profiles** - User profiles with roles (admin/user)
2. **menu_items** - Restaurant menu with categories and pricing
3. **orders** - Customer orders with status tracking
4. **order_items** - Individual items within orders
5. **reservations** - Table booking system
6. **social_media_links** - Social media integration

### Key Features
- Row Level Security (RLS) policies
- Guest checkout support
- Bangladesh Dhaka timezone configuration
- Performance indexes on frequently queried columns
- Automatic timestamp management

## 🔧 ENVIRONMENT VARIABLES

### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SITE_URL` - Production domain (sushiyakiresto.com)
- `NEXT_PUBLIC_WHATSAPP_PHONE` - WhatsApp contact number

### Demo Credentials
- `DEMO_ADMIN_EMAIL` - Admin demo account
- `DEMO_ADMIN_PASSWORD` - Admin demo password
- `DEMO_USER_EMAIL` - User demo account
- `DEMO_USER_PASSWORD` - User demo password

## 🚀 DEPLOYMENT CONFIGURATION

### Vercel Settings
- **Domain:** sushiyakiresto.com
- **Framework:** Next.js 15.2.4
- **Node Version:** 18.x
- **Build Command:** `pnpm build`
- **Install Command:** `pnpm install`

### Performance Optimizations
- Image optimization with Next.js Image component
- Bundle analysis and code splitting
- Automatic sitemap generation
- SEO metadata optimization
- Responsive design with mobile-first approach

## 🎨 DESIGN SYSTEM

### Color Palette
- **Primary Gold:** #FFD700 (rgb(255, 215, 0))
- **Secondary Red:** #DC2626 (rgb(220, 38, 38))
- **Teal Accent:** #30C8D6 (rgb(48, 200, 214))
- **Dark Background:** #0A0F14
- **Text Colors:** White, Gray variants

### Typography
- **Headings:** Playfair Display (serif)
- **Body Text:** Poppins (sans-serif)
- **Responsive scaling:** Mobile-first approach

### Layout System
- **Container:** Max-width 1200px, centered
- **Grid:** CSS Grid and Flexbox
- **Breakpoints:** Mobile (768px), Tablet (1024px), Desktop (1200px+)

## 🔐 SECURITY FEATURES

### Authentication
- Supabase Auth with email/password
- Role-based access control (admin/user)
- Protected routes with middleware
- Session management and refresh tokens

### Data Protection
- Row Level Security policies
- Input validation and sanitization
- CSRF protection
- Secure API endpoints

## 📱 FEATURES OVERVIEW

### Customer Features
- Browse menu with categories and search
- Add items to cart with quantity selection
- Guest checkout (no account required)
- Table reservation system
- User account management
- Order history and tracking
- WhatsApp integration for support

### Admin Features
- Complete dashboard with analytics
- Menu management (CRUD operations)
- Order management and status updates
- Customer management and profiles
- Reservation management
- Business analytics and reports
- System settings and configuration
- Role management for users

### Technical Features
- Server-side rendering (SSR)
- Static site generation (SSG) where applicable
- Real-time data updates
- Responsive design for all devices
- SEO optimization
- Performance monitoring
- Error boundary handling
- Loading states and animations

## 🌐 INTEGRATIONS

### Supabase Database
- PostgreSQL with real-time subscriptions
- Authentication and user management
- File storage for images
- Row Level Security policies

### External Services
- WhatsApp Business API integration
- Social media links management
- Email notifications (configurable)
- Analytics tracking (ready for Google Analytics)

## 📊 ANALYTICS DASHBOARD

### Metrics Tracked
- Revenue and sales trends
- Order volume and patterns
- Customer acquisition and retention
- Menu item popularity
- Reservation patterns
- Performance metrics

### Reporting Features
- Interactive charts and graphs
- Date range filtering
- Export functionality
- Real-time updates
- Mobile-responsive design

## 🔄 BACKUP AND MAINTENANCE

### Database Maintenance
- Automated cleanup scripts
- Performance optimization queries
- Regular vacuum operations
- Index maintenance

### Code Maintenance
- TypeScript for type safety
- ESLint and Prettier for code quality
- Component-based architecture
- Reusable utility functions

---

**This backup contains the complete codebase and configuration for the Sushi Yaki restaurant website. The system is production-ready with comprehensive admin dashboard, customer features, and database integration.**

**Last Updated:** January 15, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅

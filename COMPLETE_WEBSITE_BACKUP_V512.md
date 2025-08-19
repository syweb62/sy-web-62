# Complete Website Backup - Sushi Yaki Restaurant
**Backup Date:** January 19, 2025  
**Version:** v512 (Reverted from v510)  
**Status:** Production Ready with Working Google OAuth

## System Overview
- **Framework:** Next.js 15 with App Router
- **Database:** Supabase with PostgreSQL
- **Authentication:** Email/Password + Google OAuth
- **Deployment:** Vercel with custom domain
- **Styling:** Tailwind CSS with shadcn/ui components

## Database Schema
\`\`\`sql
-- Core Tables
- profiles (user management)
- menu_items (restaurant menu)
- orders (customer orders with short_order_id)
- order_items (order line items)
- reservations (table bookings)
- social_media_links (social media management)
- bd_time_migrations (timezone handling)

-- Key Features
- Row Level Security (RLS) policies
- UUID primary keys with short order IDs
- Bangladesh timezone support
- Real-time subscriptions
\`\`\`

## Authentication System
- **Email/Password:** Custom implementation with Supabase
- **Google OAuth:** Fully configured and working
- **Session Management:** Server-side with middleware
- **Security:** Rate limiting, CSRF protection, secure headers

## Core Features
- **Menu Management:** Dynamic menu with categories and pricing in BDT
- **Order System:** Cart functionality with short order IDs (e.g., "5157ux")
- **Reservation System:** Table booking with date/time selection
- **User Accounts:** Profile management and order history
- **Admin Dashboard:** Order management and analytics
- **Real-time Updates:** Live order status and notifications

## Environment Variables (Required)
\`\`\`
POSTGRES_URL=
POSTGRES_PRISMA_URL=
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_JWT_SECRET=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
SITE_URL=
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
NEXT_PUBLIC_WHATSAPP_PHONE=
\`\`\`

## File Structure
\`\`\`
app/
├── (auth)/
│   ├── signin/page.tsx (Email + Google OAuth)
│   └── auth/callback/page.tsx (OAuth callback)
├── account/
│   ├── orders/page.tsx (User order history)
│   └── security/page.tsx (Password management)
├── dashboard/
│   └── orders/page.tsx (Admin order management)
├── api/
│   ├── auth/ (Authentication endpoints)
│   ├── orders/ (Order management API)
│   └── reservations/ (Booking API)
├── cart/page.tsx (Shopping cart with checkout)
├── menu/page.tsx (Restaurant menu)
├── book/page.tsx (Table reservations)
├── contact/page.tsx (Contact with Google Maps)
├── about/page.tsx (Restaurant story)
└── layout.tsx (Root layout with providers)

components/
├── ui/ (shadcn/ui components)
├── auth/ (Authentication components)
├── admin/ (Admin dashboard components)
└── [feature-components]

hooks/
├── use-auth.tsx (Authentication hook)
├── use-cart.tsx (Shopping cart hook)
├── use-order-system.tsx (Order management)
└── use-order-history.tsx (Order tracking)

lib/
├── supabase.ts (Database client)
├── auth-utils.ts (Authentication utilities)
├── order-id-generator.ts (Short ID generation)
└── utils.ts (General utilities)
\`\`\`

## Key Configurations
- **next.config.mjs:** Production optimizations and security headers
- **middleware.ts:** Authentication and security middleware
- **tailwind.config.ts:** Custom styling configuration
- **vercel.json:** Deployment configuration

## Working Features Confirmed
✅ Database integration with all tables and RLS policies  
✅ Email/password authentication with session management  
✅ Google OAuth (works on live domain, blocked in v0-dev)  
✅ Order management with short order IDs  
✅ Shopping cart and checkout functionality  
✅ Menu display with categories and pricing  
✅ Table reservation system  
✅ User account management  
✅ Admin dashboard for order management  
✅ Contact page with Google Maps integration  
✅ Responsive design for all devices  
✅ Bangladesh timezone support  
✅ Security headers and CSRF protection  

## Deployment Status
- **Live Domain:** https://www.sushiyakiresto.com
- **Status:** Production ready
- **Last Deployment:** Version 512 (reverted from v510)
- **Google OAuth:** Working on live domain

## Notes
- Short order ID system generates user-friendly IDs like "5157ux", "98492"
- Google OAuth shows "This content is blocked" in v0-dev but works on live domain
- All Supabase integrations are fully functional
- System supports real-time updates and notifications
- Ready for dashboard integration

---
**Backup Created:** This backup captures the complete working state before dashboard integration.

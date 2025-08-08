# Complete Website Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Database Setup (Supabase)
- [ ] **Run SQL Scripts in Supabase SQL Editor:**
  \`\`\`sql
  -- 1. First run: setup-supabase-database-for-vercel-project.sql
  -- 2. Then run: update-order-items-table.sql
  \`\`\`

- [ ] **Verify Tables Created:**
  - `profiles` - User profiles
  - `menu_items` - Restaurant menu items
  - `orders` - Customer orders
  - `order_items` - Individual order items
  - `reservations` - Table reservations
  - `social_media_links` - Social media links

- [ ] **Check Sample Data:**
  - Menu items should be populated
  - Social media links should be populated

### 2. Environment Variables Setup

#### For Vercel Deployment:
\`\`\`bash
# Required Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Demo User Credentials (Optional)
DEMO_ADMIN_EMAIL=admin@sushiyaki.com
DEMO_ADMIN_PASSWORD=Admin123!
DEMO_USER_EMAIL=user@sushiyaki.com
DEMO_USER_PASSWORD=User123!
\`\`\`

### 3. Feature Testing Checklist

#### Core Functionality:
- [ ] **Homepage**
  - Logo loads correctly
  - Cherry blossom animation works
  - Location selector functions
  - Gallery images load with hover effects
  - Testimonials display properly

- [ ] **Menu Page**
  - Menu items load with images
  - Search functionality works
  - Category filtering works
  - "Hide Unavailable" toggle works correctly
  - Order buttons add items to cart

- [ ] **Cart System**
  - Items can be added to cart
  - Quantity can be modified
  - Items can be removed
  - Checkout process works
  - Order confirmation works

- [ ] **Authentication**
  - Sign up process works
  - Sign in process works
  - User profile updates work
  - Password reset works (if implemented)

- [ ] **Navigation**
  - All menu links work
  - Mobile menu functions properly
  - User dropdown works
  - Cart counter updates

#### Database Operations:
- [ ] **Menu Items**
  - Can fetch all menu items
  - Can filter by category
  - Can search menu items
  - Availability status works

- [ ] **Orders**
  - Can create new orders
  - Can fetch user orders
  - Order items are properly linked

- [ ] **User Profiles**
  - Can create user profiles
  - Can update user information
  - Profile data persists

### 4. Performance & SEO
- [ ] **Images**
  - All images have proper alt text
  - Images are optimized
  - Lazy loading works

- [ ] **Responsive Design**
  - Works on mobile devices
  - Works on tablets
  - Works on desktop

- [ ] **Loading States**
  - Loading spinners show during operations
  - Error states are handled gracefully

## 🔧 Deployment Steps

### Step 1: Prepare Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project or use existing
3. Go to SQL Editor
4. Run the database setup scripts:
   \`\`\`sql
   -- Copy and paste scripts/setup-supabase-database-for-vercel-project.sql
   -- Then copy and paste scripts/update-order-items-table.sql
   \`\`\`
5. Verify tables are created in Table Editor
6. Note down your project URL and API keys

### Step 2: Deploy to Vercel
1. Push code to GitHub repository
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy the project

### Step 3: Post-Deployment Testing
1. Visit your deployed website
2. Go to `/test-supabase` page
3. Run comprehensive system test
4. Verify all features work:
   - Menu browsing
   - Cart operations
   - User authentication
   - Order placement

### Step 4: Final Configuration
1. **Update Supabase Auth Settings:**
   - Add your domain to allowed origins
   - Configure redirect URLs

2. **Test Production Environment:**
   - Test all user flows
   - Verify database operations
   - Check error handling

## 🐛 Troubleshooting Common Issues

### Database Connection Issues:
\`\`\`bash
# Check environment variables are set correctly
# Verify Supabase project is active
# Check RLS policies are properly configured
\`\`\`

### Authentication Issues:
\`\`\`bash
# Verify auth settings in Supabase
# Check redirect URLs are configured
# Ensure JWT secret is properly set
\`\`\`

### Cart/Order Issues:
\`\`\`bash
# Verify order_items table structure
# Check foreign key constraints
# Ensure RLS policies allow operations
\`\`\`

## 📊 Monitoring & Maintenance

### Regular Checks:
- [ ] Database performance
- [ ] Error logs in Vercel
- [ ] User feedback
- [ ] Menu item availability updates

### Updates:
- [ ] Menu items and prices
- [ ] Restaurant information
- [ ] Social media links
- [ ] Opening hours

## 🎯 Success Criteria

Your website is ready for public use when:
- [ ] All tests pass in `/test-supabase`
- [ ] Users can browse menu and place orders
- [ ] Authentication works properly
- [ ] Mobile experience is smooth
- [ ] No console errors in production
- [ ] Database operations are fast and reliable

## 📞 Support Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs

---

**Ready to go live? Follow this checklist step by step and your restaurant website will be fully functional!** 🍣✨

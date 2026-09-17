# ÉLANÉ — Build Phases

## ✅ Phase 1 — Architecture & Scaffold
- Monorepo: `backend/` (Express + TS) + `frontend/` (Vite + React + TS + Tailwind)
- Env validation (Zod), Pino logging, MongoDB retry connection
- Helmet, CORS, rate limiting, centralized error handler
- ApiError / ApiResponse / asyncHandler utilities
- Docker (backend + frontend Dockerfiles, docker-compose.yml)
- Design tokens: ivory/charcoal/gold palette, Playfair Display + Inter

## ✅ Phase 2 — Database Models & Product APIs
- Mongoose models: User, Category, Product (scent profile + pyramid), Review, Coupon, Cart, Order
- Product service: list with full filters/sort/pagination, slug lookup, related products, CRUD, stock
- Category service + controllers + routes
- Seed script: 25 named ÉLANÉ perfumes across 5 collections, admin + customer users, 3 coupons, sample order

## ✅ Phase 3 — Authentication
- JWT access + refresh token rotation with bcrypt hashing
- Register, login, logout, refresh, getMe, updateProfile, changePassword
- Auth middleware: verifyToken, requireRole, requireAdmin
- authLimiter for brute-force protection

## ✅ Phases 4–5 — Storefront + Cart/Wishlist
- Home: cinematic hero (parallax, word-reveal, floating bottle, glow), fragrance families grid,
  featured/best-sellers/new-arrivals sections, fragrance journey, editorial banner, newsletter
- Shop: filter panel (gender, family, concentration, rating), sort, URL-synced search, pagination, skeleton loading
- ProductDetail: image gallery, size selector, qty, add-to-cart, wishlist, scent profile bars (animated),
  fragrance pyramid (interactive notes), reviews section with submission
- ProductCard: hover zoom, wishlist toggle, quick-add
- Cart: full CRUD, qty controls, price breakdown (subtotal + shipping + GST)
- Wishlist: persisted server-side, animated interactions

## ✅ Phases 6–7 — Checkout, Orders, Reviews, Coupons, Find Your Scent
- Multi-step checkout: address → review → payment → confirm
- Coupon validation inline at checkout
- COD + Online payment method selection (Razorpay-ready architecture)
- Server-side price validation and stock deduction on order creation
- Orders list page with status badges
- Review submission with verified buyer detection
- Find Your Scent: 4-question quiz → deterministic recommendation → product results

## ✅ Phase 8 — Admin Dashboard
- Protected /admin/* (ADMIN role only)
- Dashboard: revenue, orders, customers, products, charts (by status, top products, by family/gender)
- Products table with status indicators
- Orders table with inline status dropdown updates
- Customers table with account toggle
- Inventory panel with per-size stock display
- Coupons panel with enable/disable toggle

## ✅ Phase 9 — Motion Design
- Framer Motion variants: fadeUp, fadeIn, slideIn, scaleIn, stagger, imageReveal, pageTransition
- Hero: GSAP-style sequential word reveal, floating bottle with glow + parallax scroll, floating note badges
- Scroll-triggered section reveals across all pages (whileInView)
- Fragrance Journey section: alternating slide-in panels
- Navbar: initial slide-down, scroll-compact, animated mobile drawer
- Product detail: scent profile bars animate on viewport entry

## 🔲 Phases 10–12 — Hardening (to complete locally)
- Razorpay payment integration (keys ready in .env.example)
- Cloudinary image upload for admin product management
- Email notifications (nodemailer / SendGrid)
- Jest unit tests for services
- SEO: react-helmet-async for dynamic meta tags
- Stricter CSP headers
- Production nginx config

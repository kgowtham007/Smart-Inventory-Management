# Smart Inventory & Supply Chain Management System
## Full Stack Developer Project Report

---

| Field | Details |
|-------|---------|
| **Project Title** | Smart Inventory & Supply Chain Management System |
| **Tech Stack** | React.js · Node.js · Express.js · MongoDB · Mongoose |
| **Project Type** | Full Stack Web Application |
| **Date** | October 2026 |
| **GitHub** | [github.com/kgowtham007/Smart-Inventory-Management](https://github.com/kgowtham007/Smart-Inventory-Management) |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [Feature Implementation](#5-feature-implementation)
6. [API Endpoint Documentation](#6-api-endpoint-documentation)
7. [Frontend Pages & Components](#7-frontend-pages--components)
8. [Testing Strategy](#8-testing-strategy)
9. [Folder Structure](#9-folder-structure)
10. [Local Setup Instructions](#10-local-setup-instructions)
11. [GitHub Repository](#11-github-repository)
12. [Demo Walkthrough Script](#12-demo-walkthrough-script)
13. [Evaluation Rubric Checklist](#13-evaluation-rubric-checklist)

---

## 1. Project Overview

The **Smart Inventory & Supply Chain Management System** is a production-ready, full-stack web application designed to help businesses manage their inventory in real time. It provides warehouse managers, clerks, and administrators with tools to:

- Track products with SKU, category, pricing, and stock levels
- Record stock movements (stock-in, stock-out, inventory adjustments)
- Manage supplier relationships and reorder thresholds
- View a live analytics dashboard with charts and metrics
- Enforce role-based access control across all operations

### Business Problem Solved

Manual inventory management leads to stockouts, overstock, and lost revenue. This system provides a centralized, role-gated platform where every stock movement is audited and every user is held accountable through JWT-secured access.

### Key Highlights

- **JWT Authentication** with bcrypt password hashing
- **3-tier Role System**: Admin → Manager → Clerk
- **Atomic Transactions** — MongoDB sessions guarantee stock integrity
- **Soft Delete** — Products and suppliers are never permanently removed
- **Real-time Dashboard** — Recharts bar chart, metric cards, low-stock alerts
- **Property-Based Testing** — 11 fast-check suites verify correctness invariants
- **Fully Responsive** — Tailwind CSS with collapsible sidebar on mobile

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│                                                          │
│   React 18 SPA  │  Tailwind CSS  │  Axios  │  Recharts  │
└──────────────────────────┬──────────────────────────────┘
                           │  HTTP/REST  (JWT Bearer Token)
                           ▼
┌─────────────────────────────────────────────────────────┐
│               NODE.JS / EXPRESS.JS API                   │
│                   (Port 5000)                            │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Auth       │  │  RBAC       │  │  Route Handlers  │ │
│  │  Middleware │  │  Middleware │  │  (Controllers)   │ │
│  │  (JWT)      │  │  (Roles)    │  │                  │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Global Error Middleware                 │   │
│  │    { success, data, message } envelope           │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │  Mongoose ODM
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     MONGODB                              │
│                                                          │
│  Users │ Categories │ Suppliers │ Products │ Transactions│
└─────────────────────────────────────────────────────────┘
```

### Request Lifecycle

1. Browser sends HTTP request with `Authorization: Bearer <jwt>`
2. `authMiddleware` extracts and verifies JWT → attaches `req.user`
3. `rbacMiddleware` checks role against route's allowed roles
4. Controller executes business logic via Mongoose models
5. Response returned in uniform envelope: `{ success, data, message }`
6. Uncaught errors bubble to global `errorMiddleware` → HTTP 500

### Frontend Architecture

```
App
├── AuthContext (JWT + user state, localStorage persistence)
├── Router
│   ├── /login         → Login page (public)
│   ├── /register      → Register page (public)
│   └── PrivateRoute   (requires JWT)
│       └── Layout (sidebar + toaster)
│           ├── /dashboard     → Dashboard page
│           ├── /products      → Products CRUD
│           ├── /categories    → Categories CRUD
│           ├── /suppliers     → Suppliers CRUD
│           ├── /transactions  → Transaction log
│           └── /users         → Users (admin only via RoleGuard)
```

---

## 3. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React.js | 18.2 | Component-based SPA |
| **Build Tool** | Vite | 5.2 | Fast dev server & bundler |
| **CSS Framework** | Tailwind CSS | 3.4 | Utility-first responsive styling |
| **Routing** | React Router | v6 | Client-side navigation |
| **HTTP Client** | Axios | 1.6 | API calls with interceptors |
| **Charts** | Recharts | 2.12 | Dashboard bar charts |
| **Notifications** | react-hot-toast | 2.4 | Success/error toasts |
| **Backend Runtime** | Node.js | 20+ | JavaScript server runtime |
| **API Framework** | Express.js | 4.18 | RESTful API server |
| **Authentication** | jsonwebtoken | 9.0 | JWT sign/verify |
| **Password Hashing** | bcryptjs | 2.4 | Secure password storage |
| **Validation** | express-validator | 7.0 | Server-side input validation |
| **Database** | MongoDB | 6+ | Document database |
| **ODM** | Mongoose | 7.x | Schema modeling & queries |
| **Backend Tests** | Jest + Supertest | 29.7 | Integration test runner |
| **In-Memory DB** | mongodb-memory-server | 9.1 | Isolated test database |
| **PBT Library** | fast-check | 3.19 | Property-based testing |
| **Frontend Tests** | Vitest + RTL | 1.4 | Component tests |
| **Dev Server** | nodemon | 3.1 | Auto-restart on file change |

---

## 4. Database Schema

### 4.1 User Collection

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `_id` | ObjectId | Auto-generated | Primary key |
| `name` | String | Required | Display name |
| `email` | String | Required, Unique, Indexed | Lowercase normalized |
| `passwordHash` | String | Required | bcrypt hash, never returned in JSON |
| `role` | String | Enum: admin/manager/clerk | Default: `clerk` |
| `createdAt` | Date | Auto | Mongoose timestamps |
| `updatedAt` | Date | Auto | Mongoose timestamps |

### 4.2 Category Collection

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `_id` | ObjectId | Auto-generated | Primary key |
| `name` | String | Required, Unique | Category label |
| `description` | String | Optional | Free text |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

### 4.3 Supplier Collection

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `_id` | ObjectId | Auto-generated | Primary key |
| `name` | String | Required | Vendor name |
| `contactEmail` | String | Required, Unique | Vendor contact |
| `phone` | String | Optional | |
| `leadTimeDays` | Number | Required, ≥ 0 | Days to receive stock |
| `isDeleted` | Boolean | Default: false | Soft-delete flag |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

### 4.4 Product Collection

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `_id` | ObjectId | Auto-generated | Primary key |
| `name` | String | Required | Product name |
| `sku` | String | Required, Unique | Uppercase, indexed |
| `category` | ObjectId | Required, ref: Category | Foreign key |
| `quantity` | Number | Required, ≥ 0 | Current stock level |
| `unitPrice` | Number | Required, > 0 | Price per unit |
| `reorderThreshold` | Number | Required, ≥ 0 | Min before reorder alert |
| `supplier` | ObjectId | Required, ref: Supplier | Foreign key |
| `isDeleted` | Boolean | Default: false | Soft-delete flag |
| `lowStock` | Virtual | quantity < reorderThreshold | Computed, not stored |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

### 4.5 Transaction Collection

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `_id` | ObjectId | Auto-generated | Primary key |
| `product` | ObjectId | Required, ref: Product, Indexed | Foreign key |
| `type` | String | Enum: stock-in/stock-out/adjustment | Transaction type |
| `quantity` | Number | Required, ≥ 0 | Units transacted |
| `previousQuantity` | Number | Required | Snapshot before transaction |
| `delta` | Number | Required | Net change (+/-) |
| `performedBy` | ObjectId | Required, ref: User | Audit trail |
| `notes` | String | Optional | Free text |
| `createdAt` | Date | Auto, Indexed | For date-range queries |
| `updatedAt` | Date | Auto | |

### 4.6 Entity Relationship Diagram

```
User ────────────────────── Transaction
                                │
Category ──── Product ──────────┘
                │
Supplier ───────┘
```

---

## 5. Feature Implementation

### 5.1 User Authentication & Authorization

**Registration Flow:**
1. Client POST `/api/auth/register` with `{ name, email, password }`
2. express-validator checks email format and password length (≥ 8)
3. Duplicate email check → 409 if exists
4. `bcrypt.hash(password, 10)` → store hash
5. JWT signed with 24h expiry → returned with user object

**Login Flow:**
1. Client POST `/api/auth/login` with `{ email, password }`
2. Find user by email → `bcrypt.compare` hash
3. JWT returned on match; 401 "Invalid credentials" on failure

**JWT Middleware:**
- Extracts `Bearer <token>` from Authorization header
- Verifies with `jwt.verify()` → attaches decoded `req.user`
- Returns 401 on missing/expired/malformed token

**RBAC Middleware:**
```
rbacMiddleware(['admin', 'manager'])
```
- Checks `req.user.role` against allowed roles array
- Returns 403 if role not permitted

### 5.2 Full CRUD Operations

| Entity | Create | Read (List) | Read (Single) | Update | Delete |
|--------|--------|------------|--------------|--------|--------|
| Products | POST /api/products | GET /api/products | GET /api/products/:id | PUT /api/products/:id | DELETE (soft) |
| Categories | POST /api/categories | GET /api/categories | — | PUT /api/categories/:id | DELETE |
| Suppliers | POST /api/suppliers | GET /api/suppliers | — | PUT /api/suppliers/:id | DELETE (soft) |
| Transactions | POST /api/transactions | GET /api/transactions | — | — | — |
| Users | — | GET /api/users | — | PUT /api/users/:id (role) | — |

### 5.3 Transaction Atomicity

Stock movements use MongoDB sessions to prevent race conditions:

```
START session
  1. Find Product (locked in session)
  2. Validate (stock-out: check q ≤ Q)
  3. Compute new quantity
  4. Product.findByIdAndUpdate({ quantity: newQty }, { session })
  5. Transaction.create([...], { session })
COMMIT → both writes succeed
ROLLBACK → on any error, neither write persists → HTTP 500
```

This guarantees that if the Transaction record fails to save, the Product quantity is never changed.

### 5.4 Dashboard Analytics

All metrics computed server-side using MongoDB aggregation pipelines:

- **Summary**: `$match isDeleted:false` → `$group` to sum stock value, count low-stock items; separate `countDocuments` for 30-day transactions
- **Top Products**: `$match type:stock-out, last 30 days` → `$group by product, $sum quantity` → `$sort desc` → `$limit 5` → `$lookup product name`
- **Stock Movement**: `$match type:stock-in/out, last 30 days` → `$group by {date, type}` → fill all 30 days even if zero activity

### 5.5 Frontend Form Validation

All forms use controlled React components with pre-submit client-side validation:

| Field | Rule | Error Message |
|-------|------|--------------|
| Email | Regex: `/^\S+@\S+\.\S+$/` | "Enter a valid email address" |
| Password | Length ≥ 8 | "Password must be at least 8 characters" |
| Unit Price | > 0 | "Unit price must be greater than 0" |
| Quantity | ≥ 0 | "Quantity cannot be negative" |
| Required fields | Non-empty | "Field X is required" |

Validation runs **before** any API call. On server errors, the error message from `response.data.message` surfaces as a toast.

---

## 6. API Endpoint Documentation

### Uniform Response Envelope

Every API response uses this structure:

```json
{
  "success": true | false,
  "data": <payload> | null,
  "message": "Human readable string"
}
```

### Authentication Endpoints

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/api/auth/register` | None | — | Register new user |
| POST | `/api/auth/login` | None | — | Login & get JWT |

### User Management Endpoints

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/api/users` | JWT | admin | List all users |
| PUT | `/api/users/:id` | JWT | admin | Update user role |

### Category Endpoints

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/api/categories` | JWT | manager, admin | Create category |
| GET | `/api/categories` | JWT | all | List all categories |
| PUT | `/api/categories/:id` | JWT | manager, admin | Update category |
| DELETE | `/api/categories/:id` | JWT | manager, admin | Delete category |

### Supplier Endpoints

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/api/suppliers` | JWT | manager, admin | Create supplier |
| GET | `/api/suppliers` | JWT | all | List active suppliers |
| PUT | `/api/suppliers/:id` | JWT | manager, admin | Update supplier |
| DELETE | `/api/suppliers/:id` | JWT | manager, admin | Soft-delete supplier |

### Product Endpoints

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/api/products` | JWT | manager, admin | Create product |
| GET | `/api/products` | JWT | all | List products (paginated + filters) |
| GET | `/api/products/:id` | JWT | all | Get product (populated refs) |
| PUT | `/api/products/:id` | JWT | manager, admin | Update product (partial) |
| DELETE | `/api/products/:id` | JWT | manager, admin | Soft-delete product |

**Query Params for GET /api/products:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Items per page (default: 10) |
| `category` | ObjectId | Filter by category |
| `supplier` | ObjectId | Filter by supplier |
| `lowStock` | Boolean | Show only low-stock items |

### Transaction Endpoints

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/api/transactions` | JWT | clerk, manager, admin | Record transaction |
| GET | `/api/transactions` | JWT | all | List transactions (paginated) |

**Query Params for GET /api/transactions:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | Number | Page number |
| `limit` | Number | Items per page |
| `product` | ObjectId | Filter by product |
| `type` | String | stock-in / stock-out / adjustment |
| `startDate` | ISO Date | Start of date range |
| `endDate` | ISO Date | End of date range |

### Dashboard Endpoints

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/api/dashboard/summary` | JWT | manager, admin | Key metrics |
| GET | `/api/dashboard/top-products` | JWT | manager, admin | Top 5 outbound |
| GET | `/api/dashboard/stock-movement` | JWT | manager, admin | 30-day daily chart data |

### HTTP Status Code Reference

| Code | Scenario |
|------|---------|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation failure / business rule violation |
| 401 | Missing, expired, or malformed JWT |
| 403 | Insufficient role permissions |
| 404 | Resource not found / unknown route |
| 409 | Duplicate unique field (email, SKU, name) |
| 500 | Unhandled server error |
| 503 | Database unavailable |

---

## 7. Frontend Pages & Components

### 7.1 Pages

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Login | `/login` | Public | Email/password form with inline validation |
| Register | `/register` | Public | Name, email, password (≥ 8 chars) form |
| Dashboard | `/dashboard` | All auth | Metric cards, bar chart, low-stock list, top products |
| Products | `/products` | All auth | DataTable with pagination, low-stock badge, CRUD forms |
| Categories | `/categories` | All auth | Table with inline edit/delete forms |
| Suppliers | `/suppliers` | All auth | Table with lead time, inline CRUD |
| Transactions | `/transactions` | All auth | Filtered, paginated transaction log |
| Users | `/users` | Admin only | User list with inline role selector |

### 7.2 Shared Components

| Component | Purpose |
|-----------|---------|
| `Layout` | Sidebar + hamburger menu + Toaster wrapper |
| `PrivateRoute` | Redirects unauthenticated users to `/login` |
| `RoleGuard` | Conditionally renders children based on role |
| `DataTable` | Reusable paginated table with configurable columns |
| `MetricCard` | Colored card showing a labelled statistic |
| `StockMovementChart` | Recharts `BarChart` with grouped stock-in/out bars |
| `ToastProvider` | Global react-hot-toast `<Toaster />` instance |

### 7.3 Forms

| Form | Fields | Validation |
|------|--------|-----------|
| `ProductForm` | name, SKU, category, quantity, unitPrice, reorderThreshold, supplier | All required; price > 0; qty ≥ 0 |
| `CategoryForm` | name, description | Name required |
| `SupplierForm` | name, contactEmail, phone, leadTimeDays | Name, email (format), leadTime required |
| `TransactionForm` | product, type, quantity, notes | Product + type + quantity required; qty > 0 for in/out |

### 7.4 Axios Configuration

- **Base URL**: `VITE_API_URL` environment variable (default: `http://localhost:5000`)
- **Request interceptor**: Attaches `Authorization: Bearer <token>` from localStorage
- **Response interceptor**: On 401, clears stored token and redirects to `/login`

---

## 8. Testing Strategy

### 8.1 Backend Integration Tests (Jest + Supertest)

Test files run against an in-memory MongoDB instance (`mongodb-memory-server`). Each test suite isolates the database with `beforeEach/afterEach` clear hooks.

| Test File | Coverage |
|-----------|---------|
| `auth.test.js` | Register (201, 409, 400), Login (200, 401), token validation |
| `rbac.test.js` | Clerk blocked from product/supplier mutations, manager blocked from user management, admin full access |
| `products.test.js` | Full CRUD happy paths, duplicate SKU (409), 404 for missing ID, soft-delete, lowStock flag |
| `categories.test.js` | CRUD, duplicate name (409), delete blocked with products (400), delete empty category |
| `suppliers.test.js` | CRUD, duplicate email (409), soft-delete, partial update preserves fields |
| `transactions.test.js` | stock-in/out/adjustment, overdraft (400), atomic rollback, clerk access |
| `dashboard.test.js` | Summary metrics, top-products array, 30-day stock-movement data, clerk blocked (403) |

### 8.2 Property-Based Tests (fast-check — min 30 iterations each)

| Test File | Property Verified |
|-----------|------------------|
| `p4-unique-constraint.test.js` | Duplicate email/SKU/name → always 409 |
| `p5-invalid-credentials.test.js` | Random email+password pairs not matching → always 401, no JWT |
| `p6-malformed-tokens.test.js` | Random strings as Bearer tokens → always 401 |
| `p7-rbac.test.js` | Disallowed role on any protected route → always 403 |
| `p8-partial-updates.test.js` | Partial update leaves untouched fields unchanged |
| `p9-lowstock-flag.test.js` | `lowStock === (quantity < reorderThreshold)` for any pair |
| `p10-category-delete.test.js` | Category with ≥ 1 products → delete always 400 |
| `p11-stockin-invariant.test.js` | stock-in: new quantity === Q + q, delta === q |
| `p12-stockout-bounded.test.js` | q ≤ Q: succeeds; q > Q: 400, quantity unchanged |
| `p13-adjustment-exact.test.js` | adjustment: new quantity === v regardless of prior qty |
| `p14-api-envelope.test.js` | Every response has `{ success: bool, data: any, message: string }` |

### 8.3 Frontend Tests (Vitest + React Testing Library)

| Test File | Coverage |
|-----------|---------|
| `formValidation.test.jsx` | All forms: empty fields → inline errors, no API call; invalid email → error; short password → error |
| `toast.test.jsx` | Successful API call → `toast.success()`; failed API call → `toast.error()` with server message |

---

## 9. Folder Structure

```
smart-inventory-management/
│
├── README.md                    ← Setup guide & schema reference
├── API_DOCS.md                  ← Full API endpoint documentation
├── postman_collection.json      ← Importable Postman collection
├── DEMO_SCRIPT.md               ← 2-minute video walkthrough guide
├── PROJECT_REPORT.md            ← This document
│
├── backend/
│   ├── config/
│   │   └── db.js                ← MongoDB connection (dotenv)
│   ├── controllers/
│   │   ├── auth.js              ← Register, login
│   │   ├── categories.js        ← CRUD
│   │   ├── dashboard.js         ← Aggregation queries
│   │   ├── products.js          ← CRUD + soft-delete
│   │   ├── suppliers.js         ← CRUD + soft-delete
│   │   ├── transactions.js      ← Atomic stock movements
│   │   └── users.js             ← Admin user management
│   ├── middleware/
│   │   ├── auth.js              ← authMiddleware + rbacMiddleware
│   │   ├── error.js             ← Global error handler
│   │   └── notFound.js          ← 404 catch-all
│   ├── models/
│   │   ├── Category.js
│   │   ├── Product.js           ← includes lowStock virtual
│   │   ├── Supplier.js
│   │   ├── Transaction.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── dashboard.js
│   │   ├── products.js
│   │   ├── suppliers.js
│   │   ├── transactions.js
│   │   └── users.js
│   ├── tests/
│   │   ├── setup/
│   │   │   ├── globalSetup.js   ← Start MongoMemoryServer
│   │   │   ├── globalTeardown.js
│   │   │   └── testHelpers.js   ← Factory functions
│   │   ├── pbt/
│   │   │   ├── p4-unique-constraint.test.js
│   │   │   ├── p5-invalid-credentials.test.js
│   │   │   ├── p6-malformed-tokens.test.js
│   │   │   ├── p7-rbac.test.js
│   │   │   ├── p8-partial-updates.test.js
│   │   │   ├── p9-lowstock-flag.test.js
│   │   │   ├── p10-category-delete.test.js
│   │   │   ├── p11-stockin-invariant.test.js
│   │   │   ├── p12-stockout-bounded.test.js
│   │   │   ├── p13-adjustment-exact.test.js
│   │   │   └── p14-api-envelope.test.js
│   │   ├── auth.test.js
│   │   ├── categories.test.js
│   │   ├── dashboard.test.js
│   │   ├── products.test.js
│   │   ├── rbac.test.js
│   │   ├── suppliers.test.js
│   │   └── transactions.test.js
│   ├── utils/
│   │   └── response.js          ← sendSuccess / sendError helpers
│   ├── server.js                ← Express app entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── charts/
    │   │   │   └── StockMovementChart.jsx
    │   │   ├── ui/
    │   │   │   ├── DataTable.jsx
    │   │   │   ├── MetricCard.jsx
    │   │   │   ├── Pagination.jsx
    │   │   │   └── ToastProvider.jsx
    │   │   ├── Layout.jsx
    │   │   ├── PrivateRoute.jsx
    │   │   ├── RoleGuard.jsx
    │   │   └── Sidebar.jsx
    │   ├── contexts/
    │   │   └── AuthContext.jsx
    │   ├── forms/
    │   │   ├── CategoryForm.jsx
    │   │   ├── ProductForm.jsx
    │   │   ├── SupplierForm.jsx
    │   │   └── TransactionForm.jsx
    │   ├── lib/
    │   │   └── axios.js         ← Configured Axios instance
    │   ├── pages/
    │   │   ├── Categories.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Login.jsx
    │   │   ├── Products.jsx
    │   │   ├── Register.jsx
    │   │   ├── Suppliers.jsx
    │   │   ├── Transactions.jsx
    │   │   └── Users.jsx
    │   ├── tests/
    │   │   ├── formValidation.test.jsx
    │   │   ├── toast.test.jsx
    │   │   └── setup.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.js
    └── .env.example
```

---

## 10. Local Setup Instructions

### Prerequisites

- Node.js 18 or higher
- MongoDB 6+ running locally **or** a MongoDB Atlas URI
- npm 9+
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/kgowtham007/Smart-Inventory-Management.git
cd Smart-Inventory-Management
```

### Step 2: Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-inventory
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

Start the backend:

```bash
npm run dev        # Development (nodemon auto-restart)
# OR
npm start          # Production
```

The API will be available at: `http://localhost:5000`

### Step 3: Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The app will be available at: `http://localhost:5173`

### Step 4: Create an Admin User (Optional Seed)

```bash
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const hash = await bcrypt.hash('admin1234', 10);
  await User.create({ name: 'System Admin', email: 'admin@example.com', passwordHash: hash, role: 'admin' });
  console.log('Created: admin@example.com / admin1234');
  process.exit(0);
});
"
```

### Step 5: Run Tests

```bash
cd backend
npm test                   # All tests
npm run test:pbt           # Property-based tests only
```

```bash
cd frontend
npm test                   # Vitest frontend tests
```

### Default Credentials After Seeding

| Email | Password | Role |
|-------|---------|------|
| admin@example.com | admin1234 | admin |

---

## 11. GitHub Repository

### 🔗 Live Repository

[![GitHub](https://img.shields.io/badge/GitHub-Smart--Inventory--Management-181717?logo=github&logoColor=white&style=for-the-badge)](https://github.com/kgowtham007/Smart-Inventory-Management)

**URL:** [https://github.com/kgowtham007/Smart-Inventory-Management](https://github.com/kgowtham007/Smart-Inventory-Management)

> ✅ **Status:** Repository is live — all 100 source files pushed to `main` branch.

### Commit History

| SHA | Message | Branch |
|-----|---------|--------|
| `69d335d` | Initial commit: Smart Inventory & Supply Chain Management System | `main` |

### Clone & Run Locally

```bash
# Clone the repository
git clone https://github.com/kgowtham007/Smart-Inventory-Management.git
cd Smart-Inventory-Management

# Setup backend
cd backend
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev            # starts on http://localhost:5000

# Setup frontend (new terminal)
cd ../frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev            # starts on http://localhost:5173
```

### Repository Structure on GitHub

The repository will show:

```
smart-inventory-management/
├── 📁 backend/          Node.js + Express API
├── 📁 frontend/         React + Vite + Tailwind
├── 📄 README.md         Project overview & setup
├── 📄 API_DOCS.md       API reference
├── 📄 postman_collection.json
├── 📄 DEMO_SCRIPT.md
└── 📄 PROJECT_REPORT.md
```

### Recommended GitHub Repository Settings

- **Description**: "Smart Inventory & Supply Chain Management System — Full Stack (React + Node.js + MongoDB)"
- **Topics**: `react`, `nodejs`, `expressjs`, `mongodb`, `mongoose`, `jwt`, `tailwindcss`, `full-stack`, `inventory-management`
- **README**: Automatically displays from `README.md`

---

## 12. Demo Walkthrough Script

### 2-Minute Video Script

**[0:00 – 0:15] Opening**
> "This is the Smart Inventory & Supply Chain Management System — a full-stack web app built with React, Node.js, Express, and MongoDB. It supports three user roles: admin, manager, and clerk."

Show the login page.

**[0:15 – 0:30] Login as Admin**
> "I'll log in as admin to demonstrate full access."

- Enter `admin@example.com` / `admin1234` → click Sign in
- Dashboard loads with metric cards

**[0:30 – 0:50] Dashboard**
> "The dashboard shows total products, total stock value, low-stock count, and 30-day transaction activity — plus a bar chart of daily stock movements."

- Point to MetricCards
- Scroll to StockMovementChart and LowStockAlert list

**[0:50 – 1:10] Create a Category and Supplier**
> "Before adding a product, I'll create a category and supplier."

- Navigate to Categories → click "+ New Category" → fill "Industrial Tools" → Save
- Navigate to Suppliers → "+ New Supplier" → fill name, email, phone, lead time → Save
- Show success toasts

**[1:10 – 1:30] Create a Product**
> "Now let's add a product with a low reorder threshold to trigger the low-stock alert."

- Navigate to Products → "+ New Product"
- Fill: Name = "Power Drill", SKU = "DRILL-001", Category, Quantity = 3, Price = 89.99, Threshold = 10, Supplier
- Save → show success toast → point to Low Stock badge

**[1:30 – 1:45] Record a Transaction**
> "Let's record a stock-in transaction to replenish inventory."

- Navigate to Transactions → "+ Record Transaction"
- Select Power Drill, Type = Stock In, Quantity = 50 → Record
- Show the green delta (+50) in the transaction list

**[1:45 – 2:00] Wrap-up**
> "The application includes JWT authentication, three user roles, full inventory CRUD, atomic stock transactions, and a real-time analytics dashboard — all built with React, Node.js, Express, and MongoDB."

---

## 13. Evaluation Rubric Checklist

| Requirement | Status | Implementation |
|-------------|--------|---------------|
| **Frontend: React.js** | ✅ Complete | React 18 SPA with Vite |
| **Frontend: Tailwind CSS / Bootstrap** | ✅ Complete | Tailwind CSS 3.4 throughout |
| **Backend: Node.js + Express.js** | ✅ Complete | Express 4.18 REST API |
| **Database: MongoDB + Mongoose** | ✅ Complete | Mongoose 7.x with defined schemas |
| **User Authentication (JWT Login/Register)** | ✅ Complete | `/api/auth/register` + `/api/auth/login` |
| **Role-Based Authorization** | ✅ Complete | admin / manager / clerk with RBAC middleware |
| **CRUD — Entity 1 (Products)** | ✅ Complete | Full CRUD with soft-delete, SKU, lowStock flag |
| **CRUD — Entity 2 (Categories)** | ✅ Complete | Full CRUD with referential integrity guard |
| **CRUD — Entity 3 (Suppliers)** | ✅ Complete | Full CRUD with soft-delete |
| **CRUD — Entity 4 (Transactions)** | ✅ Complete | Create + read with atomic MongoDB sessions |
| **Dashboard with analytics/metrics** | ✅ Complete | 4 metric cards + Recharts bar chart + alerts |
| **Form validation** | ✅ Complete | Inline errors before API call on all forms |
| **Error handling** | ✅ Complete | Global middleware + uniform response envelope |
| **Toast notifications** | ✅ Complete | react-hot-toast for all success/error events |
| **README.md** | ✅ Complete | Architecture, schema, setup instructions |
| **API documentation** | ✅ Complete | `API_DOCS.md` with all endpoints |
| **Postman collection** | ✅ Complete | `postman_collection.json` with all routes |
| **Demo script** | ✅ Complete | `DEMO_SCRIPT.md` — 2-minute walkthrough |
| **Responsive UI** | ✅ Complete | Mobile sidebar collapses to hamburger at 768px |
| **Tests** | ✅ Complete | 7 integration + 11 PBT + 2 frontend test files |

---

*Report generated for academic/professional evaluation. All source code is located in the `smart-inventory-management/` directory.*

# Smart Inventory & Supply Chain Management System

A production-ready full-stack web application for tracking products, managing stock levels, recording transactions, and overseeing supplier relationships.

---

## Project Overview

This system provides warehouse managers, inventory clerks, and administrators with real-time visibility into stock movement, low-stock alerts, and operational analytics. It enforces role-based access control so each user role only sees and can perform the operations appropriate to their level.

**Live roles:**
| Role | Capabilities |
|------|-------------|
| `admin` | Full access including user management |
| `manager` | Manage products, categories, suppliers, transactions, view dashboard |
| `clerk` | Record transactions, view products |

---

## System Architecture

```
Browser (React SPA)
     │
     │  HTTP/REST  (Axios with JWT Bearer token)
     ▼
Express.js REST API  (Node.js, port 5000)
     │
     ├─ Auth Middleware  (JWT verification)
     ├─ RBAC Middleware  (role enforcement)
     ├─ Route Handlers → Controllers → Mongoose Models
     └─ Global Error Middleware
     │
     ▼
MongoDB (Mongoose ODM)
```

All API responses use a consistent envelope:
```json
{ "success": true|false, "data": <payload|null>, "message": "<string>" }
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| State / Auth | React Context API |
| HTTP Client | Axios (with interceptors) |
| Charts | Recharts |
| Notifications | react-hot-toast |
| Backend | Node.js 20+, Express 4 |
| Authentication | JSON Web Tokens (jsonwebtoken), bcryptjs |
| Validation | express-validator |
| Database | MongoDB 7, Mongoose 8 |
| Testing (backend) | Jest, Supertest, mongodb-memory-server, fast-check |
| Testing (frontend) | Vitest, React Testing Library |

---

## Database Schema

### User
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto |
| `name` | String | Required |
| `email` | String | Required, unique, indexed |
| `passwordHash` | String | bcrypt hash, never returned |
| `role` | String | `admin` / `manager` / `clerk`, default: `clerk` |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

### Category
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto |
| `name` | String | Required, unique |
| `description` | String | Optional |

### Supplier
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto |
| `name` | String | Required |
| `contactEmail` | String | Required, unique |
| `phone` | String | Optional |
| `leadTimeDays` | Number | Required, ≥ 0 |
| `isDeleted` | Boolean | Soft-delete flag, default: false |

### Product
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto |
| `name` | String | Required |
| `sku` | String | Required, unique, uppercase |
| `category` | ObjectId | ref: Category |
| `quantity` | Number | Required, ≥ 0 |
| `unitPrice` | Number | Required, > 0 |
| `reorderThreshold` | Number | Required, ≥ 0 |
| `supplier` | ObjectId | ref: Supplier |
| `isDeleted` | Boolean | Soft-delete flag |
| `lowStock` | Virtual | `quantity < reorderThreshold` |

### Transaction
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto |
| `product` | ObjectId | ref: Product, indexed |
| `type` | String | `stock-in` / `stock-out` / `adjustment` |
| `quantity` | Number | Amount transacted |
| `previousQuantity` | Number | Snapshot before transaction |
| `delta` | Number | Net change |
| `performedBy` | ObjectId | ref: User |
| `notes` | String | Optional |
| `createdAt` | Date | Indexed for date-range queries |

---

## Local Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6+ running locally **or** a MongoDB Atlas connection string

### 1. Clone the repository

```bash
git clone <repo-url>
cd smart-inventory-management
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-inventory
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

Start the server:
```bash
npm run dev      # development with nodemon
# or
npm start        # production
```

The API will be available at `http://localhost:5000`.

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:5000
```

Start the dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Seed an admin user (optional)

```bash
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const hash = await bcrypt.hash('admin1234', 10);
  await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: hash, role: 'admin' });
  console.log('Admin user created: admin@example.com / admin1234');
  process.exit(0);
});
"
```

### 5. Run tests

```bash
cd backend
npm test
```

---

## Project Structure

```
smart-inventory-management/
├── backend/
│   ├── config/db.js
│   ├── controllers/       auth, users, categories, suppliers, products, transactions, dashboard
│   ├── middleware/        auth.js, error.js, notFound.js
│   ├── models/            User, Category, Supplier, Product, Transaction
│   ├── routes/            auth, users, categories, suppliers, products, transactions, dashboard
│   ├── tests/             integration + PBT test suites
│   ├── utils/response.js
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    Layout, PrivateRoute, RoleGuard, UI components, Charts
│   │   ├── contexts/      AuthContext
│   │   ├── forms/         ProductForm, CategoryForm, SupplierForm, TransactionForm
│   │   ├── lib/           axios.js (configured instance)
│   │   ├── pages/         Dashboard, Products, Categories, Suppliers, Transactions, Users, Login, Register
│   │   └── tests/
│   └── .env.example
├── README.md
├── API_DOCS.md
├── postman_collection.json
└── DEMO_SCRIPT.md
```

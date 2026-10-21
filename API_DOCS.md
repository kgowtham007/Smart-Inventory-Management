# API Documentation

Base URL: `http://localhost:5000`

All responses use the envelope: `{ "success": boolean, "data": any|null, "message": string }`

Auth header for protected routes: `Authorization: Bearer <token>`

---

## Authentication

### POST /api/auth/register
Register a new user (defaults to `clerk` role).

**Body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "password123" }
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "name": "Alice", "email": "alice@example.com", "role": "clerk" }
  },
  "message": "User registered successfully"
}
```
**Errors:** 400 (validation), 409 (email exists)

---

### POST /api/auth/login
**Body:**
```json
{ "email": "alice@example.com", "password": "password123" }
```
**Response 200:**
```json
{
  "success": true,
  "data": { "token": "<jwt>", "user": { "id": "...", "name": "Alice", "email": "...", "role": "clerk" } },
  "message": "Login successful"
}
```
**Errors:** 400 (validation), 401 (invalid credentials)

---

## Users (Admin only)

### GET /api/users
Returns all users.
**Response 200:** `{ "data": [ { "_id", "name", "email", "role", "createdAt" }, ... ] }`

### PUT /api/users/:id
Update a user's role.
**Body:** `{ "role": "manager" }`
**Response 200:** `{ "data": { updated user object } }`

---

## Categories

### POST /api/categories _(manager, admin)_
**Body:** `{ "name": "Electronics", "description": "..." }`
**Response 201**
**Errors:** 400 (missing name), 409 (duplicate name)

### GET /api/categories _(authenticated)_
**Response 200:** `{ "data": [ { "_id", "name", "description" }, ... ] }`

### PUT /api/categories/:id _(manager, admin)_
**Body:** `{ "name": "Updated Name" }`
**Response 200**

### DELETE /api/categories/:id _(manager, admin)_
**Response 200** / **400** if products are assigned

---

## Suppliers

### POST /api/suppliers _(manager, admin)_
**Body:** `{ "name": "Acme", "contactEmail": "acme@example.com", "phone": "+1234", "leadTimeDays": 7 }`
**Response 201**
**Errors:** 409 (duplicate email)

### GET /api/suppliers _(authenticated)_
Returns non-deleted suppliers.

### PUT /api/suppliers/:id _(manager, admin)_
Partial update — only supplied fields are changed.

### DELETE /api/suppliers/:id _(manager, admin)_
Soft-delete. **Response 200**

---

## Products

### POST /api/products _(manager, admin)_
**Body:**
```json
{
  "name": "Widget A", "sku": "WIDGET-A",
  "category": "<categoryId>", "quantity": 100,
  "unitPrice": 9.99, "reorderThreshold": 20,
  "supplier": "<supplierId>"
}
```
**Response 201**
**Errors:** 400 (validation), 409 (duplicate SKU)

### GET /api/products _(authenticated)_
**Query params:** `page`, `limit`, `category` (id), `supplier` (id), `lowStock` (true/false)
**Response 200:** `{ "data": { "products": [...], "total": N, "page": N, "limit": N } }`

Each product includes a `lowStock` boolean virtual field.

### GET /api/products/:id _(authenticated)_
Returns populated category and supplier names.
**Errors:** 404

### PUT /api/products/:id _(manager, admin)_
Partial update.

### DELETE /api/products/:id _(manager, admin)_
Soft-delete (sets `isDeleted: true`).

---

## Transactions

### POST /api/transactions _(clerk, manager, admin)_
**Body:**
```json
{ "product": "<productId>", "type": "stock-in", "quantity": 50, "notes": "Received shipment" }
```
**Types:** `stock-in`, `stock-out`, `adjustment`
- `stock-in`: increments product quantity
- `stock-out`: decrements (400 if quantity > current stock)
- `adjustment`: sets product quantity to the given value

**Response 201:** `{ "data": <transaction with populated product and performedBy> }`
**Errors:** 400 (validation, insufficient stock), 404 (product not found), 500 (DB error — rolls back)

### GET /api/transactions _(authenticated)_
**Query params:** `page`, `limit`, `product` (id), `type`, `startDate`, `endDate`
**Response 200:** `{ "data": { "transactions": [...], "total": N } }`

---

## Dashboard (manager, admin)

### GET /api/dashboard/summary
**Response 200:**
```json
{
  "data": {
    "totalProducts": 45,
    "totalStockValue": 12500.00,
    "lowStockCount": 3,
    "recentTransactions": 28
  }
}
```

### GET /api/dashboard/top-products
Top 5 products by stock-out volume in the last 30 days.
**Response 200:**
```json
{
  "data": [
    { "productId": "...", "productName": "Widget A", "sku": "WIDGET-A", "totalOutbound": 120 },
    ...
  ]
}
```

### GET /api/dashboard/stock-movement
Daily stock-in/stock-out totals for the last 30 days.
**Response 200:**
```json
{
  "data": [
    { "date": "2026-09-22", "stockIn": 50, "stockOut": 30 },
    ...
  ]
}
```

---

## Error Responses

| HTTP | Scenario |
|------|---------|
| 400 | Validation failure / business rule violation |
| 401 | Missing, expired, or malformed JWT |
| 403 | Insufficient role |
| 404 | Resource not found / unknown route |
| 409 | Duplicate unique field |
| 500 | Unhandled server error |
| 503 | Database unavailable |

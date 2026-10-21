# 2-Minute Demo Walkthrough Script

Use this script to record a demo video showcasing the Smart Inventory Management System.

---

## Recording Setup

- Use OBS Studio, Loom, or any screen recorder
- Set resolution to 1280×720 or higher
- Open both `http://localhost:5173` (frontend) and the browser network tab (optional)
- Have a terminal open in the background showing the running backend

---

## Script (≈ 2 minutes)

### [0:00 – 0:15] Introduction
> "This is the Smart Inventory & Supply Chain Management System — a full-stack application built with React, Node.js, Express, and MongoDB. Let me walk through the key features."

**Action:** Show the login page at `/login`.

---

### [0:15 – 0:30] Login as Admin
> "I'll log in as an admin user to show the full feature set."

**Action:**
1. Enter `admin@example.com` / `admin1234`
2. Click **Sign in**
3. Show the dashboard loading with metric cards

---

### [0:30 – 0:50] Dashboard
> "The dashboard shows real-time metrics: total products, total stock value, low-stock count, and transaction activity over the last 30 days — plus a bar chart of stock movements."

**Action:**
1. Point to the 4 MetricCards
2. Scroll down to show the bar chart and low-stock alerts

---

### [0:50 – 1:05] Create a Product
> "Let's add a new product. I'll navigate to the Products page."

**Action:**
1. Click **Products** in the sidebar
2. Click **+ New Product**
3. Fill in: Name = `Demo Widget`, SKU = `DEMO-01`, Category (pick one), Quantity = `5`, Unit Price = `24.99`, Reorder Threshold = `10`, Supplier (pick one)
4. Click **Save** — show the success toast
5. Point to the **Low Stock** badge (quantity 5 < threshold 10)

---

### [1:05 – 1:25] Record Transactions
> "Now let's record a stock-in transaction to replenish the inventory."

**Action:**
1. Click **Transactions** in the sidebar
2. Click **+ Record Transaction**
3. Select `Demo Widget`, Type = `Stock In`, Quantity = `50`
4. Click **Record** — show the success toast
5. Show the transaction in the list with the green delta

---

### [1:25 – 1:40] Stock Out & Validation
> "Let me show what happens when we try to withdraw more than we have."

**Action:**
1. Click **+ Record Transaction** again
2. Select `Demo Widget`, Type = `Stock Out`, Quantity = `999`
3. Click **Record**
4. Show the error toast: "Insufficient stock..."

---

### [1:40 – 1:55] User Management (Admin)
> "As an admin I can manage user roles directly from the Users page."

**Action:**
1. Click **Users** in the sidebar (only visible to admins)
2. Show the user list
3. Change a user's role dropdown from `clerk` to `manager`
4. Show the success toast

---

### [1:55 – 2:00] Wrap-up
> "That covers the core features: JWT auth, role-based access control, full CRUD inventory management, atomic transaction recording, and a live analytics dashboard."

**Action:** Show the dashboard one more time and end recording.

---

## Tips
- Record at 1x speed, then speed up to 1.5x in editing if needed
- Use zoom-in on forms to make text legible
- Narrate what you're doing at each step for clarity

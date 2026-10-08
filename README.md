# Smart Online Food Ordering and Restaurant Management System

A polished full-stack food ordering platform built as a university DBMS project. This system supports customers, restaurant owners, delivery agents, and administrators in a complete real-world workflow.

---

## ⭐ Project Overview

This project simulates a full food delivery ecosystem where users can search restaurants, build orders, and track delivery progress. Restaurant owners manage menus and accept orders, while admins monitor system performance and approve restaurants.

The app is built with a clean separation of frontend and backend logic, and uses a normalized MySQL database to model users, restaurants, menus, carts, orders, payments, reviews, and deliveries.

---

## 🚀 Key Features

- Customer registration, login, and profile management
- Restaurant browsing and menu selection
- Cart persistence with restaurant validation
- Checkout flow with payment simulation
- Order status tracking from placement to delivery
- Restaurant owner menu management and order ticket handling
- Delivery agent status tracking and milestone updates
- Admin KPI dashboard, restaurant approvals, and reports
- JWT-based authentication with role authorization

---

## 🧠 What I Learned

- Designing a normalized relational database schema for complex real-world relationships
- Building REST APIs using Node.js, Express, and MySQL
- Implementing role-based authentication with JWT and protecting routes
- Hashing passwords securely using `bcryptjs`
- Managing frontend state and persistence with `localStorage`
- Building responsive UI and dynamic DOM updates in vanilla JavaScript
- Structuring a maintainable full-stack application with clear separation of concerns

---

## 🛠️ Technologies Used

- Node.js
- Express.js
- MySQL
- JSON Web Tokens (JWT)
- bcryptjs
- dotenv
- CORS
- Morgan
- HTML, CSS, JavaScript

---

## 📁 Project Structure

- `client/` — frontend pages, styles, and scripts
- `server/` — backend controllers, routes, middleware, models, and entry point
- `database/` — database schema and sample data
- `.gitignore` — excludes sensitive and generated files
- `README.md` — project documentation

---

## ⚙️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure MySQL Database

Create a MySQL database and run:

```sql
CREATE DATABASE food_order_db;
USE food_order_db;
```

Then execute the SQL files in the `/database` folder:
- `schema.sql`
- `sample_data.sql`

### 3. Create `.env`

Add a `.env` file to the project root with this content:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=food_order_db
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

### 4. Run the Server

```bash
npm run dev
```

### 5. Open the Client

Open `client/index.html` in your browser or serve the client folder using a local static server.

---

## 🔐 Sample Test Accounts

Password for all demo accounts: `password123`

| Role | Email | Notes |
| --- | --- | --- |
| Admin | `admin@foodorder.com` | Access admin dashboard |
| Owner 1 | `owner1@foodorder.com` | Manage restaurant menu |
| Owner 2 | `owner2@foodorder.com` | Manage restaurant menu |
| Customer 1 | `john@customer.com` | Browse and order food |
| Customer 2 | `sarah@customer.com` | Browse and order food |
| Delivery 1 | `delivery1@foodorder.com` | Update delivery status |
| Delivery 2 | `delivery2@foodorder.com` | Update delivery status |

---

## 📌 Notes

- Keep the `.env` file private.
- Use the admin dashboard for approvals and reports.
- Use the owner dashboard to update menus and process orders.
- The delivery page allows drivers to update pickup and delivery milestones.

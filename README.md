# Cinema Ticket Booking System

A full-stack movie ticket booking web application with atomic seat holds, concurrency conflict handling, and simulated payment processing. Built for a single-screen cinema with 80 seats (Rows A–H, Seats 1–10).

## 🚀 Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Lucide Icons, Glassmorphism Dark UI
- **Backend**: Node.js, Express, TypeScript, Zod, Bcrypt, JWT
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Testing**: Vitest, Supertest
- **Containerization**: Docker Compose

---

## ⚡ Concurrency & Architecture Guarantees
- **Atomic Multi-Seat Hold**: Reserve 1 to 6 seats for 5 minutes using PostgreSQL pessimistic row locking (`SELECT ... FOR UPDATE`).
- **Deadlock Prevention**: Seats are deterministically sorted by `seatId ASC` before row locks are acquired.
- **Zero Double-Booking**: Guaranteed at database level with row locking and composite unique constraints `(showId, seatId)`.
- **Payment Simulation & Retry**:
  - Payment failure keeps the 5-minute hold intact so customers can retry before it expires.
  - Expired holds are rejected atomically even before background cleanups run.
- **Schedule Conflict Prevention**: Shows reject overlapping time slots on Screen 1 with a 15-minute cleaning turnaround buffer.
- **Strict Customer Isolation**: Customers can only view their own booking receipts (`userId == req.user.id`).
- **Admin Guard**: Server-side role guard (`requireAdmin`) protects show scheduling and movie management.

---

## 📁 Monorepo Structure
```text
Movie-Ticket/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Relational models, enums & constraints
│   │   └── seed.ts             # Seeds Screen 1, 80 seats, Admin & movies
│   ├── src/
│   │   ├── app.ts              # Express app & centralized error handling
│   │   ├── server.ts           # HTTP server listener
│   │   ├── config/             # Typed env variables
│   │   ├── controllers/        # Auth, movie, show & booking controllers
│   │   ├── middlewares/        # Auth, admin guard & Zod validation
│   │   ├── routes/             # REST endpoints
│   │   ├── services/           # Concurrency & pessimistic lock engine
│   │   ├── utils/              # asyncHandler, AppError, JWT & db client
│   │   └── validators/         # Zod schemas
│   └── tests/                  # Concurrency & endpoint test suite
├── frontend/
│   ├── src/
│   │   ├── api/                # Fetch client with Bearer token interceptor
│   │   ├── components/         # 80-seat grid, hold countdown, modals & navbar
│   │   ├── context/            # AuthContext with token persistence
│   │   ├── pages/              # Movie list, Seat picker, Receipts, Admin
│   │   ├── types/              # TypeScript models
│   │   └── index.css           # Custom glassmorphism design tokens
├── docker-compose.yml          # PostgreSQL 16 container definition
└── package.json                # Workspaces configuration
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/) OR local PostgreSQL

### 2. Start PostgreSQL Database
```bash
# Using Docker:
docker compose up -d

# Or ensure PostgreSQL is running locally on port 5432 with DATABASE_URL in backend/.env
```

### 3. Install Dependencies
From the repository root:
```bash
npm install
```

### 4. Database Migration & Seeding
```bash
# Push schema to PostgreSQL:
npm run prisma:push -w backend

# Seed Screen 1 (80 seats A1-H10), Admin account, sample movies & show:
npm run prisma:seed -w backend
```

> **Default Seeded Accounts:**
> - **Admin**: `admin@cinema.com` / `Admin@12345Password!`
> - **Customer**: `customer@test.com` / `Customer@12345Password!`

### 5. Run the Application
In separate terminal tabs:
```bash
# Start Backend API (runs on http://localhost:5000)
npm run dev:backend

# Start Frontend (runs on http://localhost:5173)
npm run dev:frontend
```

---

## 🧪 Running Tests
```bash
npm run test:backend
```

---

## 📡 REST API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register customer account |
| `POST` | `/api/auth/login` | Public | Log in & receive JWT |
| `GET` | `/api/auth/me` | User | Get current profile |
| `GET` | `/api/movies` | Public | List active movies & upcoming shows |
| `GET` | `/api/shows/:id/seats` | Public / User | 80-seat map with live availability & hold countdowns |
| `POST` | `/api/shows/:id/hold` | User | Atomically hold 1–6 seats for 5 minutes (`FOR UPDATE`) |
| `POST` | `/api/bookings/:id/simulate-payment` | User | Simulate payment (`SUCCESS` or `FAILED` with retry) |
| `POST` | `/api/bookings/:id/release` | User | Voluntarily release held seats |
| `GET` | `/api/bookings/my` | User | View own booking receipts |
| `POST` | `/api/admin/shows` | Admin | Schedule show with overlap collision check |
| `GET` | `/api/admin/shows/:id/occupancy` | Admin | Real-time screen occupancy & revenue report |

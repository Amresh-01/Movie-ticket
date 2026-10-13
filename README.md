# Cinema Ticket Booking System

A full-stack movie ticket booking web application with atomic seat holds, concurrency conflict handling, and simulated payment processing. Built for a single-screen cinema with 80 seats (Rows A–H, Seats 1–10).

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Testing**: Vitest, Supertest
- **Containerization**: Docker Compose

## Key Features & Concurrency Guarantees
- **Atomic Multi-Seat Hold**: Reserve 1 to 6 seats for 5 minutes using PostgreSQL pessimistic row locking (`SELECT ... FOR UPDATE`).
- **Zero Double-Booking**: Guaranteed at database level with row locking and unique constraints `(showId, seatId)`.
- **Payment Simulation**: Complete booking upon payment confirmation or retry while hold is active.
- **Admin Management**: Schedule shows with automated overlap prevention and occupancy tracking.
- **Customer Privacy**: Strict server-side authorization ensuring customers access only their own bookings.

## Project Structure
```text
Movie-Ticket/
├── backend/
│   ├── prisma/             # Prisma schema, migrations and seed script
│   ├── src/
│   │   ├── config/         # Environment variables & constants
│   │   ├── controllers/    # API controllers
│   │   ├── middlewares/    # Authentication, validation & error handlers
│   │   ├── services/       # Core business & locking logic
│   │   └── utils/          # Database singleton & helpers
│   └── tests/              # Concurrency & integration tests
├── frontend/               # React + TypeScript + Vite app
├── docker-compose.yml      # Local PostgreSQL container configuration
└── package.json            # Monorepo workspace configuration
```

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Docker & Docker Compose or local PostgreSQL instance

### 2. Database Setup
Start the PostgreSQL container:
```bash
docker compose up -d
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Migration & Seeding
```bash
npm run prisma:generate -w backend
npm run prisma:push -w backend
npm run prisma:seed -w backend
```
*The seed script creates Screen 1, all 80 physical seats, demo movies, an upcoming show, and default admin credentials.*

### 5. Running the App
```bash
# Run backend (http://localhost:5000)
npm run dev:backend

# Run frontend (http://localhost:5173)
npm run dev:frontend
```

# 🎬 Yozigo — 3D Interactive Cinema Ticket Booking System

> **Full-Stack Engineering Intern Project Submission**  
> **Candidate:** Amresh Kumar  
> **Repository:** Monorepo (`frontend/`, `backend/`)  
> **Documentation:** [System Design & Architecture (SYSTEM_DESIGN.md)](./SYSTEM_DESIGN.md)

---

## 🌟 Overview & Key Highlights

**Yozigo** is an enterprise-ready movie ticket booking platform built with an emphasis on **real-time concurrency control, atomic seat reservation guarantees, and a realistic 3D cinema auditorium simulator**.

The application models a standard single-screen auditorium with **80 physical seats (Rows A–H, Seats 1–10)**, allowing customers to explore movie showtimes, view the auditorium in full 3D, and click any seat to preview the exact seated vantage and sightline looking directly at the live playing movie projection.

---

## ✨ Features Implemented (Flows 1 through 10)

### 1. User Authentication & Session Security
- User registration and login with salted Bcrypt password hashing and stateless JWT bearer authentication.
- Automatic session hydration on app load via `GET /api/auth/me`.
- Role-Based Access Control (`CUSTOMER` vs `ADMIN`).

### 2. Movie Catalog Discovery
- Filter movies by genre, search by title or plot synopsis, and explore movie details with rating, runtime, and language.
- Responsive showcase hero banner featuring the headline cinema release.

### 3. Showtime Scheduling & Turnaround Collision Guard
- Admins can schedule shows with automated collision checks: prevents overlapping showtimes on Screen 1 with a mandatory **15-minute cleaning turnaround buffer**.

### 4. Interactive 3D Cinema Auditorium Simulator (Three.js & R3F)
- **80 Physical 3D Chairs**: Cushioned velvet seats with cup holders, armrests, and seat number badges.
- **Stadium Risers & Environment**: Tiered elevation steps, aisle runner carpet with safety glow strips, wall acoustic baffles, and illuminated emergency exit signs.
- **Dynamic Live Video Screen**: Projection screen displaying an active 60 FPS motion video generated directly from the movie picture with Ken Burns pan/zoom, film grain particles, and anamorphic lens flares.
- **Sightline Optical Inspection**: Click any seat in 2D or 3D to transition the camera to seated eye level (`[x, eyeY, z]`) looking at screen center with distance in meters, viewing angle, and screen coverage percent.
- **Instant Back to Overview**: Smoothly return to the full auditorium overview with orbit controls re-enabled.

### 5. Atomic Seat Holds & Concurrency Protection
- Select 1 to 6 seats and hold them atomically for **5 minutes (300s)**.
- **Zero Double-Booking Guarantee**: Utilizes PostgreSQL pessimistic row locks (`SELECT ... FOR UPDATE`).
- **Deadlock Prevention**: Deterministically sorts all `seatIds` alphabetically prior to acquiring locks.

### 6. Payment Simulation & Resilient Retry
- Modal with live countdown timer reflecting remaining hold seconds.
- Payment retry capability: simulated payment failure maintains the 5-minute hold intact so customers can retry before it expires.

### 7. Digital Ticket Pass & QR Barcode
- On successful payment, generates a ticket pass card with booking reference, seat numbers, screen name, showtime, and entrance barcode.

### 8. Self-Service Booking Cancellation
- Customers can cancel their own confirmed booking up to **2 hours before showtime**.
- Requests within 2 hours or for past shows are rejected with a clear explanation.
- Cancelled seats are immediately replenished back to inventory and the booking status updates to `CANCELLED`.

### 9. Admin Occupancy & Bookings Roster
- Displays total seats (80), booked seats, active holds, occupancy percentage, and total money collected per show.
- **Confirmed Bookings Roster**: Detailed table displaying Booking ID, Customer Name, Email, Booked Seats, Amount Paid, and Booking Timestamp.
- Full CRUD controls for movies (edit/deactivate) and shows (delete with confirmed booking protection).

### 10. Live Seat Updates (Real-Time State Polling)
- Automatic **3-second background polling** on open seat selection maps.
- When another user holds or books a seat, the seat map reflects the updated state in near real-time without requiring a page reload.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend Web App** | React 19, TypeScript, Vite, React Router v7 |
| **3D Graphics & Optics** | Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`) |
| **Styling & UI Tokens** | Glassmorphism UI, Vanilla CSS, Lucide React Icons |
| **Backend API** | Node.js, Express, TypeScript |
| **Validation & Security** | Zod (Runtime Schemas), Bcrypt, JWT (JsonWebToken) |
| **Database & ORM** | Neon PostgreSQL, Prisma ORM, Pessimistic Row Locking (`FOR UPDATE`) |
| **Media Delivery** | Cloudinary CDN / Remote Image Pipeline |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- Local PostgreSQL instance OR a free [Neon](https://neon.tech/) cloud database

### 2. Environment Variables

Create `backend/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/yozigo_db?schema=public"
JWT_SECRET="super-secret-jwt-key-for-development-32chars"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
CLIENT_URL="http://localhost:5173"
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

### 3. Installation & Database Setup
From the repository root:
```bash
# 1. Install root, backend, and frontend dependencies
npm install

# 2. Push Prisma database schema to PostgreSQL
npm run prisma:push -w backend

# 3. Seed Screen 1 (80 seats A1-H10), Admin account, sample movies & shows
npm run prisma:seed -w backend
```

> **Default Seeded Accounts:**
> - **Cinema Admin**: `admin@cinema.com` / `Admin@12345Password!`
> - **Demo Customer**: `customer@test.com` / `Customer@12345Password!`

### 4. Running Locally
Run backend and frontend concurrently or in separate terminal tabs:
```bash
# Terminal 1: Backend API (http://localhost:5000)
npm run dev -w backend

# Terminal 2: Frontend Web Application (http://localhost:5173)
npm run dev -w frontend
```

---

## 📡 REST API Specification

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new customer account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT |
| `GET` | `/api/auth/me` | Authenticated | Fetch current authenticated user session |

### Movies (`/api/movies`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/movies` | Public | List all active movies and scheduled shows |
| `GET` | `/api/movies/:id` | Public | Get single movie with upcoming showtimes |
| `POST` | `/api/movies` | Admin | Create movie with poster & metadata |
| `PUT` | `/api/movies/:id` | Admin | Update movie details or active status |
| `DELETE` | `/api/movies/:id` | Admin | Delete/deactivate movie (with booking validation) |

### Shows (`/api/shows`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/shows/:id` | Public | Get show metadata |
| `GET` | `/api/shows/:id/seats` | Public / User | Get 80-seat map with live availability & hold status |
| `POST` | `/api/shows` | Admin | Schedule show with overlap & 15-min cleaning buffer guard |
| `GET` | `/api/shows/:id/occupancy` | Admin | Get booked count, revenue, and customer bookings roster |
| `DELETE` | `/api/shows/:id` | Admin | Delete show schedule (blocked if confirmed bookings exist) |

### Bookings (`/api/`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/shows/:id/hold` | Authenticated | Atomically hold 1–6 seats for 5 mins (`FOR UPDATE`) |
| `POST` | `/api/bookings/:id/simulate-payment` | Authenticated | Complete or fail simulated payment attempt |
| `POST` | `/api/bookings/:id/release` | Authenticated | Manually release held seats back to cinema |
| `GET` | `/api/bookings/my` | Authenticated | Retrieve customer's own admission tickets |
| `POST` | `/api/bookings/:id/cancel` | Authenticated | Cancel booking (> 2 hrs before show) & release seats |

---

## 📁 Repository Directory Structure

```text
Movie-Ticket/
├── SYSTEM_DESIGN.md            # Complete High-Level Design (HLD) & Architecture
├── README.md                   # Project overview & quick start
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Relational models, enums & foreign keys
│   │   └── seed.ts             # Seeds 80 seats, Screen 1, admin & sample movies
│   ├── src/
│   │   ├── app.ts              # Express application setup & middleware
│   │   ├── server.ts           # Server bootstrap
│   │   ├── controllers/        # Auth, movie, show, and booking controllers
│   │   ├── middlewares/        # Auth, admin guard & Zod validator
│   │   ├── routes/             # REST route endpoints
│   │   ├── services/           # Concurrency, locking & booking business logic
│   │   └── utils/              # ApiResponse, ApiError, asyncHandler, Prisma client
├── frontend/
│   ├── src/
│   │   ├── api/client.ts       # Centralized API client with JWT interception
│   │   ├── components/         # 3D Cinema Simulator, SeatMap, Navbar, Modals
│   │   ├── context/            # Authentication context provider
│   │   ├── pages/              # MovieList, MovieDetails, ShowBooking, Confirmation, Admin
│   │   └── types/              # TypeScript interfaces
│   └── index.html
```

---

## ⚖️ Concurrency & Real-Time Sync Strategy (Requirement 10)

### Architectural Comparison: Polling vs. Server-Sent Events (SSE) vs. WebSockets

| Metric / Consideration | Short Polling (Selected) | Server-Sent Events (SSE) | WebSockets (WS) |
|---|---|---|---|
| **Communication Flow** | Unidirectional HTTP client pull (`GET /shows/:id/seats`) | Unidirectional HTTP server push (`text/event-stream`) | Full-duplex bidirectional TCP stream |
| **Connection Overhead** | Stateless HTTP requests (reusable via HTTP/2 keep-alive) | Open persistent HTTP socket per connected user | Persistent TCP connection per connected user |
| **Edge & Serverless Compatibility** | **100% Compatible** with AWS Lambda, Vercel, Neon, Cloudflare Workers | Restricted connection duration on serverless, requires edge buffering | Requires dedicated, stateful application servers or managed gateways |
| **Complexity & Reconnection** | Minimal (browser handles retries; no state to recover) | Medium (requires `Last-Event-ID` tracking, auto-reconnect handling) | High (requires heartbeat/ping-pong, backoff reconnects, room/channel state) |
| **Bandwidth for 80 Seats** | Minimal (~2 KB gzipped JSON per interval) | Minimal event delta (~200 B per delta) | Minimal event delta (~200 B per delta) |
| **Failure Recovery** | Automatic on next tick (no dead connection states) | Must detect dropped socket and reconnect | Complex reconnect logic and reconnection storms |

### Why 3-Second Polling Was Chosen:
1. **Serverless & Edge Alignment**: Modern cinema booking systems scale out elastically across stateless serverless instances and edge compute. WebSockets and long-lived SSE connections break standard stateless deployment architectures and require sticky sessions, Redis pub/sub backplanes, or dedicated connection routers.
2. **5-Minute Hold Lifecycle Matching**: Seat holds last 300 seconds. An adaptive **3-second background polling cadence** guarantees that any seat claimed, released, or purchased by another customer is visible to all viewers within 3 seconds—well below human booking decision thresholds—without burning server memory on idle persistent connections.
3. **Resilience & Proxy Traversal**: Standard HTTP polling traverses all enterprise firewalls, VPNs, mobile NATs, and mobile browser power-saving sleep modes cleanly without connection drops or socket synchronization issues.
4. **Client-Side Conflict Auto-Resolution**: When the 3-second poll detects that a seat currently selected by the user has been claimed by another customer, the client automatically deselects the taken seat and updates the UI instantly, preventing stale hold submissions.

---

## 💡 Key Architectural Decisions (Why We Built It This Way)

1. **Why Node.js + Express + TypeScript**: Provides end-to-end type safety shared with React/TypeScript frontend, non-blocking I/O ideal for high-throughput booking traffic, and mature middleware support.
2. **Why Neon PostgreSQL with Prisma**: A relational database is mandatory for ACID guarantees; PostgreSQL provides row-level locking primitives (`SELECT ... FOR UPDATE`), serializable transactions, and strict foreign keys.
3. **How We Stopped Double Booking**: Multi-seat holds use PostgreSQL pessimistic row locks on `ShowSeat` within an interactive transaction. All `seatIds` are deterministically sorted alphabetically (`seatIds.sort()`) prior to acquiring locks, eliminating deadlock risk between competing concurrent transactions.
4. **Why 5-Minute TTL & Idempotency**: Expired holds reject payment confirmation immediately at the database level even before garbage collection runs. Payment retry preserves remaining hold seconds so legitimate buyers don't lose their seats on card errors.
5. **Why Three.js / React Three Fiber for 3D Simulator**: Renders real-time seated vantage sightlines at 60 FPS directly in the browser canvas without streaming lag or external rendering server costs.

---

## 🗄️ Database Design (Tables & Relations)

| Table | Columns | Constraints & Indexes | Relations |
|---|---|---|---|
| **`User`** | `id` (UUID), `email`, `passwordHash`, `name`, `role` (`CUSTOMER`/`ADMIN`), `createdAt`, `updatedAt` | `UNIQUE(email)`, `INDEX(email)` | `1:N` with `Booking` |
| **`Screen`** | `id` (UUID), `name` ("Screen 1"), `totalSeats` (80), `createdAt` | `UNIQUE(name)` | `1:N` with `Seat`, `1:N` with `Show` |
| **`Seat`** | `id` (UUID), `screenId`, `row` ('A'-'H'), `number` (1-10) | `UNIQUE(screenId, row, number)`, `INDEX(screenId)` | `N:1` with `Screen`, `1:N` with `ShowSeat` |
| **`Movie`** | `id` (UUID), `title`, `description`, `durationMin`, `language`, `rating`, `posterUrl`, `isActive`, `createdAt` | `PRIMARY KEY(id)` | `1:N` with `Show` |
| **`Show`** | `id` (UUID), `movieId`, `screenId`, `startTime`, `endTime`, `price`, `createdAt`, `updatedAt` | `INDEX(screenId, startTime, endTime)` | `N:1` with `Movie`, `N:1` with `Screen`, `1:N` with `ShowSeat`, `1:N` with `Booking` |
| **`ShowSeat`** | `id` (UUID), `showId`, `seatId`, `heldByUserId`, `heldUntil`, `bookingId`, `version`, `createdAt`, `updatedAt` | `UNIQUE(showId, seatId)`, `INDEX(showId, heldUntil)` | `N:1` with `Show`, `N:1` with `Seat`, `N:1` with `Booking` |
| **`Booking`** | `id` (UUID), `userId`, `showId`, `totalAmount`, `status` (`PENDING`/`CONFIRMED`/`CANCELLED`/`EXPIRED`), `holdExpiresAt`, `createdAt`, `updatedAt` | `INDEX(userId)`, `INDEX(showId)` | `N:1` with `User`, `N:1` with `Show`, `1:N` with `ShowSeat`, `1:1` with `Payment` |
| **`Payment`** | `id` (UUID), `bookingId`, `amount`, `status` (`PENDING`/`SUCCESS`/`FAILED`), `transactionRef`, `createdAt`, `updatedAt` | `UNIQUE(bookingId)` | `1:1` with `Booking` |

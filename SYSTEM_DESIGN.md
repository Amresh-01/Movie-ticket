# 🎬 Yozigo — High-Level Design (HLD) & System Architecture Specification

> **Submission for Full-Stack Engineering Intern Selection — Yozigo**  
> **Author:** Amresh Kumar  
> **Date:** October 2026  
> **System:** Distributed, High-Concurrency Cinema Booking & 3D Interactive Simulator

---


<img width="1536" height="2455" alt="both" src="https://github.com/user-attachments/assets/26b1c052-face-40bd-a930-d9e8b23f7c15" />



## 1. Executive Summary

**Yozigo** is an enterprise-grade movie ticketing platform built for extreme concurrency, zero double-booking tolerance, and visual excellence. In addition to full transactional seat reservation workflows, Yozigo introduces a **realistic 3D cinema auditorium simulator** powered by Three.js and React Three Fiber that lets moviegoers preview the movie screen directly from seated eye-level before purchasing.

The backend is built with **Node.js, Express, and TypeScript**, backed by **Neon PostgreSQL** via **Prisma ORM**, strictly adhering to **ACID transactional semantics**, deterministic row locking, and Zod runtime schema validation.

---

## 2. High-Level Architecture (HLD)

### 2.1 Complete Component Topology

```mermaid
flowchart TB
    subgraph ClientLayer ["Client & Presentation Layer"]
        UserBrowser["Customer Browser (Web / Mobile)"]
        AdminBrowser["Cinema Staff / Admin Portal"]
    end

    subgraph CDNLayer ["CDN & Asset Delivery"]
        ViteSPA["Vite + React 19 Frontend SPA"]
        CloudinaryCDN["Cloudinary Media CDN (Movie Posters / Banners)"]
    end

    subgraph GatewayLayer ["Reverse Proxy & Network Edge"]
        EdgeProxy["Nginx / Cloudflare (SSL Termination, Rate Limiting, Compression)"]
    end

    subgraph AppLayer ["Application Tier (Node.js + Express + TypeScript)"]
        AuthModule["Auth Service (JWT, Bcrypt, Role Guard)"]
        MovieModule["Movie Catalog & Show Schedule Engine"]
        BookingModule["Pessimistic Locking & Hold Engine"]
        OccupancyModule["Real-Time Occupancy & Analytics Engine"]
    end

    subgraph DataLayer ["Database Tier (PostgreSQL / Neon)"]
        PostgresDB[(Neon Serverless PostgreSQL)]
        PrismaORM["Prisma ORM with Connection Pooling"]
        SeatLocks["Row-Level Locks (SELECT ... FOR UPDATE)"]
    end

    UserBrowser -->|HTTPS / WSS| EdgeProxy
    AdminBrowser -->|HTTPS / WSS| EdgeProxy
    UserBrowser -->|Fetch Static Assets| ViteSPA
    UserBrowser -->|Fetch Optimized Images| CloudinaryCDN
    EdgeProxy --> AppLayer
    AppLayer --> PrismaORM
    PrismaORM --> PostgresDB
    BookingModule -.->|Pessimistic Lock| SeatLocks
```

---

## 3. Core Functional & Non-Functional Requirements

### 3.1 Functional Workflows
1. **User Authentication**: Secure registration and login using salted Bcrypt hashes and stateless JWT Bearer authorization.
2. **Movie & Show Exploration**: Real-time browsing of active movie titles, showtimes, genres, and pricing.
3. **Interactive 3D Seating Simulator**:
   - 80 physical auditorium seats across Rows A through H with tiered stadium risers.
   - 2D grid toggle and instant 3D camera zoom to seated eye perspective (`[x, eyeY, z]`).
   - Dynamic cinema screen with high-resolution projection video and active audio-visual atmosphere.
4. **Atomic 5-Minute Seat Hold**:
   - Concurrently lock 1 to 6 seats using transactional pessimistic row locks (`SELECT ... FOR UPDATE`).
   - Automatic 5-minute time-to-live (TTL).
5. **Payment Simulation & Idempotency**:
   - `SUCCESS`: Confirms booking and generates unique ticket pass.
   - `FAILED`: Preserves hold countdown so customer can retry payment without losing seats.
6. **Cancellation Engine (Flow 8)**:
   - Self-service cancellation allowed up to 2 hours before showtime.
   - Rejection with explicit error if within 2 hours or if show has passed.
   - Immediate seat replenishment back to inventory upon cancellation.
7. **Admin Roster & Occupancy (Flow 9)**:
   - Live revenue, total seats, booked seats, and occupancy percentages per show.
   - Detailed customer bookings roster (Booking ID, Customer Name, Email, Seats, Amount, Booked Timestamp).
   - CRUD management for shows (with overlap detection and 15-minute cleaning buffers) and movies.
8. **Live Seat Updates (Flow 10)**:
   - Automatic 3-second seat state polling without page reloads.

### 3.2 Non-Functional Architecture Guarantees
- **Strict Atomicity (Zero Double-Booking)**: Two users clicking the same seat simultaneously will NEVER result in a double-hold.
- **Deadlock Immunity**: All seat IDs are deterministically sorted (`seatIds.sort()`) before obtaining database locks.
- **Data Isolation**: Multi-tenant customer isolation where users can only inspect their own receipts.

---

## 4. End-to-End Booking Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as React 19 Frontend
    participant API as Express API Server
    participant DB as Neon PostgreSQL (Prisma)

    Customer->>Frontend: Selects 1–6 Seats in 3D / 2D View
    Frontend->>API: POST /api/shows/:id/hold { seatIds: [...] }
    Note over API,DB: Begin Transaction (Isolation Level: Read Committed)
    API->>DB: Sort seatIds ASC to prevent deadlocks
    API->>DB: SELECT * FROM "ShowSeat" WHERE showId = $1 AND seatId IN (...) FOR UPDATE
    alt Any seat is already BOOKED or held by another user
        DB-->>API: Conflict Detected
        API-->>Frontend: 409 Conflict ("Seat is currently locked by another customer")
        Frontend-->>Customer: Visual Alert & Re-fetch Available Seats
    else All seats are AVAILABLE
        API->>DB: UPDATE "ShowSeat" SET heldUntil = NOW() + 5 min, heldByUserId = $userId
        API->>DB: INSERT INTO "Booking" (PENDING, expiresAt)
        DB-->>API: Commit Transaction
        API-->>Frontend: 201 Created { bookingId, expiresInSeconds: 300, totalAmount }
        Frontend-->>Customer: Open Payment Modal with 5-minute countdown timer
    end

    Customer->>Frontend: Confirms Simulated Payment
    Frontend->>API: POST /api/bookings/:id/simulate-payment { status: "SUCCESS" }
    Note over API,DB: Begin Transaction
    API->>DB: Verify hold has not expired (heldUntil > NOW())
    API->>DB: UPDATE "Booking" SET status = 'CONFIRMED'
    API->>DB: UPDATE "ShowSeat" SET heldUntil = NULL (Permanent Booked)
    API->>DB: INSERT INTO "Payment" (SUCCESS, txnRef)
    DB-->>API: Commit Transaction
    API-->>Frontend: 200 OK { receipt: { id, movieTitle, seats, totalAmount } }
    Frontend-->>Customer: Render Confirmed Ticket Pass & QR Barcode
```

---

## 5. Concurrency & Deadlock Prevention Strategy

### 5.1 The Concurrency Problem
In high-demand ticket sales, thousands of users attempt to hold the same prime center seats (e.g., Row D, Seats 5–6) within the same millisecond. Optimistic locking fails frequently under high contention, forcing repeated retries that degrade user experience.

### 5.2 The Yozigo Pessimistic Locking Solution
Yozigo utilizes PostgreSQL pessimistic row-level locking via **`SELECT ... FOR UPDATE`** inside a Prisma transactional block:

```typescript
// 1. Deterministic sort prevents cross-dependency deadlocks
const sortedSeatIds = [...seatIds].sort();

await prisma.$transaction(async (tx) => {
  // 2. Lock specific seat rows for this show in deterministic order
  const lockedShowSeats = await tx.$queryRaw`
    SELECT * FROM "ShowSeat"
    WHERE "showId" = ${showId} AND "seatId" IN (${Prisma.join(sortedSeatIds)})
    FOR UPDATE
  `;

  // 3. Validate seat availability within the protected critical section
  for (const seat of lockedShowSeats) {
    if (seat.bookingId || (seat.heldUntil && seat.heldUntil > new Date())) {
      throw new ApiError(409, 'One or more selected seats are no longer available', [], 'SEATS_UNAVAILABLE');
    }
  }

  // 4. Atomically apply hold
  // ...
}, { timeout: 10000 });
```

### 5.3 Deadlock Prevention Proof
When User A requests seats `[Seat-5, Seat-6]` and User B requests `[Seat-6, Seat-5]`:
- Without sorting: User A locks 5 and waits for 6; User B locks 6 and waits for 5 $\rightarrow$ **Deadlock cycle**.
- With Yozigo deterministic sorting: Both transactions lock Seat-5 first. One succeeds immediately; the second waits cleanly on row 5 and fails cleanly when row 5 updates, with zero deadlocks.

---

## 6. Real-Time Seat Synchronization Strategy (Flow 10)

### Comparison: Polling vs. WebSockets vs. SSE

| Dimension | Short Polling (3s) | Server-Sent Events (SSE) | WebSockets |
|---|---|---|---|
| **Complexity** | Low, extremely robust | Medium (requires connection keep-alive) | High (bidirectional, heartbeat, reconnection) |
| **Serverless / Edge Compatibility** | 100% compatible with Neon, Vercel, AWS Lambda | Requires persistent connection handling | Requires dedicated gateway (e.g. AWS API Gateway WSS) |
| **Reverse Proxy / Firewall Safety** | Standard HTTP/1.1 & HTTP/2, zero blocking | Prone to proxy buffering | Blocked by some corporate enterprise firewalls |
| **Suitability for Cinema Holds** | **Ideal**: Seat holds last 300 seconds; 3s polling yields near-instant freshness | Overkill for 80-seat scale | Overkill for predominantly read-heavy seat maps |

**Decision**: Yozigo uses **adaptive 3-second HTTP polling** on `/api/shows/:id/seats`. It provides sub-3-second real-time state synchronization, zero memory leak risk from open sockets, and seamless auto-recovery if the user temporarily loses internet connectivity.

---

## 7. Database Entity Relationship Model (ERD)

```mermaid
erDiagram
    USER ||--o{ BOOKING : places
    USER {
        string id PK
        string email UK
        string passwordHash
        string name
        enum role "CUSTOMER | ADMIN"
        datetime createdAt
    }

    SCREEN ||--o{ SEAT : contains
    SCREEN ||--o{ SHOW : hosts
    SCREEN {
        string id PK
        string name UK
        int totalSeats
        datetime createdAt
    }

    SEAT {
        string id PK
        string screenId FK
        string row
        int number
    }

    MOVIE ||--o{ SHOW : exhibits
    MOVIE {
        string id PK
        string title
        string description
        int durationMin
        string language
        string rating
        string posterUrl
        boolean isActive
    }

    SHOW ||--o{ SHOW_SEAT : schedules
    SHOW ||--o{ BOOKING : reserves
    SHOW {
        string id PK
        string movieId FK
        string screenId FK
        datetime startTime
        datetime endTime
        decimal price
    }

    SHOW_SEAT {
        string id PK
        string showId FK
        string seatId FK
        string heldByUserId
        datetime heldUntil
        string bookingId FK
    }

    BOOKING ||--o{ SHOW_SEAT : locks
    BOOKING ||--o| PAYMENT : records
    BOOKING {
        string id PK
        string userId FK
        string showId FK
        decimal totalAmount
        enum status "PENDING | CONFIRMED | CANCELLED | EXPIRED"
        datetime holdExpiresAt
        datetime createdAt
    }

    PAYMENT {
        string id PK
        string bookingId FK
        decimal amount
        enum status "SUCCESS | FAILED"
        string transactionRef
        datetime createdAt
    }
```

---

## 8. Scalability & Production Readiness

### 8.1 Horizontal Scaling
- **Stateless API Tier**: Express server instances store no in-memory session state (JWT auth). Instances scale horizontally behind an AWS ALB or Cloudflare Load Balancer.
- **Connection Pooling**: Prisma Client is configured with connection limits matching Neon PostgreSQL pooling thresholds to prevent database connection exhaustion.
- **CDN Offloading**: All static assets and movie poster banners are cached globally via Cloudinary CDN with immutable cache headers.

### 8.2 Security Architecture
- **JWT & Role-Based Access Control**: Admins and customers are segmented via strict middleware guards (`authenticate`, `requireAdmin`).
- **Input Sanitization**: Every endpoint payload is validated using runtime Zod schemas before hitting business logic.
- **CORS & Rate Limiting**: Strict origin restrictions and Express rate limiters protect against brute-force authentication attacks.

# Implementation Plan: Elevating Yozigo to a Premium, Production-Quality Movie Ticket Booking Application

## 1. Architecture & Design System
- **Design Tokens (`index.css`)**:
  - Deep ink/charcoal cinematic palette (`#0B0D12` root background, `#151923` elevated surface, `#1D2330` secondary cards).
  - Electric coral accent (`#FF5A6E`), vivid glow highlights, emerald success (`#38C98B`), amber warning (`#F4B740`).
  - Polished typography, consistent 12px/16px/24px border radii, subtle card elevation shadows, responsive grid layouts.
  - Toast/alert system styling, ticket stub styling with cutout notches and barcode graphics.

## 2. Refined 3D Cinema Auditorium Simulator (`CinemaAuditorium3D.tsx`)
- **Fix Seat Inversion & Alignment**:
  - Seat 1 on left (`x = -3.8`), Seat 10 on right (`x = +3.8`), clear center aisle between Seat 5 and 6.
  - Row A closest to the screen, Row H at the back on elevated stadium risers.
- **Click Target & Interaction**:
  - Transparent hit-box on each chair ensuring 100% reliable click raycasting.
  - Responsive hover state without re-rendering or lagging 80 chairs.
  - Accurate colors matching the legend (Coral/Violet for selected, Crimson/Slate for available, Amber for held, Dark charcoal for booked).
- **Camera Controls & Presets**:
  - Optimized default camera angle (`[0, 6.2, 8.5]`, `target: [0, 1.2, -0.5]`).
  - Preset buttons: "Auditorium Overview", "Screen View", "Reset Camera".
  - Seat count constraint (1 to 6) enforced with clear feedback.
  - Smooth 2D fallback view switch.

## 3. Dedicated Customer Screens & Journeys
- **Home / Movie Discovery (`MovieListPage.tsx`)**:
  - Hero banner with backdrop, movie tags (IMDb rating, duration, genres, language), "Book Tickets" call to action.
  - Search input & genre category filters (All, Action, Sci-Fi, Drama, Animation).
  - Responsive movie cards with hover elevation, duration badges, rating stars, and showtime pills.
  - Movie Details modal or seamless drill-down.
- **Dedicated Movie Details (`MovieDetailsPage.tsx`)**:
  - Large cinematic backdrop, full synopsis, cast/crew info, language, certification (PG-13, R).
  - Date selector (Today, Tomorrow, Day 3) and interactive showtime pills with pricing.
  - Direct selection navigates into seat selection.
- **Checkout & Simulated Payment (`CheckoutModal.tsx` / `ShowBookingPage.tsx`)**:
  - Real-time countdown timer synchronized with server hold expiration.
  - Itemized receipt breakdown (Base ticket price, cinema service fee, tax, total).
  - Payment simulation modal (Simulate Success, Simulate Failure, Release Hold).
  - Handles payment failure retry and cancel hold without creating duplicate bookings.
- **Booking Confirmation (`BookingConfirmationPage.tsx`)**:
  - Realistic cinematic digital ticket pass with perforated receipt divider, show details, seat chips, QR code mockup, and booking reference ID.
  - Actions to view all bookings in "My Bookings" or return to movie discovery.
- **Customer Bookings History (`MyBookingsPage.tsx`)**:
  - Categorized into "Upcoming Shows" and "Past/Expired Bookings".
  - Detailed ticket modal view for any previous confirmed booking.
- **Admin Dashboard (`AdminDashboard.tsx`)**:
  - Clean metrics, real-time occupancy checker per show, show creator, and movie manager.

## 4. Verification & Validation
- Run TypeScript build check (`tsc -b && vite build`).
- Verify complete end-to-end user booking flow via browser subagent.

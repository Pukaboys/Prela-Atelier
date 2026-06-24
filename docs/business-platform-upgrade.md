# Smart Digital Platform Upgrade

## Current System Weaknesses

- Business logic is embedded directly inside Next.js route handlers and server components, especially checkout, admin order updates, dashboard metrics, and bespoke enquiries.
- The database currently supports catalog commerce, basic enquiries, and admin authentication, but it does not yet model custom orders, production stages, normalized clients, or activity logs.
- The admin dashboard is operational but limited to simple totals and recent commerce orders; it does not yet provide production analytics or charted business intelligence.
- Bespoke/custom work is currently captured as an enquiry only, so dimensions, material choice, area, calculated price, and production progress are not structured data.
- Validation logic is repeated at the route level, making future feature expansion harder to test and maintain.

## Improved Architecture Design

The upgrade will use a clean layered architecture inside the existing Next.js app:

- `src/app`: route handlers and views/controllers only.
- `src/server/validations`: request validation schemas and shared input types.
- `src/server/services`: business use cases such as order creation, dashboard analytics, bespoke intake, and later custom-order production.
- `src/server/utils`: server-only helpers for normalization and calculations.
- `prisma/schema.prisma`: persistent models and relationships.
- `src/components`: reusable UI modules, including future custom-order builder, 2D preview, dashboard charts, and production board.

## Phase 1 Implementation

Phase 1 is intentionally live-safe: it refactors existing logic into services without changing the production database schema.

- Added an order service for admin listing, status transitions, and bank-transfer order creation.
- Added a dashboard service for admin summary metrics.
- Added a bespoke service for enquiry persistence and notifications.
- Added validation modules for checkout, order status updates, and bespoke enquiry input.
- Preserved the existing live database schema to avoid breaking the deployed app.

## Target Database Schema

Phase 2 will add new tables and fields through a migration instead of replacing existing data:

- `clients`: normalized client profiles derived from orders, contact messages, and bespoke/custom work.
- `custom_orders`: dimensioned custom order records with height, width, quantity, material, area, estimated price, status, and due date.
- `custom_order_events`: production history for stage changes and notes.
- `activity_logs`: auditable business activity across orders, custom orders, and admin actions.
- `materials.price_per_square_meter` and `materials.lead_time_days`: pricing and planning inputs for custom work.

## Refactored Folder Structure

```txt
src/
  app/
    (admin)/admin/
    (public)/
    api/
  components/
    admin/
    layout/
    ui/
  lib/
  server/
    services/
    utils/
    validations/
prisma/
  schema.prisma
  seed.ts
docs/
  business-platform-upgrade.md
```

## Step-By-Step Upgrade Plan

1. Architecture foundation: move existing business logic into services and validations while preserving behavior.
2. Database migration: add clients, custom orders, production events, material pricing, and activity logs safely.
3. Custom-order builder: replace the basic bespoke form with dimensions, quantity, material selection, price/area calculation, and a 2D SVG preview.
4. Production tracking: add admin production board with Pending, In Production, and Completed stages.
5. Dashboard analytics: add Chart.js dashboard cards and charts for revenue, production, completion, and material demand.
6. Operational polish: CSV export, activity feed, alerts, filtering, and better admin workflows.
7. Live hardening: migration instructions, seed/backfill scripts, health checks, and deployment notes.

## Major Improvement Rationale

- Services make the project maintainable by isolating business workflows from HTTP and UI concerns.
- Validation modules centralize data contracts so frontend, API, and future tests can share the same rules.
- The phased database plan avoids breaking the current live schema while preparing for diploma-level business functionality.
- The custom-order and production features will transform bespoke enquiries from unstructured messages into trackable business objects.
- Dashboard analytics will turn operational data into management information suitable for a Business Informatics system.

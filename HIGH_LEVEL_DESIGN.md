# InsureHub - High-Level Design Document

## 1. Executive Summary

InsureHub is a micro-frontend (MFE) insurance platform built with Angular 21 and Webpack Module Federation. It demonstrates how independently deployable MFEs can communicate via an SSE-like event bus, share data through localStorage, and present a unified user experience using Angular Material.

---

## 2. System Architecture

### 2.1 Deployment Topology

```
                    ┌─────────────────────┐
                    │    Browser (User)    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Container Shell    │
                    │   (Host Application) │
                    │   localhost:4200     │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │  SSE Broker   │  │
                    │  │ (BroadChan)   │  │
                    │  └──────┬────────┘  │
                    └─────────┼───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼─────┐  ┌─────▼──────┐  ┌─────▼──────┐
    │   Static CDN   │  │ MFE1:4201  │  │ MFE2:4202  │
    │  (shared-lib)  │  │  Policy    │  │  Payment   │
    │  (compile-time)│  │  Dashboard │  │  Premium   │
    └───────────────┘  └────────────┘  └────────────┘
```

### 2.2 Component Architecture

| Layer             | Technology                            | Purpose                                                                                       |
| ----------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Shell**         | Angular 21 + Module Federation Host   | Layout, routing, SSE broker, mock data seeding                                                |
| **MFE1**          | Angular 21 + Module Federation Remote | Policy CRUD, premium calculation (Web Worker), SSE publishing                                 |
| **MFE2**          | Angular 21 + Module Federation Remote | Payment processing, SSE listening, receipt generation                                         |
| **Shared Lib**    | Pure TypeScript                       | Interfaces, SSE classes, storage adapter                                                      |
| **UI**            | Angular Material 3 (indigo/cyan)      | Consistent M3 design across all MFEs                                                          |
| **Styling**       | SCSS (Sass pre-processor)             | Shared theme variables, nesting, and mixins across all MFEs via `_theme.scss` partials        |
| **Bundling**      | Webpack 5 + Module Federation plugin  | Bundles each MFE independently and enables runtime remote loading without rebuilding the host |
| **State**         | localStorage via StorageAdapter       | Shared persistence without backend                                                            |
| **Communication** | BroadcastChannel (SSE pattern)        | Loosely-coupled event-driven messaging                                                        |

---

## 3. Micro-Frontend Composition

### 3.1 Webpack Module Federation

- **Host (Container)** loads remote entry points at runtime
- **Remotes (MFE1, MFE2)** expose Angular route configurations
- **Shared dependencies** (`@angular/*`, `rxjs`) are singletons - loaded once by the host

```
Container ──loadRemoteModule──> MFE1 remoteEntry.js ──> POLICY_ROUTES
         ──loadRemoteModule──> MFE2 remoteEntry.js ──> PAYMENT_ROUTES
```

### 3.2 Route Configuration

| Path                | Loaded From   | Component              |
| ------------------- | ------------- | ---------------------- |
| `/`                 | Container     | Home (dashboard stats) |
| `/policies`         | MFE1 (remote) | PolicyList             |
| `/policies/:id`     | MFE1 (remote) | PolicyDetail           |
| `/payments`         | MFE2 (remote) | PaymentForm            |
| `/payments/history` | MFE2 (remote) | PaymentHistory         |

---

## 4. Cross-MFE Communication

### 4.1 SSE-over-BroadcastChannel Pattern

The application implements SSE semantics using the browser's BroadcastChannel API:

| SSE Concept         | Implementation                                        |
| ------------------- | ----------------------------------------------------- |
| **Event Stream**    | Named BroadcastChannel (`sse:policy-events`)          |
| **Event ID**        | `crypto.randomUUID()` per event                       |
| **Event Type**      | String-typed (`policy:selected`, `payment:completed`) |
| **Event Data**      | JSON payload                                          |
| **Last-Event-ID**   | Tracked per consumer for replay                       |
| **Retry/Reconnect** | Auto-reconnect on channel error                       |

### 4.2 Communication Classes

```
SseBroker       (Container)  - Creates channels, logs events, supports replay
SseProducer      (MFEs)       - Publishes typed events to a named stream
SseConsumer      (MFEs)       - Subscribes to stream, returns RxJS Observable
```

### 4.3 Event Flow Diagram

```
┌─────────────┐    policy:selected     ┌─────────────┐
│    MFE1     │ ────────────────────►  │    MFE2     │
│  (Producer) │    nav:to-payment      │  (Consumer) │
│             │ ────────────────────►  │             │
└──────┬──────┘                        └──────┬──────┘
       │                                      │
       │ nav:to-payment                       │ payment:completed
       ▼                                      ▼
┌─────────────┐                        ┌─────────────┐
│  Container  │◄───────────────────────│  Container  │
│  (Consumer) │   payment:completed    │  (Consumer) │
│  [Navigate] │                        │  [Update]   │
└─────────────┘                        └─────────────┘
```

---

## 5. Data Architecture

### 5.1 Storage Strategy

- **No backend** - all data persists in `localStorage`
- **StorageAdapter** provides static `get<T>` / `set` / `remove` / `clear` methods
- **Key `policies`** - Array of IPolicy (seeded on first load from mock data)
- **Key `payments`** - Array of IPayment (populated as user makes payments)

### 5.2 Data Seeding

On app initialization, the container's `App.ngOnInit()` checks if the `policies` key exists in localStorage. If not, it seeds 6 mock policies (2 life, 2 health, 1 vehicle, 1 home) covering active, expired, and pending statuses.

---

## 6. Web Worker - Premium Calculator

MFE1 uses a **Web Worker** to offload premium projection calculations to a background thread:

| Calculation           | Logic                                                                        |
| --------------------- | ---------------------------------------------------------------------------- |
| **Risk Multiplier**   | Base (type): life=1.2, health=1.5, vehicle=1.8, home=1.3 + 0.05 per coverage |
| **Annual Premium**    | `basePremium × 12 × riskMultiplier`                                          |
| **Potential Savings** | `basePremium × 12 × max(0, riskMultiplier - 1) × 0.15`                       |

The worker is created via Angular's `new Worker(new URL(...))` pattern and wrapped in an `Observable` by `PremiumWorkerService`.

---

## 7. Security Considerations

| Concern            | Mitigation                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **XSS**            | Angular's built-in template sanitization                                                 |
| **MFE isolation**  | Each MFE runs in the same browser context (SPA) - no iframe isolation                    |
| **Data tampering** | localStorage is client-side only; production would use authenticated APIs                |
| **CORS**           | Module Federation remotes served from different ports; CORS headers needed in production |

---

## 8. Local Deployment Guide

### 8.1 Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- Ports **4200**, **4201**, and **4202** must be free

### 8.2 Install Dependencies

Run `npm install` in each of the three application directories and the shared library:

```bash
# Shared library
cd insure-hub/shared-lib
npm install

# Container App (Host)
cd ../container-app
npm install

# MFE1 - Policy Dashboard
cd ../mfe-policy-dashboard
npm install

# MFE2 - Premium Payment
cd ../mfe-premium-payment
npm install
```

### 8.3 Start the Applications

> **Important:** Start the two remote MFEs **before** the container app, so their `remoteEntry.js` files are available when the host loads.

**Step 1 — Start MFE1 (Policy Dashboard) on port 4201:**

```bash
cd insure-hub/mfe-policy-dashboard
npm start
# → Angular Live Development Server listening on http://localhost:4201
```

**Step 2 — Start MFE2 (Premium Payment) on port 4202:**

```bash
cd insure-hub/mfe-premium-payment
npm start
# → Angular Live Development Server listening on http://localhost:4202
```

**Step 3 — Start Container App (Host) on port 4200:**

```bash
cd insure-hub/container-app
npm start
# → Angular Live Development Server listening on http://localhost:4200
```

### 8.4 Verify the Setup

Open **http://localhost:4200** in the browser.

---

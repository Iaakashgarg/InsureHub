# InsureHub - Insurance Micro-Frontend Application

[![Live Demo](https://img.shields.io/badge/Live%20Demo-insure--hub.vercel.app-blue?style=for-the-badge&logo=vercel)](https://insure-hub.vercel.app/)

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/Iaakashgarg/InsureHub)

> 🌐 **Deployed App:** [https://insure-hub.vercel.app](https://insure-hub.vercel.app/)

> 📦 **Source Code:** [https://github.com/Iaakashgarg/InsureHub](https://github.com/Iaakashgarg/InsureHub)

A modular insurance platform built with **Angular 21**, **Angular Material 3**, and **Webpack Module Federation**. The application demonstrates a micro-frontend architecture with SSE-like cross-MFE communication via the BroadcastChannel API.

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                  Container App (port 4200)          │
│  ┌────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │ Header │  │   Sidebar   │  │   Router Outlet    │  │
│  └────────┘  └─────────────┘  │  ┌──────────────┐ │  │
│                               │  │ MFE1 or MFE2 │ │  │
│                               │  └──────────────┘ │  │
│                               └───────────────────┘  │
│  ┌──────────────────────────────────────────────┐    │
│  │          SSE Broker (BroadcastChannel)        │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
         ▲                              ▲
         │ Remote Entry                 │ Remote Entry
         │ (port 4201)                  │ (port 4202)
┌────────┴──────────┐        ┌─────────┴─────────┐
│  MFE1: Policy     │  SSE   │  MFE2: Premium    │
│  Dashboard        │◄──────►│  Payment          │
│  - Policy List    │        │  - Payment Form   │
│  - Policy Detail  │        │  - Payment History│
│  - Coverage Info  │        │  - Receipt Dialog │
│  - Web Worker     │        │  - SSE Listener   │
└───────────────────┘        └───────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Angular CLI** 21.x (`npm install -g @angular/cli`)

### Installation

```bash
cd insure-hub

# Install shared-lib dependencies
cd shared-lib && npm install && cd ..

# Install dependencies for each app
cd container-app && npm install && cd ..
cd mfe-policy-dashboard && npm install && cd ..
cd mfe-premium-payment && npm install && cd ..
```

### Running the Application

Start all three apps simultaneously (each in its own terminal):

**Terminal 1 - MFE1 Policy Dashboard (port 4201):**

```bash
cd mfe-policy-dashboard
npm start
```

**Terminal 2 - MFE2 Premium Payment (port 4202):**

```bash
cd mfe-premium-payment
npm start
```

**Terminal 3 - Container App (port 4200):**

```bash
cd container-app
npm start
```

Open http://localhost:4200 in your browser.

> **Note:** Start MFE1 and MFE2 **before** the container app. The container loads MFE remotes at runtime via their `remoteEntry.js`. Ports are pre-configured in each app's `angular.json`.

### Building for Production

```bash
cd shared-lib && npm install && cd ..
cd container-app && npm run build && cd ..
cd mfe-policy-dashboard && npm run build && cd ..
cd mfe-premium-payment && npm run build && cd ..
```

---

## 🔄 Cross-MFE Communication (SSE Pattern)

The application uses the **BroadcastChannel API** to implement SSE-like communication between MFEs:

### Streams (Channels)

| Stream              | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `policy-events`     | Policy selection, updates, premium calculations |
| `payment-events`    | Payment completion, failure notifications       |
| `navigation-events` | Cross-MFE navigation requests                   |

### Event Types

| Event                       | Source      | Consumer                           |
| --------------------------- | ----------- | ---------------------------------- |
| `policy:selected`           | MFE1        | MFE2 (auto-fills payment form)     |
| `policy:updated`            | MFE1        | Container                          |
| `policy:premium-calculated` | MFE1 Worker | MFE2                               |
| `payment:completed`         | MFE2        | Container, MFE1                    |
| `payment:failed`            | MFE2        | Container                          |
| `nav:to-payment`            | MFE1        | Container (navigates to /payments) |
| `nav:to-policies`           | MFE2        | Container (navigates to /policies) |

### Flow Example

```
User clicks "Pay Premium" on policy list (MFE1)
  → SsePublisher emits POLICY_SELECTED on policy-events stream
  → SsePublisher emits NAVIGATE_TO_PAYMENT on navigation-events stream
  → Container's SseBrokerService receives nav event, routes to /payments?policyId=X
  → MFE2's SseListenerService receives policy event, auto-fills payment form
  → User completes payment
  → MFE2 emits PAYMENT_COMPLETED on payment-events stream
```

---

## 🧩 Key Technical Decisions

| Decision                      | Rationale                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------- |
| **Webpack Module Federation** | Runtime composition - MFEs deployed independently                                 |
| **BroadcastChannel for SSE**  | No server needed; preserves SSE semantics (unidirectional push, event types, IDs) |
| **localStorage**              | Simulates backend persistence; shared across MFEs via StorageAdapter              |
| **Web Worker**                | Offloads premium calculation to background thread                                 |
| **Standalone Components**     | Angular 21 default; no NgModule boilerplate                                       |
| **Angular Material 3**        | Consistent design system with violet/cyan theme                                   |
| **SCSS**                      | Variables, mixins, and nesting for maintainable styles                            |

---

## 📦 Module Federation Configuration

### Container (Host)

```javascript
// Remote URLs are read from environment variables (set in Vercel dashboard)
// Defaults to localhost for local development
const POLICY_DASHBOARD_URL = process.env.MFE_POLICY_DASHBOARD_URL || 'http://localhost:4201';
const PREMIUM_PAYMENT_URL = process.env.MFE_PREMIUM_PAYMENT_URL || 'http://localhost:4202';

remotes: {
  mfePolicyDashboard: `mfePolicyDashboard@${POLICY_DASHBOARD_URL}/remoteEntry.js`,
  mfePremiumPayment:  `mfePremiumPayment@${PREMIUM_PAYMENT_URL}/remoteEntry.js`,
}
```

> Remote URLs are injected into Angular code at build time using webpack `DefinePlugin`.

### MFE1 (Remote)

```javascript
name: 'mfePolicyDashboard',
exposes: { './routes': './src/app/policy/policy.routes.ts' }
```

### MFE2 (Remote)

```javascript
name: 'mfePremiumPayment',
exposes: { './routes': './src/app/payment/payment.routes.ts' }
```

---

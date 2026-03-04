# InsureHub - Insurance Micro-Frontend Application

A modular insurance platform built with **Angular 21**, **Angular Material 3**, and **Webpack Module Federation**. The application demonstrates a micro-frontend architecture with SSE-like cross-MFE communication via the BroadcastChannel API.

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                  Container Shell (port 4200)          │
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

## 📂 Project Structure

```
insure-hub/
├── shared-lib/                    # Shared library (no framework dependency)
│   └── src/
│       ├── models/                # TypeScript interfaces
│       │   ├── policy.interface.ts
│       │   ├── payment.interface.ts
│       │   ├── user.interface.ts
│       │   └── sse-event.interface.ts
│       ├── sse/                   # SSE communication layer
│       │   ├── sse-broker.ts      # Central broker (container)
│       │   ├── sse-producer.ts    # Event publisher (MFEs)
│       │   ├── sse-consumer.ts    # Event subscriber (MFEs)
│       │   └── sse-event-types.ts # Stream & event type constants
│       ├── storage/               # Storage abstraction
│       │   └── storage-adapter.ts # localStorage wrapper
│       ├── styles/
│       │   └── _theme.scss        # Shared theme variables
│       └── index.ts               # Barrel exports
│
├── container-app/                 # Shell/Host application
│   ├── webpack.config.js          # Module Federation host config
│   └── src/app/
│       ├── components/
│       │   ├── header/            # Top navigation bar
│       │   ├── sidebar/           # Side navigation
│       │   └── home/              # Dashboard with stats
│       ├── services/
│       │   ├── sse-broker.service.ts   # SSE broker + navigation handler
│       │   └── storage.service.ts      # Angular storage wrapper
│       ├── data/
│       │   └── mock-policies.ts   # Seed data (6 policies)
│       ├── app.routes.ts          # Routes with loadRemoteModule
│       ├── app.config.ts
│       ├── app.ts / app.html / app.scss
│       └── styles.scss            # Material 3 indigo theme
│
├── mfe-policy-dashboard/          # MFE1: Policy management
│   ├── webpack.config.js          # Module Federation remote config
│   └── src/app/
│       ├── components/
│       │   ├── policy-list/       # Table with sort/paginator/filter
│       │   ├── policy-detail/     # Detail view with info grid
│       │   └── coverage-info/     # Expansion panel for coverages
│       ├── services/
│       │   ├── policy.service.ts         # CRUD via StorageAdapter
│       │   ├── sse-publisher.service.ts  # Emits policy & nav events
│       │   └── premium-worker.service.ts # Web Worker wrapper
│       ├── workers/
│       │   └── premium-calculator.worker.ts  # Background premium calc
│       └── policy/
│           └── policy.routes.ts   # Exposed routes
│
└── mfe-premium-payment/           # MFE2: Payment processing
    ├── webpack.config.js          # Module Federation remote config
    └── src/app/
        ├── components/
        │   ├── payment-form/      # 3-step stepper (select → pay → confirm)
        │   ├── payment-history/   # Table with search, stats cards
        │   └── receipt/           # Dialog-based receipt viewer
        ├── services/
        │   ├── payment.service.ts            # Payment CRUD + policy update
        │   ├── sse-listener.service.ts       # Listens for policy events
        │   └── sse-payment-publisher.service.ts  # Emits payment events
        └── payment/
            └── payment.routes.ts  # Exposed routes
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Angular CLI** 21.x (`npm install -g @angular/cli`)

### Installation

```bash
cd insure-hub

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
ng serve --port 4201
```

**Terminal 2 - MFE2 Premium Payment (port 4202):**

```bash
cd mfe-premium-payment
ng serve --port 4202
```

**Terminal 3 - Container Shell (port 4200):**

```bash
cd container-app
ng serve --port 4200
```

Open http://localhost:4200 in your browser.

> **Note:** Start MFE1 and MFE2 before the container app. The container loads MFE remotes at runtime via their `remoteEntry.js`.

### Building for Production

```bash
cd container-app && ng build --configuration production
cd mfe-policy-dashboard && ng build --configuration production
cd mfe-premium-payment && ng build --configuration production
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
// Loads MFE1 and MFE2 at runtime
remotes: {
  mfePolicyDashboard: 'http://localhost:4201/remoteEntry.js',
  mfePremiumPayment:  'http://localhost:4202/remoteEntry.js',
}
```

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

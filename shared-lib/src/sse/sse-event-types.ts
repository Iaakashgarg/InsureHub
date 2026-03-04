/** Named SSE streams (channels) */
export const SSE_STREAMS = {
  POLICY_EVENTS: "policy-events",
  PAYMENT_EVENTS: "payment-events",
  NAVIGATION_EVENTS: "navigation-events",
} as const;

/** SSE event types within streams */
export const SSE_EVENT_TYPES = {
  // Policy stream events
  POLICY_SELECTED: "policy:selected",
  POLICY_UPDATED: "policy:updated",
  PREMIUM_CALCULATED: "policy:premium-calculated",

  // Payment stream events
  PAYMENT_INITIATED: "payment:initiated",
  PAYMENT_COMPLETED: "payment:completed",
  PAYMENT_FAILED: "payment:failed",

  // Navigation events
  NAVIGATE_TO_PAYMENT: "nav:to-payment",
  NAVIGATE_TO_POLICIES: "nav:to-policies",
} as const;

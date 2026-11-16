/**
 * Client-Side DFA Order Validator
 * Identical rules as server-side to ensure deterministic consistency.
 */
(function(window) {
  const DFA_STATES = Object.freeze({
    S0: {
      id: 'S0',
      name: 'ORDER_PLACED',
      label: 'Order Placed',
      stepNumber: 0,
      isTerminal: false,
      badgeClass: 'badge-primary',
      color: '#0d6efd',
      icon: 'bi-cart-check-fill',
      description: 'The order has been created and received by the system.'
    },
    S1: {
      id: 'S1',
      name: 'ORDER_CONFIRMED',
      label: 'Order Confirmed',
      stepNumber: 1,
      isTerminal: false,
      badgeClass: 'badge-info',
      color: '#0dcaf0',
      icon: 'bi-patch-check-fill',
      description: 'Payment verified and order accepted by the store.'
    },
    S2: {
      id: 'S2',
      name: 'PROCESSING',
      label: 'Processing',
      stepNumber: 2,
      isTerminal: false,
      badgeClass: 'badge-warning',
      color: '#ffc107',
      icon: 'bi-gear-wide-connected',
      description: 'Items are being picked, quality-checked, and packed in warehouse.'
    },
    S3: {
      id: 'S3',
      name: 'SHIPPED',
      label: 'Shipped',
      stepNumber: 3,
      isTerminal: false,
      badgeClass: 'badge-secondary',
      color: '#6c757d',
      icon: 'bi-truck',
      description: 'Package has been handed over to the courier logistics partner.'
    },
    S4: {
      id: 'S4',
      name: 'OUT_FOR_DELIVERY',
      label: 'Out for Delivery',
      stepNumber: 4,
      isTerminal: false,
      badgeClass: 'badge-indigo',
      color: '#6610f2',
      icon: 'bi-geo-alt-fill',
      description: 'Courier agent has left the local hub and is en route to customer.'
    },
    S5: {
      id: 'S5',
      name: 'DELIVERED',
      label: 'Delivered',
      stepNumber: 5,
      isTerminal: true,
      badgeClass: 'badge-success',
      color: '#198754',
      icon: 'bi-check-circle-fill',
      description: 'Order successfully delivered to customer. Terminal state (Immutable).'
    },
    S6: {
      id: 'S6',
      name: 'CANCELLED',
      label: 'Cancelled',
      stepNumber: -1,
      isTerminal: true,
      badgeClass: 'badge-danger',
      color: '#dc3545',
      icon: 'bi-x-circle-fill',
      description: 'Order has been cancelled. Terminal state (Immutable).'
    }
  });

  const DFA_ACTIONS = Object.freeze({
    CONFIRM_ORDER: {
      code: 'CONFIRM_ORDER',
      label: 'Confirm Order',
      targetState: 'S1',
      description: 'Accept order and verify inventory/payment.'
    },
    START_PROCESSING: {
      code: 'START_PROCESSING',
      label: 'Start Processing',
      targetState: 'S2',
      description: 'Send items to warehouse packing station.'
    },
    SHIP_ORDER: {
      code: 'SHIP_ORDER',
      label: 'Ship Order',
      targetState: 'S3',
      description: 'Dispatch packed parcel via courier.'
    },
    OUT_FOR_DELIVERY: {
      code: 'OUT_FOR_DELIVERY',
      label: 'Out for Delivery',
      targetState: 'S4',
      description: 'Package is on final delivery vehicle with courier.'
    },
    DELIVER_ORDER: {
      code: 'DELIVER_ORDER',
      label: 'Deliver Order',
      targetState: 'S5',
      description: 'Mark order as handed to recipient (Final Delivered state).'
    },
    CANCEL_ORDER: {
      code: 'CANCEL_ORDER',
      label: 'Cancel Order',
      targetState: 'S6',
      description: 'Cancel order and release reserved stock (Final Cancelled state).'
    }
  });

  const DFA_TRANSITION_TABLE = Object.freeze({
    S0: [
      { targetState: 'S1', action: 'CONFIRM_ORDER', actionLabel: 'Confirm Order' },
      { targetState: 'S6', action: 'CANCEL_ORDER', actionLabel: 'Cancel Order' }
    ],
    S1: [
      { targetState: 'S2', action: 'START_PROCESSING', actionLabel: 'Start Processing' },
      { targetState: 'S6', action: 'CANCEL_ORDER', actionLabel: 'Cancel Order' }
    ],
    S2: [
      { targetState: 'S3', action: 'SHIP_ORDER', actionLabel: 'Ship Order' }
    ],
    S3: [
      { targetState: 'S4', action: 'OUT_FOR_DELIVERY', actionLabel: 'Out for Delivery' }
    ],
    S4: [
      { targetState: 'S5', action: 'DELIVER_ORDER', actionLabel: 'Deliver Order' }
    ],
    S5: [],
    S6: []
  });

  function normalizeState(stateInput) {
    if (!stateInput) return null;
    const upper = String(stateInput).trim().toUpperCase();
    if (DFA_STATES[upper]) return upper;
    for (const [key, state] of Object.entries(DFA_STATES)) {
      if (state.name === upper || state.label.toUpperCase() === upper) {
        return key;
      }
    }
    return null;
  }

  function isTerminalState(stateInput) {
    const stateId = normalizeState(stateInput);
    if (!stateId) return false;
    return Boolean(DFA_STATES[stateId].isTerminal);
  }

  function getValidNextTransitions(currentStateInput) {
    const stateId = normalizeState(currentStateInput);
    if (!stateId || !DFA_TRANSITION_TABLE[stateId]) return [];
    return DFA_TRANSITION_TABLE[stateId].map(tr => ({
      targetState: tr.targetState,
      targetLabel: DFA_STATES[tr.targetState].label,
      action: tr.action,
      actionLabel: tr.actionLabel,
      badgeClass: DFA_STATES[tr.targetState].badgeClass,
      color: DFA_STATES[tr.targetState].color,
      icon: DFA_STATES[tr.targetState].icon
    }));
  }

  function validateTransition(currentStateInput, targetInput) {
    const fromState = normalizeState(currentStateInput);
    if (!fromState) {
      return {
        isValid: false,
        fromState: currentStateInput,
        fromLabel: 'Unknown State',
        toState: null,
        toLabel: null,
        errorMessage: `Invalid DFA State: '${currentStateInput}' does not exist.`
      };
    }

    const fromMeta = DFA_STATES[fromState];

    if (fromState === 'S5') {
      return {
        isValid: false,
        fromState: 'S5',
        fromLabel: fromMeta.label,
        toState: null,
        toLabel: null,
        errorMessage: "DFA Violation: Order is in terminal state 'Delivered' (S5). Delivered orders cannot be modified."
      };
    }

    if (fromState === 'S6') {
      return {
        isValid: false,
        fromState: 'S6',
        fromLabel: fromMeta.label,
        toState: null,
        toLabel: null,
        errorMessage: "DFA Violation: Order is in terminal state 'Cancelled' (S6). Cancelled orders cannot be modified."
      };
    }

    let targetState = normalizeState(targetInput);
    let actionCode = null;

    if (!targetState) {
      const upperInput = String(targetInput).trim().toUpperCase();
      if (DFA_ACTIONS[upperInput]) {
        actionCode = upperInput;
        targetState = DFA_ACTIONS[upperInput].targetState;
      }
    }

    if (!targetState) {
      return {
        isValid: false,
        fromState: fromState,
        fromLabel: fromMeta.label,
        toState: null,
        toLabel: null,
        errorMessage: `DFA Violation: Target status '${targetInput}' is unrecognized.`
      };
    }

    const toMeta = DFA_STATES[targetState];

    if (fromState === targetState) {
      return {
        isValid: false,
        fromState: fromState,
        fromLabel: fromMeta.label,
        toState: targetState,
        toLabel: toMeta.label,
        errorMessage: `DFA Violation: Self-transition rejected. The order is already in state '${toMeta.label}' (${targetState}).`
      };
    }

    const validTransitions = DFA_TRANSITION_TABLE[fromState] || [];
    const match = validTransitions.find(t => t.targetState === targetState);

    if (!match) {
      const allowedTransitionsList = validTransitions
        .map(t => `'${DFA_STATES[t.targetState].label}' (${t.targetState}) via ${t.actionLabel}`)
        .join(', ');

      return {
        isValid: false,
        fromState: fromState,
        fromLabel: fromMeta.label,
        toState: targetState,
        toLabel: toMeta.label,
        errorMessage: `DFA Violation: Invalid state transition! Cannot transition from '${fromMeta.label}' (${fromState}) directly to '${toMeta.label}' (${targetState}). ` +
                      (allowedTransitionsList 
                        ? `Allowed transition(s) from ${fromState}: [ ${allowedTransitionsList} ].` 
                        : `No transitions allowed from ${fromState}.`)
      };
    }

    return {
      isValid: true,
      fromState: fromState,
      fromLabel: fromMeta.label,
      toState: targetState,
      toLabel: toMeta.label,
      action: match.action,
      actionLabel: match.actionLabel,
      errorMessage: null
    };
  }

  function getStateMetadata(stateInput) {
    const stateId = normalizeState(stateInput);
    return stateId ? DFA_STATES[stateId] : null;
  }

  function getAllStates() {
    return Object.values(DFA_STATES);
  }

  window.DFAOrderValidator = {
    DFA_STATES,
    DFA_ACTIONS,
    DFA_TRANSITION_TABLE,
    normalizeState,
    isTerminalState,
    getValidNextTransitions,
    validateTransition,
    getStateMetadata,
    getAllStates
  };
})(typeof window !== 'undefined' ? window : this);

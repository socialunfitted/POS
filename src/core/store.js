/**
 * Reactive Store Engine
 * Lightweight state store leveraging ES6 Proxy for fine-grained reactive state tracking.
 */
export class Store {
  /**
   * @param {Object} initialState - Initial state object
   */
  constructor(initialState = {}) {
    this.listeners = new Set();
    this.state = new Proxy(initialState, {
      set: (target, property, value) => {
        const oldValue = target[property];
        if (oldValue !== value) {
          target[property] = value;
          this.notify(property, value, oldValue);
        }
        return true;
      }
    });
  }

  /**
   * Get current state snapshot
   */
  getState() {
    return this.state;
  }

  /**
   * Update multiple state properties at once
   * @param {Object} partialState 
   */
  setState(partialState) {
    Object.assign(this.state, partialState);
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback (key, newValue, oldValue, state)
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all registered subscribers
   */
  notify(key, newValue, oldValue) {
    this.listeners.forEach((listener) => {
      try {
        listener(key, newValue, oldValue, this.state);
      } catch (err) {
        console.error('[Store Error] Subscriber execution failed:', err);
      }
    });
  }
}

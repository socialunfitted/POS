/**
 * Global Event Bus
 * Decoupled publish-subscribe pattern for application-wide event communication.
 */
class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);

    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event 
   * @param {Function} callback 
   */
  off(event, callback) {
    if (this.events.has(event)) {
      this.events.get(event).delete(callback);
    }
  }

  /**
   * Publish an event with optional payload
   * @param {string} event 
   * @param {any} data 
   */
  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(`[EventBus Error] Event "${event}" handler failed:`, err);
        }
      });
    }
  }

  /**
   * Subscribe to event once
   * @param {string} event 
   * @param {Function} callback 
   */
  once(event, callback) {
    const unbind = this.on(event, (data) => {
      unbind();
      callback(data);
    });
  }
}

export const eventBus = new EventBus();

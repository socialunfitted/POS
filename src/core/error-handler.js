import { eventBus } from './event-bus.js';

/**
 * Global Application Error Boundary & Interceptor
 */
export class GlobalErrorHandler {
  static init() {
    // Uncaught Javascript Exceptions
    window.addEventListener('error', (event) => {
      GlobalErrorHandler.handleError({
        type: 'UNCAUGHT_EXCEPTION',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        error: event.error
      });
    });

    // Unhandled Promise Rejections (API calls, async tasks)
    window.addEventListener('unhandledrejection', (event) => {
      GlobalErrorHandler.handleError({
        type: 'UNHANDLED_REJECTION',
        message: event.reason?.message || String(event.reason),
        error: event.reason
      });
    });
  }

  /**
   * Central error processor
   * @param {Object} errInfo 
   */
  static handleError(errInfo) {
    console.error('[GlobalErrorHandler Caught Error]:', errInfo);

    // Emit event for UI Toast notification system
    eventBus.emit('NOTIFICATION_TRIGGERED', {
      type: 'error',
      title: 'System Error',
      message: errInfo.message || 'An unexpected error occurred. Please try again.',
      duration: 5000
    });

    // Optional remote telemetry logging hook
    eventBus.emit('LOG_TELEMETRY', {
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      details: errInfo
    });
  }

  /**
   * Format Supabase API Errors into readable system error messages
   * @param {Object} supabaseError 
   * @returns {Error}
   */
  static formatSupabaseError(supabaseError) {
    if (!supabaseError) return new Error('Unknown API Error');
    const msg = supabaseError.message || supabaseError.error_description || 'Database request failed';
    const err = new Error(msg);
    err.code = supabaseError.code;
    err.details = supabaseError.details;
    return err;
  }
}

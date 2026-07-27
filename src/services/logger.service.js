/**
 * Centralized Client-Side Logger Service
 */
export class LoggerService {
  static LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };

  static currentLevel = LoggerService.LOG_LEVELS.INFO;

  static debug(message, ...args) {
    if (this.currentLevel <= this.LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, ...args);
    }
  }

  static info(message, ...args) {
    if (this.currentLevel <= this.LOG_LEVELS.INFO) {
      console.info(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
    }
  }

  static warn(message, ...args) {
    if (this.currentLevel <= this.LOG_LEVELS.WARN) {
      console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...args);
    }
  }

  static error(message, ...args) {
    if (this.currentLevel <= this.LOG_LEVELS.ERROR) {
      console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, ...args);
    }
  }
}

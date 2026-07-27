import { eventBus } from './event-bus.js';

/**
 * SPA Hash/History Client Router with Middleware Pipeline
 */
export class Router {
  constructor(containerId = 'app-view') {
    this.containerId = containerId;
    this.routes = new Map();
    this.currentRoute = null;
    this.middlewares = [];

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  /**
   * Add middleware guard to router execution pipeline
   * @param {Function} middlewareFn - Async function (route, context) => boolean|string
   */
  use(middlewareFn) {
    this.middlewares.push(middlewareFn);
  }

  /**
   * Register a route definition
   * @param {string} path - e.g. '#/dashboard'
   * @param {Object} options - { component, meta: { requiresAuth, tenantOnly, requiredFeature, requiredPlan } }
   */
  register(path, options) {
    this.routes.set(path, {
      path,
      component: options.component,
      meta: options.meta || {}
    });
  }

  /**
   * Navigate programmatically to path
   * @param {string} path 
   */
  navigate(path) {
    window.location.hash = path.startsWith('#') ? path : `#${path}`;
  }

  /**
   * Process current hash route through middleware pipeline and render
   */
  async handleRoute() {
    let hash = window.location.hash || '#/dashboard';
    let route = this.routes.get(hash);

    if (!route) {
      route = this.routes.get('#/404') || {
        path: '#/404',
        component: () => '<div class="card p-6 text-center"><h2>404 - Page Not Found</h2></div>',
        meta: {}
      };
    }

    const context = { route, redirectPath: null };

    // Execute global and route-specific middleware pipeline
    for (const middleware of this.middlewares) {
      const allowed = await middleware(route, context);
      if (allowed === false || context.redirectPath) {
        const fallback = context.redirectPath || '#/login';
        if (window.location.hash !== fallback) {
          this.navigate(fallback);
        }
        return;
      }
    }

    this.currentRoute = route;
    const container = document.getElementById(this.containerId);

    if (container) {
      // Clear container and mount view component
      container.innerHTML = '';
      if (typeof route.component === 'function') {
        const content = await route.component();
        if (typeof content === 'string') {
          container.innerHTML = content;
        } else if (content instanceof HTMLElement) {
          container.appendChild(content);
        } else if (content && typeof content.mount === 'function') {
          content.mount(container);
        }
      }
    }

    eventBus.emit('ROUTE_CHANGED', { route: route.path, meta: route.meta });
  }
}

import { SUPABASE_CONFIG } from '../config/supabase.config.js';
import { GlobalErrorHandler } from '../core/error-handler.js';

/**
 * Base Supabase Connection & Repository Layer Wrapper
 */
export class SupabaseService {
  constructor() {
    this.client = null;
    this.initClient();
  }

  /**
   * Initialize Supabase Client
   */
  initClient() {
    if (window.supabase?.createClient) {
      this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, SUPABASE_CONFIG.options);
    } else {
      console.warn('[SupabaseService] Supabase JS SDK CDN or module bundle not loaded yet. Mocking client layer.');
    }
  }

  /**
   * Abstract Query Executor with standardized error formatting
   * @param {Function} queryFn - Async query function
   */
  async executeQuery(queryFn) {
    try {
      if (!this.client) this.initClient();
      const { data, error } = await queryFn(this.client);
      if (error) throw GlobalErrorHandler.formatSupabaseError(error);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Base Generic Repository Methods
   */
  async findByTenant(table, tenantId, select = '*') {
    return this.executeQuery((client) =>
      client.from(table).select(select).eq('tenant_id', tenantId)
    );
  }

  async findById(table, id, select = '*') {
    return this.executeQuery((client) =>
      client.from(table).select(select).eq('id', id).single()
    );
  }

  async insert(table, payload) {
    return this.executeQuery((client) =>
      client.from(table).insert(payload).select()
    );
  }

  async update(table, id, payload) {
    return this.executeQuery((client) =>
      client.from(table).update(payload).eq('id', id).select()
    );
  }

  async delete(table, id) {
    return this.executeQuery((client) =>
      client.from(table).delete().eq('id', id)
    );
  }
}

export const supabaseService = new SupabaseService();

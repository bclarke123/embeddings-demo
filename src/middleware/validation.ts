import type { Context, Next } from "hono";

interface ExtendedContext extends Context {
  get(key: 'validatedBody'): { title?: string; content?: string; query?: string; limit?: number };
  get(key: 'validatedId'): number;
  get(key: string): unknown;
}

export interface ValidationSchema {
  title?: {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
  };
  content?: {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
  };
  query?: {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
  };
  limit?: {
    min?: number;
    max?: number;
    default?: number;
  };
}

export function validateBody(schema: ValidationSchema) {
  return async (c: ExtendedContext, next: Next) => {
    const body = await c.req.json().catch(() => null);
    
    if (!body || typeof body !== 'object') {
      throw new Error("Invalid JSON body");
    }
    
    // Validate title
    if (schema.title) {
      if (schema.title.required && !body.title) {
        throw new Error("Title is required");
      }
      if (body.title && typeof body.title !== 'string') {
        throw new Error("Title must be a string");
      }
      if (body.title && schema.title.maxLength && body.title.length > schema.title.maxLength) {
        throw new Error(`Title must be less than ${schema.title.maxLength} characters`);
      }
      if (body.title && schema.title.minLength && body.title.length < schema.title.minLength) {
        throw new Error(`Title must be at least ${schema.title.minLength} characters`);
      }
    }
    
    // Validate content
    if (schema.content) {
      if (schema.content.required && !body.content) {
        throw new Error("Content is required");
      }
      if (body.content && typeof body.content !== 'string') {
        throw new Error("Content must be a string");
      }
      if (body.content && schema.content.maxLength && body.content.length > schema.content.maxLength) {
        throw new Error(`Content must be less than ${schema.content.maxLength} characters`);
      }
      if (body.content && schema.content.minLength && body.content.length < schema.content.minLength) {
        throw new Error(`Content must be at least ${schema.content.minLength} characters`);
      }
    }
    
    // Validate query
    if (schema.query) {
      if (schema.query.required && !body.query) {
        throw new Error("Query is required");
      }
      if (body.query && typeof body.query !== 'string') {
        throw new Error("Query must be a string");
      }
      if (body.query && schema.query.maxLength && body.query.length > schema.query.maxLength) {
        throw new Error(`Query must be less than ${schema.query.maxLength} characters`);
      }
      if (body.query && schema.query.minLength && body.query.length < schema.query.minLength) {
        throw new Error(`Query must be at least ${schema.query.minLength} characters`);
      }
    }
    
    // Validate limit
    if (schema.limit && body.limit !== undefined) {
      const limit = Number(body.limit);
      if (isNaN(limit)) {
        throw new Error("Limit must be a number");
      }
      if (schema.limit.min && limit < schema.limit.min) {
        throw new Error(`Limit must be at least ${schema.limit.min}`);
      }
      if (schema.limit.max && limit > schema.limit.max) {
        throw new Error(`Limit must be no more than ${schema.limit.max}`);
      }
      // Set default if not provided
      body.limit = limit;
    } else if (schema.limit?.default) {
      body.limit = schema.limit.default;
    }
    
    // Store validated body for use in handlers
    c.set('validatedBody', body);
    await next();
  };
}

export function validateParams(paramName: string, isNumeric = false) {
  return async (c: ExtendedContext, next: Next) => {
    const param = c.req.param(paramName);
    
    if (!param) {
      throw new Error(`${paramName} parameter is required`);
    }
    
    if (isNumeric) {
      const numericValue = parseInt(param);
      if (isNaN(numericValue) || numericValue <= 0) {
        throw new Error(`${paramName} must be a positive number`);
      }
      c.set(`validated${paramName.charAt(0).toUpperCase() + paramName.slice(1)}`, numericValue);
    }
    
    await next();
  };
}
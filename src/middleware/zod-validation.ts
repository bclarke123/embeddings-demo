import type { Context, Next } from "hono";
import type { z } from "zod";
import { validateJsonBody, validateParams, validateQuery } from "../lib/schemas";

// Custom context interface for validated data
declare module "hono" {
  interface ContextVariableMap {
    validatedBody: any;
    validatedParams: any;
    validatedQuery: any;
  }
}

/**
 * Middleware for validating JSON request body with Zod schema
 */
export function zodValidateBody<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    let body: unknown;
    
    try {
      body = await c.req.json();
    } catch (error) {
      throw new Error("Invalid JSON body");
    }
    
    const result = validateJsonBody(schema, body);
    
    if (!result.success) {
      const firstError = result.error.issues[0];
      const errorMessage = firstError ? firstError.message : result.error.message;
      throw new Error(errorMessage);
    }
    
    // Store validated data in context
    c.set('validatedBody', result.data);
    await next();
  };
}

/**
 * Middleware for validating URL parameters with Zod schema
 */
export function zodValidateParams<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    const params = c.req.param();
    const result = validateParams(schema, params);
    
    if (!result.success) {
      const firstError = result.error.issues[0];
      const errorMessage = firstError ? firstError.message : result.error.message;
      throw new Error(errorMessage);
    }
    
    // Store validated data in context
    c.set('validatedParams', result.data);
    await next();
  };
}

/**
 * Middleware for validating query parameters with Zod schema
 */
export function zodValidateQuery<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    const query = c.req.query();
    const result = validateQuery(schema, query);
    
    if (!result.success) {
      const firstError = result.error.issues[0];
      const errorMessage = firstError ? firstError.message : result.error.message;
      throw new Error(errorMessage);
    }
    
    // Store validated data in context
    c.set('validatedQuery', result.data);
    await next();
  };
}

/**
 * Helper function to get validated body from context with proper typing
 */
export function getValidatedBody<T>(c: Context): T {
  return c.get('validatedBody') as T;
}

/**
 * Helper function to get validated params from context with proper typing
 */
export function getValidatedParams<T>(c: Context): T {
  return c.get('validatedParams') as T;
}

/**
 * Helper function to get validated query from context with proper typing
 */
export function getValidatedQuery<T>(c: Context): T {
  return c.get('validatedQuery') as T;
}
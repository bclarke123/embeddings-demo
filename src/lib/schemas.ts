import { z } from "zod";

// Base validation schemas
export const scriptCreateSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  content: z.string()
    .min(10, "Content must be at least 10 characters")
    .max(1000000, "Content must be less than 1,000,000 characters")
    .trim()
});

export const batchUploadSchema = z.object({
  files: z.array(z.object({
    title: z.string()
      .min(1, "Title is required")
      .max(200, "Title must be less than 200 characters")
      .trim(),
    content: z.string()
      .min(10, "Content must be at least 10 characters")
      .max(1000000, "Content must be less than 1,000,000 characters")
      .trim()
  }))
  .min(1, "At least one file is required")
  .max(50, "Maximum 50 files per batch")
});

export const searchRequestSchema = z.object({
  query: z.string()
    .min(1, "Query is required")
    .max(500, "Query must be less than 500 characters")
    .trim(),
  limit: z.number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be no more than 50")
    .default(10)
});

export const scriptIdParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, "ID must be a positive integer")
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, "ID must be a positive integer")
});

// Health check schemas
export const healthMetricsQuerySchema = z.object({
  since: z.string()
    .datetime("Invalid date format")
    .optional()
}).transform(data => ({
  since: data.since ? new Date(data.since) : new Date(Date.now() - 60 * 60 * 1000)
}));

// Type exports for use in services and API routes
export type ScriptCreateInput = z.infer<typeof scriptCreateSchema>;
export type BatchUploadInput = z.infer<typeof batchUploadSchema>;
export type SearchRequestInput = z.infer<typeof searchRequestSchema>;
export type ScriptIdParam = z.infer<typeof scriptIdParamSchema>;
export type HealthMetricsQuery = z.infer<typeof healthMetricsQuerySchema>;

// Validation result types
export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    message: string;
    issues: Array<{
      path: string[];
      message: string;
      code: string;
    }>;
  };
};

// Validation helper functions
export function validateSchema<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }
  
  return {
    success: false,
    error: {
      message: "Validation failed",
      issues: result.error.issues.map(issue => ({
        path: issue.path.map(String),
        message: issue.message,
        code: issue.code
      }))
    }
  };
}

// Schema validation for JSON body
export function validateJsonBody<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): ValidationResult<T> {
  // First check if data exists and is an object
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: {
        message: "Invalid JSON body",
        issues: [{
          path: [],
          message: "Request body must be a valid JSON object",
          code: "invalid_type"
        }]
      }
    };
  }
  
  return validateSchema(schema, data);
}

// Parameter validation
export function validateParams<T>(
  schema: z.ZodSchema<T>, 
  params: Record<string, string>
): ValidationResult<T> {
  return validateSchema(schema, params);
}

// Query parameter validation
export function validateQuery<T>(
  schema: z.ZodSchema<T>, 
  query: Record<string, string | undefined>
): ValidationResult<T> {
  return validateSchema(schema, query);
}
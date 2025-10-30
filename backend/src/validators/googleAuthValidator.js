const { z } = require('zod');

// Role validation (reused from authValidator)
const roleSchema = z
  .enum(['admin', 'creator', 'analyst'], {
    errorMap: () => ({ message: 'Role must be admin, creator, or analyst' })
  })
  .optional()
  .default('analyst');

// Google OAuth authentication schema
const googleAuthSchema = z.object({
  token: z
    .string()
    .min(1, { message: 'Google ID token is required' })
    .max(2000, { message: 'Google token is too long' }), // Google tokens are typically 800-1500 chars
  role: roleSchema
}).strict();

// Google token validation schema (for token verification endpoint)
const googleTokenValidationSchema = z.object({
  token: z
    .string()
    .min(1, { message: 'Google ID token is required' })
}).strict();

// Schema for linking Google account to existing user
const linkGoogleAccountSchema = z.object({
  token: z
    .string()
    .min(1, { message: 'Google ID token is required' })
    .max(2000, { message: 'Google token is too long' })
}).strict();

// Schema for unlinking Google account
const unlinkGoogleAccountSchema = z.object({
  password: z
    .string()
    .min(1, { message: 'Password is required to unlink Google account' })
    .max(128, { message: 'Password cannot exceed 128 characters' })
}).strict();

module.exports = {
  googleAuthSchema,
  googleTokenValidationSchema,
  linkGoogleAccountSchema,
  unlinkGoogleAccountSchema
};
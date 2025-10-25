const { z } = require('zod');

// Common email validation
const emailSchema = z
  .string()
  .email({ message: 'Please provide a valid email address' })
  .min(1, { message: 'Email is required' })
  .max(100, { message: 'Email cannot exceed 100 characters' })
  .transform(email => email.toLowerCase().trim());

// Common password validation
const passwordSchema = z
  .string()
  .min(6, { message: 'Password must be at least 6 characters long' })
  .max(128, { message: 'Password cannot exceed 128 characters' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  });

// Name validation
const nameSchema = z
  .string()
  .min(1, { message: 'Name cannot be empty' })
  .max(50, { message: 'Name cannot exceed 50 characters' })
  .regex(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
  })
  .transform(name => name.trim())
  .optional();

// Role validation
const roleSchema = z
  .enum(['admin', 'creator', 'analyst'], {
    errorMap: () => ({ message: 'Role must be admin, creator, or analyst' })
  })
  .optional()
  .default('analyst');

// Register schema
const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: roleSchema
}).strict();

// Login schema
const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .max(128, { message: 'Password cannot exceed 128 characters' })
}).strict();

// Refresh token schema
const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, { message: 'Refresh token is required' })
}).strict();

// Update profile schema
const updateProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema
}).strict().refine(data => {
  // At least one field must be provided
  return data.firstName !== undefined || data.lastName !== undefined;
}, {
  message: 'At least one field (firstName or lastName) must be provided'
});

// Change password schema
const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: 'Current password is required' })
    .max(128, { message: 'Current password cannot exceed 128 characters' }),
  newPassword: passwordSchema
}).strict().refine(data => {
  return data.currentPassword !== data.newPassword;
}, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

// Forgot password schema
const forgotPasswordSchema = z.object({
  email: emailSchema
}).strict();

// Reset password schema
const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, { message: 'Reset token is required' }),
  password: passwordSchema
}).strict();

// Update role schema (admin only)
const updateRoleSchema = z.object({
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid user ID format' }),
  role: z.enum(['admin', 'creator', 'analyst'], {
    errorMap: () => ({ message: 'Role must be admin, creator, or analyst' })
  })
}).strict();

// Google OAuth authentication schema
const googleAuthSchema = z.object({
  token: z
    .string()
    .min(1, { message: 'Google ID token is required' })
    .max(2000, { message: 'Google token is too long' }),
  role: roleSchema
}).strict();

// Twitter OAuth authentication schema
const twitterAuthSchema = z.object({
  code: z
    .string()
    .min(1, { message: 'Twitter authorization code is required' })
    .max(500, { message: 'Twitter code is too long' }),
  codeVerifier: z
    .string()
    .min(43, { message: 'Code verifier must be at least 43 characters' })
    .max(128, { message: 'Code verifier is too long' }),
  role: roleSchema
}).strict();

// GitHub OAuth authentication schema
const githubAuthSchema = z.object({
  code: z
    .string()
    .min(1, { message: 'GitHub authorization code is required' })
    .max(500, { message: 'GitHub code is too long' }),
  role: roleSchema
}).strict();

// Link Google account schema
const linkGoogleAccountSchema = z.object({
  token: z
    .string()
    .min(1, { message: 'Google ID token is required' })
    .max(2000, { message: 'Google token is too long' })
}).strict();

// Unlink Google account schema
const unlinkGoogleAccountSchema = z.object({
  password: z
    .string()
    .min(1, { message: 'Password is required to unlink Google account' })
    .max(128, { message: 'Password cannot exceed 128 characters' })
}).strict();

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateRoleSchema,
  googleAuthSchema,
  twitterAuthSchema,
  githubAuthSchema,
  linkGoogleAccountSchema,
  unlinkGoogleAccountSchema
};
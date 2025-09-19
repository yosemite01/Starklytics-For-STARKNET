const { z } = require('zod');

// MongoDB ObjectId validation
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid ID format' });

// Reward schema
const rewardSchema = z.object({
  amount: z
    .number()
    .positive({ message: 'Reward amount must be positive' })
    .max(1000000, { message: 'Reward amount cannot exceed 1,000,000' }),
  currency: z
    .enum(['USD', 'EUR', 'GBP', 'ETH', 'BTC'], {
      errorMap: () => ({ message: 'Currency must be USD, EUR, GBP, ETH, or BTC' })
    })
    .default('USD')
});

// Requirement schema
const requirementSchema = z.object({
  description: z
    .string()
    .min(1, { message: 'Requirement description is required' })
    .max(500, { message: 'Requirement description cannot exceed 500 characters' })
    .transform(desc => desc.trim()),
  isCompleted: z.boolean().optional().default(false)
});

// Tag schema
const tagSchema = z
  .string()
  .min(1, { message: 'Tag cannot be empty' })
  .max(30, { message: 'Tag cannot exceed 30 characters' })
  .regex(/^[a-zA-Z0-9-_]+$/, {
    message: 'Tags can only contain letters, numbers, hyphens, and underscores'
  })
  .transform(tag => tag.toLowerCase().trim());

// Create bounty schema
const createBountySchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required' })
    .max(200, { message: 'Title cannot exceed 200 characters' })
    .transform(title => title.trim()),
  description: z
    .string()
    .min(1, { message: 'Description is required' })
    .max(2000, { message: 'Description cannot exceed 2000 characters' })
    .transform(desc => desc.trim()),
  reward: rewardSchema,
  status: z
    .enum(['draft', 'active', 'completed', 'cancelled', 'expired'], {
      errorMap: () => ({ message: 'Invalid status' })
    })
    .optional()
    .default('draft'),
  priority: z
    .enum(['low', 'medium', 'high', 'critical'], {
      errorMap: () => ({ message: 'Priority must be low, medium, high, or critical' })
    })
    .optional()
    .default('medium'),
  category: z.enum(['bug', 'feature', 'security', 'documentation', 'design', 'research', 'other'], {
    errorMap: () => ({ message: 'Invalid category' })
  }),
  tags: z
    .array(tagSchema)
    .max(10, { message: 'Cannot have more than 10 tags' })
    .optional()
    .default([]),
  requirements: z
    .array(requirementSchema)
    .max(20, { message: 'Cannot have more than 20 requirements' })
    .optional()
    .default([]),
  deadline: z
    .string()
    .datetime({ message: 'Invalid deadline format' })
    .transform(date => new Date(date))
    .refine(date => date > new Date(), {
      message: 'Deadline must be in the future'
    })
    .optional(),
  isPublic: z.boolean().optional().default(true)
}).strict();

// Update bounty schema (all fields optional except for validation)
const updateBountySchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title cannot be empty' })
    .max(200, { message: 'Title cannot exceed 200 characters' })
    .transform(title => title.trim())
    .optional(),
  description: z
    .string()
    .min(1, { message: 'Description cannot be empty' })
    .max(2000, { message: 'Description cannot exceed 2000 characters' })
    .transform(desc => desc.trim())
    .optional(),
  reward: rewardSchema.optional(),
  status: z
    .enum(['draft', 'active', 'completed', 'cancelled', 'expired'], {
      errorMap: () => ({ message: 'Invalid status' })
    })
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high', 'critical'], {
      errorMap: () => ({ message: 'Priority must be low, medium, high, or critical' })
    })
    .optional(),
  category: z
    .enum(['bug', 'feature', 'security', 'documentation', 'design', 'research', 'other'], {
      errorMap: () => ({ message: 'Invalid category' })
    })
    .optional(),
  tags: z
    .array(tagSchema)
    .max(10, { message: 'Cannot have more than 10 tags' })
    .optional(),
  requirements: z
    .array(requirementSchema)
    .max(20, { message: 'Cannot have more than 20 requirements' })
    .optional(),
  deadline: z
    .string()
    .datetime({ message: 'Invalid deadline format' })
    .transform(date => new Date(date))
    .refine(date => date > new Date(), {
      message: 'Deadline must be in the future'
    })
    .optional()
    .nullable(),
  isPublic: z.boolean().optional(),
  assignedTo: objectIdSchema.optional().nullable()
}).strict().refine(data => {
  // At least one field must be provided for update
  return Object.keys(data).length > 0;
}, {
  message: 'At least one field must be provided for update'
});

// Bounty params schema (for route parameters)
const bountyParamsSchema = z.object({
  id: objectIdSchema
}).strict();

// Submit to bounty schema
const submitToBountySchema = z.object({
  content: z
    .string()
    .min(1, { message: 'Submission content is required' })
    .max(5000, { message: 'Submission content cannot exceed 5000 characters' })
    .transform(content => content.trim()),
  attachments: z
    .array(z.string().url({ message: 'Invalid attachment URL' }))
    .max(5, { message: 'Cannot have more than 5 attachments' })
    .optional()
    .default([])
}).strict();

// Bounty query schema (for filtering and pagination)
const bountyQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, { message: 'Page must be a positive integer' })
    .transform(val => parseInt(val))
    .refine(val => val > 0, { message: 'Page must be greater than 0' })
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/, { message: 'Limit must be a positive integer' })
    .transform(val => parseInt(val))
    .refine(val => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' })
    .optional(),
  status: z
    .enum(['draft', 'active', 'completed', 'cancelled', 'expired'])
    .optional(),
  category: z
    .enum(['bug', 'feature', 'security', 'documentation', 'design', 'research', 'other'])
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high', 'critical'])
    .optional(),
  search: z
    .string()
    .min(1)
    .max(100, { message: 'Search term cannot exceed 100 characters' })
    .transform(search => search.trim())
    .optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'reward.amount', 'deadline', 'title'])
    .optional(),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional(),
  minReward: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Invalid minimum reward format' })
    .transform(val => parseFloat(val))
    .optional(),
  maxReward: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Invalid maximum reward format' })
    .transform(val => parseFloat(val))
    .optional()
}).strict();

// Search bounties schema
const searchBountiesSchema = z.object({
  q: z
    .string()
    .min(1, { message: 'Search query is required' })
    .max(100, { message: 'Search query cannot exceed 100 characters' })
    .transform(query => query.trim()),
  category: z
    .enum(['bug', 'feature', 'security', 'documentation', 'design', 'research', 'other'])
    .optional(),
  status: z
    .enum(['draft', 'active', 'completed', 'cancelled', 'expired'])
    .optional(),
  minReward: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .transform(val => parseFloat(val))
    .optional(),
  maxReward: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .transform(val => parseFloat(val))
    .optional(),
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(val => parseInt(val))
    .refine(val => val > 0)
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(val => parseInt(val))
    .refine(val => val > 0 && val <= 50)
    .optional()
}).strict();

module.exports = {
  createBountySchema,
  updateBountySchema,
  bountyParamsSchema,
  submitToBountySchema,
  bountyQuerySchema,
  searchBountiesSchema
};
import { z } from 'zod';

export const videoFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  videoUrl: z.string().url('Enter a valid URL'),
  category: z.string().max(100).optional().or(z.literal('')),
  sortOrder: z.string().optional().or(z.literal('')),
});

export type VideoFormValues = z.infer<typeof videoFormSchema>;

import { z } from 'zod';

export const signInFormSchema = z.object({
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const authFormSchema = signInFormSchema.extend({
  name: z.string().min(1, 'Name is required.'),
});

export const noteFormSchema = z.object({
  body: z.string(),
  title: z
    .string()
    .trim()
    .min(1, 'Note title is required.')
    .max(120, 'Use 120 characters or fewer.'),
});

export type AuthFormValues = z.infer<typeof authFormSchema>;
export type SignInFormValues = z.infer<typeof signInFormSchema>;
export type NoteFormValues = z.infer<typeof noteFormSchema>;

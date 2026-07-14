import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  orgName: z.string().min(2, "Enter your business/organization name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type SignInInput = z.infer<typeof signInSchema>;

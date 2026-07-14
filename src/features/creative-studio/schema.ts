import { z } from "zod";

export const generateImageSchema = z.object({
  prompt: z
    .string()
    .min(5, "Describe what you want in a bit more detail")
    .max(1000, "Keep the prompt under 1000 characters"),
  brandKitId: z.string().optional().or(z.literal("")),
  aspectRatio: z.enum(["square", "portrait", "landscape"]).default("square"),
});
export type GenerateImageInput = z.infer<typeof generateImageSchema>;

export const ASPECT_RATIO_TO_SIZE = {
  square: "1024x1024",
  portrait: "1024x1536",
  landscape: "1536x1024",
} as const;

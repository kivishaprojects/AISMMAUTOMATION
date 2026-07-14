import { z } from "zod";

export const brandKitSchema = z.object({
  name: z.string().min(2, "Give this brand kit a name"),
  primaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #1A1A1A"),
  secondaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #1A1A1A"),
  accentColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #1A1A1A"),
  headingFont: z.string().min(1, "Pick a heading font"),
  bodyFont: z.string().min(1, "Pick a body font"),
  toneOfVoice: z.string().max(500).optional().or(z.literal("")),
});
export type BrandKitInput = z.infer<typeof brandKitSchema>;

export const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Playfair Display",
  "Roboto",
  "Montserrat",
  "Merriweather",
] as const;

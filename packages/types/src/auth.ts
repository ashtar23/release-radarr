import { z } from "zod";

export const authCredentialsSchema = z.object({
  email: z.string().min(1, "Email is required."),
  password: z.string().min(1, "Password is required."),
});

export type AuthCredentialsInput = z.infer<typeof authCredentialsSchema>;

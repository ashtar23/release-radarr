import { z } from "zod";

export const authCredentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type AuthCredentialsInput = z.infer<typeof authCredentialsSchema>;

export const signUpCredentialsSchema = authCredentialsSchema
  .extend({
    repeatedPassword: z.string().min(1, "Please repeat your password."),
  })
  .refine((data: AuthCredentialsInput & { repeatedPassword: string }) => {
    return data.password === data.repeatedPassword;
  }, {
    message: "Passwords do not match.",
    path: ["repeatedPassword"],
  });

export type SignUpCredentialsInput = z.infer<typeof signUpCredentialsSchema>;

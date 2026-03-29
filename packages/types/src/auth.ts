import { z } from "zod";

const authEmailSchema = z
  .string()
  .trim()
  .min(1, { error: "Email is required." })
  .pipe(z.email({ error: "Enter a valid email address." }));

export const signInCredentialsSchema = z.object({
  email: authEmailSchema,
  password: z.string(),
});

export type SignInCredentialsInput = z.infer<typeof signInCredentialsSchema>;

export const authCredentialsSchema = z.object({
  email: authEmailSchema,
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." }),
});

export type AuthCredentialsInput = z.infer<typeof authCredentialsSchema>;

export const signUpCredentialsSchema = authCredentialsSchema
  .extend({
    repeatedPassword: z
      .string()
      .min(1, { error: "Please repeat your password." }),
  })
  .refine((data: AuthCredentialsInput & { repeatedPassword: string }) => {
    return data.password === data.repeatedPassword;
  }, {
    error: "Passwords do not match.",
    path: ["repeatedPassword"],
  });

export type SignUpCredentialsInput = z.infer<typeof signUpCredentialsSchema>;

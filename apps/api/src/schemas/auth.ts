import { Type } from "@sinclair/typebox";

export const EmailAvailabilityQuerySchema = Type.Object({
  email: Type.String({ minLength: 1, format: "email" }),
});

export const EmailAvailabilityResultSchema = Type.Object({
  available: Type.Boolean(),
  reason: Type.Optional(Type.Literal("taken")),
});

export const SignUpBodySchema = Type.Object({
  email: Type.String({ minLength: 1, format: "email" }),
  password: Type.String({ minLength: 8 }),
  username: Type.String({ minLength: 1 }),
  displayName: Type.Optional(Type.String({ minLength: 1 })),
});

export const SignUpResultSchema = Type.Object({
  userId: Type.String(),
  email: Type.String({ format: "email" }),
  username: Type.String(),
  displayName: Type.Union([Type.String(), Type.Null()]),
  nextStep: Type.Literal("sign-in"),
});

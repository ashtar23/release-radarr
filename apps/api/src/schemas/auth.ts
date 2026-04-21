import { Type } from "@sinclair/typebox";

export const EmailAvailabilityQuerySchema = Type.Object({
  email: Type.String({ minLength: 1, format: "email" }),
});

export const EmailAvailabilityResultSchema = Type.Object({
  available: Type.Boolean(),
  reason: Type.Optional(Type.Literal("taken")),
});

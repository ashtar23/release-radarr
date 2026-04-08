import { Type } from "@sinclair/typebox";

export const ErrorResponseSchema = Type.Object({
  error: Type.String(),
});

export const AppEnvSchema = Type.Union([
  Type.Literal("development"),
  Type.Literal("staging"),
  Type.Literal("production"),
  Type.Literal("test"),
]);

export const DataSourceSchema = Type.Union([
  Type.Literal("postgres"),
  Type.Literal("supabase"),
]);

export const HealthStatusSchema = Type.Object({
  status: Type.Literal("ok"),
  appEnv: AppEnvSchema,
  dataSource: DataSourceSchema,
});

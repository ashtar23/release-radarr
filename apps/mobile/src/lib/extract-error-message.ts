import { P, match } from "ts-pattern";

export function extractErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred.",
): string {
  return match(error)
    .with(P.string, (message) => message)
    .with(
      { response: { data: { errors: P.array({ title: P.string }) } } },
      (value) => value.response.data.errors[0]?.title ?? fallback,
    )
    .with(
      { response: { data: { message: P.string } } },
      (value) => value.response.data.message,
    )
    .with({ message: P.string }, (value) => value.message)
    .otherwise(() => fallback);
}

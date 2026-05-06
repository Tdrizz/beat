// Express 5 types `req.params[k]` as `string | string[]` because route patterns
// can include wildcard segments. For our named params (`:id`, `:handle`, …) we
// always get a single string at runtime, so this helper coerces safely.
export function p(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join("/");
  return value ?? "";
}

export type ValidationError = {
  rule: string;
  message: string;
  path: string[];
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

export function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

export function fail<T = never>(errors: ValidationError[]): ValidationResult<T> {
  return { ok: false, errors };
}

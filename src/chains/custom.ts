import { ValidationContext } from '../core/context';
import { ok, fail } from '../core/result';
import type { ValidationResult } from '../core/result';

export type CustomValidatorFn<T> = (value: unknown, ctx: ValidationContext) => T | void;

export class CustomChain<T> {
  private _fn: CustomValidatorFn<T>;

  constructor(fn: CustomValidatorFn<T>) {
    this._fn = fn;
  }

  validate(input: unknown): ValidationResult<T> {
    const ctx = new ValidationContext();
    const result = this._fn(input, ctx);

    if (ctx.hasErrors) {
      return fail(ctx.errors!);
    }

    return ok(result as T);
  }
}

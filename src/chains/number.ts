import { Chain } from '../core/chain';
import { ValidationContext } from '../core/context';
import { ok, fail } from '../core/result';
import type { ValidationResult } from '../core/result';
import { coerceToNumber } from '../utils/coerce';

export class NumberChain extends Chain<number> {
  private _coerce = false;

  protected isNil(value: unknown): boolean {
    return value === undefined || value === null;
  }

  protected typeCheck(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
  }

  protected typeName(): string {
    return 'number';
  }

  coerce(): this {
    this._coerce = true;
    return this;
  }

  override validate(input: unknown): ValidationResult<number> {
    if (this._coerce && input !== undefined && input !== null) {
      const coerced = coerceToNumber(input);
      if (coerced !== undefined) {
        input = coerced;
      }
    }
    return super.validate(input);
  }

  // --- Sanitizers ---

  round(): this {
    return this.addSanitizer((v) => Math.round(v));
  }

  floor(): this {
    return this.addSanitizer((v) => Math.floor(v));
  }

  ceil(): this {
    return this.addSanitizer((v) => Math.ceil(v));
  }

  clamp(min: number, max: number): this {
    return this.addSanitizer((v) => Math.min(Math.max(v, min), max));
  }

  // --- Validators ---

  min(n: number, message?: string): this {
    return this.addRule('min', message || `Must be at least ${n}`, (v) => v >= n);
  }

  max(n: number, message?: string): this {
    return this.addRule('max', message || `Must be at most ${n}`, (v) => v <= n);
  }

  between(min: number, max: number, message?: string): this {
    return this.addRule('between', message || `Must be between ${min} and ${max}`, (v) => v >= min && v <= max);
  }

  integer(message?: string): this {
    return this.addRule('integer', message || 'Must be an integer', (v) => Number.isInteger(v));
  }

  positive(message?: string): this {
    return this.addRule('positive', message || 'Must be positive', (v) => v > 0);
  }

  negative(message?: string): this {
    return this.addRule('negative', message || 'Must be negative', (v) => v < 0);
  }

  oneOf(values: number[], message?: string): this {
    return this.addRule('oneOf', message || `Must be one of: ${values.join(', ')}`, (v) => values.includes(v));
  }
}

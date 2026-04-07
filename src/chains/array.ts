import { Chain } from '../core/chain';
import { ValidationContext } from '../core/context';
import { ok, fail } from '../core/result';
import type { ValidationResult } from '../core/result';

export class ArrayChain<E = unknown> extends Chain<E[]> {
  private _elementChain?: Chain<E>;

  protected isNil(value: unknown): boolean {
    return value === undefined || value === null;
  }

  protected typeCheck(value: unknown): value is E[] {
    return Array.isArray(value);
  }

  protected typeName(): string {
    return 'array';
  }

  of(chain: Chain<E>): this {
    this._elementChain = chain;
    return this;
  }

  minLength(n: number, message?: string): this {
    return this.addRule('minLength', message || `Must have at least ${n} items`, (v) => v.length >= n);
  }

  maxLength(n: number, message?: string): this {
    return this.addRule('maxLength', message || `Must have at most ${n} items`, (v) => v.length <= n);
  }

  unique(message?: string): this {
    return this.addRule('unique', message || 'All elements must be unique', (v) => {
      return new Set(v).size === v.length;
    });
  }

  noEmpty(message?: string): this {
    return this.addRule('noEmpty', message || 'Must not contain empty elements', (v) => {
      return v.every((el) => el !== undefined && el !== null && el !== '');
    });
  }

  // --- Sanitizers ---

  compact(): this {
    return this.addSanitizer((v) => v.filter((el) => el !== undefined && el !== null) as E[]);
  }

  flat(depth: number = 1): this {
    return this.addSanitizer((v) => (v as any[]).flat(depth) as E[]);
  }

  override validate(input: unknown): ValidationResult<E[]> {
    // Run base chain validation first (required/optional/type/rules/sanitizers)
    const baseResult = super.validate(input);

    if (!baseResult.ok) return baseResult;
    if (!this._elementChain) return baseResult;

    // Validate each element
    const ctx = new ValidationContext();
    const cleanedElements: E[] = [];

    for (let i = 0; i < baseResult.value.length; i++) {
      const elResult = this._elementChain.validate(baseResult.value[i]);
      if (!elResult.ok) {
        for (const err of elResult.errors) {
          ctx.addError(err.rule, err.message);
          // Prefix path with index
          const lastErr = ctx.errors![ctx.errors!.length - 1];
          lastErr.path = [String(i), ...err.path];
        }
      } else {
        cleanedElements.push(elResult.value);
      }
    }

    if (ctx.hasErrors) {
      return fail(ctx.errors!);
    }

    return ok(cleanedElements);
  }
}

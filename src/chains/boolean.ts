import { Chain } from '../core/chain';
import type { ValidationResult } from '../core/result';
import { coerceToBoolean } from '../utils/coerce';

export class BooleanChain extends Chain<boolean> {
  private _coerce = false;

  protected isNil(value: unknown): boolean {
    return value === undefined || value === null;
  }

  protected typeCheck(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }

  protected typeName(): string {
    return 'boolean';
  }

  coerce(): this {
    this._coerce = true;
    return this;
  }

  override validate(input: unknown): ValidationResult<boolean> {
    if (this._coerce && input !== undefined && input !== null) {
      const coerced = coerceToBoolean(input);
      if (coerced !== undefined) {
        input = coerced;
      }
    }
    return super.validate(input);
  }
}

import { Chain, WhenChain } from '../core/chain';
import { ValidationContext } from '../core/context';
import { ok, fail } from '../core/result';
import type { ValidationResult, ValidationError } from '../core/result';

type SchemaMap = Record<string, Chain<any> | WhenChain<any>>;
type InferSchema<S extends SchemaMap> = {
  [K in keyof S]: S[K] extends Chain<infer T> ? T : S[K] extends WhenChain<infer T> ? T : never;
};

export class ObjectChain<S extends SchemaMap> extends Chain<InferSchema<S>> {
  private _schema: S;
  private _strict = false;
  private _strictMsg = 'Unknown field';

  constructor(schema: S) {
    super();
    this._schema = schema;
  }

  protected isNil(value: unknown): boolean {
    return value === undefined || value === null;
  }

  protected typeCheck(value: unknown): value is InferSchema<S> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  protected typeName(): string {
    return 'object';
  }

  strict(message?: string): this {
    this._strict = true;
    if (message) this._strictMsg = message;
    return this;
  }

  override validate(input: unknown): ValidationResult<InferSchema<S>> {
    // Handle nil
    if (input === undefined || input === null) {
      if (this._hasDefault) {
        input = this._defaultValue;
      } else if (this._isOptional) {
        return ok(undefined as unknown as InferSchema<S>);
      } else if (this._isRequired) {
        const ctx = new ValidationContext();
        ctx.addError('required', this._requiredMsg);
        return fail(ctx.errors!);
      }
    }

    if (input === undefined || input === null) {
      return ok(input as unknown as InferSchema<S>);
    }

    // Type check
    if (!this.typeCheck(input)) {
      const ctx = new ValidationContext();
      ctx.addError('type', `Expected object, got ${typeof input}`);
      return fail(ctx.errors!);
    }

    const obj = input as Record<string, unknown>;
    const ctx = new ValidationContext();
    const result: Record<string, unknown> = Object.create(null);

    // Validate each field in schema
    for (const [key, chainOrWhen] of Object.entries(this._schema)) {
      let fieldResult: ValidationResult<any>;
      if (chainOrWhen instanceof WhenChain) {
        fieldResult = chainOrWhen.validate(obj[key], obj);
      } else {
        fieldResult = chainOrWhen.validate(obj[key]);
      }
      if (!fieldResult.ok) {
        for (const err of fieldResult.errors) {
          ctx.addError(err.rule, err.message);
          const lastErr = ctx.errors![ctx.errors!.length - 1];
          lastErr.path = [key, ...err.path];
        }
      } else {
        result[key] = fieldResult.value;
      }
    }

    // Strict mode: reject unknown keys
    if (this._strict) {
      for (const key of Object.keys(obj)) {
        if (!(key in this._schema)) {
          ctx.addError('unknown', this._strictMsg);
          const lastErr = ctx.errors![ctx.errors!.length - 1];
          lastErr.path = [key];
        }
      }
    }

    if (ctx.hasErrors) {
      return fail(ctx.errors!);
    }

    return ok(result as InferSchema<S>);
  }
}

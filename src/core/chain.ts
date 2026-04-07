import { ValidationContext } from './context';
import { ok, fail } from './result';
import type { ValidationResult } from './result';

export type Rule<T> = {
  name: string;
  message: string;
  validate: (value: T) => boolean;
};

export type Sanitizer<T> = (value: T) => T;

export type AsyncRule<T> = {
  name: string;
  message: string;
  validate: (value: T) => Promise<boolean>;
};

export abstract class Chain<T> {
  protected _rules: Rule<T>[] = [];
  protected _sanitizers: Array<{ index: number; fn: Sanitizer<T> }> = [];
  protected _asyncRules: AsyncRule<T>[] = [];
  protected _isRequired = false;
  protected _isOptional = false;
  protected _requiredMsg = 'This field is required';
  protected _defaultValue?: T;
  protected _hasDefault = false;
  private _stepCount = 0;

  required(message?: string): this {
    this._isRequired = true;
    if (message) this._requiredMsg = message;
    return this;
  }

  optional(): this {
    this._isOptional = true;
    return this;
  }

  default(value: T): this {
    this._hasDefault = true;
    this._defaultValue = value;
    return this;
  }

  test(name: string, message: string, fn: (value: T) => boolean): this {
    this._rules.push({ name, message, validate: fn });
    this._stepCount++;
    return this;
  }

  testAsync(name: string, message: string, fn: (value: T) => Promise<boolean>): this {
    this._asyncRules.push({ name, message, validate: fn });
    return this;
  }

  protected addRule(name: string, message: string, fn: (value: T) => boolean): this {
    this._rules.push({ name, message, validate: fn });
    this._stepCount++;
    return this;
  }

  protected addSanitizer(fn: Sanitizer<T>): this {
    this._sanitizers.push({ index: this._stepCount, fn });
    this._stepCount++;
    return this;
  }

  protected abstract isNil(value: unknown): boolean;
  protected abstract typeCheck(value: unknown): value is T;
  protected abstract typeName(): string;

  validate(input: unknown): ValidationResult<T> {
    // Handle nil values
    if (input === undefined || input === null || input === '') {
      if (this._hasDefault) {
        input = this._defaultValue;
      } else if (this._isOptional) {
        return ok(undefined as T);
      } else if (this._isRequired) {
        const ctx = new ValidationContext();
        ctx.addError('required', this._requiredMsg);
        return fail(ctx.errors!);
      }
    }

    // If still nil after default, and not required, pass through
    if ((input === undefined || input === null) && !this._isRequired) {
      return ok(input as T);
    }

    if (input === undefined || input === null) {
      const ctx = new ValidationContext();
      ctx.addError('required', this._requiredMsg);
      return fail(ctx.errors!);
    }

    // Type check
    if (!this.typeCheck(input)) {
      const ctx = new ValidationContext();
      ctx.addError('type', `Expected ${this.typeName()}, got ${typeof input}`);
      return fail(ctx.errors!);
    }

    let value = input as T;
    const ctx = new ValidationContext();

    // Run rules and sanitizers in order
    let ruleIdx = 0;
    let sanIdx = 0;

    for (let step = 0; step < this._stepCount; step++) {
      // Check if there's a sanitizer at this step
      if (sanIdx < this._sanitizers.length && this._sanitizers[sanIdx].index === step) {
        value = this._sanitizers[sanIdx].fn(value);
        sanIdx++;
      }
      // Check if there's a rule at this step
      else if (ruleIdx < this._rules.length) {
        const rule = this._rules[ruleIdx];
        if (!rule.validate(value)) {
          ctx.addError(rule.name, rule.message);
        }
        ruleIdx++;
      }
    }

    if (ctx.hasErrors) {
      return fail(ctx.errors!);
    }

    return ok(value);
  }

  or<U>(other: Chain<U>): OrChain<T, U> {
    return new OrChain<T, U>(this, other);
  }

  and(other: Chain<T>): AndChain<T> {
    return new AndChain<T>(this, other);
  }

  when(field: string, opts: WhenOptions<T>): WhenChain<T> {
    return new WhenChain<T>(this, field, opts);
  }

  async validateAsync(input: unknown): Promise<ValidationResult<T>> {
    const syncResult = this.validate(input);
    if (!syncResult.ok) return syncResult;

    const ctx = new ValidationContext();

    for (const rule of this._asyncRules) {
      const passed = await rule.validate(syncResult.value);
      if (!passed) {
        ctx.addError(rule.name, rule.message);
      }
    }

    if (ctx.hasErrors) {
      return fail(ctx.errors!);
    }

    return syncResult;
  }
}

// --- Combinator types ---

export type WhenOptions<T> = {
  is: unknown;
  then: (chain: Chain<T>) => Chain<T>;
  otherwise?: (chain: Chain<T>) => Chain<T>;
};

export class OrChain<A, B> {
  private _left: Chain<A>;
  private _right: Chain<B>;

  constructor(left: Chain<A>, right: Chain<B>) {
    this._left = left;
    this._right = right;
  }

  validate(input: unknown): ValidationResult<A | B> {
    const leftResult = this._left.validate(input);
    if (leftResult.ok) return leftResult;

    const rightResult = this._right.validate(input);
    if (rightResult.ok) return rightResult;

    // Both failed — combine errors
    return fail([...leftResult.errors, ...rightResult.errors]);
  }

  async validateAsync(input: unknown): Promise<ValidationResult<A | B>> {
    const leftResult = await this._left.validateAsync(input);
    if (leftResult.ok) return leftResult;

    const rightResult = await this._right.validateAsync(input);
    if (rightResult.ok) return rightResult;

    return fail([...leftResult.errors, ...rightResult.errors]);
  }
}

export class AndChain<T> {
  private _left: Chain<T>;
  private _right: Chain<T>;

  constructor(left: Chain<T>, right: Chain<T>) {
    this._left = left;
    this._right = right;
  }

  validate(input: unknown): ValidationResult<T> {
    const leftResult = this._left.validate(input);
    const rightResult = this._right.validate(input);

    if (!leftResult.ok && !rightResult.ok) {
      return fail([...leftResult.errors, ...rightResult.errors]);
    }
    if (!leftResult.ok) return leftResult;
    if (!rightResult.ok) return rightResult;

    return rightResult;
  }

  async validateAsync(input: unknown): Promise<ValidationResult<T>> {
    const leftResult = await this._left.validateAsync(input);
    const rightResult = await this._right.validateAsync(input);

    if (!leftResult.ok && !rightResult.ok) {
      return fail([...leftResult.errors, ...rightResult.errors]);
    }
    if (!leftResult.ok) return leftResult;
    if (!rightResult.ok) return rightResult;

    return rightResult;
  }
}

export class WhenChain<T> {
  private _base: Chain<T>;
  private _field: string;
  private _opts: WhenOptions<T>;

  constructor(base: Chain<T>, field: string, opts: WhenOptions<T>) {
    this._base = base;
    this._field = field;
    this._opts = opts;
  }

  resolveChain(siblingValue: unknown): Chain<T> {
    if (siblingValue === this._opts.is) {
      return this._opts.then(this._base);
    }
    if (this._opts.otherwise) {
      return this._opts.otherwise(this._base);
    }
    return this._base;
  }

  get field(): string {
    return this._field;
  }

  validate(input: unknown, siblingsObj?: Record<string, unknown>): ValidationResult<T> {
    const siblingValue = siblingsObj?.[this._field];
    const chain = this.resolveChain(siblingValue);
    return chain.validate(input);
  }

  async validateAsync(input: unknown, siblingsObj?: Record<string, unknown>): Promise<ValidationResult<T>> {
    const siblingValue = siblingsObj?.[this._field];
    const chain = this.resolveChain(siblingValue);
    return chain.validateAsync(input);
  }
}

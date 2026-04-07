import type { ValidationError } from './result';

export class ValidationContext {
  private _errors: ValidationError[] | null = null;
  private _path: string[];

  constructor(path: string[] = []) {
    this._path = path;
  }

  addError(rule: string, message: string): void {
    if (!this._errors) {
      this._errors = [];
    }
    this._errors.push({ rule, message, path: [...this._path] });
  }

  child(key: string): ValidationContext {
    return new ValidationContext([...this._path, key]);
  }

  get errors(): ValidationError[] | null {
    return this._errors;
  }

  get hasErrors(): boolean {
    return this._errors !== null && this._errors.length > 0;
  }

  merge(other: ValidationContext): void {
    if (other._errors) {
      if (!this._errors) {
        this._errors = [];
      }
      this._errors.push(...other._errors);
    }
  }
}

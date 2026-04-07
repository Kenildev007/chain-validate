import { Chain } from '../core/chain';
import { EMAIL_REGEX, URL_REGEX, UUID_REGEX } from '../utils/patterns';

export class StringChain extends Chain<string> {
  protected isNil(value: unknown): boolean {
    return value === undefined || value === null || value === '';
  }

  protected typeCheck(value: unknown): value is string {
    return typeof value === 'string';
  }

  protected typeName(): string {
    return 'string';
  }

  // --- Sanitizers ---

  trim(): this {
    return this.addSanitizer((v) => v.trim());
  }

  lowercase(): this {
    return this.addSanitizer((v) => v.toLowerCase());
  }

  uppercase(): this {
    return this.addSanitizer((v) => v.toUpperCase());
  }

  replace(search: string | RegExp, replacement: string): this {
    return this.addSanitizer((v) => v.replace(search, replacement));
  }

  // --- Validators ---

  minLength(n: number, message?: string): this {
    return this.addRule('minLength', message || `Must be at least ${n} characters`, (v) => v.length >= n);
  }

  maxLength(n: number, message?: string): this {
    return this.addRule('maxLength', message || `Must be at most ${n} characters`, (v) => v.length <= n);
  }

  length(n: number, message?: string): this {
    return this.addRule('length', message || `Must be exactly ${n} characters`, (v) => v.length === n);
  }

  email(message?: string): this {
    return this.addRule('email', message || 'Invalid email address', (v) => EMAIL_REGEX.test(v));
  }

  url(message?: string): this {
    return this.addRule('url', message || 'Invalid URL', (v) => URL_REGEX.test(v));
  }

  uuid(message?: string): this {
    return this.addRule('uuid', message || 'Invalid UUID', (v) => UUID_REGEX.test(v));
  }

  regex(pattern: RegExp, message?: string): this {
    return this.addRule('regex', message || `Must match pattern ${pattern}`, (v) => pattern.test(v));
  }

  includes(str: string, message?: string): this {
    return this.addRule('includes', message || `Must contain "${str}"`, (v) => v.includes(str));
  }

  startsWith(str: string, message?: string): this {
    return this.addRule('startsWith', message || `Must start with "${str}"`, (v) => v.startsWith(str));
  }

  endsWith(str: string, message?: string): this {
    return this.addRule('endsWith', message || `Must end with "${str}"`, (v) => v.endsWith(str));
  }

  oneOf(values: string[], message?: string): this {
    return this.addRule('oneOf', message || `Must be one of: ${values.join(', ')}`, (v) => values.includes(v));
  }

  notEmpty(message?: string): this {
    return this.addRule('notEmpty', message || 'Must not be empty', (v) => v.trim().length > 0);
  }
}

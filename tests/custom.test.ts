import { describe, it, expect } from 'vitest';
import { v } from '../src';

describe('CustomChain', () => {
  it('runs custom validation logic', () => {
    const password = v.custom<string>((value, ctx) => {
      if (typeof value !== 'string') {
        ctx.addError('type', 'Must be a string');
        return;
      }
      if (value.length < 8) ctx.addError('minLength', 'At least 8 characters');
      if (!/[A-Z]/.test(value)) ctx.addError('uppercase', 'Need one uppercase letter');
      if (!/[0-9]/.test(value)) ctx.addError('digit', 'Need one digit');
      return value;
    });

    const weak = password.validate('abc');
    expect(weak.ok).toBe(false);
    if (!weak.ok) {
      expect(weak.errors.length).toBe(3); // minLength, uppercase, digit
    }

    const strong = password.validate('Abcdefg1');
    expect(strong.ok).toBe(true);
    if (strong.ok) expect(strong.value).toBe('Abcdefg1');
  });

  it('custom with no errors returns value', () => {
    const identity = v.custom<number>((value) => value as number);
    const result = identity.validate(42);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(42);
  });
});

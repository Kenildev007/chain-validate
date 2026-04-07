import { describe, it, expect } from 'vitest';
import { v } from '../src';

describe('ArrayChain', () => {
  it('validates an array', () => {
    const result = v.array().validate([1, 2, 3]);
    expect(result.ok).toBe(true);
  });

  it('fails on non-array', () => {
    const result = v.array().validate('not array');
    expect(result.ok).toBe(false);
  });

  it('minLength validates', () => {
    const chain = v.array().minLength(2);
    expect(chain.validate([1]).ok).toBe(false);
    expect(chain.validate([1, 2]).ok).toBe(true);
  });

  it('maxLength validates', () => {
    const chain = v.array().maxLength(2);
    expect(chain.validate([1, 2, 3]).ok).toBe(false);
    expect(chain.validate([1, 2]).ok).toBe(true);
  });

  it('unique validates', () => {
    const chain = v.array().unique();
    expect(chain.validate([1, 2, 1]).ok).toBe(false);
    expect(chain.validate([1, 2, 3]).ok).toBe(true);
  });

  it('noEmpty validates', () => {
    const chain = v.array().noEmpty();
    expect(chain.validate([1, null, 3]).ok).toBe(false);
    expect(chain.validate([1, 2, 3]).ok).toBe(true);
  });

  it('compact sanitizes', () => {
    const result = v.array().compact().validate([1, null, 2, undefined, 3]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([1, 2, 3]);
  });

  it('of() validates each element', () => {
    const chain = v.array<string>().of(v.string().email());
    const result = chain.validate(['a@b.com', 'not-email']);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].path[0]).toBe('1');
      expect(result.errors[0].rule).toBe('email');
    }
  });

  it('of() sanitizes each element', () => {
    const chain = v.array<string>().of(v.string().trim().lowercase());
    const result = chain.validate(['  HELLO  ', '  WORLD  ']);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(['hello', 'world']);
  });

  it('required rejects undefined', () => {
    expect(v.array().required().validate(undefined).ok).toBe(false);
  });

  it('optional allows undefined', () => {
    expect(v.array().optional().validate(undefined).ok).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { v } from '../src';

describe('AnyChain', () => {
  it('passes any value', () => {
    expect(v.any().validate('hello').ok).toBe(true);
    expect(v.any().validate(42).ok).toBe(true);
    expect(v.any().validate(true).ok).toBe(true);
    expect(v.any().validate([1, 2]).ok).toBe(true);
    expect(v.any().validate({ a: 1 }).ok).toBe(true);
  });

  it('required rejects undefined/null', () => {
    expect(v.any().required().validate(undefined).ok).toBe(false);
    expect(v.any().required().validate(null).ok).toBe(false);
  });

  it('optional allows undefined', () => {
    const result = v.any().optional().validate(undefined);
    expect(result.ok).toBe(true);
  });

  it('custom test works on any', () => {
    const chain = v.any().test('is-truthy', 'Must be truthy', (v) => !!v);
    expect(chain.validate('hello').ok).toBe(true);
    expect(chain.validate(0).ok).toBe(false);
    expect(chain.validate('').ok).toBe(false);
  });

  it('default fills in undefined', () => {
    const result = v.any().default('fallback').validate(undefined);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('fallback');
  });
});

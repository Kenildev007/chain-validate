import { describe, it, expect } from 'vitest';
import { v } from '../src';

describe('OrChain (.or)', () => {
  it('passes if left chain passes', () => {
    const chain = v.string().or(v.number());
    const result = chain.validate('hello');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('hello');
  });

  it('passes if right chain passes', () => {
    const chain = v.string().or(v.number());
    const result = chain.validate(42);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(42);
  });

  it('fails if both chains fail', () => {
    const chain = v.string().or(v.number());
    const result = chain.validate(true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBe(2);
    }
  });

  it('returns left value when both could pass', () => {
    const chain = v.string().email().or(v.string().url());
    const result = chain.validate('test@example.com');
    expect(result.ok).toBe(true);
  });
});

describe('AndChain (.and)', () => {
  it('passes if both chains pass', () => {
    const chain = v.string().minLength(3).and(v.string().maxLength(10));
    const result = chain.validate('hello');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('hello');
  });

  it('fails if left chain fails', () => {
    const chain = v.string().minLength(10).and(v.string().maxLength(20));
    const result = chain.validate('hi');
    expect(result.ok).toBe(false);
  });

  it('fails if right chain fails', () => {
    const chain = v.string().minLength(1).and(v.string().maxLength(3));
    const result = chain.validate('hello');
    expect(result.ok).toBe(false);
  });

  it('collects errors from both chains', () => {
    const chain = v.string().minLength(10).and(v.string().email());
    const result = chain.validate('hi');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBe(2);
    }
  });
});

describe('WhenChain (.when)', () => {
  it('applies then branch when condition matches', () => {
    const schema = v.object({
      type: v.string().oneOf(['personal', 'business']),
      company: v.string().when('type', {
        is: 'business',
        then: (chain) => chain.required('Company required for business'),
        otherwise: (chain) => chain.optional(),
      }),
    });

    const result = schema.validate({ type: 'business', company: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path[0] === 'company')).toBe(true);
    }
  });

  it('applies otherwise branch when condition does not match', () => {
    const schema = v.object({
      type: v.string().oneOf(['personal', 'business']),
      company: v.string().when('type', {
        is: 'business',
        then: (chain) => chain.required('Company required'),
        otherwise: (chain) => chain.optional(),
      }),
    });

    const result = schema.validate({ type: 'personal' });
    expect(result.ok).toBe(true);
  });

  it('applies then branch and validates', () => {
    const schema = v.object({
      type: v.string(),
      company: v.string().when('type', {
        is: 'business',
        then: (chain) => chain.required().minLength(2),
        otherwise: (chain) => chain.optional(),
      }),
    });

    const valid = schema.validate({ type: 'business', company: 'Acme Inc' });
    expect(valid.ok).toBe(true);

    const invalid = schema.validate({ type: 'business', company: 'A' });
    expect(invalid.ok).toBe(false);
  });
});

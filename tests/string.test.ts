import { describe, it, expect } from 'vitest';
import { v } from '../src';

describe('StringChain', () => {
  it('validates a simple string', () => {
    const result = v.string().validate('hello');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('hello');
  });

  it('fails on non-string', () => {
    const result = v.string().validate(123);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0].rule).toBe('type');
  });

  it('required rejects empty string', () => {
    const result = v.string().required('Name needed').validate('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].rule).toBe('required');
      expect(result.errors[0].message).toBe('Name needed');
    }
  });

  it('optional allows undefined', () => {
    const result = v.string().optional().validate(undefined);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeUndefined();
  });

  it('default fills in missing value', () => {
    const result = v.string().default('fallback').validate(undefined);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('fallback');
  });

  it('trim sanitizes whitespace', () => {
    const result = v.string().trim().validate('  hello  ');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('hello');
  });

  it('lowercase sanitizes case', () => {
    const result = v.string().lowercase().validate('HELLO');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('hello');
  });

  it('uppercase sanitizes case', () => {
    const result = v.string().uppercase().validate('hello');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('HELLO');
  });

  it('trim + lowercase chains sanitizers', () => {
    const result = v.string().trim().lowercase().validate('  HELLO  ');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('hello');
  });

  it('minLength validates', () => {
    const chain = v.string().minLength(3);
    expect(chain.validate('ab').ok).toBe(false);
    expect(chain.validate('abc').ok).toBe(true);
  });

  it('maxLength validates', () => {
    const chain = v.string().maxLength(3);
    expect(chain.validate('abcd').ok).toBe(false);
    expect(chain.validate('abc').ok).toBe(true);
  });

  it('length validates exact length', () => {
    const chain = v.string().length(5);
    expect(chain.validate('abcd').ok).toBe(false);
    expect(chain.validate('abcde').ok).toBe(true);
  });

  it('email validates', () => {
    const chain = v.string().email();
    expect(chain.validate('test@example.com').ok).toBe(true);
    expect(chain.validate('not-email').ok).toBe(false);
  });

  it('url validates', () => {
    const chain = v.string().url();
    expect(chain.validate('https://example.com').ok).toBe(true);
    expect(chain.validate('not-a-url').ok).toBe(false);
  });

  it('uuid validates', () => {
    const chain = v.string().uuid();
    expect(chain.validate('550e8400-e29b-41d4-a716-446655440000').ok).toBe(true);
    expect(chain.validate('not-a-uuid').ok).toBe(false);
  });

  it('regex validates custom pattern', () => {
    const chain = v.string().regex(/^[a-z]+$/);
    expect(chain.validate('hello').ok).toBe(true);
    expect(chain.validate('Hello123').ok).toBe(false);
  });

  it('includes validates substring', () => {
    const chain = v.string().includes('@');
    expect(chain.validate('a@b').ok).toBe(true);
    expect(chain.validate('ab').ok).toBe(false);
  });

  it('startsWith validates prefix', () => {
    const chain = v.string().startsWith('https://');
    expect(chain.validate('https://x.com').ok).toBe(true);
    expect(chain.validate('http://x.com').ok).toBe(false);
  });

  it('endsWith validates suffix', () => {
    const chain = v.string().endsWith('.com');
    expect(chain.validate('x.com').ok).toBe(true);
    expect(chain.validate('x.org').ok).toBe(false);
  });

  it('oneOf validates allowed values', () => {
    const chain = v.string().oneOf(['a', 'b', 'c']);
    expect(chain.validate('a').ok).toBe(true);
    expect(chain.validate('d').ok).toBe(false);
  });

  it('notEmpty rejects whitespace-only strings', () => {
    const chain = v.string().notEmpty();
    expect(chain.validate('   ').ok).toBe(false);
    expect(chain.validate('hi').ok).toBe(true);
  });

  it('collects multiple errors', () => {
    const result = v.string().minLength(5).email().validate('ab');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBe(2);
      expect(result.errors[0].rule).toBe('minLength');
      expect(result.errors[1].rule).toBe('email');
    }
  });

  it('sanitize before validate — trim then minLength', () => {
    const chain = v.string().trim().minLength(3);
    // "  ab  " trims to "ab" (length 2) — should fail
    expect(chain.validate('  ab  ').ok).toBe(false);
    // "  abc  " trims to "abc" (length 3) — should pass
    const r = chain.validate('  abc  ');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('abc');
  });

  it('custom test rule', () => {
    const chain = v.string().test('no-spaces', 'No spaces allowed', (v) => !v.includes(' '));
    expect(chain.validate('hello').ok).toBe(true);
    expect(chain.validate('hello world').ok).toBe(false);
  });

  it('replace sanitizer', () => {
    const result = v.string().replace(/-/g, '').validate('123-456-789');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('123456789');
  });
});

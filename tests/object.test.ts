import { describe, it, expect } from 'vitest';
import { v } from '../src';

describe('ObjectChain', () => {
  const userSchema = v.object({
    name: v.string().required().trim().minLength(2),
    email: v.string().required().trim().lowercase().email(),
    age: v.number().optional().min(0),
  });

  it('validates a valid object', () => {
    const result = userSchema.validate({
      name: '  Kenil  ',
      email: '  KENIL@EXAMPLE.COM  ',
      age: 25,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Kenil');
      expect(result.value.email).toBe('kenil@example.com');
      expect(result.value.age).toBe(25);
    }
  });

  it('collects errors from multiple fields', () => {
    const result = userSchema.validate({
      name: '',
      email: 'bad',
      age: -1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      const paths = result.errors.map((e) => e.path[0]);
      expect(paths).toContain('name');
      expect(paths).toContain('email');
      expect(paths).toContain('age');
    }
  });

  it('nested objects have correct paths', () => {
    const schema = v.object({
      user: v.object({
        email: v.string().email('Bad email'),
      }),
    });
    const result = schema.validate({ user: { email: 'nope' } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].path).toEqual(['user', 'email']);
      expect(result.errors[0].message).toBe('Bad email');
    }
  });

  it('strict mode rejects unknown keys', () => {
    const schema = v.object({
      name: v.string(),
    }).strict();
    const result = schema.validate({ name: 'Kenil', extra: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].rule).toBe('unknown');
      expect(result.errors[0].path).toEqual(['extra']);
    }
  });

  it('required rejects undefined', () => {
    const schema = v.object({ x: v.string() }).required();
    expect(schema.validate(undefined).ok).toBe(false);
  });

  it('optional allows undefined', () => {
    const schema = v.object({ x: v.string() }).optional();
    expect(schema.validate(undefined).ok).toBe(true);
  });

  it('fails on non-object', () => {
    const schema = v.object({ x: v.string() });
    expect(schema.validate('string').ok).toBe(false);
    expect(schema.validate([]).ok).toBe(false);
  });

  it('optional fields pass when missing', () => {
    const result = userSchema.validate({
      name: 'Kenil',
      email: 'k@e.com',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.age).toBeUndefined();
  });
});

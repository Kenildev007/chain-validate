import { describe, it, expect } from 'vitest';
import { v } from '../src';

describe('NumberChain', () => {
  it('validates a number', () => {
    const result = v.number().validate(42);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(42);
  });

  it('fails on string without coerce', () => {
    const result = v.number().validate('42');
    expect(result.ok).toBe(false);
  });

  it('coerces string to number', () => {
    const result = v.number().coerce().validate('42');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(42);
  });

  it('coerce fails on non-numeric string', () => {
    const result = v.number().coerce().validate('abc');
    expect(result.ok).toBe(false);
  });

  it('rejects NaN', () => {
    const result = v.number().validate(NaN);
    expect(result.ok).toBe(false);
  });

  it('min validates', () => {
    const chain = v.number().min(5);
    expect(chain.validate(4).ok).toBe(false);
    expect(chain.validate(5).ok).toBe(true);
  });

  it('max validates', () => {
    const chain = v.number().max(10);
    expect(chain.validate(11).ok).toBe(false);
    expect(chain.validate(10).ok).toBe(true);
  });

  it('between validates range', () => {
    const chain = v.number().between(1, 10);
    expect(chain.validate(0).ok).toBe(false);
    expect(chain.validate(5).ok).toBe(true);
    expect(chain.validate(11).ok).toBe(false);
  });

  it('integer validates', () => {
    const chain = v.number().integer();
    expect(chain.validate(3.5).ok).toBe(false);
    expect(chain.validate(3).ok).toBe(true);
  });

  it('positive validates', () => {
    const chain = v.number().positive();
    expect(chain.validate(0).ok).toBe(false);
    expect(chain.validate(1).ok).toBe(true);
  });

  it('negative validates', () => {
    const chain = v.number().negative();
    expect(chain.validate(0).ok).toBe(false);
    expect(chain.validate(-1).ok).toBe(true);
  });

  it('round sanitizer', () => {
    const result = v.number().round().validate(3.7);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(4);
  });

  it('floor sanitizer', () => {
    const result = v.number().floor().validate(3.7);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(3);
  });

  it('ceil sanitizer', () => {
    const result = v.number().ceil().validate(3.2);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(4);
  });

  it('clamp sanitizer', () => {
    const chain = v.number().clamp(0, 100);
    let r = chain.validate(-5);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(0);

    r = chain.validate(150);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(100);
  });

  it('coerce + integer + between combined', () => {
    const chain = v.number().coerce().integer().between(1, 100);
    expect(chain.validate('50').ok).toBe(true);
    expect(chain.validate('3.5').ok).toBe(false); // fails integer
  });

  it('oneOf validates', () => {
    const chain = v.number().oneOf([1, 2, 3]);
    expect(chain.validate(1).ok).toBe(true);
    expect(chain.validate(4).ok).toBe(false);
  });
});

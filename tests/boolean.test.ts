import { describe, it, expect } from 'vitest';
import { v } from '../src';

describe('BooleanChain', () => {
  it('validates true', () => {
    const result = v.boolean().validate(true);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(true);
  });

  it('validates false', () => {
    const result = v.boolean().validate(false);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(false);
  });

  it('fails on string without coerce', () => {
    expect(v.boolean().validate('true').ok).toBe(false);
  });

  it('coerces "true" string', () => {
    const result = v.boolean().coerce().validate('true');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(true);
  });

  it('coerces "false" string', () => {
    const result = v.boolean().coerce().validate('false');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(false);
  });

  it('coerces number 1', () => {
    const result = v.boolean().coerce().validate(1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(true);
  });

  it('coerces "yes"', () => {
    const result = v.boolean().coerce().validate('yes');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(true);
  });

  it('required rejects undefined', () => {
    const result = v.boolean().required().validate(undefined);
    expect(result.ok).toBe(false);
  });

  it('optional allows undefined', () => {
    const result = v.boolean().optional().validate(undefined);
    expect(result.ok).toBe(true);
  });
});

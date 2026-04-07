import { describe, it, expect } from 'vitest';
import { v } from '../src';

describe('Async Validation', () => {
  it('runs async validators after sync', async () => {
    const chain = v.string()
      .email()
      .testAsync('unique', 'Email taken', async (value) => {
        // Simulate DB check
        return value !== 'taken@example.com';
      });

    const taken = await chain.validateAsync('taken@example.com');
    expect(taken.ok).toBe(false);
    if (!taken.ok) expect(taken.errors[0].rule).toBe('unique');

    const available = await chain.validateAsync('new@example.com');
    expect(available.ok).toBe(true);
  });

  it('skips async if sync fails', async () => {
    let asyncCalled = false;
    const chain = v.string()
      .email()
      .testAsync('check', 'Fail', async () => {
        asyncCalled = true;
        return true;
      });

    const result = await chain.validateAsync('not-email');
    expect(result.ok).toBe(false);
    expect(asyncCalled).toBe(false);
  });
});

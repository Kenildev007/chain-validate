import { StringChain } from './chains/string';
import { NumberChain } from './chains/number';
import { BooleanChain } from './chains/boolean';
import { ArrayChain } from './chains/array';
import { ObjectChain } from './chains/object';
import { AnyChain } from './chains/any';
import { CustomChain } from './chains/custom';
import type { CustomValidatorFn } from './chains/custom';

export const v = {
  string: () => new StringChain(),
  number: () => new NumberChain(),
  boolean: () => new BooleanChain(),
  array: <E = unknown>() => new ArrayChain<E>(),
  object: <S extends Record<string, any>>(schema: S) => new ObjectChain(schema),
  any: () => new AnyChain(),
  custom: <T>(fn: CustomValidatorFn<T>) => new CustomChain<T>(fn),
};

// Re-export types
export type { ValidationResult, ValidationError } from './core/result';
export type { CustomValidatorFn } from './chains/custom';
export { StringChain } from './chains/string';
export { NumberChain } from './chains/number';
export { BooleanChain } from './chains/boolean';
export { ArrayChain } from './chains/array';
export { ObjectChain } from './chains/object';
export { AnyChain } from './chains/any';
export { CustomChain } from './chains/custom';
export { ValidationContext } from './core/context';
export { OrChain, AndChain, WhenChain } from './core/chain';
export type { WhenOptions } from './core/chain';

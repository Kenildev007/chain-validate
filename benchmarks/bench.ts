import { v } from '../src';

function bench(name: string, fn: () => void, iterations = 1_000_000) {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;

  const opsPerSec = Math.round((iterations / elapsed) * 1000);
  console.log(`${name}: ${opsPerSec.toLocaleString()} ops/sec (${elapsed.toFixed(1)}ms)`);
}

console.log('validate-chain benchmarks\n');
console.log('='.repeat(60));

// --- Simple string (valid) ---
const simpleString = v.string().minLength(3).maxLength(50);
bench('Simple string (valid)', () => {
  simpleString.validate('hello world');
});

// --- Simple string (invalid) ---
bench('Simple string (invalid)', () => {
  simpleString.validate('hi');
});

// --- String with sanitizers (valid) ---
const sanitizedString = v.string().trim().lowercase().email();
bench('String + sanitize (valid)', () => {
  sanitizedString.validate('  TEST@EXAMPLE.COM  ');
});

// --- Number with coerce (valid) ---
const coercedNumber = v.number().coerce().integer().between(0, 100);
bench('Number + coerce (valid)', () => {
  coercedNumber.validate('42');
});

// --- Simple object (valid) ---
const simpleObject = v.object({
  name: v.string().required().trim().minLength(2),
  email: v.string().required().trim().lowercase().email(),
  age: v.number().optional().min(0).max(150),
});

const validObj = { name: '  Kenil  ', email: '  KENIL@EXAMPLE.COM  ', age: 25 };
bench('Simple object (valid)', () => {
  simpleObject.validate(validObj);
});

// --- Simple object (invalid) ---
const invalidObj = { name: '', email: 'bad', age: -1 };
bench('Simple object (invalid)', () => {
  simpleObject.validate(invalidObj);
});

// --- Nested object (valid) ---
const nestedObject = v.object({
  user: v.object({
    name: v.string().required().trim(),
    contact: v.object({
      email: v.string().required().email(),
      phone: v.string().optional(),
    }),
  }),
  tags: v.array<string>().of(v.string().trim()).maxLength(5),
});

const validNested = {
  user: {
    name: '  Kenil  ',
    contact: { email: 'k@e.com', phone: '123' },
  },
  tags: ['  a  ', '  b  ', '  c  '],
};
bench('Nested object (valid)', () => {
  nestedObject.validate(validNested);
});

// --- Nested object (invalid) ---
const invalidNested = {
  user: {
    name: '',
    contact: { email: 'bad' },
  },
  tags: ['  a  ', '  b  ', '  c  ', '  d  ', '  e  ', '  f  '],
};
bench('Nested object (invalid)', () => {
  nestedObject.validate(invalidNested);
});

// --- Boolean coerce ---
const boolCoerce = v.boolean().coerce();
bench('Boolean coerce (valid)', () => {
  boolCoerce.validate('true');
});

// --- Array with element validation ---
const arrayChain = v.array<string>().of(v.string().trim().email()).minLength(1).maxLength(10);
const validEmails = ['a@b.com', 'c@d.com', 'e@f.com'];
bench('Array of emails (valid)', () => {
  arrayChain.validate(validEmails);
});

console.log('\n' + '='.repeat(60));
console.log('Done.');

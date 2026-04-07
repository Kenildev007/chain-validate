# validate-chain

Fluent, chainable validation library for JavaScript & TypeScript.
Zero dependencies. Under 3kb gzipped. Works everywhere.
134 tests passing.

```bash
npm install validate-chain
```

## Quick Start

```ts
import { v } from 'validate-chain';

const emailSchema = v.string()
  .trim()
  .lowercase()
  .email('Invalid email address')
  .maxLength(255, 'Email too long');

const result = emailSchema.validate('  KENIL@EXAMPLE.COM  ');

if (result.ok) {
  console.log(result.value); // "kenil@example.com"
} else {
  console.log(result.errors);
  // [{ rule: "email", message: "Invalid email address", path: [] }]
}
```

## Why validate-chain?

| Feature | validate-chain | Zod | Yup | Joi |
|---|---|---|---|---|
| Bundle size | ~2.5kb | ~14kb | ~12kb | ~30kb |
| Zero dependencies | Yes | Yes | Yes | No |
| Collects ALL errors | Yes | No | No | Configurable |
| Built-in sanitization | Yes | No | Partial | No |
| Never throws | Yes | No | No | No |
| TypeScript-first | Yes | Yes | Partial | No |

## Core Concepts

### Never Throws

Every `.validate()` returns a discriminated union — never an exception:

```ts
type ValidationResult<T> =
  | { ok: true;  value: T }
  | { ok: false; errors: ValidationError[] }
```

### Collects All Errors

Unlike Zod which stops at the first failure, validate-chain runs every rule:

```ts
const result = v.string().minLength(5).email().validate('ab');
// result.errors = [
//   { rule: "minLength", message: "Must be at least 5 characters" },
//   { rule: "email", message: "Invalid email address" }
// ]
```

### Sanitize In The Chain

Sanitizers transform the value as it flows through — `result.value` is already clean:

```ts
const result = v.string().trim().lowercase().validate('  HELLO  ');
// result.value = "hello"
```

## API

### Entry Points

```ts
v.string()    // StringChain
v.number()    // NumberChain
v.boolean()   // BooleanChain
v.array()     // ArrayChain
v.object()    // ObjectChain
v.any()       // AnyChain
v.custom()    // CustomChain
```

### StringChain

**Validators:** `required()`, `minLength()`, `maxLength()`, `length()`, `email()`, `url()`, `uuid()`, `regex()`, `includes()`, `startsWith()`, `endsWith()`, `oneOf()`, `notEmpty()`

**Sanitizers:** `trim()`, `lowercase()`, `uppercase()`, `replace()`, `default()`

### NumberChain

**Validators:** `required()`, `min()`, `max()`, `between()`, `integer()`, `positive()`, `negative()`, `oneOf()`

**Sanitizers:** `coerce()`, `round()`, `floor()`, `ceil()`, `clamp()`, `default()`

### BooleanChain

**Validators:** `required()`

**Sanitizers:** `coerce()` (handles `"true"`, `"yes"`, `1`), `default()`

### ArrayChain

**Validators:** `required()`, `of()`, `minLength()`, `maxLength()`, `unique()`, `noEmpty()`

**Sanitizers:** `compact()`, `flat()`, `default()`

### ObjectChain

```ts
const schema = v.object({
  name: v.string().required().trim(),
  email: v.string().required().email(),
  age: v.number().optional().min(0),
});
```

**Validators:** `required()`, `strict()` (rejects unknown keys)

**Nested paths:** Errors include the full path — `["user", "email"]`

### Custom Validators

```ts
// Inline
v.string().test('no-spam', 'No spam', (val) => !val.includes('spam'));

// Async
v.string().testAsync('unique', 'Taken', async (val) => {
  return !(await db.exists(val));
});

// Fully custom
v.custom<string>((value, ctx) => {
  if (typeof value !== 'string') ctx.addError('type', 'Must be string');
  return value as string;
});
```

### Combinators

```ts
// Union — passes if either chain passes
v.string().or(v.number());

// Intersection — both must pass
v.string().minLength(3).and(v.string().maxLength(10));
```

### Conditional Validation

```ts
v.object({
  type: v.string().oneOf(['personal', 'business']),
  company: v.string().when('type', {
    is: 'business',
    then: (chain) => chain.required('Company required'),
    otherwise: (chain) => chain.optional(),
  }),
});
```

## Real-World Examples

### Express API

```ts
const createUserSchema = v.object({
  name: v.string().required().trim().minLength(2),
  email: v.string().required().trim().lowercase().email(),
  password: v.string().required().minLength(8),
  age: v.number().optional().coerce().integer().between(13, 150),
});

app.post('/users', (req, res) => {
  const result = createUserSchema.validate(req.body);
  if (!result.ok) return res.status(400).json({ errors: result.errors });
  const user = await createUser(result.value); // typed & sanitized
  res.json({ data: user });
});
```

### React Form

```ts
const loginSchema = v.object({
  email: v.string().required('Email is required').email('Enter a valid email'),
  password: v.string().required('Password is required').minLength(8, 'At least 8 characters'),
});

const result = loginSchema.validate(formData);
if (!result.ok) {
  const fieldErrors = {};
  result.errors.forEach((err) => {
    fieldErrors[err.path[0]] = err.message;
  });
  setErrors(fieldErrors);
}
```

## Performance

- Zero allocations on valid input
- Pre-compiled regex patterns
- Lazy error arrays — only created on first failure
- No Proxy, no getter traps — plain V8-optimizable calls

```bash
npm run bench
```

## License

MIT

// ===== PLAYGROUND DATA =====
const scenarios = {
  string: {
    schema: `<span class="kw">const</span> schema = v.<span class="fn">string</span>()
  .<span class="fn">required</span>(<span class="str">'Email is required'</span>)
  .<span class="fn">trim</span>()
  .<span class="fn">lowercase</span>()
  .<span class="fn">email</span>(<span class="str">'Must be a valid email'</span>)
  .<span class="fn">maxLength</span>(<span class="num">255</span>, <span class="str">'Email too long'</span>);`,
    input: '  KENIL@EXAMPLE.COM  ',
    validate(input) {
      const value = input;
      const errors = [];

      if (!value || value.trim() === '') {
        return { ok: false, errors: [{ rule: 'required', message: 'Email is required', path: [] }] };
      }

      let v = value.trim().toLowerCase();

      const emailRe = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRe.test(v)) errors.push({ rule: 'email', message: 'Must be a valid email', path: [] });
      if (v.length > 255) errors.push({ rule: 'maxLength', message: 'Email too long', path: [] });

      if (errors.length) return { ok: false, errors };
      return { ok: true, value: v };
    }
  },
  number: {
    schema: `<span class="kw">const</span> schema = v.<span class="fn">number</span>()
  .<span class="fn">required</span>(<span class="str">'Age is required'</span>)
  .<span class="fn">coerce</span>()
  .<span class="fn">integer</span>(<span class="str">'Must be whole number'</span>)
  .<span class="fn">between</span>(<span class="num">13</span>, <span class="num">150</span>, <span class="str">'Must be 13-150'</span>);`,
    input: '25',
    validate(input) {
      const raw = input.trim();
      if (!raw) return { ok: false, errors: [{ rule: 'required', message: 'Age is required', path: [] }] };

      const n = Number(raw);
      const errors = [];

      if (isNaN(n)) {
        return { ok: false, errors: [{ rule: 'type', message: 'Expected number, got string', path: [] }] };
      }
      if (!Number.isInteger(n)) errors.push({ rule: 'integer', message: 'Must be whole number', path: [] });
      if (n < 13 || n > 150) errors.push({ rule: 'between', message: 'Must be 13-150', path: [] });

      if (errors.length) return { ok: false, errors };
      return { ok: true, value: n };
    }
  },
  object: {
    schema: `<span class="kw">const</span> schema = v.<span class="fn">object</span>({
  name:  v.<span class="fn">string</span>().<span class="fn">required</span>().<span class="fn">trim</span>().<span class="fn">minLength</span>(<span class="num">2</span>),
  email: v.<span class="fn">string</span>().<span class="fn">required</span>().<span class="fn">trim</span>().<span class="fn">lowercase</span>().<span class="fn">email</span>(),
  age:   v.<span class="fn">number</span>().<span class="fn">optional</span>().<span class="fn">coerce</span>().<span class="fn">min</span>(<span class="num">0</span>),
});`,
    input: '{\n  "name": "  KENIL  ",\n  "email": "  Kenil@Example.COM  ",\n  "age": "25"\n}',
    validate(input) {
      let obj;
      try { obj = JSON.parse(input); } catch { return { ok: false, errors: [{ rule: 'parse', message: 'Invalid JSON', path: [] }] }; }

      const errors = [];
      const result = {};

      // name
      if (!obj.name || obj.name.trim() === '') {
        errors.push({ rule: 'required', message: 'This field is required', path: ['name'] });
      } else {
        const n = obj.name.trim();
        if (n.length < 2) errors.push({ rule: 'minLength', message: 'Must be at least 2 characters', path: ['name'] });
        else result.name = n;
      }

      // email
      if (!obj.email || obj.email.trim() === '') {
        errors.push({ rule: 'required', message: 'This field is required', path: ['email'] });
      } else {
        const e = obj.email.trim().toLowerCase();
        const emailRe = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRe.test(e)) errors.push({ rule: 'email', message: 'Invalid email address', path: ['email'] });
        else result.email = e;
      }

      // age (optional)
      if (obj.age !== undefined && obj.age !== null && obj.age !== '') {
        const a = Number(obj.age);
        if (isNaN(a)) errors.push({ rule: 'type', message: 'Expected number', path: ['age'] });
        else if (a < 0) errors.push({ rule: 'min', message: 'Must be at least 0', path: ['age'] });
        else result.age = a;
      }

      if (errors.length) return { ok: false, errors };
      return { ok: true, value: result };
    }
  },
  array: {
    schema: `<span class="kw">const</span> schema = v.<span class="fn">array</span>()
  .<span class="fn">of</span>(v.<span class="fn">string</span>().<span class="fn">trim</span>().<span class="fn">email</span>())
  .<span class="fn">minLength</span>(<span class="num">1</span>, <span class="str">'Need at least one'</span>)
  .<span class="fn">maxLength</span>(<span class="num">5</span>, <span class="str">'Max 5 emails'</span>)
  .<span class="fn">unique</span>(<span class="str">'No duplicates'</span>);`,
    input: '["a@b.com", "  C@D.COM  ", "not-email"]',
    validate(input) {
      let arr;
      try { arr = JSON.parse(input); } catch { return { ok: false, errors: [{ rule: 'parse', message: 'Invalid JSON array', path: [] }] }; }

      if (!Array.isArray(arr)) return { ok: false, errors: [{ rule: 'type', message: 'Expected array', path: [] }] };

      const errors = [];
      if (arr.length < 1) errors.push({ rule: 'minLength', message: 'Need at least one', path: [] });
      if (arr.length > 5) errors.push({ rule: 'maxLength', message: 'Max 5 emails', path: [] });
      if (new Set(arr.map(s => typeof s === 'string' ? s.trim().toLowerCase() : s)).size !== arr.length) {
        errors.push({ rule: 'unique', message: 'No duplicates', path: [] });
      }

      const cleaned = [];
      const emailRe = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      arr.forEach((el, i) => {
        if (typeof el !== 'string') {
          errors.push({ rule: 'type', message: 'Expected string', path: [String(i)] });
        } else {
          const trimmed = el.trim();
          if (!emailRe.test(trimmed)) errors.push({ rule: 'email', message: 'Invalid email address', path: [String(i)] });
          else cleaned.push(trimmed);
        }
      });

      if (errors.length) return { ok: false, errors };
      return { ok: true, value: cleaned };
    }
  },
  custom: {
    schema: `<span class="kw">const</span> schema = v.<span class="fn">custom</span>((value, ctx) => {
  <span class="kw">if</span> (<span class="kw">typeof</span> value !== <span class="str">'string'</span>) {
    ctx.<span class="fn">addError</span>(<span class="str">'type'</span>, <span class="str">'Must be a string'</span>);
    <span class="kw">return</span>;
  }
  <span class="kw">if</span> (value.length < <span class="num">8</span>)
    ctx.<span class="fn">addError</span>(<span class="str">'minLength'</span>, <span class="str">'At least 8 characters'</span>);
  <span class="kw">if</span> (!/[A-Z]/.<span class="fn">test</span>(value))
    ctx.<span class="fn">addError</span>(<span class="str">'uppercase'</span>, <span class="str">'Need one uppercase'</span>);
  <span class="kw">if</span> (!/[0-9]/.<span class="fn">test</span>(value))
    ctx.<span class="fn">addError</span>(<span class="str">'digit'</span>, <span class="str">'Need one digit'</span>);
  <span class="kw">if</span> (!/[^a-zA-Z0-9]/.<span class="fn">test</span>(value))
    ctx.<span class="fn">addError</span>(<span class="str">'special'</span>, <span class="str">'Need one special char'</span>);
  <span class="kw">return</span> value;
});`,
    input: 'abc',
    validate(input) {
      const value = input;
      const errors = [];
      if (typeof value !== 'string') {
        return { ok: false, errors: [{ rule: 'type', message: 'Must be a string', path: [] }] };
      }
      if (value.length < 8) errors.push({ rule: 'minLength', message: 'At least 8 characters', path: [] });
      if (!/[A-Z]/.test(value)) errors.push({ rule: 'uppercase', message: 'Need one uppercase', path: [] });
      if (!/[0-9]/.test(value)) errors.push({ rule: 'digit', message: 'Need one digit', path: [] });
      if (!/[^a-zA-Z0-9]/.test(value)) errors.push({ rule: 'special', message: 'Need one special char', path: [] });

      if (errors.length) return { ok: false, errors };
      return { ok: true, value };
    }
  },
  conditional: {
    schema: `<span class="kw">const</span> schema = v.<span class="fn">object</span>({
  type:    v.<span class="fn">string</span>().<span class="fn">oneOf</span>([<span class="str">'personal'</span>, <span class="str">'business'</span>]),
  company: v.<span class="fn">string</span>().<span class="fn">when</span>(<span class="str">'type'</span>, {
    is: <span class="str">'business'</span>,
    then:      (c) => c.<span class="fn">required</span>(<span class="str">'Company required'</span>),
    otherwise: (c) => c.<span class="fn">optional</span>(),
  }),
});`,
    input: '{\n  "type": "business",\n  "company": ""\n}',
    validate(input) {
      let obj;
      try { obj = JSON.parse(input); } catch { return { ok: false, errors: [{ rule: 'parse', message: 'Invalid JSON', path: [] }] }; }

      const errors = [];
      const result = {};

      const validTypes = ['personal', 'business'];
      if (!validTypes.includes(obj.type)) {
        errors.push({ rule: 'oneOf', message: 'Must be one of: personal, business', path: ['type'] });
      } else {
        result.type = obj.type;
      }

      if (obj.type === 'business') {
        if (!obj.company || obj.company.trim() === '') {
          errors.push({ rule: 'required', message: 'Company required', path: ['company'] });
        } else {
          result.company = obj.company;
        }
      } else {
        result.company = obj.company || undefined;
      }

      if (errors.length) return { ok: false, errors };
      return { ok: true, value: result };
    }
  }
};

// ===== PLAYGROUND LOGIC =====
const schemaCode = document.getElementById('schemaCode');
const playgroundInput = document.getElementById('playgroundInput');
const playgroundOutput = document.getElementById('playgroundOutput');
const runBtn = document.getElementById('runBtn');
const tabs = document.querySelectorAll('.playground-tab');

let currentTab = 'string';

function loadTab(tab) {
  currentTab = tab;
  const s = scenarios[tab];
  schemaCode.innerHTML = s.schema;
  playgroundInput.value = s.input;
  runValidation();

  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
}

function formatResult(result) {
  if (result.ok) {
    const val = typeof result.value === 'object'
      ? JSON.stringify(result.value, null, 2)
      : JSON.stringify(result.value);
    return `<span class="output-ok">&#10003; Validation Passed</span>\n\n<span class="output-key">ok:</span> <span class="kw">true</span>\n<span class="output-key">value:</span> <span class="str">${escapeHtml(val)}</span>`;
  }

  let out = `<span class="output-fail">&#10007; Validation Failed</span>\n\n<span class="output-key">ok:</span> <span class="kw">false</span>\n<span class="output-key">errors:</span> [\n`;
  result.errors.forEach((err, i) => {
    const path = err.path.length ? `[${err.path.map(p => `"${p}"`).join(', ')}]` : '[]';
    out += `  {\n`;
    out += `    <span class="output-key">rule:</span>    <span class="str">"${escapeHtml(err.rule)}"</span>\n`;
    out += `    <span class="output-key">message:</span> <span class="str">"${escapeHtml(err.message)}"</span>\n`;
    out += `    <span class="output-key">path:</span>    <span class="num">${path}</span>\n`;
    out += `  }${i < result.errors.length - 1 ? ',' : ''}\n`;
  });
  out += `]`;
  return out;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function runValidation() {
  const s = scenarios[currentTab];
  const result = s.validate(playgroundInput.value);
  playgroundOutput.innerHTML = formatResult(result);
}

// Event listeners
tabs.forEach(tab => {
  tab.addEventListener('click', () => loadTab(tab.dataset.tab));
});

runBtn.addEventListener('click', runValidation);
playgroundInput.addEventListener('input', runValidation);

// ===== COPY BUTTON =====
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.dataset.copy;
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add('copied');
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
      }, 2000);
    });
  });
});

// ===== MOBILE NAV =====
const mobileToggle = document.querySelector('.nav-mobile-toggle');
const navLinks = document.querySelector('.nav-links');
mobileToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== INIT =====
loadTab('string');

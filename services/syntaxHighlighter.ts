// Lightweight, fast, zero-dependency syntax highlighter for academic programming notes
// Specialized for C++, C, Python, Java, SQL, and JavaScript

export type SupportedLanguage = 'cpp' | 'c' | 'python' | 'java' | 'sql' | 'javascript' | 'plaintext';

export interface LanguageOption {
  id: SupportedLanguage;
  name: string;
  badge: string;
  color: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: 'cpp', name: 'C++', badge: 'C++', color: '#00599c' },
  { id: 'c', name: 'C Language', badge: 'C', color: '#555555' },
  { id: 'python', name: 'Python', badge: 'PY', color: '#3776ab' },
  { id: 'java', name: 'Java', badge: 'JAVA', color: '#b07219' },
  { id: 'sql', name: 'SQL Database', badge: 'SQL', color: '#e38c00' },
  { id: 'javascript', name: 'JavaScript / TS', badge: 'JS', color: '#f7df1e' },
  { id: 'plaintext', name: 'كود عام / نص', badge: 'CODE', color: '#64748b' },
];

export function normalizeLanguage(lang: string | undefined | null): SupportedLanguage {
  if (!lang) return 'plaintext';
  const clean = lang.trim().toLowerCase();
  if (['cpp', 'c++', 'cxx', 'cc'].includes(clean)) return 'cpp';
  if (clean === 'c') return 'c';
  if (['python', 'py'].includes(clean)) return 'python';
  if (clean === 'java') return 'java';
  if (['sql', 'mysql', 'postgresql', 'sqlite'].includes(clean)) return 'sql';
  if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx'].includes(clean)) return 'javascript';
  return 'plaintext';
}

// Token definitions
const CPP_KEYWORDS = new Set([
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit', 'atomic_noexcept',
  'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t',
  'char32_t', 'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit',
  'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype', 'default', 'delete',
  'do', 'double', 'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float',
  'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept',
  'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected', 'public',
  'reflexpr', 'register', 'reinterpret_cast', 'requires', 'return', 'short', 'signed', 'sizeof',
  'static', 'static_assert', 'static_cast', 'struct', 'switch', 'synchronized', 'template', 'this',
  'thread_local', 'throw', 'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned',
  'using', 'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq'
]);

const CPP_BUILTINS = new Set([
  'cout', 'cin', 'endl', 'printf', 'scanf', 'std', 'vector', 'string', 'map', 'set',
  'pair', 'queue', 'stack', 'size_t', 'include', 'define', 'ifdef', 'ifndef', 'endif'
]);

const C_KEYWORDS = new Set([
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else',
  'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return',
  'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned',
  'void', 'volatile', 'while', 'NULL', 'bool', 'true', 'false'
]);

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
  'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
  'try', 'while', 'with', 'yield'
]);

const PYTHON_BUILTINS = new Set([
  'print', 'input', 'len', 'range', 'int', 'str', 'float', 'list', 'dict', 'set', 'tuple',
  'type', 'sum', 'min', 'max', 'abs', 'round', 'open', 'enumerate', 'zip', 'map', 'filter',
  'isinstance', 'issubclass', 'help', 'super', 'self'
]);

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
  'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
  'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void',
  'volatile', 'while', 'true', 'false', 'null'
]);

const JAVA_BUILTINS = new Set([
  'System', 'out', 'println', 'print', 'Scanner', 'String', 'Integer', 'Double', 'Boolean',
  'ArrayList', 'HashMap', 'HashSet', 'List', 'Map', 'Set', 'Math', 'Override'
]);

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'DROP',
  'ALTER', 'ADD', 'COLUMN', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON', 'GROUP',
  'BY', 'ORDER', 'ASC', 'DESC', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'AS', 'AND', 'OR',
  'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'CONSTRAINT', 'DEFAULT', 'CHECK', 'UNIQUE', 'INDEX', 'VIEW', 'DATABASE', 'USE', 'UNION',
  'ALL', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'VALUES', 'SET', 'CASCADE', 'CASE', 'WHEN',
  'THEN', 'ELSE', 'END', 'EXISTS'
]);

const SQL_TYPES = new Set([
  'INT', 'INTEGER', 'VARCHAR', 'CHAR', 'TEXT', 'BOOLEAN', 'BOOL', 'DATE', 'DATETIME',
  'TIMESTAMP', 'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'BIGINT', 'SERIAL', 'BLOB'
]);

const JS_KEYWORDS = new Set([
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'function',
  'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'return', 'super', 'switch',
  'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield'
]);

// Helper to escape HTML characters
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Highlights a raw code snippet according to language syntax rules.
 * Returns safe HTML with syntax-coloring spans.
 */
export function highlightCode(code: string, language: SupportedLanguage): string {
  if (!code) return '';
  if (language === 'plaintext') {
    return escapeHtml(code);
  }

  // Pre-process line by line or token by token
  const lines = code.split('\n');
  const highlightedLines = lines.map((line) => highlightLine(line, language));
  return highlightedLines.join('\n');
}

function highlightLine(line: string, language: SupportedLanguage): string {
  let result = '';
  let i = 0;
  const len = line.length;

  while (i < len) {
    const ch = line[i];
    const nextCh = i + 1 < len ? line[i + 1] : '';

    // 1. Line comments
    // C/C++/Java/JS: //
    if ((language === 'cpp' || language === 'c' || language === 'java' || language === 'javascript') && ch === '/' && nextCh === '/') {
      const commentText = line.slice(i);
      result += `<span class="text-slate-400 dark:text-slate-400 italic font-mono">${escapeHtml(commentText)}</span>`;
      break;
    }

    // Python: #
    if (language === 'python' && ch === '#') {
      const commentText = line.slice(i);
      result += `<span class="text-slate-400 dark:text-slate-400 italic font-mono">${escapeHtml(commentText)}</span>`;
      break;
    }

    // SQL: --
    if (language === 'sql' && ch === '-' && nextCh === '-') {
      const commentText = line.slice(i);
      result += `<span class="text-slate-400 dark:text-slate-400 italic font-mono">${escapeHtml(commentText)}</span>`;
      break;
    }

    // 2. Preprocessor in C/C++ (#include, #define...)
    if ((language === 'cpp' || language === 'c') && ch === '#') {
      let end = i + 1;
      while (end < len && /[a-zA-Z0-9_]/.test(line[end])) {
        end++;
      }
      const directive = line.slice(i, end);
      result += `<span class="text-rose-400 font-bold">${escapeHtml(directive)}</span>`;
      i = end;
      continue;
    }

    // 3. String literals ("..." or '...')
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let end = i + 1;
      while (end < len) {
        if (line[end] === '\\') {
          end += 2; // skip escaped char
          continue;
        }
        if (line[end] === quote) {
          end++;
          break;
        }
        end++;
      }
      const strLiteral = line.slice(i, end);
      result += `<span class="text-emerald-400 dark:text-emerald-300">${escapeHtml(strLiteral)}</span>`;
      i = end;
      continue;
    }

    // 4. Numbers
    if (/\d/.test(ch)) {
      let end = i + 1;
      while (end < len && /[\d\.xXa-fA-F]/.test(line[end])) {
        end++;
      }
      const numLiteral = line.slice(i, end);
      result += `<span class="text-amber-300 dark:text-amber-300 font-semibold">${escapeHtml(numLiteral)}</span>`;
      i = end;
      continue;
    }

    // 5. Identifiers, Keywords, Types
    if (/[a-zA-Z_]/.test(ch)) {
      let end = i + 1;
      while (end < len && /[a-zA-Z0-9_]/.test(line[end])) {
        end++;
      }
      const word = line.slice(i, end);
      const upperWord = word.toUpperCase();

      if (language === 'sql') {
        if (SQL_KEYWORDS.has(upperWord)) {
          result += `<span class="text-sky-300 dark:text-sky-300 font-black">${escapeHtml(word)}</span>`;
        } else if (SQL_TYPES.has(upperWord)) {
          result += `<span class="text-purple-300 dark:text-purple-300 font-bold">${escapeHtml(word)}</span>`;
        } else {
          result += escapeHtml(word);
        }
      } else if (language === 'cpp') {
        if (CPP_KEYWORDS.has(word)) {
          result += `<span class="text-indigo-300 dark:text-indigo-300 font-bold">${escapeHtml(word)}</span>`;
        } else if (CPP_BUILTINS.has(word)) {
          result += `<span class="text-cyan-300 dark:text-cyan-300 font-semibold">${escapeHtml(word)}</span>`;
        } else {
          result += escapeHtml(word);
        }
      } else if (language === 'c') {
        if (C_KEYWORDS.has(word)) {
          result += `<span class="text-indigo-300 dark:text-indigo-300 font-bold">${escapeHtml(word)}</span>`;
        } else if (['printf', 'scanf', 'malloc', 'free', 'sizeof', 'main'].includes(word)) {
          result += `<span class="text-cyan-300 dark:text-cyan-300 font-semibold">${escapeHtml(word)}</span>`;
        } else {
          result += escapeHtml(word);
        }
      } else if (language === 'python') {
        if (PYTHON_KEYWORDS.has(word)) {
          result += `<span class="text-purple-300 dark:text-purple-300 font-bold">${escapeHtml(word)}</span>`;
        } else if (PYTHON_BUILTINS.has(word)) {
          result += `<span class="text-cyan-300 dark:text-cyan-300 font-semibold">${escapeHtml(word)}</span>`;
        } else {
          result += escapeHtml(word);
        }
      } else if (language === 'java') {
        if (JAVA_KEYWORDS.has(word)) {
          result += `<span class="text-indigo-300 dark:text-indigo-300 font-bold">${escapeHtml(word)}</span>`;
        } else if (JAVA_BUILTINS.has(word)) {
          result += `<span class="text-cyan-300 dark:text-cyan-300 font-semibold">${escapeHtml(word)}</span>`;
        } else {
          result += escapeHtml(word);
        }
      } else if (language === 'javascript') {
        if (JS_KEYWORDS.has(word)) {
          result += `<span class="text-indigo-300 dark:text-indigo-300 font-bold">${escapeHtml(word)}</span>`;
        } else if (['console', 'log', 'document', 'window', 'Math', 'JSON', 'Array', 'Object'].includes(word)) {
          result += `<span class="text-cyan-300 dark:text-cyan-300 font-semibold">${escapeHtml(word)}</span>`;
        } else {
          result += escapeHtml(word);
        }
      } else {
        result += escapeHtml(word);
      }

      i = end;
      continue;
    }

    // 6. Operators & Punctuation
    if (/[+\-*\/%=&|<>!?:;.,~^]/.test(ch)) {
      result += `<span class="text-slate-300 dark:text-slate-300 font-medium">${escapeHtml(ch)}</span>`;
      i++;
      continue;
    }

    // Default character
    result += escapeHtml(ch);
    i++;
  }

  return result;
}

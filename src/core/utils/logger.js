// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const LEVEL_CONFIG = {
  LOG: { color: colors.green, label: ' LOG ' },
  WARN: { color: colors.yellow, label: 'WARN ' },
  ERROR: { color: colors.red, label: 'ERROR' },
  DEBUG: { color: colors.blue, label: 'DEBUG' },
  VERBOSE: { color: colors.cyan, label: ' VRB ' },
};

function getTimestamp() {
  const now = new Date();
  const date = now.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = now.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${date}, ${time}`;
}

function write(level, context, message) {
  if (process.env.NODE_ENV === 'test') return;

  const { color, label } = LEVEL_CONFIG[level];
  const time = getTimestamp();

  const pid = `${colors.gray}${colors.bold}[GitPulse]${colors.reset}`;
  const ts = `${colors.gray}${time}${colors.reset}`;
  const lvl = `${color}${colors.bold}${label}${colors.reset}`;
  const ctx = `${color}[${context}]${colors.reset}`;
  const msg = `${colors.white}${message}${colors.reset}`;

  process.stdout.write(`${pid} ${ts}  ${lvl}  ${ctx} ${msg}\n`);
}

const Logger = {
  log: (context, message) => write('LOG', context, message),
  warn: (context, message) => write('WARN', context, message),
  error: (context, message) => write('ERROR', context, message),
  debug: (context, message) => write('DEBUG', context, message),
  verbose: (context, message) => write('VERBOSE', context, message),
};

export default Logger;

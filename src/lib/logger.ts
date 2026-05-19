type LogLevel = 'info' | 'warn' | 'error';

function write(level: LogLevel, scope: string, detail?: unknown) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    scope,
    detail: detail instanceof Error ? { message: detail.message, stack: detail.stack } : detail
  };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

export function logInfo(scope: string, detail?: unknown) {
  write('info', scope, detail);
}

export function logWarn(scope: string, detail?: unknown) {
  write('warn', scope, detail);
}

export function logError(scope: string, detail?: unknown) {
  write('error', scope, detail);
}

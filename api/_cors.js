const ALLOWED_ORIGIN_PATTERNS = [
  // ── WorldMonitor production ───────────────────────────────────────
  /^https:\/\/(.*\.)?worldmonitor\.app$/,

  // ── Your actual Vercel deployment ────────────────────────────────
  /^https:\/\/worldmonitor-rho-five\.vercel\.app$/,

  // ── Any future Vercel preview deployments of this project ────────
  /^https:\/\/worldmonitor-[a-z0-9-]+\.vercel\.app$/,

  // ── Local development ─────────────────────────────────────────────
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,

  // ── Tauri desktop app ─────────────────────────────────────────────
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/,

  // ── n8n on Railway (your actual instance) ────────────────────────
  /^https:\/\/primary-production-65b44\.up\.railway\.app$/,

  // ── Any Railway deployment (self-hosted n8n) ─────────────────────
  /^https?:\/\/[a-z0-9-]+\.up\.railway\.app$/,
  /^https?:\/\/[a-z0-9-]+\.railway\.app$/,

  // ── n8n Cloud ─────────────────────────────────────────────────────
  /^https:\/\/(.*\.)?n8n\.cloud$/,
  /^https:\/\/(.*\.)?n8n\.io$/,

  // ── Other self-hosted n8n platforms ──────────────────────────────
  /^https?:\/\/[a-z0-9-]+\.render\.com$/,
];

function isAllowedOrigin(origin) {
  return Boolean(origin) && ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export function getCorsHeaders(req, methods = 'GET, OPTIONS') {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = isAllowedOrigin(origin) ? origin : 'https://worldmonitor.app';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-WorldMonitor-Key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function isDisallowedOrigin(req) {
  const origin = req.headers.get('origin');
  // No origin = server-to-server (n8n HTTP Request node) — always allow
  if (!origin) return false;
  return !isAllowedOrigin(origin);
}

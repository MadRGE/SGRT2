const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3333;

// ── Local providers (always available if running) ──
const LOCAL_PROVIDERS = {
  ollama: {
    url: 'http://localhost:11434',
    defaultModel: 'llama3.2',
    auth: null
  },
  openclaw: {
    url: 'http://localhost:18789',
    defaultModel: 'claude-sonnet-4-20250514',
    auth: 'Bearer 9bfdaa62718f721f4b61cb850663fd536215c28eff1c129a7216a23f57d35b17'
  }
};

// ── External providers (need API key from client) ──
const EXTERNAL_PROVIDERS = {
  groq: {
    name: 'Groq',
    url: 'https://api.groq.com/openai',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it']
  },
  gemini: {
    name: 'Google Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro']
  },
  openrouter: {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/api',
    defaultModel: 'google/gemini-2.0-flash-exp:free',
    models: ['google/gemini-2.0-flash-exp:free', 'deepseek/deepseek-chat-v3-0324:free', 'meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free']
  }
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, data) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ── Proxy to any OpenAI-compatible endpoint ──
function proxyChat(res, provider, messages, model, apiKey) {
  let targetUrl, auth, defaultModel, httpModule;

  if (LOCAL_PROVIDERS[provider]) {
    const cfg = LOCAL_PROVIDERS[provider];
    targetUrl = new URL('/v1/chat/completions', cfg.url);
    auth = cfg.auth;
    defaultModel = cfg.defaultModel;
    httpModule = http;
  } else if (EXTERNAL_PROVIDERS[provider]) {
    const cfg = EXTERNAL_PROVIDERS[provider];
    if (!apiKey) return json(res, 400, { error: `API key required for ${cfg.name}` });
    targetUrl = new URL('/v1/chat/completions', cfg.url);
    auth = `Bearer ${apiKey}`;
    defaultModel = cfg.defaultModel;
    httpModule = https;
  } else {
    return json(res, 400, { error: `Unknown provider: ${provider}` });
  }

  const payload = JSON.stringify({
    model: model || defaultModel,
    messages: messages || [],
    stream: true
  });

  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  };
  if (auth) headers['Authorization'] = auth;

  const proxyReq = httpModule.request({
    hostname: targetUrl.hostname,
    port: targetUrl.port || (httpModule === https ? 443 : 80),
    path: targetUrl.pathname,
    method: 'POST',
    headers
  }, (proxyRes) => {
    cors(res);
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': proxyRes.headers['content-type'] || 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    json(res, 502, { error: `${provider} error: ${err.message}` });
  });

  proxyReq.write(payload);
  proxyReq.end();
}

// ── Proxy to already-open response (for auto mode, headers already sent) ──
function proxyChatPiped(res, provider, messages, model, apiKey) {
  let targetUrl, auth, defaultModel, httpModule;

  if (LOCAL_PROVIDERS[provider]) {
    const cfg = LOCAL_PROVIDERS[provider];
    targetUrl = new URL('/v1/chat/completions', cfg.url);
    auth = cfg.auth;
    defaultModel = cfg.defaultModel;
    httpModule = http;
  } else if (EXTERNAL_PROVIDERS[provider]) {
    const cfg = EXTERNAL_PROVIDERS[provider];
    if (!apiKey) { res.write(`data: ${JSON.stringify({ error: `API key required for ${cfg.name}` })}\n\n`); res.end(); return; }
    targetUrl = new URL('/v1/chat/completions', cfg.url);
    auth = `Bearer ${apiKey}`;
    defaultModel = cfg.defaultModel;
    httpModule = https;
  } else {
    res.write(`data: ${JSON.stringify({ error: `Unknown provider: ${provider}` })}\n\n`); res.end(); return;
  }

  const payload = JSON.stringify({
    model: model || defaultModel,
    messages: messages || [],
    stream: true
  });

  const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) };
  if (auth) headers['Authorization'] = auth;

  const proxyReq = httpModule.request({
    hostname: targetUrl.hostname,
    port: targetUrl.port || (httpModule === https ? 443 : 80),
    path: targetUrl.pathname,
    method: 'POST',
    headers
  }, (proxyRes) => {
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  });

  proxyReq.write(payload);
  proxyReq.end();
}

// ── Fetch Ollama models ──
function getOllamaModels() {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: 'localhost',
      port: 11434,
      path: '/api/tags',
      timeout: 2000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.models.map(m => m.name));
        } catch { resolve([]); }
      });
    });
    req.on('error', () => resolve([]));
    req.on('timeout', () => { req.destroy(); resolve([]); });
  });
}

// ── Smart Router: classify prompt → pick best provider/model ──
const CODE_WORDS = /\b(function|class|const |let |var |import |require|def |return |async |await |error|bug|fix|refactor|code|codigo|programa|script|debug|compilar|npm|git|api|endpoint|database|query|sql|html|css|regex)\b/i;
const REASON_WORDS = /\b(explain|analiz|compar|design|architect|plan|strategy|evalua|trade.?off|pros.?cons|ventajas|desventajas|infraestructura|competidor|amenaza|legal)\b/i;
const SIMPLE_THRESHOLD = 60; // chars

function smartRoute(messages, apiKeys, ollamaUp) {
  const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
  const allText = messages.map(m => m.content).join(' ').toLowerCase();
  const len = lastMsg.length;

  // Priority 1: Code tasks → codellama (local, specialized)
  if (CODE_WORDS.test(allText) && ollamaUp) {
    return { provider: 'ollama', model: 'codellama:7b', reason: 'codigo → codellama (local)' };
  }

  // Priority 2: Complex reasoning → Groq 70B (free, powerful) or Gemini
  if (REASON_WORDS.test(allText) || len > 300) {
    if (apiKeys?.groq) return { provider: 'groq', model: 'llama-3.3-70b-versatile', reason: 'razonamiento → Groq 70B (gratis)' };
    if (apiKeys?.gemini) return { provider: 'gemini', model: 'gemini-2.0-flash', reason: 'razonamiento → Gemini Flash' };
    if (apiKeys?.openrouter) return { provider: 'openrouter', model: 'deepseek/deepseek-chat-v3-0324:free', reason: 'razonamiento → DeepSeek (gratis)' };
    if (ollamaUp) return { provider: 'ollama', model: 'llama3.2:latest', reason: 'razonamiento → llama3.2 (local)' };
  }

  // Priority 3: Very short/simple → tinyllama (fastest, cheapest)
  if (len < SIMPLE_THRESHOLD && ollamaUp) {
    return { provider: 'ollama', model: 'tinyllama:latest', reason: 'simple → tinyllama (rapido)' };
  }

  // Priority 4: General → llama3.2 (good balance, local)
  if (ollamaUp) return { provider: 'ollama', model: 'llama3.2:latest', reason: 'general → llama3.2 (local)' };

  // Fallback: any available external
  if (apiKeys?.groq) return { provider: 'groq', model: 'llama-3.1-8b-instant', reason: 'fallback → Groq 8B' };
  if (apiKeys?.openrouter) return { provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free', reason: 'fallback → OpenRouter' };
  if (apiKeys?.gemini) return { provider: 'gemini', model: 'gemini-2.0-flash-lite', reason: 'fallback → Gemini Lite' };

  return { provider: 'ollama', model: 'llama3.2', reason: 'default → llama3.2' };
}

// ── Quick health check ──
function checkLocal(provider) {
  const cfg = LOCAL_PROVIDERS[provider];
  if (!cfg) return Promise.resolve(false);
  return new Promise((resolve) => {
    const target = new URL(provider === 'ollama' ? '/api/tags' : '/v1/models', cfg.url);
    const req = http.get({
      hostname: target.hostname,
      port: target.port,
      path: target.pathname,
      timeout: 2000
    }, (res) => {
      res.resume();
      resolve(res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

// ── Server ──
const server = http.createServer(async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve dashboard
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'project-viewer.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Providers info + Ollama model list
  if (req.method === 'GET' && req.url === '/api/providers') {
    const [ollamaUp, openclawUp, ollamaModels] = await Promise.all([
      checkLocal('ollama'),
      checkLocal('openclaw'),
      getOllamaModels()
    ]);

    json(res, 200, {
      local: {
        ollama: { available: ollamaUp, models: ollamaModels, defaultModel: LOCAL_PROVIDERS.ollama.defaultModel },
        openclaw: { available: openclawUp, defaultModel: LOCAL_PROVIDERS.openclaw.defaultModel }
      },
      external: Object.fromEntries(
        Object.entries(EXTERNAL_PROVIDERS).map(([k, v]) => [k, { name: v.name, models: v.models, defaultModel: v.defaultModel }])
      )
    });
    return;
  }

  // Git status for a project
  if (req.method === 'POST' && req.url === '/api/git-status') {
    const { projectPath } = await parseBody(req);
    if (!projectPath) return json(res, 400, { error: 'projectPath required' });

    const gitCmd = [
      'git rev-parse --abbrev-ref HEAD',           // branch
      'git status --porcelain',                      // changes
      'git log -1 --format="%s|||%ar|||%h"',         // last commit
      'git log --oneline -5'                         // recent commits
    ].join(' & echo __SEP__ & ');

    exec(gitCmd, { cwd: projectPath, shell: 'cmd.exe', timeout: 5000 }, (err, stdout) => {
      if (err) return json(res, 200, { isGit: false });

      const parts = stdout.split('__SEP__').map(s => s.trim());
      const branch = parts[0] || '';
      const changes = (parts[1] || '').split('\n').filter(l => l.trim());
      const lastCommitRaw = (parts[2] || '').split('|||');
      const recentRaw = (parts[3] || '').split('\n').filter(l => l.trim());

      json(res, 200, {
        isGit: true,
        branch,
        changes: {
          total: changes.length,
          modified: changes.filter(l => l.startsWith(' M') || l.startsWith('M')).length,
          added: changes.filter(l => l.startsWith('A') || l.startsWith('??')).length,
          deleted: changes.filter(l => l.startsWith('D') || l.startsWith(' D')).length
        },
        lastCommit: lastCommitRaw.length >= 3 ? {
          message: lastCommitRaw[0],
          ago: lastCommitRaw[1],
          hash: lastCommitRaw[2]
        } : null,
        recentCommits: recentRaw.slice(0, 5)
      });
    });
    return;
  }

  // Launch Claude in terminal (optionally with a prompt)
  if (req.method === 'POST' && req.url === '/api/launch') {
    const { projectPath, prompt } = await parseBody(req);
    if (!projectPath) return json(res, 400, { error: 'projectPath required' });
    // start "" sets window title, then cmd /k runs the command
    // Unset CLAUDECODE so the new instance doesn't think it's nested
    const escapedPrompt = prompt ? prompt.replace(/"/g, '\\"') : '';
    const claudeCmd = prompt ? `claude "${escapedPrompt}"` : 'claude';
    const title = prompt ? `Claude Task - ${path.basename(projectPath)}` : `Claude - ${path.basename(projectPath)}`;
    const cmd = `start "${title}" cmd /k "set CLAUDECODE= && cd /d ${projectPath} && ${claudeCmd}"`;
    exec(cmd, { shell: 'cmd.exe' }, (err) => {
      if (err) return json(res, 500, { error: err.message });
      json(res, 200, { ok: true });
    });
    return;
  }

  // Chat proxy (streaming)
  if (req.method === 'POST' && req.url === '/api/chat') {
    const body = await parseBody(req);
    let provider = body.provider || 'ollama';
    let model = body.model;
    let routeInfo = null;

    // Smart routing
    if (provider === 'auto') {
      const ollamaUp = await checkLocal('ollama');
      routeInfo = smartRoute(body.messages || [], body.apiKeys || {}, ollamaUp);
      provider = routeInfo.provider;
      model = routeInfo.model;
      // Send route info as first SSE event so frontend can show it
      cors(res);
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(`data: ${JSON.stringify({ route: routeInfo })}\n\n`);
      // Now proxy the rest (but we need to handle it differently since headers are already sent)
      proxyChatPiped(res, provider, body.messages, model, body.apiKeys?.[provider]);
      return;
    }

    proxyChat(res, provider, body.messages, model, body.apiKey);
    return;
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n  Project Viewer Server`);
  console.log(`  ─────────────────────`);
  console.log(`  Dashboard:  http://localhost:${PORT}`);
  console.log(`  Local:      Ollama | OpenClaw`);
  console.log(`  External:   Groq | Gemini | OpenRouter`);
  console.log(`  \n  Ctrl+C to stop\n`);
});

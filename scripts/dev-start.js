const { execFileSync, spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

// Electron will start the API server itself; no need to block it.

function readWindowsProcesses() {
  const command = [
    "$processes = Get-CimInstance Win32_Process | Where-Object {",
    "  $_.CommandLine -and",
    "  ($_.CommandLine -match 'bikebrowser' -or ($_.CommandLine -match 'npm-cli\\.js' -and $_.CommandLine -match 'run server')) -and",
    "  $_.Name -match 'node|electron'",
    "} | Select-Object ProcessId, ParentProcessId, Name, CommandLine;",
    "$processes | ConvertTo-Json -Compress"
  ].join(' ');

  const output = execFileSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
    { cwd: rootDir, encoding: 'utf8' }
  ).trim();

  if (!output) {
    return [];
  }

  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function shouldKillProcess(proc) {
  if (!proc || !proc.CommandLine) {
    return false;
  }

  if (Number(proc.ProcessId) === process.pid) {
    return false;
  }

  const commandLine = String(proc.CommandLine);
  const processName = String(proc.Name || '').toLowerCase();

  if (commandLine.includes('scripts\\dev-start.js')) {
    return false;
  }

  // Clean up stale BikeBrowser Electron processes from previous runs.
  if (processName === 'electron.exe') {
    return true;
  }

  // Clean up stale BikeBrowser Node wrappers/servers that survive task restarts.
  if (processName === 'node.exe' && commandLine.includes('bikebrowser')) {
    return true;
  }

  return (
    (commandLine.includes('npm-cli.js') && commandLine.includes('run server')) ||
    commandLine.includes('concurrently') ||
    commandLine.includes('vite') ||
    commandLine.includes('electron .') ||
    commandLine.includes('electron\\cli.js') ||
    commandLine.includes('--app-path=')
  );
}

function killWindowsProcesses(processes) {
  const killed = [];

  for (const proc of processes) {
    if (!shouldKillProcess(proc)) {
      continue;
    }

    try {
      execFileSync('taskkill', ['/PID', String(proc.ProcessId), '/T', '/F'], {
        stdio: 'ignore'
      });
      killed.push(`${proc.Name}:${proc.ProcessId}`);
    } catch {
      // Ignore race conditions where the process exits on its own.
    }
  }

  return killed;
}

function killUnixProcesses() {
  try {
    execFileSync('pkill', ['-f', `${rootDir}.*(vite|electron|concurrently)`], {
      stdio: 'ignore'
    });
  } catch {
    // Ignore when no matching processes exist.
  }
}

function cleanExistingDevProcesses() {
  if (isWindows) {
    const processes = readWindowsProcesses();
    const killed = killWindowsProcesses(processes);
    if (killed.length > 0) {
      console.log(`Cleaned old dev processes: ${killed.join(', ')}`);
    }
    return;
  }

  killUnixProcesses();
}

function startFreshDevStack() {
  const child = isWindows
    ? spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev:stack'], {
        cwd: rootDir,
        stdio: 'inherit',
        env: process.env,
        shell: false
      })
    : spawn('npm', ['run', 'dev:stack'], {
        cwd: rootDir,
        stdio: 'inherit',
        env: process.env,
        shell: false
      });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

// --- Cloudflare Tunnel ---

function findCloudflaredExe() {
  const candidates = [
    'C:\\Program Files\\Cloudflare\\cloudflared.exe',
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe'
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  // Check PATH
  try {
    const result = execFileSync(
      isWindows ? 'where.exe' : 'which',
      ['cloudflared'],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim().split(/\r?\n/)[0];
    if (result && fs.existsSync(result)) return result;
  } catch {
    // not on PATH
  }

  return null;
}

function isCloudflaredRunning() {
  try {
    if (isWindows) {
      const out = execSync('tasklist /FI "IMAGENAME eq cloudflared.exe" /NH', { encoding: 'utf8' });
      return out.includes('cloudflared.exe');
    }
    execSync('pgrep -x cloudflared', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function startCloudflaredTunnel() {
  if (!isWindows) {
    // Only autostart on Windows for now; start-all.ps1 handles production
    return;
  }

  if (isCloudflaredRunning()) {
    console.log('[TUNNEL] cloudflared already running - reusing');
    return;
  }

  const exe = findCloudflaredExe();
  if (!exe) {
    console.log('[TUNNEL] cloudflared not found - bike-browser.com will be unavailable (LAN still works)');
    return;
  }

  console.log('[TUNNEL] Starting cloudflared tunnel...');
  const logsDir = path.join(rootDir, 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  const tunnelProc = spawn(exe, ['tunnel', 'run', 'bikebrowser'], {
    cwd: rootDir,
    stdio: ['ignore', fs.openSync(path.join(logsDir, 'tunnel.out.log'), 'a'), fs.openSync(path.join(logsDir, 'tunnel.err.log'), 'a')],
    detached: true,
    windowsHide: true
  });
  tunnelProc.unref();

  // Verify it's still alive after a moment
  setTimeout(() => {
    try {
      process.kill(tunnelProc.pid, 0); // signal 0 = existence check
      console.log(`[TUNNEL] cloudflared running (PID ${tunnelProc.pid})`);
    } catch {
      console.log('[TUNNEL] cloudflared exited early - check logs/tunnel.err.log');
    }
  }, 3000);
}

cleanExistingDevProcesses();
startCloudflaredTunnel();
startFreshDevStack();
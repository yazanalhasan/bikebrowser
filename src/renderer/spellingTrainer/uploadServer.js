const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function isPrivateLanHost(hostname) {
  return /^(10|192\.168|172\.(1[6-9]|2\d|3[0-1]))\./.test(hostname);
}

export function getUploadServerBase(hostname = window.location.hostname) {
  if (loopbackHosts.has(hostname)) {
    return "http://127.0.0.1:3000";
  }

  if (isPrivateLanHost(hostname)) {
    return `http://${hostname}:3000`;
  }

  return null;
}

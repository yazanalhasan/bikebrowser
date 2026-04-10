const os = require('os');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();

  for (const values of Object.values(interfaces)) {
    for (const item of values || []) {
      if (item.family === 'IPv4' && !item.internal) {
        return item.address;
      }
    }
  }

  return '127.0.0.1';
}

module.exports = {
  getLocalIpAddress,
};

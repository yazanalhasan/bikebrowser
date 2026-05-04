export function isPublicPagesHost() {
  if (typeof window === 'undefined') {
    return false;
  }

  const host = window.location.hostname;
  return host === 'bike-browser.com'
    || host === 'www.bike-browser.com'
    || host === 'bikebrowser.pages.dev'
    || host.endsWith('.bikebrowser.pages.dev');
}

# BikeBrowser Production Deployment

Production for `bike-browser.com` should be Cloudflare Pages, built from GitHub `main`.

## Expected Cloudflare Pages Settings

- Install command: `npm ci`
- Build command: `npm run build`
- Build output directory: `build`
- Production branch: `main`
- Secrets: configure in Cloudflare dashboard only; do not commit secrets.

The repo also includes `wrangler.toml` with `pages_build_output_dir = "build"` so Wrangler direct deploys and Pages config agree on the Vite output directory.

## GitHub Deployment Provenance

The GitHub Action deploys with explicit Wrangler metadata:

- `--branch=${{ github.ref_name }}`
- `--commit-hash=${{ github.sha }}`
- `--commit-dirty=false`

`npm run build` generates `/build-info.json` with the deployed SHA, branch, timestamp, and dirty state. Production `/api/health` also reports Cloudflare Pages runtime metadata when available.

Verify a production deploy:

1. Confirm local `origin/main`:
   `git fetch origin && git rev-parse origin/main`
2. Check production build info:
   `curl https://bike-browser.com/build-info.json`
3. Check Pages health:
   `curl https://bike-browser.com/api/health`
4. In Cloudflare Pages, confirm latest deployment commit hash matches `origin/main` and `commit_dirty` is false.

## Tunnel Safety

Never route the public production host `bike-browser.com` to a local `localhost:5173` Cloudflare Tunnel. The public host belongs to Cloudflare Pages.

Tunnel usage is allowed only for private/dev hostnames such as `private.bike-browser.com`. Before release checks, run:

`node scripts/check-production-routing.mjs`

That script confirms the public host reports Cloudflare Pages health and build provenance.


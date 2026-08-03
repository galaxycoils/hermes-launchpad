# CI/CD — activation required

These workflow files are ready to use but must live in `.github/workflows/` to
run. They were placed here because the token used to create this repo lacks
GitHub's `workflow` scope (GitHub refuses workflow-file pushes without it).

## Activate (pick one)

**Option A — local move (30 seconds):**
```bash
git clone https://github.com/galaxycoils/hermes-launchpad.git
cd hermes-launchpad
mkdir -p .github/workflows
mv ci-cd/ci.yml ci-cd/deploy.yml .github/workflows/
git add -A && git commit -m "ci: activate workflows" && git push
```

**Option B — zero-secrets native integration:**
Cloudflare dashboard → Pages → hermes-launchpad → Settings → "Connect to Git"
→ pick this repo → build command `npm run build`, output dir `dist`.
Every push to main then auto-builds and deploys, no secrets needed.

## Secrets for Option A deploys

Repo → Settings → Secrets and variables → Actions:
- `CF_API_TOKEN` — Cloudflare token with Pages:Edit + Workers Scripts:Edit
- `CF_ACCOUNT_ID` — `a55a43856c7029505b79300ec82f1629`

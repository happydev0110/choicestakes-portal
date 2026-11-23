# Malformed request handling

The portal rejects unknown catch-all page paths instead of generating new cache
entries. Proxy also checks the reserved `/_next/static/` namespace: oversized
decoded filename segments receive 414 before they reach the filesystem cache.
Normal asset requests continue to Next's static-file handler.

Page POSTs must carry a syntactically valid Next.js 16 Server Action ID and use
`text/plain`. This matches the current `setLanguage(string)` client action.
Missing/invalid action IDs receive 400 and unsupported body formats receive 415.
API routes retain their own authentication, JSON validation, and body limits.
If native Server Action forms or file uploads are added in future, revise this
contract and its integration tests. Proxy is not an authentication boundary;
Next's action resolution and origin validation still run for accepted requests.

## Verify locally

```sh
npm run test:requests
npm run build
npm run start -- --hostname 127.0.0.1 --port 3002
```

In a second terminal, on Linux/macOS:

```sh
PORTAL_TEST_ORIGIN=http://127.0.0.1:3002 npm run test:requests
```

In PowerShell:

```powershell
$env:PORTAL_TEST_ORIGIN='http://127.0.0.1:3002'
npm run test:requests
```

The HTTP tests use the real language action from the production build and verify
its locale cookie, normal pages/assets, protected-page redirects, unknown paths,
and malformed requests. They do not sign in or change database records.

## Deploy

Deploy the changed source first. On the existing single-directory PM2 setup,
stop the portal before replacing its installed packages/build so it cannot serve
a mixture of build files. This causes a brief portal outage. Do not delete `.next`
while the portal is running.

```sh
cd ~/dev/choicestakes-portal
pm2 stop portal
npm ci && npm run build && pm2 restart portal --update-env
```

If installation/build fails, keep the failed build offline and restore the
previous release. For continuous availability, build in a separate release
directory and switch PM2 to the completed release.

A browser tab left open across deployments can still send an old but correctly
formatted action ID. Reload the tab in that case. All running portal instances
must use the same build output. Do not cache page POSTs in Nginx/CDN rules. Review
Nginx access logs for repeated malformed traffic and apply targeted edge rate
limits there if needed; no infrastructure rules are modified by this fix.

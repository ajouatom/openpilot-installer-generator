# Short installer URLs with Cloudflare Workers

Deploy `worker.mjs` as a Worker named `carrot`. A Cloudflare-provided
`workers.dev` address is sufficient; purchasing a domain is unnecessary.
The account's actual Workers subdomain is selected in Cloudflare.

Paths:

- `/`, `/wip`, `/carrot-wip`: carrot-wip
- `/cinque_v2`, `/carrot-cinque_v2`: carrot-cinque_v2
- `/bmr_v6`, `/carrot-bmr_v6`: carrot-bmr_v6
- `/cinque-terre`, `/carrot-cinque-terre`: carrot-cinque-terre

The Worker returns the binary directly. It fetches an immutable GitHub
release asset and checks its size and SHA-256 before caching it. Incoming
device serials, cookies and other request headers are not forwarded to
GitHub. Only GET and HEAD are accepted. No account secrets are required.

Run `node --test cloudflare/worker.test.mjs` before deployment. In the
Cloudflare dashboard, create a Worker, replace the sample source with
`worker.mjs`, and deploy it. Alternatively, use the provided Wrangler
configuration from this directory with an already authorized account.

Verify the deployed URL from a device, check the SHA-256, and test actual
installer startup. For a template change, repeat a complete installer run
in a private mount namespace with an empty `/data`, without replacing the
vehicle's existing installation. Update the pinned release and hashes
together; never replace the source with an unverified moving upstream URL.

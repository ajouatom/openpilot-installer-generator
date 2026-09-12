# Short installer URLs on Cloudflare

The verified installer files are deployed as static assets at:

```text
https://carrot.ajouatom.workers.dev
```

No custom domain is required. The root URL installs `carrot-wip`.
Available paths are:

| Paths | Branch |
| --- | --- |
| `/`, `/wip`, `/carrot-wip` | carrot-wip |
| `/cinque_v2`, `/carrot-cinque_v2` | carrot-cinque_v2 |
| `/bmr_v6`, `/carrot-bmr_v6` | carrot-bmr_v6 |
| `/cinque-terre`, `/carrot-cinque-terre` | carrot-cinque-terre |

Cloudflare serves the ELF directly with `application/octet-stream`. The
short aliases use same-site 200 proxy rules, not external redirects.
The service needs neither the NAS nor a runtime request to GitHub to
deliver the installer. The installer itself downloads the selected branch
from GitHub as usual. No custom runtime code, secrets, bindings, or logs
are configured.

## Reproduce and deploy

```sh
python3 -m unittest discover -s agnos_compat -p 'test_*.py'
python3 cloudflare/build_assets.py
```

The builder verifies the pinned template and every generated binary,
then creates `cloudflare/dist/` and `cloudflare/carrot-installers.zip`.
The ZIP contains exactly four installer binaries, `SHA256SUMS`, `_headers`,
and `_redirects`; executable payloads are checked again after compression.

In Cloudflare, open the `carrot` application's **New deployment** page and
upload the ZIP. Alternatively, deploy the generated assets with the
provided Wrangler configuration from this directory using an already
authorized account. Do not upload the source repository itself.

After deployment, fetch the root and each branch alias from the device.
Confirm HTTP 200, ELF bytes, content length 1,401,224, and the hashes in
`SHA256SUMS`. For a template change, repeat an actual installer run in an
isolated empty `/data`; preserve the existing vehicle installation.

Deployment `273d6117` on 2026-09-12 was checked from comma four:
the root and all branch aliases returned the expected binaries. Those
same `carrot-wip` and `carrot-cinque_v2` bytes had completed actual installs
with exit status 0 on AGNOS `19.6.3-carrot` before deployment.

The independently operated `i.carrotpilot.app` service is unchanged.
See the [administrator report](../agnos_compat/UPSTREAM_REPORT.md).

`worker.mjs` and `worker.test.mjs` are retained as an optional GitHub proxy
implementation. They are not part of the deployed static-asset service.

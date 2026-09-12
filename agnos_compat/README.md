# AGNOS installer compatibility template

The current upstream installer can exit before cloning on AGNOS
`19.6.3-carrot`, with `Failed to bind Wayland globals` followed by
`Failed to initialize Wayland`. Initial setup then starts again because
the installer never created `/data/continue.sh`.

This directory pins the installer bundled in that AGNOS image. Only the
reserved repository and branch string slots are replaced; executable code,
fonts, and ELF offsets remain unchanged. Do not substitute an untested
upstream binary or remove the SHA-256 check.

## Published installation URL

Enter this URL in custom software setup for `carrot-wip`:

```text
https://github.com/ajouatom/openpilot-installer-generator/releases/download/agnos-19.6.3-compat-20260912/carrot-wip
```

The [release](https://github.com/ajouatom/openpilot-installer-generator/releases/tag/agnos-19.6.3-compat-20260912)
also includes `carrot-cinque_v2`, `carrot-bmr_v6`, and `carrot-cinque-terre`.
Replace the final branch name in the URL to select one of those assets.
The independently operated `i.carrotpilot.app` service is unchanged.

## Provenance

- Source: `/usr/comma/installer` from AGNOS `19.6.3-carrot`.
- ELF: aarch64, Build ID `0ca958c7729770f0599ae3487cbf3a0aea4c8e32`.
- Size: 1,401,224 bytes.
- SHA-256: `85f6d9e54286a3842920d6967b187478b4e43d6171c331d72d3fb3102106e101`.
- Verified on comma four with a private mount namespace exposing an empty
  `/data`. The running installation was preserved.
- Other hardware and AGNOS versions require their own verification; this
  template is not evidence of universal compatibility.

## Generate a branch installer

```sh
python3 agnos_compat/build_installer.py carrot-wip installer-carrot-wip
python3 -m unittest discover -s agnos_compat -p 'test_*.py'
```

Serve the resulting ELF as `application/octet-stream`, with its actual
`Content-Length`. Pin the template source to an immutable commit when
integrating it into a live installer service. Keep the previous service
version available for rollback and verify the publicly downloaded binary
on the target device after deployment.

Adding these assets does not by itself change an existing installer URL.

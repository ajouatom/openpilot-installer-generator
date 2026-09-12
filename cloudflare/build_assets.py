"""Build a checksummed, directly uploadable Cloudflare installer bundle."""
import argparse
import hashlib
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "agnos_compat"))
from build_installer import build

HASHES = {
  "carrot-wip": "c84e5baa897b2b3e29f20584553049ebc659002cd02f718a5253da576afe0f4f",
  "carrot-cinque_v2": "1d33a7ca29c2caf4a9b8942b5bb2f063f2d333960180c9d7a36d38c07c706b04",
  "carrot-bmr_v6": "3fd8171a928736dda91d9cfb0172873254c53e86f0ee615e271c48b27eb3c054",
  "carrot-cinque-terre": "37ded80e7e5b9cfca7d06a1aa497d4b990ca2ce75cf1f5cd1a2a079c95a573af",
}


def make_assets(output: Path):
  output.mkdir(parents=True, exist_ok=True)
  base = (ROOT / "agnos_compat/installer-agnos-19.6.3-carrot-base").read_bytes()
  assets = {}
  for branch, expected in HASHES.items():
    binary = build(base, branch)
    assert hashlib.sha256(binary).hexdigest() == expected
    assets[branch] = binary
  redirects = ["/ /carrot-wip 200"]
  redirects += [f"/{branch.removeprefix('carrot-')} /{branch} 200" for branch in HASHES]
  assets["_redirects"] = ("\n".join(redirects) + "\n").encode()
  assets["_headers"] = b'/*\n  Content-Type: application/octet-stream\n  Content-Disposition: attachment; filename="carrot-installer"\n  X-Content-Type-Options: nosniff\n  Cache-Control: public, max-age=3600\n'
  assets["SHA256SUMS"] = "".join(f"{digest}  {branch}\n" for branch, digest in HASHES.items()).encode()
  for name, data in assets.items():
    (output / name).write_bytes(data)
  bundle = output.parent / "carrot-installers.zip"
  with zipfile.ZipFile(bundle, "w", compression=zipfile.ZIP_DEFLATED) as z:
    for name, data in assets.items():
      z.writestr(name, data)
  with zipfile.ZipFile(bundle) as z:
    assert set(z.namelist()) == set(assets)
    for branch, expected in HASHES.items():
      assert hashlib.sha256(z.read(branch)).hexdigest() == expected
  print(bundle)


if __name__ == "__main__":
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("--output", type=Path, default=Path(__file__).with_name("dist"))
  make_assets(parser.parse_args().output)

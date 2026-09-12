"""Build Carrot installers from the verified AGNOS-compatible ELF template."""
import argparse
import hashlib
import re
from pathlib import Path

BASE_SHA256 = "85f6d9e54286a3842920d6967b187478b4e43d6171c331d72d3fb3102106e101"


def build(base: bytes, branch: str) -> bytes:
  if hashlib.sha256(base).hexdigest() != BASE_SHA256:
    raise ValueError("Unverified installer template")
  if not re.fullmatch(r"carrot-[A-Za-z0-9_./-]+", branch) or ".." in branch or "//" in branch:
    raise ValueError("Invalid Carrot branch")
  data = base
  for marker, value in (
    (b"https://github.com/commaai/openpilot.git?", b"https://github.com/ajouatom/openpilot.git"),
    (b"release3?", branch.encode("ascii")),
  ):
    if data.count(marker) != 1:
      raise ValueError("Installer placeholder is missing or ambiguous")
    start = data.index(marker)
    end = data.index(b"\0", start)
    if len(value) + 1 > end - start:
      raise ValueError("Installer placeholder is too short")
    data = data[:start] + (value + b"?").ljust(end - start, b" ") + data[end:]
  assert len(data) == len(base) and data.startswith(b"\x7fELF")
  return data


if __name__ == "__main__":
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("branch")
  parser.add_argument("output", type=Path)
  args = parser.parse_args()
  base = Path(__file__).with_name("installer-agnos-19.6.3-carrot-base").read_bytes()
  result = build(base, args.branch)
  args.output.write_bytes(result)
  print(hashlib.sha256(result).hexdigest(), args.output)

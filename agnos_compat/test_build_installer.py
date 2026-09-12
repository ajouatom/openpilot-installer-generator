import hashlib
import unittest
from pathlib import Path

from build_installer import build


class InstallerTests(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    cls.base = Path(__file__).with_name("installer-agnos-19.6.3-carrot-base").read_bytes()

  def test_matches_device_tested_artifacts(self):
    expected = {
      "carrot-wip": "c84e5baa897b2b3e29f20584553049ebc659002cd02f718a5253da576afe0f4f",
      "carrot-cinque_v2": "1d33a7ca29c2caf4a9b8942b5bb2f063f2d333960180c9d7a36d38c07c706b04",
    }
    for branch, digest in expected.items():
      with self.subTest(branch=branch):
        result = build(self.base, branch)
        self.assertEqual(hashlib.sha256(result).hexdigest(), digest)
        self.assertEqual(len(result), len(self.base))

  def test_rejects_changed_template(self):
    with self.assertRaises(ValueError):
      build(self.base[:-1] + bytes([self.base[-1] ^ 1]), "carrot-wip")

  def test_rejects_shell_metacharacters_and_oversized_branch(self):
    for branch in ("carrot-wip;reboot", "carrot-$(reboot)", "carrot-'test'", "carrot-../x", "carrot-x\nreboot", "carrot-" + "x" * 100):
      with self.subTest(branch=branch), self.assertRaises(ValueError):
        build(self.base, branch)

  def test_only_reserved_slots_change(self):
    result = bytearray(build(self.base, "carrot-wip"))
    for marker in (b"https://github.com/commaai/openpilot.git?", b"release3?"):
      start = self.base.index(marker)
      end = self.base.index(b"\0", start)
      result[start:end] = self.base[start:end]
    self.assertEqual(bytes(result), self.base)


if __name__ == "__main__":
  unittest.main()

"""
Compress hero.mp4 into web-optimized desktop and mobile versions.
Uses moviepy (which bundles ffmpeg via imageio-ffmpeg).

Original: 1080x1920 vertical, ~41 MB
Targets:
  hero.mp4         (desktop)  1080x1920 @ ~3.5 Mbps  ~12 MB
  hero-mobile.mp4  (mobile)    720x1280 @ ~1.5 Mbps  ~5 MB
"""
from pathlib import Path
import subprocess
import imageio_ffmpeg

ASSETS = Path(__file__).parent
SRC = ASSETS / "hero.mp4"
DESK = ASSETS / "hero.mp4"          # overwrite (after backup)
MOBILE = ASSETS / "hero-mobile.mp4"
BACKUP = ASSETS / "hero-original.mp4"

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
print("Using ffmpeg:", ffmpeg)

# Backup the original first
if not BACKUP.exists():
    print(f"Backing up original to {BACKUP.name}")
    BACKUP.write_bytes(SRC.read_bytes())

# Helper to run ffmpeg
def run(args, label):
    print(f"\n=== {label} ===")
    cmd = [ffmpeg, "-y", "-i", str(BACKUP), *args]
    print(" ".join(cmd))
    subprocess.run(cmd, check=True)

# Desktop: 1080p vertical, H.264, slow preset, CRF 24, AAC audio at 96kbps
run([
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "24",
    "-vf", "scale=1080:1920",
    "-c:a", "aac",
    "-b:a", "96k",
    "-ac", "2",
    "-movflags", "+faststart",
    str(DESK)
], "Desktop 1080x1920")

# Mobile: 720p vertical, more aggressive compression, audio at 80kbps
run([
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "27",
    "-vf", "scale=720:1280",
    "-c:a", "aac",
    "-b:a", "80k",
    "-ac", "2",
    "-movflags", "+faststart",
    str(MOBILE)
], "Mobile 720x1280")

# Final size report
for f in [DESK, MOBILE, BACKUP]:
    size_mb = f.stat().st_size / (1024 * 1024)
    print(f"  {f.name:30s} {size_mb:7.2f} MB")

# Also create a version WITH audio (if user clicks sound toggle)
# kept original as backup; we can add audio version later if needed
print("\nDone. Original backed up at hero-original.mp4")

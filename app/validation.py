"""Upload validation. The real threat is the media decoder, so we never trust
the file extension: sniff the content type, then structurally verify with
ffprobe and enforce hard caps before the file is ever queued."""
import json
import subprocess
from pathlib import Path

import magic

from .config import get_settings

settings = get_settings()


class ValidationError(Exception):
    pass


def sniff_mime(path: Path) -> str:
    return magic.from_file(str(path), mime=True)


def ffprobe(path: Path) -> dict:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_format", "-show_streams",
        "-of", "json", str(path),
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, timeout=30, check=True)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        raise ValidationError("file is not a decodable media container") from e
    return json.loads(out.stdout or b"{}")


def validate_video(path: Path) -> dict:
    """Return extracted metadata, or raise ValidationError."""
    mime = sniff_mime(path)
    if mime not in settings.allowed_mime:
        raise ValidationError(f"unsupported content type: {mime}")

    info = ffprobe(path)
    video_streams = [
        s for s in info.get("streams", []) if s.get("codec_type") == "video"
    ]
    if not video_streams:
        raise ValidationError("no video stream found")

    v = video_streams[0]
    codec = v.get("codec_name")
    if codec not in settings.allowed_video_codecs:
        raise ValidationError(f"unsupported video codec: {codec}")

    width = int(v.get("width") or 0)
    height = int(v.get("height") or 0)
    if width * height > settings.max_pixels:
        raise ValidationError("resolution exceeds the configured limit")

    duration = float(info.get("format", {}).get("duration") or 0.0)
    if duration > settings.max_duration_sec:
        raise ValidationError("duration exceeds the configured limit")

    return {
        "mime_type": mime,
        "codec": codec,
        "width": width,
        "height": height,
        "duration_sec": round(duration, 2),
    }

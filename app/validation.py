"""Upload validation. The real threat is the media decoder, so we never trust
the file extension: sniff the content type, then structurally verify with
ffprobe and enforce hard caps before the file is ever queued."""
import json
import subprocess
from pathlib import Path

import magic

from .config import get_settings

settings = get_settings()

_MIME_LABELS = {
    "video/mp4": "MP4",
    "video/x-matroska": "MKV",
    "video/quicktime": "MOV",
}

_MAX_RES_LABEL = f"{settings.max_pixels // 1920}p" if settings.max_pixels else "1080p"


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
    except subprocess.TimeoutExpired as e:
        raise ValidationError("video analysis timed out — the file may be corrupted") from e
    except subprocess.CalledProcessError as e:
        raise ValidationError("file is not a valid video — we couldn't decode it") from e
    return json.loads(out.stdout or b"{}")


def validate_video(path: Path) -> dict:
    """Return extracted metadata, or raise ValidationError."""
    mime = sniff_mime(path)
    if mime not in settings.allowed_mime:
        allowed = ", ".join(_MIME_LABELS.get(m, m) for m in settings.allowed_mime)
        raise ValidationError(f"unsupported format ({mime}). Accepted: {allowed}")

    info = ffprobe(path)
    video_streams = [
        s for s in info.get("streams", []) if s.get("codec_type") == "video"
    ]
    if not video_streams:
        raise ValidationError("no video stream found in this file")

    v = video_streams[0]
    codec = v.get("codec_name")
    if codec not in settings.allowed_video_codecs:
        allowed = ", ".join(settings.allowed_video_codecs)
        raise ValidationError(f"unsupported codec: {codec}. Accepted: {allowed}")

    try:
        width = int(v.get("width") or 0)
        height = int(v.get("height") or 0)
    except (ValueError, TypeError):
        raise ValidationError("could not determine video resolution")
    if width * height > settings.max_pixels:
        raise ValidationError(
            f"resolution too high ({width}×{height}). Max is {_MAX_RES_LABEL}"
        )

    duration = float(info.get("format", {}).get("duration") or 0.0)
    if duration > settings.max_duration_sec:
        mins = settings.max_duration_sec // 60
        raise ValidationError(
            f"video is too long ({duration:.0f}s). Max duration is {mins} minutes"
        )

    return {
        "mime_type": mime,
        "codec": codec,
        "width": width,
        "height": height,
        "duration_sec": round(duration, 2),
    }


def video_dimensions(path: Path) -> dict[str, int] | None:
    """Return width/height of the primary video stream, or None if unreadable."""
    try:
        info = ffprobe(path)
    except ValidationError:
        return None
    for s in info.get("streams", []):
        if s.get("codec_type") == "video":
            w, h = int(s.get("width") or 0), int(s.get("height") or 0)
            if w > 0 and h > 0:
                return {"width": w, "height": h}
    return None

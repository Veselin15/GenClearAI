#!/bin/sh
set -e

# Ensure the data volume is writable by the unprivileged runtime user.
# Named Docker volumes are root-owned on first mount.
if [ -d /data ]; then
  chown -R appuser:appuser /data 2>/dev/null || true
fi

export HOME=/tmp
exec "$@"

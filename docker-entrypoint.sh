#!/bin/sh
set -e

# Make the data volume writable by the unprivileged runtime user, then drop
# root. Named Docker volumes are root-owned on first mount, so this runs as
# root and hands off to "appuser" via gosu.
if [ -d /data ]; then
  chown -R appuser:appuser /data 2>/dev/null || true
fi

# gosu keeps the parent's env, so point HOME at a writable dir (the worker runs
# read-only with a tmpfs /tmp; the api's rootfs is writable).
export HOME=/tmp

exec gosu appuser "$@"

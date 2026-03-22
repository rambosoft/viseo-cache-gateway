#!/bin/sh
set -eu

role="${APP_ROLE:-server}"

case "$role" in
  server)
    exec node dist/src/bootstrap/server.js
    ;;
  worker)
    exec node dist/src/bootstrap/worker.js
    ;;
  fixtures)
    exec node scripts/manual-test-fixtures/run-fixtures.mjs
    ;;
  *)
    echo "Unknown APP_ROLE: $role" >&2
    exit 1
    ;;
esac

#!/bin/sh
set -e

echo "==> Waiting for database to accept connections..."
python - << 'EOF'
import os
import sys
import time
import socket

host = os.environ.get('DB_HOST', '')
port_val = os.environ.get('DB_PORT', '')

if not port_val:
    engine = os.environ.get('DB_ENGINE', '')
    port = 5432 if ('postgres' in engine or 'psql' in engine) else 3306
else:
    try:
        port = int(port_val)
    except ValueError:
        port = 5432

if host and host not in ('', 'localhost', '127.0.0.1'):
    print(f"Polling database on {host}:{port}...")
    start_time = time.time()
    while True:
        try:
            with socket.create_connection((host, port), timeout=2):
                print(f"Database on {host}:{port} is reachable!")
                break
        except (socket.error, socket.timeout):
            if time.time() - start_time > 30:
                print("Database wait timeout (30s). Proceeding with startup...")
                break
            time.sleep(1)
EOF

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Collecting static assets..."
python manage.py collectstatic --noinput || true

PORT_TO_BIND="${PORT:-8000}"
echo "==> Starting Daphne ASGI server on port ${PORT_TO_BIND}..."
exec daphne -b 0.0.0.0 -p "${PORT_TO_BIND}" config.asgi:application

# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for MySQL / PostgreSQL client libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    pkg-config \
    default-libmysqlclient-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . /app/

# Create directories for staticfiles and media
RUN mkdir -p /app/staticfiles /app/media

RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

# Run entrypoint script (runs migrations, collects static, starts Daphne)
CMD ["/app/entrypoint.sh"]

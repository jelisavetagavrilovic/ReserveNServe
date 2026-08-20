#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

CERT_DIR="${HOME}/.aspnet/https"
CERT_PATH="${CERT_DIR}/reservenserve.pfx"


if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env file not found: $ENV_FILE"
    exit 1
fi


CERT_PASSWORD="$(
    sed -n 's/^ASPNETCORE_HTTPS_CERTIFICATE_PASSWORD=//p' "$ENV_FILE" |
    tail -n 1
)"

if [ -z "$CERT_PASSWORD" ]; then
    echo "ERROR: ASPNETCORE_HTTPS_CERTIFICATE_PASSWORD is not defined in .env"
    exit 1
fi


mkdir -p "$CERT_DIR"


if [ -f "$CERT_PATH" ]; then
    echo "HTTPS certificate already exists:"
    echo "$CERT_PATH"
    exit 0
fi


echo "Exporting ASP.NET development HTTPS certificate..."

dotnet dev-certs https \
    -ep "$CERT_PATH" \
    -p "$CERT_PASSWORD"


echo "HTTPS certificate exported successfully:"
echo "$CERT_PATH"

echo
echo "If needed, trust the development certificate with:"
echo "dotnet dev-certs https --trust"
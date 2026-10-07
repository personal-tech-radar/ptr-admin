#!/bin/sh
set -eu

api_base_url=${PTR_ADMIN_API_BASE_URL:-}
if [ -z "$api_base_url" ]; then
  echo "PTR_ADMIN_API_BASE_URL must be set for the admin container." >&2
  exit 1
fi

if ! printf '%s' "$api_base_url" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]+)?(/[A-Za-z0-9._~%-]+)*/?$'; then
  echo "PTR_ADMIN_API_BASE_URL must be an HTTP(S) URL without query parameters or credentials." >&2
  exit 1
fi

while [ "${api_base_url%/}" != "$api_base_url" ]; do
  api_base_url=${api_base_url%/}
done

printf 'globalThis.__PTR_ADMIN_CONFIG__ = { apiBaseUrl: "%s" };\n' "$api_base_url" \
  > /usr/share/nginx/html/runtime-config.js

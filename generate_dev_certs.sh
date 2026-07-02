#!/usr/bin/env bash
# Copyright 2026 Muhammad Waleed
# Licensed under the Apache License, Version 2.0
# Author: Muhammad Waleed
#
# generate_dev_certs.sh
# ─────────────────────
# Generates a self-signed mTLS certificate bundle for local development.
# DO NOT USE IN PRODUCTION — use a real PKI (e.g. Vault, CFSSL, cert-manager).
#
# Outputs (placed in ./certs/):
#   ca.crt / ca.key             — Root CA (used to sign all leaf certs)
#   orchestrator.crt / .key     — Orchestrator server certificate
#   agent.crt / agent.key       — Agent client certificate
#   server.crt / server.key     — Nginx TLS certificate (SAN: localhost)
#
# Requirements: openssl ≥ 1.1.1

set -euo pipefail

CERTS_DIR="$(dirname "$0")/certs"
DAYS=3650           # 10 years for dev certs
KEY_BITS=4096
COUNTRY="DE"
ORG="TAAFI AI Dev"
CA_CN="TAAFI Dev Root CA"
ORCH_CN="taafi-orchestrator"
AGENT_CN="taafi-agent"
SERVER_CN="localhost"

echo "🔐 Generating TAAFI AI mTLS development certificates in: $CERTS_DIR"
mkdir -p "$CERTS_DIR"

# ── 1. Root CA ────────────────────────────────────────────────────────────────
echo "[1/4] Generating Root CA..."
openssl genrsa -out "$CERTS_DIR/ca.key" $KEY_BITS 2>/dev/null
openssl req -new -x509 -days $DAYS -key "$CERTS_DIR/ca.key" \
    -out "$CERTS_DIR/ca.crt" \
    -subj "/C=$COUNTRY/O=$ORG/CN=$CA_CN" \
    -extensions v3_ca \
    -addext "basicConstraints=critical,CA:TRUE" \
    -addext "keyUsage=critical,keyCertSign,cRLSign"

# ── 2. Orchestrator certificate (server + client auth) ────────────────────────
echo "[2/4] Generating Orchestrator certificate..."
openssl genrsa -out "$CERTS_DIR/orchestrator.key" $KEY_BITS 2>/dev/null
openssl req -new -key "$CERTS_DIR/orchestrator.key" \
    -out "$CERTS_DIR/orchestrator.csr" \
    -subj "/C=$COUNTRY/O=$ORG/CN=$ORCH_CN"
openssl x509 -req -days $DAYS \
    -in "$CERTS_DIR/orchestrator.csr" \
    -CA "$CERTS_DIR/ca.crt" -CAkey "$CERTS_DIR/ca.key" -CAcreateserial \
    -out "$CERTS_DIR/orchestrator.crt" \
    -extfile <(printf "subjectAltName=DNS:%s,DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth,clientAuth" "$ORCH_CN")
rm "$CERTS_DIR/orchestrator.csr"

# ── 3. Agent certificate (client auth) ───────────────────────────────────────
echo "[3/4] Generating Agent certificate..."
openssl genrsa -out "$CERTS_DIR/agent.key" $KEY_BITS 2>/dev/null
openssl req -new -key "$CERTS_DIR/agent.key" \
    -out "$CERTS_DIR/agent.csr" \
    -subj "/C=$COUNTRY/O=$ORG/CN=$AGENT_CN"
openssl x509 -req -days $DAYS \
    -in "$CERTS_DIR/agent.csr" \
    -CA "$CERTS_DIR/ca.crt" -CAkey "$CERTS_DIR/ca.key" -CAcreateserial \
    -out "$CERTS_DIR/agent.crt" \
    -extfile <(printf "subjectAltName=DNS:%s,DNS:localhost\nextendedKeyUsage=clientAuth" "$AGENT_CN")
rm "$CERTS_DIR/agent.csr"

# ── 4. Nginx/server certificate (TLS) ─────────────────────────────────────────
echo "[4/4] Generating Nginx server certificate..."
openssl genrsa -out "$CERTS_DIR/server.key" $KEY_BITS 2>/dev/null
openssl req -new -key "$CERTS_DIR/server.key" \
    -out "$CERTS_DIR/server.csr" \
    -subj "/C=$COUNTRY/O=$ORG/CN=$SERVER_CN"
openssl x509 -req -days $DAYS \
    -in "$CERTS_DIR/server.csr" \
    -CA "$CERTS_DIR/ca.crt" -CAkey "$CERTS_DIR/ca.key" -CAcreateserial \
    -out "$CERTS_DIR/server.crt" \
    -extfile <(printf "subjectAltName=DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth")
rm "$CERTS_DIR/server.csr"

# ── Set restrictive permissions ───────────────────────────────────────────────
chmod 600 "$CERTS_DIR"/*.key
chmod 644 "$CERTS_DIR"/*.crt

echo ""
echo "✅ Certificates generated in: $CERTS_DIR"
echo ""
echo "Files:"
ls -lh "$CERTS_DIR"
echo ""
echo "⚠️  WARNING: These are self-signed development certificates."
echo "   For production, replace with certificates from a trusted PKI."
echo ""
echo "Next steps:"
echo "  1. Create a named Docker volume: docker volume create taafi_certs"
echo "  2. Copy certs into the volume or mount the ./certs/ directory"
echo "  3. Set CERT_PATH, KEY_PATH, CA_PATH env vars in docker-compose.yml"

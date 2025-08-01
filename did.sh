#!/usr/bin/env bash
set -euo pipefail

CANISTER=backend
ROOT=src/$CANISTER
WASM=target/wasm32-unknown-unknown/release/$CANISTER.wasm
DID_OUT=$ROOT/$CANISTER.did

echo "🔧 Building $CANISTER"
cargo build --release --target wasm32-unknown-unknown --package "$CANISTER"

echo "📄 Generating .did"
candid-extractor "$WASM" > "$DID_OUT"
echo "✔️ $DID_OUT generated"

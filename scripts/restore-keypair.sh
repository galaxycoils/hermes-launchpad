#!/usr/bin/env bash
# restore-keypair.sh — restore program deploy keypair from encrypted backup
# Usage: ./scripts/restore-keypair.sh /path/to/encrypted-backup.json
# The keypair is restored to programs/hermes-curve/target/deploy/hermes_curve-keypair.json
# Required for any future `anchor deploy --provider.cluster devnet` upgrade.

set -euo pipefail

BACKUP_SRC="${1:-}"
TARGET="programs/hermes-curve/target/deploy/hermes_curve-keypair.json"

if [[ -z "$BACKUP_SRC" ]]; then
  echo "Usage: $0 <encrypted-backup-path>"
  echo "Example: $0 ~/1password/hermes_curve-keypair.json"
  exit 1
fi

if [[ ! -f "$BACKUP_SRC" ]]; then
  echo "Backup not found: $BACKUP_SRC"
  exit 1
fi

mkdir -p "$(dirname "$TARGET")"
cp "$BACKUP_SRC" "$TARGET"
chmod 600 "$TARGET"
echo "Keypair restored to $TARGET"

# Verify it matches the deployed program ID
PROGRAM_ID="9K5eAWBkrUJbUiUC8aM6xeuXM2ACj9XNHfbC1X6Scjgz"
PUBKEY=$(solana-keygen pubkey "$TARGET" 2>/dev/null || true)
if [[ "$PUBKEY" == "$PROGRAM_ID" ]]; then
  echo "Verified: public key matches deployed program ($PROGRAM_ID)"
else
  echo "WARNING: restored keypair pubkey ($PUBKEY) does NOT match deployed program ($PROGRAM_ID)"
  echo "Ensure you restored the correct keypair."
  exit 1
fi
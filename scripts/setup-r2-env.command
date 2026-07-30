#!/bin/bash
# Double-click helper for Zohaib: writes the project .env with R2 credentials.
# Values are typed/pasted directly into this Terminal window and go straight
# into .env (gitignored) — they never pass through chat or the agent.
cd "$(dirname "$0")/.."

echo "DeenDawn — R2 credentials setup"
echo "Keep the Cloudflare page with your new API token open."
echo
echo "1) Copy the field called 'Access Key ID' on the Cloudflare page,"
printf "   paste it here and press Return: "
read -r ACCESS_KEY
echo
echo "2) Copy the field called 'Secret Access Key' (click the eye/copy icon),"
printf "   paste it here and press Return: "
read -r SECRET_KEY
echo
echo "3) Copy the S3 endpoint shown on the same page — it looks like"
echo "   https://LONGCODE.r2.cloudflarestorage.com"
printf "   paste the WHOLE thing here and press Return: "
read -r ENDPOINT

ACCOUNT_ID=$(echo "$ENDPOINT" | sed -E 's|^https?://([a-z0-9]+)\.r2\.cloudflarestorage\.com.*|\1|')

if [ -z "$ACCESS_KEY" ] || [ -z "$SECRET_KEY" ] || [ -z "$ACCOUNT_ID" ] || [ "$ACCOUNT_ID" = "$ENDPOINT" ]; then
  echo
  echo "Something looks off (a value was empty or the endpoint didn't match)."
  echo "Nothing was saved. Close this window and double-click the file again."
  exit 1
fi

cat > .env << EOF
R2_ACCOUNT_ID=$ACCOUNT_ID
R2_ACCESS_KEY_ID=$ACCESS_KEY
R2_SECRET_ACCESS_KEY=$SECRET_KEY
R2_BUCKET=deendawn-upload
EOF

echo
echo "Done — .env saved. You can close this window and tell Claude '.env is in'."

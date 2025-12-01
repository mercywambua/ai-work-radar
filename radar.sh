#!/bin/bash

URL="https://ai-work-radar.onrender.com"
RETRY_DELAY=5   # seconds
MAX_RETRIES=10

retry_count=0

echo "👀 Dev Bot waking up..."

while true; do
    echo "🔎 Checking: $URL"

    # Check DNS first
    host ai-work-radar.onrender.com > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "⚠️ DNS ERROR (EAI_AGAIN) – Host cannot be resolved."
        echo "   Retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
        continue
    fi

    # Try curl
    RESPONSE=$(curl -sf "$URL")
    if [ $? -ne 0 ]; then
        echo "⚠️ Connection failed. Trying again..."
        retry_count=$((retry_count+1))
        if [ $retry_count -ge $MAX_RETRIES ]; then
            echo "❌ Failed after $MAX_RETRIES attempts. Check your network or DNS."
            retry_count=0
        fi
        sleep $RETRY_DELAY
        continue
    fi

    # Success
    echo "✅ Response received:"
    echo "$RESPONSE"
    retry_count=0

    sleep 3
done

#!/bin/bash

# URL of the Walrus installation script
WALRUS_URL="https://raw.githubusercontent.com/MystenLabs/walrus/main/setup/walrus-install.sh"

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo "Error: curl is required but not installed"
    exit 1
fi

# Fetch the content
echo "Fetching Walrus installation script..."
CONTENT=$(curl -s "$WALRUS_URL")

# Check if content was fetched successfully
if [ -z "$CONTENT" ]; then
    echo "Error: Failed to fetch content from $WALRUS_URL"
    exit 1
fi

# Execute the content
echo "Executing Walrus installation script..."
eval "$CONTENT"

# Check execution status
if [ $? -eq 0 ]; then
    echo "Walrus installation completed successfully"
else
    echo "Error: Walrus installation failed"
    exit 1
fi
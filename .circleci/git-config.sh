#!/bin/bash
set -e
set -o pipefail

git config user.name "$USER_NAME"
git config user.email "$USER_EMAIL"

# Remove strict host checking for github.com
mkdir -p ~/.ssh/
echo -e "Host github.com\n\tStrictHostKeyChecking no\n\tUserKnownHostsFile /dev/null\n" >> ~/.ssh/config
chmod 600 ~/.ssh/config

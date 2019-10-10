#!/bin/bash
set -e
set -o pipefail

./.circleci/git-config.sh

PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d ' ')

PUBLISHED_VERSION=$(npm show @girder/components version \
  | tr -d ' ')

# Remove strict host checking for github.com
mkdir -p ~/.ssh/
echo -e "Host github.com\n\tStrictHostKeyChecking no\n\tUserKnownHostsFile /dev/null\n" >> ~/.ssh/config
chmod 600 ~/.ssh/config

if [ "$PACKAGE_VERSION" != "$PUBLISHED_VERSION" ]; then
  yarn publish --non-interactive
  TAG_NAME="v${PACKAGE_VERSION}"
  git tag "$TAG_NAME"
  git push origin "refs/tags/$TAG_NAME"
else
  echo "package version $PACKAGE_VERSION matches npmjs version $PUBLISHED_VERSION. Nothing to do."
fi

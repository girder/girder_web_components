#!/bin/bash
set -e
set -o pipefail
export PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d ' ')

export PUBLISHED_VERSION=$(npm show @girder/components version \
  | tr -d ' ')

if [ "$PACKAGE_VERSION" != "$PUBLISHED_VERSION" ]; then
  yarn publish --non-interactive
  TAG_NAME="v${PACKAGE_VERSION}"
  git tag "$TAG_NAME"
  git push origin "refs/tags/$TAG_NAME"
else
  echo "package version $PACKAGE_VERSION matches npmjs version $PUBLISHED_VERSION. Nothing to do."
fi

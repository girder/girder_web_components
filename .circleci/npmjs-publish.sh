#!/bin/bash

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
else
  echo "package version $PACKAGE_VERSION matches npmjs version $PUBLISHED_VERSION. Nothing to do."
fi

#!/bin/bash
set -e
set -o pipefail

./.circleci/git-config.sh

git checkout gh-pages
git pull origin gh-pages

find . -maxdepth 1 ! -name '_site' ! -name '.git' ! -name '.gitignore' -exec rm -rf {} \;
mv _site/* .
rm -R _site/

git add -fA
git commit --allow-empty -m "$(git log master -1 --pretty=%B)"
git push origin gh-pages || exit 1

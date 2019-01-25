git config user.name "$USER_NAME"
git config user.email "$USER_EMAIL"

# Remove strict host checking for github.com
mkdir -p ~/.ssh/
echo -e "Host github.com\n\tStrictHostKeyChecking no\n\tUserKnownHostsFile /dev/null\n" >> ~/.ssh/config
chmod 600 ~/.ssh/config

git checkout gh-pages
git pull origin gh-pages

find . -maxdepth 1 ! -name '_site' ! -name '.git' ! -name '.gitignore' -exec rm -rf {} \;
mv _site/* .
rm -R _site/

git add -fA
git commit --allow-empty -m "$(git log master -1 --pretty=%B)"
git push origin gh-pages || exit 1

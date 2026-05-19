#!/usr/bin/env bash
set -euo pipefail

REMOTE_URL="${GITHUB_REMOTE_URL:-https://github.com/D1abloo/dentista.git}"
BRANCH="${GIT_BRANCH:-main}"
MESSAGE="${1:-chore: update dentalflow}"

if [ -f .env ]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Git no está instalado en este entorno."
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git init -b "$BRANCH" >/dev/null 2>&1; then
    true
  else
    git init >/dev/null
    git checkout -B "$BRANCH" >/dev/null
  fi
fi

current_branch="$(git branch --show-current || true)"
if [ -z "$current_branch" ]; then
  git checkout -B "$BRANCH" >/dev/null
elif [ "$current_branch" != "$BRANCH" ]; then
  git checkout -B "$BRANCH" >/dev/null
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

git add -A

if git diff --cached --quiet; then
  echo "No hay cambios para commitear."
  exit 0
fi

export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-Isaac Coria}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-isaaccoria46@gmail.com}"
export GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-$GIT_AUTHOR_NAME}"
export GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-$GIT_AUTHOR_EMAIL}"

git commit -m "$MESSAGE"
git push -u origin "$BRANCH"

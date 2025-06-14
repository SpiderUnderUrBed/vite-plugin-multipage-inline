#!/usr/bin/env bash

# Usage: ./cleanup-tags.sh <version>
# Example: ./cleanup-tags.sh 1.0.9

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.0.9"
  exit 1
fi

VERSION_THRESHOLD=$1

# Function to convert version like 1.0.14 -> a comparable number for sorting
ver_to_num() {
  # pad each part to 3 digits to compare as integer
  IFS='.' read -r major minor patch <<< "$1"
  printf "%03d%03d%03d\n" "$major" "$minor" "$patch"
}

threshold_num=$(ver_to_num "$VERSION_THRESHOLD")

# Get tags starting with v and matching semver-like pattern, e.g. v1.0.9
tags=$(git tag -l 'v*' | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' || true)

echo "Current version threshold: $VERSION_THRESHOLD"

for tag in $tags; do
  tag_version="${tag#v}"
  tag_num=$(ver_to_num "$tag_version")

#  if [[ "$tag_num" -gt "$threshold_num" ]]; then
  if [[ "$tag_num" > "$threshold_num" ]]; then

    echo "Deleting tag $tag (version $tag_version) as it's higher than $VERSION_THRESHOLD"
    git tag -d "$tag" || true
    git push --delete origin "$tag" || echo "Remote tag $tag does not exist or could not be deleted"
  fi
done

echo "Tag cleanup done."

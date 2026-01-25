#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script: build WAR and deploy to App Engine (flex custom runtime)
# Usage: ./deploy.sh --project=PROJECT_ID [--version=V] [--skip-tests] [--deploy] [--no-promote]

MODULE_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_YAML_SRC="$MODULE_DIR/src/main/appengine/app.yaml"
DOCKERFILE_SRC=""
if [[ -f "$MODULE_DIR/src/main/appengine/Dockerfile" ]]; then
  DOCKERFILE_SRC="$MODULE_DIR/src/main/appengine/Dockerfile"
elif [[ -f "$MODULE_DIR/Dockerfile" ]]; then
  DOCKERFILE_SRC="$MODULE_DIR/Dockerfile"
fi
WAR_TARGET="$MODULE_DIR/target/sw-engineering-candies-webgl-examples.war"

PROJECT=""
VERSION=""
SKIP_TESTS=false
DO_DEPLOY=false
PROMOTE=true

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]
  --project=PROJECT_ID   (optional; defaults to gcloud configured project)
  --version=V            version name (defaults to timestamp)
  --skip-tests           pass -DskipTests=true to Maven
  --deploy               actually deploy (if omitted the script only builds)
  --no-promote           don't promote the new version
  --help                 show this help
EOF
}

# parse args
for arg in "$@"; do
  case $arg in
    --project=*) PROJECT="${arg#*=}" ;;
    --version=*) VERSION="${arg#*=}" ;;
    --skip-tests) SKIP_TESTS=true ;;
    --deploy) DO_DEPLOY=true ;;
    --no-promote) PROMOTE=false ;;
    --help) usage; exit 0 ;;
    *) echo "Unknown option: $arg"; usage; exit 2 ;;
  esac
done

# resolve defaults
if [[ -z "$PROJECT" ]]; then
  if command -v gcloud >/dev/null 2>&1; then
    PROJECT=$(gcloud config get-value project 2>/dev/null || true)
  fi
fi

if [[ -z "$PROJECT" ]]; then
  echo "ERROR: no project specified and gcloud has no project set" >&2
  exit 2
fi

if [[ -z "$VERSION" ]]; then
  VERSION="v$(date +%Y%m%d%H%M%S)"
fi

# build
MVN_SKIP_ARG="-DskipTests=${SKIP_TESTS}"
echo "Building module (skipTests=$SKIP_TESTS)..."
( cd "$MODULE_DIR" && mvn $MVN_SKIP_ARG clean package )

if [[ ! -f "$WAR_TARGET" ]]; then
  echo "ERROR: WAR not found at $WAR_TARGET" >&2
  exit 3
fi

echo "WAR built: $WAR_TARGET"

# Copy the built WAR into src/main/appengine so Dockerfile or app engine build context can find it
APPENGINE_DIR="$MODULE_DIR/src/main/appengine"
if [[ -d "$APPENGINE_DIR" ]]; then
  echo "Copying WAR to $APPENGINE_DIR/"
fi

if [[ "$DO_DEPLOY" != true ]]; then
  echo "Build complete, skipping deploy (use --deploy to deploy). WAR: $WAR_TARGET"
  exit 0
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not available" >&2
  exit 4
fi

# prepare minimal build context so Cloud Build can COPY target/<war>
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
cp "$APP_YAML_SRC" "$TMPDIR/app.yaml"
if [[ -n "$DOCKERFILE_SRC" ]]; then
  cp "$DOCKERFILE_SRC" "$TMPDIR/Dockerfile"
fi
mkdir -p "$TMPDIR/target"
cp "$WAR_TARGET" "$TMPDIR/target/"

pushd "$TMPDIR" >/dev/null
DEPLOY_CMD=(gcloud app deploy app.yaml --project="$PROJECT" --version="$VERSION")
if [[ "$PROMOTE" != true ]]; then
  DEPLOY_CMD+=(--no-promote)
fi

echo "Running: ${DEPLOY_CMD[*]}"
"${DEPLOY_CMD[@]}"
RET=$?
popd >/dev/null

if [[ $RET -ne 0 ]]; then
  echo "gcloud deploy failed with exit $RET" >&2
  exit $RET
fi

echo "Deploy succeeded: version=$VERSION project=$PROJECT"

# end

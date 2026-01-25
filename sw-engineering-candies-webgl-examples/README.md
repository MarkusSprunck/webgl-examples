# Deployment Quick Start

Below are the common commands used by the project deploy script and how to use them.

## Install the Google Cloud CLI (one-time on a machine)
This installs the gcloud command-line tool used for authentication and deploying to App Engine.
```shell
brew install gcloud-cli 
```

## Authenticate with Google Cloud
Opens a browser to log in and authorize the local gcloud CLI for your account.
```shell
gcloud auth login
```

## Verify the target project exists
This shows metadata about the `webgl-examples` project to confirm you have access.
```shell
gcloud projects describe webgl-examples
```

## Set the active gcloud project
Sets the default project so `gcloud` commands target `webgl-examples` without passing --project each time.
```shell
gcloud config set project webgl-examples
```

## Build and deploy the web app
This runs the project's `deploy.sh` script which builds the WAR, prepares a minimal build context, and calls `gcloud app deploy` to create a new App Engine (flex/custom) version. Use `--skip-tests` to build without running tests.
```shell
./deploy.sh --deploy
```

## Smoke test the deployed app
Check the smoke endpoint to confirm the running service responds with a simple OK.
```shell
curl https://webgl-examples.appspot.com/smoke
```

## Tail application logs
Stream logs from the `default` service to debug startup, health checks, and requests.
```shell
gcloud app logs tail -s default --project=webgl-examples
```

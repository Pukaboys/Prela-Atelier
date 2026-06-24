# Codemagic iOS Simulator Setup

This repository includes a root `codemagic.yaml` workflow for building the Expo mobile app from `mobile` and generating an unsigned iOS simulator package for browser-based testing tools such as Appetize.

## What the workflow does

- installs mobile dependencies with `npm ci`
- runs `npx expo prebuild --platform ios`
- installs CocoaPods
- builds an iOS Simulator `.app` without Apple code signing
- packages the simulator app as `.tar.gz`
- stores both the `.app` and `.tar.gz` in Codemagic build artifacts

## Workflow name

Use this workflow in Codemagic:

`prela-ios-simulator`

## Why this workflow avoids Apple Developer

This workflow does not build a signed IPA and does not upload to TestFlight.

Because it targets the iOS Simulator instead of a physical iPhone, it does not require:

- an Apple Developer subscription
- App Store Connect
- provisioning profiles
- distribution certificates

## Required Codemagic setup

### 1. Connect the repository

- In Codemagic, add the GitHub repository `Pukaboys/Prela-Atelier`.
- Make sure Codemagic detects the root `codemagic.yaml`.

### 2. No Apple signing setup required

You do not need to configure:

- `iOS certificates`
- `iOS provisioning profiles`
- Apple Developer integration

### 3. API URL

The workflow already injects:

`EXPO_PUBLIC_API_URL=https://www.prela-atelier.com`

That matches the current mobile app setup.

## How to run the build

In Codemagic:

1. Open the app.
2. Select the workflow `prela-ios-simulator`.
3. Start a new build from `main`.

## Where to get the build

When the build finishes:

- open the build in Codemagic
- go to `Artifacts`
- download the generated `.tar.gz`

You can use that simulator package with services like Appetize.

## Notes

- This workflow is for simulator testing, not real iPhone installation.
- Without Apple Developer signing, you cannot install the app directly on a physical iPhone or submit it to TestFlight.
- If you later want a paid Apple release pipeline, we can add a separate signed workflow instead of replacing this one.

## Sources

- Codemagic React Native / Expo YAML guide: https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app/
- Codemagic YAML getting started: https://docs.codemagic.io/yaml-basic-configuration/yaml-getting-started/

# GitHub Actions Workflows

## Build Commander App Workflow

This workflow automatically builds the Commander Electron application when changes are pushed to the main branch or when pull requests are created.

### Workflow Overview

The `build-app.yml` workflow:
- Triggers on pushes to `main` branch and pull requests
- Builds the app for macOS, Windows, and Linux in parallel
- Runs code quality checks (linting and type checking)
- Uploads build artifacts for download

### Build Artifacts

After a successful build, the following artifacts are available:
- **macOS**: `.app` bundle and `.zip` file
- **Windows**: `.exe` installer
- **Linux**: `.deb` and `.rpm` packages

Artifacts are retained for 30 days and can be downloaded from the Actions tab in GitHub.

### macOS Code Signing (Optional)

To enable code signing for macOS builds, add the following secrets to your GitHub repository:
1. `APPLE_ID`: Your Apple Developer account email
2. `APPLE_ID_PASSWORD`: App-specific password for your Apple ID
3. `APPLE_TEAM_ID`: Your Apple Developer Team ID
4. `CSC_LINK`: Base64-encoded certificate (.p12 file)
5. `CSC_KEY_PASSWORD`: Password for the certificate

To encode your certificate:
```bash
base64 -i certificate.p12 -o encoded.txt
```

### Local Testing

To test the build process locally:
```bash
npm run make
```

Build output will be in the `out/make/` directory.

### Downloading Artifacts

1. Go to the Actions tab in your GitHub repository
2. Click on a workflow run
3. Scroll to the Artifacts section
4. Click on the artifact name to download

### Customization

To modify the workflow:
- Change retention days: Update `retention-days` in upload steps
- Add more platforms: Copy a job and modify the `runs-on` value
- Change Node version: Update the `node-version` in setup steps
- Add release creation: Add a release step using `actions/create-release`
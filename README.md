# spotify-control

A CLI for a couple of simple spotify things. Currently toggles devices and
adds the currently playing track to a monthly playlist.

## Installation

```
yarn global add https://github.com/adampash/spotify-control
```

## Setup

Get a Spotify client id and client secret
You'll need the following environment variables set:

```bash
export STEREO=<name your stereo starts with, lowercased>
export LOCAL=<name your local machine starts with, lowercased>
export CLIENT_ID=<your spotify client id>
export CLIENT_SECRET=<your spotify client secret>
```

## Usage

```bash
# Toggle output device via spotify connect
spotify-control toggle-device

# Add currently playing track to a monthly playlist
# (creates playlist if it doesn't exist — e.g., April 2018)
spotify-control add-to-monthly-playlist
```

## Develop

```bash
yarn build:watch

# to test cli
./bin/spotify-control.js <argument>
```

## Release

```bash
# Build
yarn build
git commit -m "your release notes"

# Increment version in package.json
yarn version
git push && git push --tags
```


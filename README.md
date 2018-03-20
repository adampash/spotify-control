# Setup

Get a Spotify access token:

```bash
yarn global add spotify-auth-cli

spotify-token
```

Copy the output of the `spotify-token` command.

You'll need a .envrc (or something of that ilk) file exporting the following variables:

```bash
export SPOTIFY_ACCESS_TOKEN=<spotify access token>
export STEREO=<name your stereo starts with, lowercased>
export LOCAL=<name your local machine starts with, lowercased>
```

const express = require('express');
const openurl = require('openurl');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const PORT = 54041;

const SPOTIFY_CONTROL_CONF_DIR = `${require('os').homedir()}${path.sep}.spotify-control`;
const ACCESS_TOKEN_PATH = `${SPOTIFY_CONTROL_CONF_DIR}${path.sep}ACCESS_TOKEN`;
if (!fs.existsSync(SPOTIFY_CONTROL_CONF_DIR)) {
  fs.mkdirSync(SPOTIFY_CONTROL_CONF_DIR);
}
const SPOTIFY_URL = 'https://accounts.spotify.com/authorize';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'user-top-read',
  'user-library-read',
  'user-read-birthdate',
  'playlist-modify-private',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-follow-modify',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-follow-read',
  'user-library-modify',
  'streaming',
  'playlist-modify-public',
  'playlist-read-collaborative',
];
const REDIRECT_URL = `http://localhost:${PORT}/auth/callback`;
const AUTH_URL = `${SPOTIFY_URL}?client_id=${
  process.env.CLIENT_ID
}&redirect_uri=${REDIRECT_URL}&scope=${SCOPES.join(' ')}&response_type=code`;

const SERVER_AUTH_URL = 'https://accounts.spotify.com/api/token';
const SERVER_AUTH_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Authorization: `Basic ${Buffer.from(
    `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
  ).toString('base64')}`,
};

const app = express();
let server;

const objToForm = obj =>
  Reflect.ownKeys(obj)
    .map(key => `${key}=${obj[key]}`)
    .join('&');

const getLocalToken = () => JSON.parse(fs.readFileSync(ACCESS_TOKEN_PATH));

const getAccessToken = async () =>
  await new Promise((resolve, reject) => {
    try {
      const { access_token: token } = getLocalToken();
      if (!token) throw new Error(`No token in ${ACCESS_TOKEN_PATH}`);
      resolve(token);
    } catch (e) {
      console.log(`ERORR IN READING TOKEN`, e);
      app.get('/auth/callback', async (req, res) => {
        const { code } = req.query;
        const params = {
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URL,
        };
        const authReq = await fetch(SERVER_AUTH_URL, {
          method: 'POST',
          body: objToForm(params),
          headers: SERVER_AUTH_HEADERS,
        });
        const { error, error_description, ...body } = await authReq.json();
        console.log(`error`, error);
        console.log(`error_description`, error_description);
        console.log(`body`, body);
        if (error) reject(error_description);
        fs.writeFileSync(ACCESS_TOKEN_PATH, JSON.stringify(body));
        resolve(body.access_token);
        res.send('Successfully fetched token. You can close this window.');
        server.close();
      });

      server = app.listen(PORT);

      openurl.open(AUTH_URL);
    }
  });

const refreshAccessToken = () =>
  new Promise(async (resolve, reject) => {
    try {
      const { refresh_token } = getLocalToken();
      if (!refresh_token) return resolve(await getAccessToken());
      const params = {
        grant_type: 'refresh_token',
        refresh_token,
      };
      const authReq = await fetch(SERVER_AUTH_URL, {
        method: 'POST',
        body: objToForm(params),
        headers: SERVER_AUTH_HEADERS,
      });
      const { error, error_description, ...body } = await authReq.json();
      if (error) reject(error_description);
      fs.writeFileSync(
        ACCESS_TOKEN_PATH,
        JSON.stringify({ refresh_token, ...body })
      );
      resolve(body.access_token);
    } catch (e) {
      console.log(`ERROR refreshing token`, e);
    }
  });

module.exports = {
  getAccessToken,
  refreshAccessToken,
};

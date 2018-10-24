const SpotifyWebApi = require('spotify-web-api-node');
const moment = require('moment');
const { getAccessToken, refreshAccessToken } = require('./auth');

const spotifyApi = new SpotifyWebApi();
let REFRESHED_TOKEN = false;
const retryWithRefresh = fn => async (...args) => {
  const loadedFn = () => fn(...args);
  try {
    return await loadedFn();
  } catch (e) {
    console.log(`ERROR on first try`, e);
    if (REFRESHED_TOKEN) return;
    console.log('Trying to refresh token');
    REFRESHED_TOKEN = true;
    await refreshAccessToken();
    return await loadedFn();
  }
};

const spotifyClient = async () => {
  try {
    const token = await getAccessToken();
    await spotifyApi.setAccessToken(token);
    return spotifyApi;
  } catch (e) {
    console.log(`ERROR setting up client`, e);
  }
};

const selectDevice = async device => {
  try {
    const client = await spotifyClient();
    const result = await client.transferMyPlayback({
      deviceIds: [device.id]
    });
  } catch (e) {
    console.log(`Error in selectDevice`, e);
  }
};

const startDevice = retryWithRefresh(async deviceName => {
  try {
    const client = await spotifyClient();
    const response = await client.getMyDevices();
    const {
      body: { devices }
    } = response;
    const stereo = devices.find(({ name }) => name.toLowerCase().startsWith(deviceName || process.env.STEREO));
    selectDevice(stereo);
  } catch (toggleError) {
    console.log(`toggleError`, toggleError);
    throw toggleError;
  }
});

const toggleDevice = retryWithRefresh(async () => {
  try {
    const client = await spotifyClient();
    const response = await client.getMyDevices();
    const {
      body: { devices }
    } = response;
    const stereo = devices.find(({ name }) => name.toLowerCase().startsWith(process.env.STEREO));
    const local = devices.find(({ name }) => name.toLowerCase().startsWith(process.env.LOCAL));
    selectDevice(local.is_active ? stereo : local);
  } catch (toggleError) {
    console.log(`toggleError`, toggleError);
    throw toggleError;
  }
});

const getPlaylist = retryWithRefresh(async (playlistName = 'Discover Weekly') => {
  const client = await spotifyClient();
  const {
    body: { id: userId }
  } = await client.getMe();
  const {
    body: { items: playlists }
  } = await client.getUserPlaylists(userId);
  const playlist = playlists.find(({ name }) => playlistName === name);
  if (!playlist) {
    console.log('No playlist with that name exits');
    console.log('Here are your playlists');
    console.log(playlists);
    return;
  }
  console.log(playlist.id);
  return playlist.id;
});

const getMonthlyPlaylistName = () => moment().format('MMMM YYYY');
const getMonthlyPlaylist = retryWithRefresh(async userId => {
  const monthlyPlaylistName = getMonthlyPlaylistName();
  const id = await getPlaylist(monthlyPlaylistName);
  return id;
});

const addToMonthlyPlaylist = retryWithRefresh(async () => {
  const client = await spotifyClient();
  const {
    body: {
      item: { uri: trackUri }
    }
  } = await client.getMyCurrentPlayingTrack();
  const {
    body: { id: userId }
  } = await client.getMe();
  const {
    body: { items: playlists }
  } = await client.getUserPlaylists(userId);
  const playlistId = await getMonthlyPlaylist(userId);
  const {
    body: { items: tracks }
  } = await client.getPlaylistTracks(userId, playlistId);
  if (tracks.find(({ track: { uri } }) => uri === trackUri)) return;
  await client.addTracksToPlaylist(userId, playlistId, [trackUri]);
});

const setVolume = retryWithRefresh(async (percent = 25) => {
  const client = await spotifyClient();
  await client.setVolume(percent);
});

const pause = retryWithRefresh(async (options = {}) => {
  const client = await spotifyClient();
  await client.pause(options);
});
const play = retryWithRefresh(async (options = {}) => {
  const client = await spotifyClient();
  await client.play(options);
});

module.exports = {
  'toggle-device': toggleDevice,
  play: play,
  pause: pause,
  'start-device': startDevice,
  'set-volume': setVolume,
  'add-to-monthly-playlist': addToMonthlyPlaylist,
  'get-monthly-playlist': getMonthlyPlaylist,
  'get-monthly-playlist-name': getMonthlyPlaylistName,
  'get-playlist': getPlaylist
};
//# sourceMappingURL=index.js.map
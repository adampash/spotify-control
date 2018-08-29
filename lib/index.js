const SpotifyWebApi = require('spotify-web-api-node');
const moment = require('moment');
const { getAccessToken, refreshAccessToken } = require('./auth');

const spotifyApi = new SpotifyWebApi();
let REFRESHED_TOKEN = false;
const retryWithRefresh = fn => async () => {
  try {
    return await fn();
  } catch (e) {
    console.log(`ERROR on first try`, e);
    if (REFRESHED_TOKEN) return;
    console.log('Trying to refresh token');
    REFRESHED_TOKEN = true;
    await refreshAccessToken();
    await fn();
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
      deviceIds: [device.id],
      play: true
    });
  } catch (e) {
    console.log(`Error in selectDevice`, e);
  }
};

const toggleDevice = retryWithRefresh(async () => {
  try {
    const client = await spotifyClient();
    const response = await client.getMyDevices();
    const { body: { devices } } = response;
    const stereo = devices.find(({ name }) => name.toLowerCase().startsWith(process.env.STEREO));
    const local = devices.find(({ name }) => name.toLowerCase().startsWith(process.env.LOCAL));
    selectDevice(local.is_active ? stereo : local);
  } catch (toggleError) {
    console.log(`toggleError`, toggleError);
    throw toggleError;
  }
});

const monthlyPlaylistName = moment().format('MMMM YYYY');
const getMonthlyPlaylist = (log = false) => retryWithRefresh(async userId => {
  const client = await spotifyClient();
  const { body: { items: playlists } } = await client.getUserPlaylists(userId);
  const playlist = playlists.find(({ name }) => monthlyPlaylistName === name) || (await client.createPlaylist(userId, monthlyPlaylistName));
  if (log) console.log("playlist id:", playlist.id);
  return playlist.id;
});

const addToMonthlyPlaylist = retryWithRefresh(async () => {
  const client = await spotifyClient();
  const {
    body: { item: { uri: trackUri } }
  } = await client.getMyCurrentPlayingTrack();
  const { body: { id: userId } } = await client.getMe();
  const { body: { items: playlists } } = await client.getUserPlaylists(userId);
  const playlistId = await getMonthlyPlaylist()(userId);
  const { body: { items: tracks } } = await client.getPlaylistTracks(userId, playlistId);
  if (tracks.find(({ track: { uri } }) => uri === trackUri)) return;
  await client.addTracksToPlaylist(userId, playlistId, [trackUri]);
});

module.exports = {
  'toggle-device': toggleDevice,
  'add-to-monthly-playlist': addToMonthlyPlaylist,
  'get-monthly-playlist': getMonthlyPlaylist(true)
};
//# sourceMappingURL=index.js.map
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi();

spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);

const selectDevice = async device => {
  try {
    const result = await spotifyApi.transferMyPlayback({
      deviceIds: [device.id],
      play: true
    });
  } catch (e) {
    console.log(`e`, e);
  }
};

const toggleDevice = async () => {
  const response = await spotifyApi.getMyDevices();
  const { body: { devices } } = response;
  const stereo = devices.find(({ name }) => name.toLowerCase().startsWith(process.env.STEREO));
  const local = devices.find(({ name }) => name.toLowerCase().startsWith(process.env.LOCAL));
  selectDevice(local.is_active ? stereo : local);
};

module.exports = {
  toggle: toggleDevice
};
//# sourceMappingURL=index.js.map
// Load process.env.XXX
require('dotenv').config()
// Load modules
const Discord = require('discord.js');
const Voice = require('./lib/voice.js');
// Load (discord-)event handlers
const { manageJoransGuild } = require('./lib/administrative-handlers.js');
const { handleUwU } = require('./lib/casual-handlers.js');

const client = new Discord.Client();
const voice = new Voice(process.env.DISCORD_ADMINISTRATIVE_USERTAGS.split(','));

client.on('ready', () => {
  console.log(`Logged in as ${client.user.username} (${client.user.tag})`);
});

client.on('message', async msg => {

  handleUwU(msg, client);

  if (msg.content.startsWith('%cometalk')) {
    await voice.activate(msg);
  }

  if (msg.content.startsWith('%language')) {
    voice.setPronounciation(msg);
  }

  if (msg.content.startsWith('%voice')) {
    voice.setVariant(msg);
  }

  if (msg.content.startsWith('%cu')) {
    voice.deactivate(msg);
  }

  if (msg.content.startsWith('%say ')) {
    await voice.speak(msg.content.split(' ').slice(1).join(' '), msg.channel);
  }
});

// Conditional ad-hoc moderation :rolleyes:
client.on('guildMemberAdd', member => {
  manageJoransGuild(member);
});

client.login(process.env.DISCORD_CLIENT_SECRET);

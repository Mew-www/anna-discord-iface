// Load process.env.XXX
require('dotenv').config()
// Load modules
const text2wav = require('text2wav');
const Samplerate = require("node-samplerate");
const waveheader = require("waveheader");
const { Readable } = require('stream');
const Discord = require('discord.js');
// Init DiscordClient
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.username} (${client.user.tag})`);
});

client.on('message', msg => {

  // UwU
  if (
    ( msg.content.startsWith('uwu') || msg.content.includes(' uwu') )
    && msg.author.id !== client.user.id
  ) {
    msg.channel.send('uwu');
  }

  if (msg.content.startsWith('!say ')) {
    if (msg.member.voiceChannel) {
      msg.member.voiceChannel.join()
        .then(async (connection) => {
          // Parse message
          const str = msg.content.split('!say ')[1];
          // Turn message to PCM via espeak-ng/mbrola
          const wav_uint8 = await text2wav(str);
          // Upsample (initially 22050Hz) PCM to 48000Hz required by Discord
          const data_48000 = Samplerate.resample(wav_uint8.slice(44), 22050, 48000, 1); // returns data in a Buffer, without header
          // Interleave mono to stereo sound
          const bytes_per_sample = 2;
          const num_samples = data_48000.length / bytes_per_sample;
          const stereo_channels = 2;
          let interleaved_48000 = Buffer.alloc(num_samples * bytes_per_sample * stereo_channels); // Basically twice mono's space
          for (
                let offset = 0;                        // Seek 0
                offset < num_samples*bytes_per_sample; // Move until end
                offset += bytes_per_sample             // Move sample at a time
              ) {
            let value = data_48000.readInt16LE(offset);
            interleaved_48000.writeInt16LE(value, offset*stereo_channels); // Left
            interleaved_48000.writeInt16LE(value, offset*stereo_channels+bytes_per_sample); // Right
          }
          // Construct valid Wav
          const header = waveheader(num_samples, {sampleRate: 48000, channels: 2, bitDepth: 16});
          const wav_48000 = Buffer.concat([header, interleaved_48000]);
          // Construct ReadableStream (as discord.js requires)
          let readable = Readable();
          readable.push(wav_48000);
          readable.push(null);
          // Dispatch to method that plays stream of PCM-16 data
          const dispatcher = connection.playConvertedStream(readable);
          dispatcher.on('end', end => {
            connection.disconnect();
          });
        })
        .catch(console.log);
    } else {
        msg.reply('You\'re not in a voice channel.');
    }
  }
});

// Conditional ad-hoc moderation :rolleyes:
client.on('guildMemberAdd', member => {
  if (member.guild.owner.user.tag === 'Joran#3781') {
    // Add default role
    const def_role = member.guild.roles.find(role => role.name === 'Steffen\'s Crustaceans');
    if (def_role) {
      member.addRole(def_role);
    } else {
      console.log(`${member.guild.name}'s default_role name has changed (to something unknown).`);
    }
    // KSKSKSKSKSKSKS
    const channel = member.guild.channels.find(ch => !ch.name.includes('rules'));
    if (!channel) return;
    channel.send('*KSKSKSKSKSKS*')
  }
});

client.login(process.env.DISCORD_CLIENT_SECRET);

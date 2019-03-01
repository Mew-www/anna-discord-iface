const text2wav = require('text2wav');
const Samplerate = require("node-samplerate");
const waveheader = require("waveheader");
const { Readable } = require('stream');

class Voice {
  // Administrative user tags must be in ["username#NNNN"] format
  constructor(administrative_user_tags) {
    this._administrative_user_tags = administrative_user_tags;
    this._is_active = false;
    this._currently_active_in = null;
    this._currently_activated_by = null;
    this._voice_connection = null;
    this._is_speaking = false;
  }

  _userCanAdminister(user) {
    if (this._administrative_user_tags.includes(user.tag)) {
      return true;
    }
    return false;
  }

  async _constructWav(processed_phrase) {
    // Turn message to PCM via espeak-ng/mbrola
    const synthesized_wav_uint8 = await text2wav(processed_phrase);

    // Discord requires voice to be sent in stereo with a sample rate of 48kHz
    // https://discordapp.com/developers/docs/topics/voice-connections#encrypting-and-sending-voice

    // Upsample PCM to 48000Hz
    const data_48000 = Samplerate.resample(synthesized_wav_uint8.slice(44), 22050, 48000, 1);
    // Interleave mono-to-stereo sound
    const bytes_per_sample = 2;
    const num_samples = data_48000.length / bytes_per_sample;
    const num_stereo_channels = 2;
    const interleaved_48000 = Buffer.alloc(num_samples * bytes_per_sample * num_stereo_channels); // B$
    for (
          let offset = 0;                        // Seek 0
          offset < num_samples*bytes_per_sample; // Move until end
          offset += bytes_per_sample             // Move sample at a time
        ) {
      let value = data_48000.readInt16LE(offset);
      interleaved_48000.writeInt16LE(value, offset*num_stereo_channels); // Left
      interleaved_48000.writeInt16LE(value, offset*num_stereo_channels+bytes_per_sample); // Right
    }

    // Prepend a valid Wav header
    const header = waveheader(num_samples, {sampleRate: 48000, channels: 2, bitDepth: 16});
    const wav_48000 = Buffer.concat([header, interleaved_48000]);
    return wav_48000;
  }

  // Check the requester may administer
  async activate(activation_message) {
    const requester = activation_message.author;
    const guild = activation_message.guild;
    const voice_channel = activation_message.member.voiceChannel;
    if (!this._userCanAdminister(requester)) {
      activation_message.reply('You do not have the permission to activate voice capabilities.');
      return false;
    }
    if (this._is_active) {
      activation_message.reply(`I have already been activated by ${this._currently_activated_by.tag} in server ${this._currently_active_in.name}.`);
      return false;
    }
    if (!voice_channel) {
      activation_message.reply('You must be in a voice channel to request voice capabilities.');
      return false;
    }
    this._is_active = true;
    this._currently_active_in = guild;
    this._currently_activated_by = requester;
    this._voice_connection = await voice_channel.join();
    return true;
  }

  // Check the requester originally issued activation
  deactivate(deactivation_message) {
    const requester = deactivation_message.author;
    if (!this._is_active) {
      deactivation_message.reply('I\'m not currently active.');
      return false;
    }
    if (this._voice_connection === null) {
      deactivation_message.reply('In middle of instantiating voice connection, try again later.');
      return false;
    }
    if (requester.id !== this._currently_activated_by.id) {
      deactivation_message.reply(`Activated by ${this._currently_activated_by.tag}, only that user is able to deactivate the voice.`);
      return false;
    }
    this._voice_connection.disconnect();
    this._voice_connection = null;
    this._currently_activated_by = null;
    this._currently_active_in = null;
    this._is_active = false;
    return true;
  }

  async speak(phrase, error_channel) {
    if (!this._is_active) {
      error_channel.send('I must first be activated.');
      return;
    }
    if (this._voice_connection === null) {
      error_channel.send('In middle of instantiating voice connection, try again later.');
      return;
    }
    if (this._is_speaking) {
      error_channel.send('Currently speaking, try again later.');
      return;
    }
    this._is_speaking = true;

    // Any word-filters etc. here

    const waveform_audio = await this._constructWav(phrase);

    // Construct ReadableStream (as discord.js requires)
    const readable = Readable();
    readable._read = () => {};
    readable.push(waveform_audio);
    readable.push(null);

    // Play stream of PCM-16 data and flag when finished
    const dispatcher = this._voice_connection.playConvertedStream(readable);
    dispatcher.on('end', end => {
      this._is_speaking = false;
    });
  }
}

module.exports = Voice;

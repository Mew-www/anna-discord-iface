// Load process.env.XXX
require('dotenv').config()
const Discord = require('discord.js');

const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.username} (${client.user.tag})`);
});

client.on('message', msg => {
  if (
    ( msg.content.startsWith('uwu') || msg.content.includes(' uwu') )
    && msg.author.id !== client.user.id
  ) {
    msg.channel.send('uwu');
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

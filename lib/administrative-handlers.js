exports.manageJoransGuild = function (member) {
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
}

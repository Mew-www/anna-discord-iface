exports.handleUwU = function (msg, client_self) {
  if (
    ( msg.content.startsWith('uwu') || msg.content.includes(' uwu') )
    && msg.author.id !== client_self.user.id
  ) {
    msg.channel.send('uwu');
  }
}

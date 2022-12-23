const { Intents } = require('discord.js');
const {
    DIRECT_MESSAGES,
    GUILD_MESSAGES,
    GUILDS,
    GUILD_VOICE_STATES,
} = Intents.FLAGS;

const config = {
    prefix: '!',
};

const botIntents = [
    DIRECT_MESSAGES,
    GUILD_MESSAGES,
    GUILDS,
    GUILD_VOICE_STATES,
];

const commands = {
    play: 'play',
    skip: 'skip',
    stop: 'stop',
    queue: 'queue',
    nowp: 'nowplaying',
    test: 'test',
    help: 'help'
};

module.exports = { botIntents ,config ,commands };
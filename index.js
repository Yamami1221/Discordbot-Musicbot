require(`dotenv`).config();
const { Client } = require(`discord.js`);
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, NoSubscriberBehavior, VoiceConnectionStatus, AudioPlayerStatus } = require(`@discordjs/voice`)
const { botIntents, config, commands } = require(`./config/config`);
const client = new Client({intents: botIntents,partials: ['CHANNEL', 'MESSAGE', 'REACTION'],});
const { video_basic_info, stream, search } = require('play-dl');
const AudioPlayer = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Play,
        maxMissedFrames: 100,
	},
});
const queue = new Map();

client.on(`ready`, () => {
    console.log(`Logged in as ${client.user.tag}!`)
    client.user.setActivity(`${config.prefix}help`, { type: `PLAYING`});
});
client.on(`reconnecting`, () => {
    console.log(`Reconnecting!`);
});
client.on(`disconnect`, () => {
    console.log(`Disconnect!`);
});

client.on(`messageCreate`, async (msg) => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(config.prefix)) return;
    const cmdArray = msg.content.slice(config.prefix.length).split(` `);
    var serverQueue = queue.get(msg.guild.id);

    if (cmdArray[0] == commands.play) {
        play(msg,cmdArray,serverQueue);
    } else if (cmdArray[0] == commands.skip) {
        skip(msg,cmdArray,serverQueue);
    } else if (cmdArray[0] == commands.stop) {
        stop(msg,cmdArray,serverQueue);
    } else if (cmdArray[0] == commands.help) {
        const helpreply = await help();
        msg.channel.send({ embeds: helpreply});
    } else {
        msg.reply({ embeds: [{
            color: 0xff8800,
            title: `Invalid Command!`,
            description: "For more info`!help`",
        }]});
    }
});

function isValidURL(link) {
    var res = link.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
};
async function play(msg, cmdArray, serverQueue) {
    const voiceChannel = msg.member.voice.channel;
    if (!voiceChannel) {
        return msg.channel.send("You need to be in a voice channel to play music!");
    }
    const permissions = voiceChannel.permissionsFor(msg.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return msg.channel.send("I need the permissions to join and speak in your voice channel!");
    }
    if (!cmdArray[1]) {
        const invalidargreply = await invalidarg();
        msg.reply({ embeds: invalidargreply });
        return;
    }

    if (isValidURL(cmdArray[1]) == true) {
        const videourl = cmdArray[1]
        const songInfo = await video_basic_info(videourl);
        queuemanager(msg, songInfo, videourl, serverQueue);
    } else {
        const firstvideourl = await search(cmdArray[1], { limit: 1 });
        if (!firstvideourl[0].url) return msg.reply('Video Not Found!');
        const videourl = firstvideourl[0].url
        const songInfo = await video_basic_info(videourl);
        queuemanager(msg, songInfo, videourl, serverQueue);
    }
}
async function queuemanager(msg,songInfo,videourl,serverQueue) {
    const song = {
        title: songInfo.video_details.title,
        url: videourl,
    }
    if (!serverQueue) {
        const queueContruct = {
            textChannel: msg.channel,
            voiceChannel: msg.member.voice.channel,
            connection: null,
            playerstat: null,
            songs: [],
            volume: 5,
            playing: true
        };
        queue.set(msg.guild.id, queueContruct);
        queueContruct.songs.push(song);
        try {
            const conns = joinVoiceChannel({
                channelId: msg.member.voice.channel.id,
                guildId: msg.guild.id,
                adapterCreator: msg.guild.voiceAdapterCreator
            });
            queueContruct.connection = conns;
            queueContruct.playerstat = AudioPlayer;
            await player(msg, queueContruct.songs[0], serverQueue);
            msg.reply({ embeds: [{
                color: 0xff8800,
                title: `Now playing`,
                description: `Now playing:[${songInfo.video_details.title}](${videourl})`,
            }]});
        } catch (err) {
            console.log(err);
            queue.delete(msg.guild.id);
            return msg.reply(err);
        }
    } else {
        serverQueue.songs.push(song);
        msg.reply({ embeds: [{
            color: 0xff8800,
            title: `Added to queue`,
            description: `[${song.title}](${videourl}) has been added to the queue!`,
        }]});
    }
}
async function player(msg, song, serverQueue) {
    const connection = getVoiceConnection(msg.guild.id);
    const serverQueueInfo = queue.get(msg.guild.id);
    if (!song) {
        connection.destroy();
        AudioPlayer.stop();
        //serverQueue.voiceChannel.leave();
        queue.delete(msg.guild.id);
        return;
    }
    try {
        const streams = await stream(song.url);
        const resource = createAudioResource(streams.stream, {
        inputType: streams.type
        });
        AudioPlayer.play(resource);
        connection.subscribe(AudioPlayer);
        dispatcher(msg, serverQueueInfo, serverQueue);
    }
    catch(Error) {
        msg.reply(`${Error}`)
        console.log(Error)
        queue.delete(msg.guild.id);
        connection.destroy();
        AudioPlayer.stop();
    }
    
}
async function dispatcher(msg, serverQueueInfo, serverQueue) {
    const dispatcher = serverQueueInfo.playerstat
        .on(AudioPlayerStatus.Idle, () => {
            serverQueue.songs.shift();
            player(msg, serverQueue.songs[0], serverQueue);
        });
}
async function skip(msg,cmdArray) {

}
async function stop(msg,cmdArray) {
    
}
const help = async () => {
    const helpembeds = [{
        color: 0xff8800,
        author: {
            name: `Dukdui Bot`,
            icon_url: `https://cdn.discordapp.com/attachments/976085250511867904/977546401544290334/square.jpg`
        },
        thumbnail: {
            url: `https://cdn.discordapp.com/attachments/976085250511867904/977546401544290334/square.jpg`
        },
        title: `วิธีใช้บอท`,
        description: `วิธีใช้นั่นแหละ อ่านๆดูเอาเองละกัน`,
        fields: [{
            name: `!bot`,
            value: "ตั้งสถานะบอทหรือตรวจสอบสถานะ\nวิธีใช้\n\`!bot [start,stop,status,stat]\`\nตัวอย่าง\n\`!bot status\`",
            inline: false
        },
        {
            name: `!teach`,
            value: "สอนน้อง\nวิธีใช้\n\`!teach [inputเช่น สวัสดี] [Outputเช่น ดีจ้า]\`\nตัวอย๋าง\n\`!teach เธอชื่อไร เราชื่อประยุทธ์\`",
            inline: false
        },
        {
            name: `!teachsw`,
            value: "สำหรับการเพิ่มคำคล้าย หรือ ต้องการให้ตอบสนองเหมือนกัน\nวิธีใช้\n\`!teachsw [inputใหม่] [inputที่เคยเพิ่มแล้ว]\`\nตัวอย่าง\n\`!teachsw ชื่อไรอะ เธอชื่อไร\`",
            inline: false
        },
        {
            name: `!random`,
            value: "สุ่มเลข\nวิธีใช้\n\`!random [ค่าต่ำสุด] [ค่าสูงสุด]\`\nตัวอย่าง\n\`!random 1 10\`",
            inline: false
        },
        {
            name: "More Info",
            value: "[Click Here](https://youtu.be/dQw4w9WgXcQ)",
            inline: false
        },],
        timestamp: new Date(),
        footer: {
            text: "ตอนนี้รองรับแค่ภาษาไทยนะ"
        }
    }];
    return helpembeds;
}
const invalidarg = async () => {
    const invalidargembed = [{
        color: 0xff8800,
        title: `Invalid Argument!`,
        description: "More info in `!help`",
    }];
    return invalidargembed;
}

client.login(process.env.DISCORD_TOKEN);
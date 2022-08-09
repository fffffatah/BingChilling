const Discord = require('discord.js');
const playdl = require('play-dl');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior } = require('@discordjs/voice');
const youtubesearchapi = require('youtube-search-api');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGE_TYPING", "GUILD_VOICE_STATES"] })
const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop
    }
});
var musicQueue = [];
var message = null;
var connection = null;
var channel = null;

client.login(process.env.BC);

client.once('ready', () => {
    console.log("BingChilling!");
    client.user.setActivity("$help",{type:'LISTENING'});
});

client.on('messageCreate', async msg => {
    message = msg;
    const command = parseCommand();
    const payload = parsePayload();

    switch(command) {
        case "play":
            console.log(payload);

            if(payload === ("$" + command)) break;

            try {
                const ytRes = await getYtUrl(payload);
                console.log(ytRes[0]);

                if(ytRes.length < 1){
                    msg.reply("Unable to Play Track!");
                    break;
                }

                channel = msg.member.voice.channel;
                
                if(channel){
                    if(connection == null){
                        connection = joinVoiceChannel({
                            channelId: channel.id,
                            guildId: channel.guild.id,
                            adapterCreator: channel.guild.voiceAdapterCreator,
                        });
                    }
                }
                else{
                    msg.reply("You must be in a Voice Channel!");
                    break;
                }

                if(player.state.status === "buffering" || player.state.status === "playing" || player.state.status === "paused"){
                    addToQueue(ytRes[0]);
                    break;
                }

                addToQueue(ytRes[0]);
                const temp = getFromQueue();
                if(temp){
                    connection.subscribe(player);
                    player.play(await getAudioStream(temp.id));
                    message.reply("Now Playing: "+temp.title);
                    musicQueue.splice(0, 1);
                }
            } catch (error) {
                console.log(error);
            }
            break;
        case "help":
            msg.reply("1) '$play [song]' = Play Music from YouTube (Search/URL)\n2) '$pause' = Pause Currently Playing\n3) '$resume' = Resume Last Paused Playing\n4) '$stop' = Stop Currently Playing/Clear Queue\n5) '$queue' = List Queue\n6) '$skip' = Skip Currently Playing\n7) '$remove [track number] = Remove Specific Track from Queue'");
            break;
        case "stop":
            musicQueue = [];
            msg.reply("Stopped!");
            player.stop();
            break;
        case "pause":
            msg.reply("Paused!");
            player.pause();
            break;
        case "resume":
            msg.reply("Resumed!");
            player.unpause();
            break;
        case "queue":
            printQueue(msg);
            break;
        case "skip":
            msg.reply("Skipped!");
            player.stop();
            break;
        case "remove":
            if(payload === ("$" + command)){
                break;
            }

            removeFromQueueSpecific(payload);
            break;
        default:
            break;
      }
});

//PLAY AUDIO IN VC
player.on("idle", async () => {
    try{
        const temp = getFromQueue();
        
        if(temp){
            player.play(await getAudioStream(temp.id));
            message.channel.send("Now Playing: " + temp.title);
            musicQueue.splice(0, 1);
        }
        else{
            player.stop();
            connection.destroy();
            connection = null;
            channel = null;
            message = null;
            musicQueue = [];
        }
    }
    catch(e){
        console.log(e);
    }
});

//COMMAND PARSER
const parseCommand = () => {
    const prefix = "$";
    if(!message.content.startsWith(prefix) || message.author.bot) return;
        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();
        return command;
}

//PAYLOAD PARSER
const parsePayload = () => {
    const args = message.content.substring(message.content.indexOf(" ") + 1);
    return args;
}

//GET YOUTUBE VIDEO ID
const getYtUrl = async (payload) => {
    try {
        const res = await youtubesearchapi.GetListByKeyword(payload, false, 1);
        return res.items;
    } catch (error) {
        console.log(error);
    }
}

//GET YOUTUBE URL
const getYouTubeUrl = (videoId) => {
    return "https://www.youtube.com/watch?v=" + videoId;
}

//GET AUDIO STREAM FROM YOUTUBE
const getAudioStream = async (videoId) => {
    try {
        let audioStream = await playdl.stream(getYouTubeUrl(videoId), {discordPlayerCompatibility: true});
        let resource = createAudioResource(audioStream.stream, {
            inputType: audioStream.type
        });

        return resource;
    } catch (error) {
        console.log(error);
    }
}

//PRINT QUEUE
const printQueue = () => {
    var temp = "";
    if(musicQueue.length>0){
        for(let i = 0; i < musicQueue.length; i++){
            temp = temp + "\n" + (i + 1) + ") " + musicQueue[i].title;
        }
        message.reply("[Queue Items]" + temp);
    }
    else{
        message.reply("Queue Empty!");
    }
}

//ADD TO QUEUE
const addToQueue = (music) => {
    musicQueue.push(music);
    message.reply("Added To Queue: " + music.title);
}

//REMOVE FROM QUEUE (SPECIFIC)
const removeFromQueueSpecific = (index) => {
    if(musicQueue.length > 0 && index > 0 && index <= musicQueue.length){
        message.reply("Removed from Queue: " + musicQueue[index-1].title);
        musicQueue.splice(index-1, 1);
    }
    else{
        message.reply("Couldn't Remove!");
    }
}

//GET FIRST FROM QUEUE ON FINISH
const getFromQueue = () => {
    if(musicQueue.length > 0){
        temp = musicQueue[0];
        return temp;
    }
    else{
        return false;
    }
}

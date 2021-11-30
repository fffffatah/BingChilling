const Discord = require('discord.js');
const ytdl = require('ytdl-core')
const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const youtubesearchapi = require('youtube-search-api');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGE_TYPING", "GUILD_VOICE_STATES"] })
const player = createAudioPlayer();
var musicQueue = [];
client.once('ready',()=>{
    console.log("BingChilling!");
});

client.on('messageCreate',async message=>{
    const command = parseCommand(message);
    const payload = parsePayload(message);

    switch(command) {
        case "play":
            console.log(payload);
            if(payload === ("$"+command)) break;
            try {
                const ytRes = await getYtUrl(payload);
                console.log(ytRes);
                if(ytRes.length<1){
                    message.reply("Unable to Play Track!");
                    break;
                }
                const channel = message.member.voice.channel;
                if(channel){
                    const connection = joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channel.guild.id,
                        adapterCreator: channel.guild.voiceAdapterCreator,
                    });
                    addToQueue(ytRes[0]);
                    await playAudioVc(connection, message);
                }
                else{
                    message.reply("You must be in a Voice Channel!");
                }
            } catch (error) {
                console.log(error);
            }
            break;
        case "help":
            message.reply("1) '$play [song]' = Play Music from YouTube (Search/URL)\n2) '$pause' = Pause Currently Playing\n3) '$resume' = Resume Last Paused Playing\n4) '$stop' = Stop Currently Playing/Clear Queue\n5) '$queue' = List Queue");
            break;
        case "stop":
            message.reply("Stopped!");
            player.stop();
            break;
        case "pause":
            message.reply("Paused!");
            player.pause();
            break;
        case "resume":
            message.reply("Resumed!");
            player.unpause();
            break;
        case "queue":
            printQueue();
            break;
        case "remove":
            if(payload === ("$"+command)){
                break;
            }
            removeFromQueueSpecific(message, payload);
            break;
        default:
            break;
      }
})


client.login(process.env.BC);

//COMMAND PARSER
const parseCommand = (message)=>{
    const prefix = "$";
    if(!message.content.startsWith(prefix)||message.author.bot) return;
        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();
        return command;
}
//PAYLOAD PARSER
const parsePayload = (message)=>{
    const args = message.content.substring(message.content.indexOf(" ") + 1);
        return args;
}
//GET YOUTUBE VIDEO ID
const getYtUrl = async (payload)=>{
    try {
        const res = await youtubesearchapi.GetListByKeyword(payload, false, 1);
        return res.items;
    } catch (error) {
        console.log(error);
    }
}
//GET AUDIO STREAM FROM YOUTUBE
const getAudioStream = async (id)=>{
    try {
        const res = await ytdl("https://www.youtube.com/watch?v="+id+"&bpctr=9999999999", {filter:'audioonly'});
        return res;
    } catch (error) {
        console.log(error);
    }
}
//PLAY AUDIO IN VC
const playAudioVc = async (connection, message)=>{
    try {
        const temp = getFromQueue();
        if(temp){
            const streamdata = await getAudioStream(temp.id);
            const resource = createAudioResource(streamdata);
            connection.subscribe(player);
            player.play(resource);
            message.reply("Now Playing: "+temp.title);
            player.on("idle",()=>{
                try{
                    await playAudioVc(connection, message);
                }
                catch(e){
                    console.log(e);
                }
            })
        }
        else{
            player.stop();
            connection.destroy();
        }
    } catch (error) {
        console.log(error);
    }
}

//PRINT QUEUE
const printQueue = (message)=>{
    var temp = "[Queue Items]";
    if(musicQueue.length>0){
        for(let i = 0; i < musicQueue.length; i++){
            temp = i+") "+temp+"\n"+musicQueue[i].title;
        }
        message.reply(temp);
    }
    else{
        message.reply("Queue Empty!");
    }
}

//ADD TO QUEUE
const addToQueue = (message, music)=>{
    musicQueue.push(music);
    message.reply("Added To Queue: "+music.title);
}

//REMOVE FROM QUEUE ON FINISH
const removeFromQueue = ()=>{
    musicQueue = musicQueue.splice(0, 1);
}

//REMOVE FROM QUEUE (SPECIFIC)
const removeFromQueueSpecific = (message, index)=>{
    if(musicQueue.length>0 && index>0 && index<=musicQueue.length){
        message.reply("Removed from Queue: "+musicQueue[index-1].title);
        musicQueue = musicQueue.splice(index-1, 1);
    }
    else{
        message.reply("Couldn't Remove!");
    }
}

//GET FIRST FROM QUEUE ON FINISH
const getFromQueue = ()=>{
    if(musicQueue.length>0){
        temp = musicQueue[0];
        removeFromQueue();
        return temp;
    }
    else{
        return false;
    }
}
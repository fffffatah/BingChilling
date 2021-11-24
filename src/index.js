const Discord = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const youtubesearchapi = require('youtube-search-api');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGE_TYPING", "GUILD_VOICE_STATES"] })

client.once('ready',()=>{
    console.log("BingChilling!");
});

client.on('messageCreate',message=>{
    const command = parseCommand(message);
    const payload = parsePayload(message, command);

    switch(command) {
        case "p":
            message.reply("Test for Command $p, Author: "+message.author.username+" Payload: "+payload);
            const channel = message.member.voice.channel;
            if(channel){
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });
                const resource = createAudioResource("https://file-examples-com.github.io/uploads/2017/11/file_example_MP3_700KB.mp3",{
                    inlineVolume: true
                });
                resource.volume.setVolume(0.2);
                const player = createAudioPlayer();
                connection.subscribe(player);
                player.play(resource);
                player.on("idle",()=>{
                    try{
                        player.stop();
                    }
                    catch(e){
                        console.log(e);
                    }
                    try{
                        connection.destroy();
                    }
                    catch(e){
                        console.log(e);
                    }

                })
            }
            else{
                message.reply("You must be in a Voice Channel!");
            }
            break;
        case "play":
            message.reply("Test for Command $play, Author: "+message.author.username+" Payload: "+payload);
            break;
        case "help":
            message.reply("1) '$p [song]' or '$play [song]' = Play Music from YouTube (Search/URL)\n2) '$pause' = Pause Currently Playing");
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
//VALIDATE PAYLOAD

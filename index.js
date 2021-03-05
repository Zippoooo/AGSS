/* Requires */
const {Client, MessageEmbed} = require("discord.js");
const config = require("./config.json");
const chalk = require("chalk");
const query = require("source-server-query");
const fetch = require("node-fetch");
const mcquery = require('minecraft-server-util');
const fs = require("fs");
const { players } = require("source-server-query");
var branding = config.branding;
/* Configuartion */
chalk.gold = chalk.hex("fecd69").bold;
chalk.lightred = chalk.hex("e54b4b").bold;
/* Connections */
const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
/* Events */
client.on('ready', () => {
    console.log(chalk.lightred(`[LOGS] [READY] `) + chalk.gold(`${client.user.tag} is `) + chalk.lightred("online") + chalk.gold("!"));
})
/* Functions */
async function getGameInfo(ip, port, game) {
    switch(game) {
        case 'csgo': 
            return await source(ip, port);
        case 'fivem':
            return await fivem(ip, port);
        case 'rust':
            return await source(ip, port);
        case 'minecraft':
            return await mc(ip, port);
    }
}
/* Interval */
function interval(func, time) {
    setInterval(func, time)
}

var globalTimer = setInterval(()=> {
    if(new Date().getSeconds() == 0){
        interval(main, config.interval)
        clearInterval(globalTimer)
    }
}, 1000)

async function main(type, message){
    let embed = new MessageEmbed()
    .setTitle(branding.title)
    .setURL(branding.titleurl)
    .setColor(branding.color)
    .setThumbnail(branding.thumbnail)
    .setImage(branding.image)
    .setFooter(branding.footer, branding.footerlogo)
    .setTimestamp()
    for(var category in config.categories){
        var list = [];
        for(var server of config.categories[category]){
            var data = await getGameInfo(server.ip, server.port, server.game)
            var playersnum, maxplayers;
            if(server.game === "fivem") { playersnum = data.length; maxplayers = server.maxplayers; } else if(server.game === "minecraft") { playersnum = data.onlinePlayers; maxplayers = data.maxPlayers; } else { playersnum = data.playersnum; maxplayers = data.maxplayers; } if(playersnum === undefined || maxplayers === undefined) { playersnum = "∞"; maxplayers = "∞" }
            list.push(`**[${server.emoji}]** **${server.name}** [**Connect**](${server.url}) \`${playersnum}/${maxplayers}\` **Players**`)
        }
        embed.addField(`**__${category}__**`, list)
    }
    if(type === 'devmode'){
        if(config.branding.header) {
            var header = new MessageEmbed()
            .setColor(branding.color)
            .setImage(branding.headerimage)
            message.channel.send(header)
        }
        message.channel.send(embed).then(msg => {
            config.messageid = msg.id;
            config.channelid = msg.channel.id;
            fs.writeFile("./config.json", JSON.stringify(config,null,'\t'), function writeJSON(err) {
                if(err) throw err;
            })
        })
    } else {
        const channel = client.channels.cache.get(config.channelid);
        const msg = await channel.messages.fetch(config.messageid);
        msg.edit(embed)
    }
}
/* Queries */
    /* Source */ async function source(ip, port) { return query.info(ip, port, 1000) }
    /* FiveM */ async function fivem(ip, port) { return await fetch(`http://${ip}:${port}/players.json`, { timeout: 3000 }).then(res => res.json()); }
    /* Minecraft */ async function mc(ip, port) { return await mcquery.status(ip, {port: port, timeout: 1000}) }
/* Commands */
client.on('message', async (message) => {
    const prefix = config.prefix
    if(message.type !== "DEFAULT") return;
    if(message.author.bot) return;
	const args = message.content.split(' ');
    const msg = args.shift().toLowerCase();
    if(msg === prefix + 'showhere') {
        message.delete()
        main("devmode", message)
    }
    if(msg === prefix + 'update') {
        message.delete()
        main()
    }
})
client.login(config.token)

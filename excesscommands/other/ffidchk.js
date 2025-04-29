const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

const allowedChannels = ['1355943977710391416', '987654321098765432'];

module.exports = {
    name: 'ffidchk',
    description: 'Check if a Free Fire account is banned and show basic account info.',
    execute: async (message, args) => {
        if (!allowedChannels.includes(message.channel.id)) {
            return message.reply('❌ This command can only be used in specific channels.');
        }

        if (args.length !== 1) {
            return message.reply('❌ Usage: `!ffidchk <UID>`\nExample: `!ffidchk 2349899077`');
        }

        const uid = args[0];
        const country = 'bd'; // Default country
        const banApiUrl = `https://brokenplayz23ban.vercel.app/api/ban_check/${uid}`;
        const infoApiUrl = `https://ariiflexlabs-playerinfo-icxc.onrender.com/ff_info?uid=${uid}&region=${country}`;

        try {
            const banResponse = await axios.get(banApiUrl);
            const banData = banResponse.data;

            if (banData.status !== 'success') {
                return message.reply(`❌ Failed to check ban status for UID **${uid}**.`);
            }

            let accountInfo = null;
            try {
                const infoResponse = await axios.get(infoApiUrl);
                const infoData = infoResponse.data;
                if (!infoData.error && infoData.AccountInfo) {
                    accountInfo = infoData.AccountInfo;
                }
            } catch (infoError) {
                console.warn(`⚠️ Failed to fetch player info:`, infoError.message);
            }

            const isBanned = banData.data.is_banned === 1;
            const period = banData.data.period || 'NA';

            const toBDTime = (timestamp) => {
                return new Date(timestamp * 1000).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
            };

            const embed = new EmbedBuilder()
                .setTitle(`🚨 Free Fire Ban Check - UID: ${uid}`)
                .setDescription(isBanned
                    ? `🚫 **Uh-oh! This account is BANNED!**\n⌛ **Ban Period:** ${period} months.\n\n🔗 **Possible Appeal?** Contact support [Click here](https://ffsupport.garena.com/hc/en-us) —we're here to help!`
                    : `✅ **Good news! This account is NOT banned!** 🙌\nYou're all clear to play! 🎮`
                )
                .setColor(isBanned ? '#ff0000' : '#00ff00')
                .setImage(isBanned
                    ? 'https://cdn.discordapp.com/attachments/1227567434483896370/1352329253290639370/standard-1.gif'
                    : 'https://cdn.discordapp.com/attachments/1227567434483896370/1352329253886361610/standard-2.gif'
                )
                .setTimestamp();

            if (accountInfo) {
                embed.addFields(
                    { name: '🧑 Player Name', value: accountInfo.AccountName || 'Unknown', inline: true },
                    { name: '🔰 Level', value: `${accountInfo.AccountLevel || 'N/A'}`, inline: true },
                    { name: '📅 Created On', value: accountInfo.AccountCreateTime ? toBDTime(accountInfo.AccountCreateTime) : 'N/A', inline: true },
                    { name: '🕒 Last Login', value: accountInfo.AccountLastLogin ? toBDTime(accountInfo.AccountLastLogin) : 'N/A', inline: true }
                );
            } else {
                embed.addFields(
                    { name: 'ℹ️ Note', value: 'Player info could not be loaded at this time.', inline: false }
                );
            }

            embed.addFields(
                { name: '🌟 **Follow Us!**', value: '[YouTube](https://www.youtube.com/@BrokenPlayz23) | [Telegram](https://t.me/goldserver23) | [TikTok](https://www.tiktok.com/@brokenplayz23_) | [Instagram](https://www.instagram.com/brokenplayz23/) | [Facebook](https://www.facebook.com/brokenplayz233/)', inline: true },
                { name: '🎯 **Join Our Community!**', value: '💬 Chat with us, get updates, and have fun! 🚀' }
            )
            .setFooter({ text: '🔥 Stay Legendary with BrokenPlayz! 🔥', iconURL: 'https://i.imgur.com/BmfOnwA.png' });

            return message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('API Error:', error.response?.data || error.message);
            return message.reply('❌ Failed to fetch data. Please check the inputs and try again.');
        }
    },
};

const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { likecollection, likeuserconfig } = require('../../mongodb');

const allowedChannels = ['1311789875972014090', '1349772318355751035'];
const allowedUsers = ['1197447304110673963', '1004206704994566164'];
const DEFAULT_LIMIT = 1;
const oneDay = 24 * 60 * 60 * 1000;

module.exports = {
    name: 'like',
    description: 'Give a like to a Free Fire player using UID.',

    execute: async (message, args) => {
        if (!allowedChannels.includes(message.channel.id)) {
            return message.reply('❌ This command can only be used in specific channels.\n👉 Click here to join the #FF-100-Likes channel: [Like-Commands Channel](https://discord.com/channels/1197458067504242799/1349772318355751035)');
        }

        if (args.length < 2) {
            return message.reply('❌ Usage: `!like <country> <UID>`\nExample: `!like bd 2349899077`');
        }

        const [country, uid] = args;
        const userId = message.author.id;
        const apiUrl = `https://brokenplayz23like.vercel.app/like?uid=${uid}&server_name=${country}`;
        const currentTime = Date.now();

        try {
            const userConfig = await likeuserconfig.findOne({ userId });
            const userLimit = userConfig?.limit ?? DEFAULT_LIMIT;

            const userLikeData = await likecollection.findOne({ userId }) || {};
            const likesUsed = userLikeData.likesUsed ?? 0;
            const lastUsed = userLikeData.lastUsed ?? 0;
            const uidEntry = userLikeData.uids?.find(entry => entry.uid === uid);

            if (!allowedUsers.includes(userId) && likesUsed >= userLimit && currentTime - lastUsed < oneDay) {
                const remainingTime = oneDay - (currentTime - lastUsed);
                const hoursLeft = Math.floor(remainingTime / (1000 * 60 * 60));
                const minutesLeft = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                const nextRequestTime = new Date(lastUsed + oneDay);
                const discordTimestamp = `<t:${Math.floor(nextRequestTime / 1000)}:f>`;

                return message.reply(`⚠️ Hey <@${userId}>! You’ve reached your daily free like request limit of ${userLimit}. No worries! You can send more **Free** likes after **${hoursLeft} hours and ${minutesLeft} minutes**, which will be at **${discordTimestamp}**. 😊✨ If you need more like requests, you can buy them from [Get Buying Ticket](https://discord.com/channels/1197458067504242799/1198032241108996306). 🚀`);
            }

            if (uidEntry && currentTime - uidEntry.lastLiked < oneDay) {
                const remainingTime = oneDay - (currentTime - uidEntry.lastLiked);
                const hoursLeft = Math.floor(remainingTime / (1000 * 60 * 60));
                const minutesLeft = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                const nextAvailableTimestamp = `<t:${Math.floor((uidEntry.lastLiked + oneDay) / 1000)}:f>`;

                return message.reply(
                    `💡 Oops! No likes were sent to **${uidEntry.nickname || 'this player'}** (UID: ${uid}) this time.\n` +
                    `🔁 It looks like you already liked this UID recently. Try again in **${hoursLeft}h ${minutesLeft}m** — that's around **${nextAvailableTimestamp}**. 💛✨`
                );
            }

            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data || !data.PlayerNickname) {
                return message.reply(`❌ Uh-oh! It looks like the UID **${uid}** you entered isn't correct or doesn't exist. Please check your game UID & try again. 🚀😊`);
            }

            const {
                PlayerNickname = 'Unknown',
                LikesbeforeCommand = 0,
                LikesafterCommand = 0,
                UID = 'Unknown'
            } = data;

            const LikesGiven = Math.max(0, LikesafterCommand - LikesbeforeCommand);

            if (LikesGiven <= 0) {
                return message.reply(
                    `💡 Oops! No likes were sent to **${PlayerNickname}** (UID: ${UID}) this time.\n` +
                    `🔁 It looks like you already liked this UID recently. No worries—try again after **24 hours** from your last claim. 💛✨`
                );
            }

            let playerLevel = 'Unknown';
            let playerRegion = 'Unknown';

            try {
                const infoResponse = await axios.get(`https://ariiflexlabs-playerinfo-icxc.onrender.com/ff_info?uid=${uid}&region=${country}`);
                const infoData = infoResponse.data;

                if (infoData?.AccountInfo) {
                    playerLevel = infoData.AccountInfo.AccountLevel || 'Unknown';
                    playerRegion = infoData.AccountInfo.AccountRegion || 'Unknown';
                }
            } catch (infoErr) {
                console.warn(`Could not fetch extra player info for UID ${uid}:`, infoErr.message);
            }

            const uidExists = userLikeData?.uids?.some(entry => entry.uid === uid);

            if (uidExists) {
                await likecollection.updateOne(
                    { userId, 'uids.uid': uid },
                    {
                        $set: {
                            lastUsed: currentTime,
                            'uids.$.lastLiked': currentTime,
                            'uids.$.nickname': PlayerNickname
                        },
                        $inc: { likesUsed: 1 }
                    }
                );
            } else {
                await likecollection.updateOne(
                    { userId },
                    {
                        $set: { lastUsed: currentTime },
                        $inc: { likesUsed: 1 },
                        $push: { uids: { uid, lastLiked: currentTime, nickname: PlayerNickname } }
                    },
                    { upsert: true }
                );
            }

            const embed = new EmbedBuilder()
                .setTitle(`🎉 Booyah! 🎊 ${PlayerNickname}, you received **${LikesGiven}** likes! 🥳`)
                .setDescription(
                    `👤 **Player:** ${PlayerNickname}\n` +
                    `🌍 **Region:** ${playerRegion}\n` +
                    `🎖️ **Level:** ${playerLevel}\n` +
                    `👍 **Likes Before:** ${LikesbeforeCommand}\n` +
                    `🔥 **Likes After:** ${LikesafterCommand}\n` +
                    `🎁 **Total Likes Given:** ${LikesGiven}\n` +
                    `🎗️ **Come back in 24 hours to claim your next free like! ✌️**`
                )
                .setColor('#FFD700')
                .setTimestamp()
                .addFields(
                    { name: '🌟 **Follow Us & Stay Updated!**', value: '[YouTube](https://www.youtube.com/@BrokenPlayz23) | [Telegram](https://t.me/goldserver23) | [TikTok](https://www.tiktok.com/@brokenplayz23_) | [Instagram](https://www.instagram.com/brokenplayz23/) | [Facebook](https://www.facebook.com/brokenplayz233/)', inline: true },
                    { name: '🎯 **Join Our Awesome Community!**', value: '💬 Chat with us, get exclusive updates, and enjoy special perks! 🚀' }
                )
                .setFooter({ text: '🔥 Stay Legendary with BrokenPlayz! 🔥', iconURL: 'https://i.imgur.com/BmfOnwA.png' });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('API Error:', error.response?.data || error.message);
            return message.reply(`❌ ⚠️ Oops, <@${userId}>! Something went wrong. 🤔 Please check your game UID, and if it’s correct, try again later. Don’t worry, we’re fixing it! 🚀 Thanks for your patience! 😊✨`);
        }
    },
};
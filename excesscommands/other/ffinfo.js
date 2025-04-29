const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Only allow command in these channel IDs
const allowedChannels = ['1355943354336149735']; // Add more channel IDs if needed

module.exports = {
  name: 'ffinfo',
  description: 'Get full Free Fire player profile using UID.',
  execute: async (message, args) => {
    if (!allowedChannels.includes(message.channel.id)) {
      return message.reply('❌ This command can only be used in specific channels.')
        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000));
    }

    if (args.length < 2) {
      return message.reply('❌ Usage: `!ffinfo <country> <UID>`\nExample: `!ffinfo bd 11349339253`')
        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000));
    }

    const [region, uid] = args;
    const profileApi = `https://brokenplay23-ff-info.onrender.com/api/account?uid=${uid}&region=${region}`;
    const rankApi = `https://akiru.vercel.app/AKIRU-rank-info?uid=${uid}&region=${region}`;
    const outfitApi = `https://wlx-demon-outfits.vercel.app/outfit_images?bg=https://iili.io/3VKgBqu.png&uid=${uid}&region=${region}&key=wlx_wb`;

    try {
      const [profileRes, rankRes, outfitRes] = await Promise.all([
        axios.get(profileApi),
        axios.get(rankApi),
        axios.get(outfitApi)
      ]);

      const profile = profileRes.data;
      const rankInfo = rankRes.data;
      const outfitInfo = outfitRes.data;

      if (!profile.basicInfo) {
        return message.reply(`❌ No data found for UID **${uid}** in **${region.toUpperCase()}**.`)
          .then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000));
      }

      const {
        basicInfo,
        captainBasicInfo,
        clanBasicInfo,
        creditScoreInfo,
        petInfo,
        socialInfo
      } = profile;

      const toBangladeshTime = (timestamp) =>
        new Date(timestamp * 1000).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

      const createdAt = basicInfo.createAt ? toBangladeshTime(basicInfo.createAt) : 'N/A';
      const lastLogin = basicInfo.lastLoginAt ? toBangladeshTime(basicInfo.lastLoginAt) : 'N/A';

      const embed = new EmbedBuilder()
        .setTitle(`🎮 Free Fire Profile - ${basicInfo.nickname || 'Unknown'}`)
        .setColor('#00FFCC')
        .setThumbnail(`https://iili.io/3XKjol4.png`)
        .setTimestamp()
        .addFields(
          { name: '🆔 UID:', value: `${uid}`, inline: false },
          { name: '🌍 Region:', value: `${basicInfo.region || region.toUpperCase()}`, inline: false },
          { name: '📅 Created:', value: `${createdAt}`, inline: false },
          { name: '🕒 Last Login:', value: `${lastLogin}`, inline: false },
          { name: '🔰 Level:', value: `${basicInfo.level}`, inline: false },
          { name: '⭐ EXP:', value: `${basicInfo.exp}`, inline: false },
          { name: '👍 Likes:', value: `${basicInfo.liked}`, inline: false }
        )
        .addFields(
          { name: '🏆 Battle Royale Rank:', value: `${rankInfo.BrRank || 'N/A'}`, inline: false },
          { name: '🎖️ BR Points:', value: `${basicInfo.rankingPoints || 'N/A'}`, inline: false },
          { name: '🏆 Clash Squad Rank:', value: `${rankInfo.CsRank || 'N/A'}`, inline: false },
          { name: '🎖️ CS Points:', value: `${basicInfo.csRankingPoints || 'N/A'}`, inline: false }
        )
        .addFields(
          { name: '👥 Guild Info:', value: `**Name:** ${clanBasicInfo.clanName || 'N/A'}\n**Level:** ${clanBasicInfo.clanLevel || 'N/A'}\n**Capacity:** ${clanBasicInfo.capacity || 'N/A'}`, inline: false },
          { name: '👑 Guild Leader:', value: `**Name:** ${captainBasicInfo.nickname || 'N/A'}\n**Level:** ${captainBasicInfo.level || 'N/A'}\n**UID:** ${captainBasicInfo.accountId || 'N/A'}\n**BR Rank:** ${captainBasicInfo.rank || 'N/A'}\n**CS Rank:** ${captainBasicInfo.csRank || 'N/A'}\n**Badges:** ${captainBasicInfo.badgeCnt || 'N/A'}\n**Joined:** ${captainBasicInfo.createAt ? toBangladeshTime(captainBasicInfo.createAt) : 'N/A'}`, inline: false }
        )
        .addFields(
          { name: '💳 Credit Score:', value: `${creditScoreInfo.creditScore || 'N/A'}`, inline: false },
          { name: '🎟️ Reward Status:', value: `${creditScoreInfo.rewardState || 'N/A'}`, inline: false }
        )
        .addFields(
          { name: '🐾 Pet:', value: `**Name:** ${petInfo.name || 'N/A'}\n**Level:** ${petInfo.level || 'N/A'}\n**EXP:** ${petInfo.exp || 'N/A'}\n**Skill ID:** ${petInfo.selectedSkillId || 'N/A'}`, inline: false }
        )
        .addFields(
          { name: '💬 Social Info:', value: `**Signature:** ${socialInfo.signature || 'N/A'}\n**Language:** ${socialInfo.language || 'N/A'}\n**Rank Show:** ${socialInfo.rankShow || 'N/A'}`, inline: false }
        )
        .setImage(outfitApi)
        .addFields(
          {
            name: '🌟 **Follow Us!**',
            value: '[YouTube](https://www.youtube.com/@BrokenPlayz23) | [Telegram](https://t.me/goldserver23) | [TikTok](https://www.tiktok.com/@brokenplayz23_) | [Instagram](https://www.instagram.com/brokenplayz23/) | [Facebook](https://www.facebook.com/brokenplayz233/)',
            inline: false
          },
          {
            name: '🎯 **Join Our Community!**',
            value: '💬 Chat with us, get updates, and have fun! 🚀',
            inline: false
          }
        )
        .setFooter({ text: '🔥 Stay Legendary with BrokenPlayz! 🔥', iconURL: 'https://i.imgur.com/BmfOnwA.png' });

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('FFINFO ERROR:', error);
      return message.reply('❌ Failed to fetch data. Please try again later.')
        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000));
    }
  }
};
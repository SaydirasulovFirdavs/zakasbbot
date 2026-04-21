require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const bot = new Telegraf(process.env.BOT_TOKEN || '');
console.log('DEBUG: Full Token used:', process.env.BOT_TOKEN);
const app = express();

app.use(cors());
app.use(bodyParser.json());

const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:5173';

// Middleware to validate Telegram WebApp Data
function validateTelegramData(initData, botToken) {
    if (!initData) return false;
    
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
        
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();
        
    const calculatedHash = crypto.createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
        
    return calculatedHash === hash;
}

// Health Check
app.get('/', (req, res) => {
    res.send('Bakery Bot API is running! 🥖');
});

bot.start((ctx) => {
    console.log(`Received /start from ${ctx.from.id}`);
    try {
        ctx.replyWithHTML(
            `<b>Xush kelibsiz, ${ctx.from.first_name}!</b> 🍰☕️\n\n` +
            `Bu yerdan siz eng mazali pishiriqlarni buyurtma qilishingiz mumkin. Mini-ilovamiz orqali menyuni ko'rish uchun pastdagi tugmani bosing:`,
            Markup.inlineKeyboard([
                [Markup.button.webApp("🛒 Menu & Buyurtma", WEB_APP_URL)]
            ])
        ).catch(err => console.error('Reply error:', err));
    } catch (e) {
        console.error('Start command error:', e);
    }
});

// API Endpoint for orders
app.post('/api/order', async (req, res) => {
    try {
        const { items, subTotal, discount, totalPrice, paymentMethod, user, initData, lang } = req.body;
        
        // Security Check
        if (!validateTelegramData(initData, process.env.BOT_TOKEN)) {
            console.warn('Security check failed for order');
            return res.status(403).json({ error: 'Xavfsizlik tekshiruvidan o\'tilmadi' });
        }

        const urlParams = new URLSearchParams(initData);
        const userData = JSON.parse(urlParams.get('user'));
        const chat_id = userData.id;

        const isUz = lang === 'uz';
        
        let orderSummary = `<b>${isUz ? 'Yangi buyurtma!' : 'Новый заказ!'} ✅</b>\n\n`;
        orderSummary += `<b>👤 ${isUz ? 'Mijoz' : 'Клиент'}:</b> ${user.name}\n`;
        orderSummary += `<b>📞 ${isUz ? 'Tel' : 'Тел'}:</b> ${user.phone}\n`;
        orderSummary += `<b>📍 ${isUz ? 'Manzil' : 'Адрес'}:</b> ${user.address}\n`;
        orderSummary += `<b>💳 ${isUz ? 'To\'lov' : 'Оплата'}:</b> ${paymentMethod === 'cash' ? (isUz ? 'Naqd' : 'Наличные') : (isUz ? 'Karta' : 'Карта')}\n\n`;
        
        orderSummary += `<b>📦 ${isUz ? 'Mahsulotlar' : 'Продукты'}:</b>\n`;
        items.forEach(item => {
            const itemName = isUz ? item.name_uz : item.name_ru;
            orderSummary += `- ${itemName} (${item.quantity}x) - ${(item.price * item.quantity).toLocaleString()} so'm\n`;
        });
        
        if (discount > 0) {
            orderSummary += `\n<b>🎁 ${isUz ? 'Chegirma' : 'Скидка'}:</b> -${discount.toLocaleString()} so'm`;
        }
        orderSummary += `\n<b>💰 ${isUz ? 'Jami' : 'Итого'}:</b> ${totalPrice.toLocaleString()} so'm`;

        // Send confirmation message
        await bot.telegram.sendMessage(chat_id, orderSummary, { parse_mode: 'HTML' });
        await bot.telegram.sendMessage(chat_id, isUz ? '✅ Buyurtmangiz qabul qilindi! Holatni shu yerda kuzatib borishingiz mumkin.' : '✅ Ваш заказ принят! Вы можете следить за статусом здесь.');

        // Simulate Status Updates
        setTimeout(() => {
            bot.telegram.sendMessage(chat_id, isUz ? '👨‍🍳 Buyurtmangiz tayyorlanmoqda...' : '👨‍🍳 Ваш заказ готовится...');
        }, 10000);

        setTimeout(() => {
            bot.telegram.sendMessage(chat_id, isUz ? '🚴 Kurer buyurtmani olib yo\'lga chiqdi!' : '🚴 Курьер забрал заказ и уже в пути!');
        }, 30000);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Order Error:', error);
        res.status(500).json({ error: 'Buyurtmani qayta ishlashda xatolik yuz berdi' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ API Server running on port ${PORT}`);
});

bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

bot.launch().then(() => {
    console.log('🚀 Bot successfully launched!');
}).catch(err => {
    console.error('Bot launch failed:', err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

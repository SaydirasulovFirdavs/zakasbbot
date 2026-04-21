require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { db, initDb } = require('./database');

const bot = new Telegraf(process.env.MY_NEW_BOT_TOKEN || '');
const app = express();

// Initialize Database
initDb().then(() => {
    console.log('📦 Database initialized and ready');
}).catch(err => {
    console.error('❌ Database initialization error:', err);
});

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

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

// Public: Get all products
app.get('/api/products', (req, res) => {
    db.all(`SELECT * FROM products WHERE is_active = 1`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin: Get statistics
app.get('/api/admin/stats', (req, res) => {
    const stats = {};
    db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
        stats.totalUsers = row.count;
        db.get(`SELECT COUNT(*) as count, SUM(total_price) as total FROM orders`, (err, row) => {
            stats.totalOrders = row.count;
            stats.totalRevenue = row.total || 0;
            res.json(stats);
        });
    });
});

// Admin: Get all orders
app.get('/api/admin/orders', (req, res) => {
    db.all(`SELECT * FROM orders ORDER BY created_at DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin: Get all users
app.get('/api/admin/users', (req, res) => {
    db.all(`SELECT * FROM users ORDER BY created_at DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin: Add/Update Product
app.post('/api/admin/products', (req, res) => {
    const { id, name_uz, name_ru, price, category, image, desc_uz, desc_ru } = req.body;
    if (id) {
        db.run(
            `UPDATE products SET name_uz=?, name_ru=?, price=?, category=?, image=?, desc_uz=?, desc_ru=? WHERE id=?`,
            [name_uz, name_ru, price, category, image, desc_uz, desc_ru, id],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, message: 'Yangilandi' });
            }
        );
    } else {
        db.run(
            `INSERT INTO products (name_uz, name_ru, price, category, image, desc_uz, desc_ru) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name_uz, name_ru, price, category, image, desc_uz, desc_ru],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID, message: 'Qo\'shildi' });
            }
        );
    }
});

// Categories API
app.get('/api/categories', (req, res) => {
    db.all(`SELECT * FROM categories`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/admin/categories', (req, res) => {
    const { id, uz, ru } = req.body;
    db.run(
        `INSERT INTO categories (id, uz, ru) VALUES (?, ?, ?)`,
        [id, uz, ru],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Kategoriya qo\'shildi' });
        }
    );
});

// Health Check
app.get('/', (req, res) => {
    res.send('Bakery Bot API is running! 🥖');
});

bot.start(async (ctx) => {
    console.log(`Received /start from ${ctx.from.id}`);
    
    // Save user to DB
    const { id, first_name, last_name, username } = ctx.from;
    db.run(
        `INSERT OR REPLACE INTO users (telegram_id, first_name, last_name, username) VALUES (?, ?, ?, ?)`,
        [id, first_name, last_name, username],
        (err) => { if (err) console.error('User save error:', err); }
    );

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
        const { items, subTotal, discount, totalPrice, paymentMethod, user, initData, lang, locationLink } = req.body;
        
        // Security Check
        if (!validateTelegramData(initData, process.env.MY_NEW_BOT_TOKEN)) {
            console.warn('Security check failed for order');
            return res.status(403).json({ error: 'Xavfsizlik tekshiruvidan o\'tilmadi' });
        }

        const urlParams = new URLSearchParams(initData);
        const userData = JSON.parse(urlParams.get('user'));
        const chat_id = userData.id;

        // Save order to DB
        db.run(
            `INSERT INTO orders (user_id, user_name, user_phone, user_address, total_price, discount, payment_method, items) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [chat_id, user.name, user.phone, user.address, totalPrice, discount, payment_method, JSON.stringify(items)],
            function(err) {
                if (err) console.error('Order DB save error:', err);
                else console.log('Order saved to DB with ID:', this.lastID);
            }
        );

        const isUz = lang === 'uz';
        
        let orderSummary = `<b>${isUz ? 'Yangi buyurtma!' : 'Новый заказ!'} ✅</b>\n\n`;
        orderSummary += `<b>👤 ${isUz ? 'Mijoz' : 'Клиент'}:</b> ${user.name}\n`;
        orderSummary += `<b>📞 ${isUz ? 'Tel' : 'Тел'}:</b> ${user.phone}\n`;
        orderSummary += `<b>📍 ${isUz ? 'Manzil' : 'Адрес'}:</b> ${user.address}\n`;
        if (locationLink) {
            orderSummary += `<b>🗺 ${isUz ? 'Xarita' : 'Карта'}:</b> <a href="${locationLink}">${isUz ? 'Joylashuvni ko\'rish' : 'Посмотреть локацию'}</a>\n`;
        }
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

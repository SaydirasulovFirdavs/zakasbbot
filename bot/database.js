const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'bakery.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Products Table
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name_uz TEXT,
                name_ru TEXT,
                price INTEGER,
                category TEXT,
                image TEXT,
                desc_uz TEXT,
                desc_ru TEXT,
                is_active INTEGER DEFAULT 1
            )`);

            // Categories Table
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                uz TEXT,
                ru TEXT
            )`);

            // Orders Table
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                user_name TEXT,
                user_phone TEXT,
                user_address TEXT,
                total_price INTEGER,
                discount INTEGER,
                payment_method TEXT,
                items TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Users Table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                telegram_id INTEGER PRIMARY KEY,
                first_name TEXT,
                last_name TEXT,
                username TEXT,
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) return reject(err);
                
                // Seed initial products if table is empty
                db.get(`SELECT COUNT(*) as count FROM products`, (err, row) => {
                    if (!err && row.count === 0) {
                        console.log('🌱 Seeding initial products...');
                        const initialProducts = [
                            ['Samsa go\'shtli', 'Самса с мясом', 8000, 'bread', '/images/samsa.png', 'An\'anaviy o\'zbek samsasi.', 'Традиционная узбекская самса.'],
                            ['Issiq Non', 'Горячий Хлеб', 5000, 'bread', '/images/non.png', 'Tandirdan uzilgan.', 'Свежий из тандыра.'],
                            ['Bo\'g\'irsoq', 'Богирсок', 500, 'bogirsoq', '/images/bogirsoq.png', 'Tilla rangli bo\'g\'irsoqlar.', 'Золотистые богирсоки.']
                        ];
                        const stmt = db.prepare(`INSERT INTO products (name_uz, name_ru, price, category, image, desc_uz, desc_ru) VALUES (?, ?, ?, ?, ?, ?, ?)`);
                        initialProducts.forEach(p => stmt.run(p));
                        stmt.finalize();
                    }
                });

                // Seed initial categories if empty
                db.get(`SELECT COUNT(*) as count FROM categories`, (err, row) => {
                    if (!err && row.count === 0) {
                        const initialCats = [
                            ['all', 'Hammasi', 'Все'],
                            ['bogirsoq', "Bo'g'irsoq", 'Богирсок'],
                            ['sweets', 'Shirinliklar', 'Сладости'],
                            ['bread', 'Non', 'Хлеб']
                        ];
                        const stmt = db.prepare(`INSERT INTO categories (id, uz, ru) VALUES (?, ?, ?)`);
                        initialCats.forEach(c => stmt.run(c));
                        stmt.finalize();
                    }
                    resolve();
                });
            });
        });
    });
};

module.exports = { db, initDb };

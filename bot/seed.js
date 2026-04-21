const { db, initDb } = require('./database');

const initialProducts = [
  {
    name_uz: 'Samsa go\'shtli',
    name_ru: 'Самса с мясом',
    price: 8000,
    category: 'bread',
    image: '/images/samsa.png',
    desc_uz: 'An\'anaviy o\'zbek samsasi.',
    desc_ru: 'Традиционная узбекская самса.'
  },
  {
    name_uz: 'Frantsuz Kruassani',
    name_ru: 'Французский Круассан',
    price: 12000,
    category: 'sweets',
    image: '/images/kruassan.png',
    desc_uz: 'Yumshoq va qatlamli.',
    desc_ru: 'Мягкий и слоеный.'
  },
  {
    name_uz: 'Glazurli Donat',
    name_ru: 'Глазированный Донат',
    price: 10000,
    category: 'sweets',
    image: '/images/donat.png',
    desc_uz: 'Shirin glazur bilan.',
    desc_ru: 'Со сладкой глазурью.'
  },
  {
    name_uz: 'Bo\'g\'irsoq',
    name_ru: 'Богирсок',
    price: 500,
    category: 'bogirsoq',
    image: '/images/bogirsoq.png',
    desc_uz: 'Tilla rangli bo\'g\'irsoqlar.',
    desc_ru: 'Золотистые богирсоки.'
  },
  {
    name_uz: 'Issiq Non',
    name_ru: 'Горячий Хлеб',
    price: 5000,
    category: 'bread',
    image: '/images/non.png',
    desc_uz: 'Tandirdan uzilgan.',
    desc_ru: 'Свежий из тандыра.'
  },
  {
    name_uz: 'Patir Non',
    name_ru: 'Патир Нон',
    price: 15000,
    category: 'bread',
    image: '/images/patir.png',
    desc_uz: 'Sariyog\'li patir.',
    desc_ru: 'Патир на сливочном масле.'
  },
  {
    name_uz: 'Paxlava',
    name_ru: 'Пахлава',
    price: 25000,
    category: 'sweets',
    image: '/images/paxlava.png',
    desc_uz: 'Asalli va yong\'oqli.',
    desc_ru: 'С медом и орехами.'
  },
  {
    name_uz: 'Chak-chak',
    name_ru: 'Чак-чак',
    price: 18000,
    category: 'sweets',
    image: '/images/chakchak.png',
    desc_uz: 'Milliy shirinlik.',
    desc_ru: 'Национальная сладость.'
  }
];

const seed = async () => {
    await initDb();
    console.log('Seeding products...');
    
    for (const p of initialProducts) {
        db.run(
            `INSERT INTO products (name_uz, name_ru, price, category, image, desc_uz, desc_ru) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [p.name_uz, p.name_ru, p.price, p.category, p.image, p.desc_uz, p.desc_ru]
        );
    }
    console.log('Done seeding!');
};

seed();

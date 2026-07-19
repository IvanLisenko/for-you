const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'answers.json');

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

app.post('/api/save', (req, res) => {
    const data = req.body;
    data.received_at = new Date().toISOString();

    let answers = [];
    try {
        const raw = fs.readFileSync(DATA_FILE);
        answers = JSON.parse(raw);
    } catch (e) {
        answers = [];
    }

    answers.push(data);
    fs.writeFileSync(DATA_FILE, JSON.stringify(answers, null, 2));

    console.log('📩 НОВЫЙ ОТВЕТ:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Имя: ${data.name}`);
    console.log(`🍕 Еда: ${data.food}`);
    console.log(`🍷 Напиток: ${data.drink}`);
    console.log(`🐾 Питомец: ${data.pet}`);
    console.log(`🎯 Квест: ${data.quest}`);
    console.log(`📅 Дата: ${data.date}`);
    console.log(`⏰ Время: ${data.time}`);
    console.log(`😊 Настроение: ${data.mood1}% → ${data.mood2}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    res.json({ success: true, message: 'Сова доставила письмо!' });
});

app.get('/api/answers', (req, res) => {
    try {
        const raw = fs.readFileSync(DATA_FILE);
        res.json(JSON.parse(raw));
    } catch (e) {
        res.json([]);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║   🦉 СОВА ЗАПУЩЕНА!                 ║
    ║   Открывай: http://localhost:${PORT}   ║
    ║   Или с телефона: http://192.168.3.19:${PORT} ║
    ╚═══════════════════════════════════════╝
    `);
});
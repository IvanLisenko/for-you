const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const RESPONSES_FILE = path.join(DATA_DIR, "responses.json");

const QUESTS = {
  "1": "Шерлок",
  "2": "Зазеркалье",
  "3": "В плену Дэвида Джонса",
  "4": "Тайна фараонов",
  "5": "Тайна Гарри"
};

// ===== НАСТРОЙКИ TELEGRAM =====
const TELEGRAM_TOKEN = '8919836690:AAGE0woa_Td73IX419Rkz7_siKdDTaDgLPQ';
const TELEGRAM_CHAT_ID = '1295376533';

async function sendTelegramNotification(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    if (result.ok) {
      console.log('✅ Уведомление в Telegram успешно отправлено!');
    } else {
      console.error('❌ Telegram ответил ошибкой:', result);
    }
  } catch (error) {
    console.error('❌ Ошибка отправки в Telegram:', error);
  }
}
// ===============================

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));
app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "autumn-fairytale" });
});

app.post("/api/save", async (req, res) => {
  try {
    const questId = String(req.body?.questId ?? "");
    const date = String(req.body?.date ?? "");

    if (!Object.hasOwn(QUESTS, questId)) {
      return res.status(400).json({ ok: false, message: "Выбери один из пяти квестов." });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ ok: false, message: "Укажи корректную дату." });
    }

    const parsedDate = new Date(`${date}T12:00:00`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      return res.status(400).json({ ok: false, message: "Укажи корректную дату." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(`${date}T00:00:00`);
    if (chosen < today) {
      return res.status(400).json({ ok: false, message: "Дата не может быть в прошлом." });
    }

    await fs.mkdir(DATA_DIR, { recursive: true });

    let responses = [];
    try {
      const raw = await fs.readFile(RESPONSES_FILE, "utf8");
      responses = JSON.parse(raw);
      if (!Array.isArray(responses)) responses = [];
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    const response = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      questId,
      quest: QUESTS[questId],
      date,
      receivedAt: new Date().toISOString()
    };

    responses.push(response);
    await fs.writeFile(RESPONSES_FILE, `${JSON.stringify(responses, null, 2)}\n`, "utf8");

    console.log(`🍁 Получен ответ: ${response.quest}, дата ${response.date}`);

    // ===== ОТПРАВЛЯЕМ В TELEGRAM =====
    const tgMessage = `
<b>🍁 Новый ответ на приглашение!</b>

🎯 <b>Квест:</b> ${response.quest}
📅 <b>Дата:</b> ${response.date}
🕒 <b>Получено:</b> ${new Date(response.receivedAt).toLocaleString('ru-RU')}
    `;
    
    sendTelegramNotification(tgMessage);

    return res.status(201).json({ ok: true, message: "Ответ сохранён. Сказка началась!" });
  } catch (error) {
    console.error("Не удалось сохранить ответ:", error);
    return res.status(500).json({
      ok: false,
      message: "Не удалось сохранить ответ. Попробуй ещё раз чуть позже."
    });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ ok: false, message: "API-маршрут не найден." });
  }
  return res.sendFile(path.join(PUBLIC_DIR, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.listen(PORT, () => {
  console.log(`🍂 Осенняя сказка запущена: http://localhost:${PORT}`);
});
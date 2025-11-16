import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(express.json());
app.use(cors());

// Telegram
const BOT_TOKEN = "8278406628:AAEC8yF_ZRjSbEVNsz-1RDXejm-HxK-P0MY";
const CHAT_ID = "1395598568";

// POST маршрут для заказов
app.post("/api/order", async (req, res) => {
  try {
    const { firstName, lastName, phone, items = [], total = 0 } = req.body;
    if (!firstName || !phone) return res.status(400).json({ error: "Имя и телефон обязательны" });

    const lines = ["📦 Новый заказ"];
    lines.push(`👤 ${firstName} ${lastName || ""}`);
    lines.push(`📞 ${phone}`);
    lines.push(`Итого: ${Number(total).toLocaleString("ru-RU")} сум`);
    const message = lines.join("\n");

    const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });

    const tgData = await tgResponse.json();
    if (!tgResponse.ok || tgData.ok === false) return res.status(500).json({ error: "Telegram error", details: tgData });

    res.json({ success: true, message: "Заказ успешно отправлен!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// 🚫 Для всех остальных запросов делаем 404 (без "*")
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

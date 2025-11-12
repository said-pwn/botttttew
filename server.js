import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

// 🧱 Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

// ⚙️ Конфигурация Telegram
const BOT_TOKEN = "8278406628:AAEC8yF_ZRjSbEVNsz-1RDXejm-HxK-P0MY";
const CHAT_ID = "1395598568";

// 📩 POST маршрут для заказов
app.post("/api/order", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      delivery,
      payment,
      date,
      comment,
      items = [],
      total = 0,
    } = req.body || {};

    if (!firstName || !phone) {
      return res.status(400).json({ error: "Имя и телефон обязательны" });
    }

    const lines = [];
    lines.push("Новый заказ на свечи");
    lines.push("━━━━━━━━━━━━━━━");
    lines.push(` Имя: ${firstName}${lastName ? " " + lastName : ""}`);
    lines.push(` Телефон: ${phone}`);
    if (delivery) lines.push(` Доставка: ${delivery}`);
    if (payment) lines.push(` Оплата: ${payment}`);
    if (date) lines.push(` Дата отправки: ${date}`);
    if (comment) lines.push(` Комментарий: ${comment}`);

    if (Array.isArray(items) && items.length) {
      lines.push("───────────────");
      lines.push("Состав заказа:");
      items.forEach((it, idx) => {
        const name = it?.name ?? "Товар";
        const qty = Number(it?.quantity ?? 1);
        const price = Number(it?.price ?? 0);
        const sum = (price * qty).toLocaleString("ru-RU");

        // Добавляем выбранный тип/вариант/категорию/цвет/размер, если есть
        const details = [];
        if (it?.type) details.push(`тип: ${it.type}`);
        if (it?.variant) details.push(`вариант: ${it.variant}`);
        if (it?.categoryName || it?.category) details.push(`категория: ${it.categoryName || it.category}`);
        if (it?.color) details.push(`цвет: ${it.color}`);
        if (it?.size) details.push(`размер: ${it.size}`);
        if (it?.scent) details.push(`аромат: ${it.scent}`);
        if (it?.wick) details.push(`фитиль: ${it.wick}`);
        if (typeof it?.cottonWick === 'boolean') details.push(`хлопковый фитиль: ${it.cottonWick ? 'да' : 'нет'}`);
        const extra = details.length ? ` (${details.join(", ")})` : "";

        lines.push(`${idx + 1}) ${name}${extra} × ${qty} — ${sum} сум`);
      });
    }

    lines.push("───────────────");
    lines.push(`Итого: ${Number(total || 0).toLocaleString("ru-RU")} сум`);

    const message = lines.join("\n");

    // Отправляем простой текст (без Markdown), чтобы избежать ошибок парсинга
    const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });

    let tgData = null;
    try { tgData = await tgResponse.json(); } catch (_) {}

    if (!tgResponse.ok || (tgData && tgData.ok === false)) {
      console.error("Ошибка Telegram:", tgData);
      return res.status(500).json({ error: "Ошибка при отправке в Telegram", details: tgData });
    }

    console.log("✅ Новый заказ успешно отправлен в Telegram");
    return res.json({ success: true, message: "Заказ успешно отправлен!" });
  } catch (err) {
    console.error("Ошибка сервера:", err);
    return res.status(500).json({ error: "Ошибка на сервере" });
  }
});

// 🚀 Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Сервер запущен на порту ${PORT}`));

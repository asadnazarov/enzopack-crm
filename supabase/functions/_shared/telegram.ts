export async function sendTelegramMessage(text: string, replyMarkup?: unknown, chatId?: string) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const targetChatId = chatId ?? Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !targetChatId) {
    throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы в секретах функции')
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: targetChatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Telegram API error: ${res.status} ${body}`)
  }
  return res.json()
}

export function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: 'Сегодня', callback_data: 'report:today' },
        { text: 'Неделя', callback_data: 'report:week' },
        { text: 'Месяц', callback_data: 'report:month' },
      ],
    ],
  }
}

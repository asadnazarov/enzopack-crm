// Регистрируется как Telegram webhook (см. README для команды setWebhook).
// Обрабатывает /start и кнопки "Сегодня" / "Неделя" / "Месяц" / произвольная дата.
import { buildReport, type ReportRange } from '../_shared/reportBuilder.ts'
import { mainMenuKeyboard, sendTelegramMessage } from '../_shared/telegram.ts'

const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/

Deno.serve(async (req) => {
  try {
    const update = await req.json()

    const message = update.message
    const callback = update.callback_query

    if (callback) {
      const chatId = String(callback.message.chat.id)
      const data: string = callback.data ?? ''
      const range = data.replace('report:', '') as ReportRange
      const text = await buildReport(range)
      await sendTelegramMessage(text, undefined, chatId)
      return new Response('ok')
    }

    if (message) {
      const chatId = String(message.chat.id)
      const text: string = message.text ?? ''

      if (text === '/start' || text === '/report') {
        await sendTelegramMessage(
          'Выберите период отчёта или пришлите дату в формате ДД.ММ.ГГГГ:',
          mainMenuKeyboard(),
          chatId,
        )
        return new Response('ok')
      }

      const dateMatch = text.match(DATE_RE)
      if (dateMatch) {
        const [, dd, mm, yyyy] = dateMatch
        const iso = `${yyyy}-${mm}-${dd}`
        const report = await buildReport({ from: iso, to: iso })
        await sendTelegramMessage(report, undefined, chatId)
        return new Response('ok')
      }

      await sendTelegramMessage(
        'Не понял команду. Нажмите /start, чтобы увидеть меню отчётов.',
        undefined,
        chatId,
      )
    }

    return new Response('ok')
  } catch (error) {
    console.error(error)
    return new Response('ok') // Telegram ожидает 200 даже при внутренней ошибке
  }
})

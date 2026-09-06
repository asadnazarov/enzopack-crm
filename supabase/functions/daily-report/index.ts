// Вызывается раз в день (см. .github/workflows/daily-report.yml) и шлёт
// руководителю сводку за текущий день в Telegram.
import { buildReport } from '../_shared/reportBuilder.ts'
import { sendTelegramMessage } from '../_shared/telegram.ts'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  const expected = `Bearer ${Deno.env.get('FUNCTION_SHARED_SECRET') ?? ''}`
  if (Deno.env.get('FUNCTION_SHARED_SECRET') && authHeader !== expected) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const text = await buildReport('today')
    await sendTelegramMessage(text)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

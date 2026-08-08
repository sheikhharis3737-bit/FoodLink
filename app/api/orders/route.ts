import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const result = await db.execute(sql`SELECT id, created_at AS "createdAt", customer, lines, grand_total AS "grandTotal" FROM foodlink_orders ORDER BY created_at DESC`)
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const order = await request.json()
  if (!order?.id || !order?.customer || !Array.isArray(order.lines) || !Number.isFinite(Number(order.grandTotal))) {
    return NextResponse.json({ error: 'Invalid order payload.' }, { status: 400 })
  }

  await db.execute(sql`INSERT INTO foodlink_orders (id, created_at, customer, lines, grand_total)
    VALUES (${String(order.id)}, COALESCE(${order.createdAt ? new Date(order.createdAt) : null}, NOW()), ${JSON.stringify(order.customer)}::jsonb, ${JSON.stringify(order.lines)}::jsonb, ${Math.round(Number(order.grandTotal))})
    ON CONFLICT (id) DO NOTHING`)

  return NextResponse.json({ ok: true })
}

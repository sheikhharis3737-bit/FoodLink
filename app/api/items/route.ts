import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const result = await db.execute(sql`SELECT id, name, price, unit, updated_at AS "updatedAt", visible, sort_order AS "sortOrder", category_id AS "categoryId" FROM foodlink_items ORDER BY sort_order ASC, name ASC`)
  return NextResponse.json(result.rows)
}

export async function PUT(request: Request) {
  const body = await request.json()
  if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid catalog payload.' }, { status: 400 })

  await db.transaction(async (tx) => {
    for (const item of body) {
      if (!item?.id || !item?.name?.trim() || !Number.isFinite(Number(item.price))) continue
      await tx.execute(sql`INSERT INTO foodlink_items (id, name, price, unit, updated_at, visible, sort_order, category_id)
        VALUES (${String(item.id)}, ${String(item.name).trim()}, ${Math.round(Number(item.price))}, ${String(item.unit || 'KG')}, NOW(), ${item.visible !== false}, ${Number(item.sortOrder) || 0}, ${String(item.categoryId || 'uncategorized')})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, unit = EXCLUDED.unit, updated_at = NOW(), visible = EXCLUDED.visible, sort_order = EXCLUDED.sort_order, category_id = EXCLUDED.category_id`)
    }
    const ids = body.filter((item: { id?: string }) => item?.id).map((item: { id: string }) => item.id)
    if (ids.length) await tx.execute(sql`DELETE FROM foodlink_items WHERE id NOT IN (${sql.join(ids.map((id: string) => sql`${id}`), sql`, `)})`)
    else await tx.execute(sql`DELETE FROM foodlink_items`)
  })

  return GET()
}

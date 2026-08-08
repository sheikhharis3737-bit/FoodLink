import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

async function ensureMarketPriceColumn() {
  const existsRow = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'foodlink_items'
        AND column_name = 'market_price'
    ) AS "exists"
  `)

  const hasColumn = Boolean((existsRow.rows?.[0] as { exists?: boolean } | undefined)?.exists)
  if (!hasColumn) {
    await db.execute(sql`ALTER TABLE foodlink_items ADD COLUMN market_price INTEGER NOT NULL DEFAULT 0`)
  }
}

export async function GET() {
  await ensureMarketPriceColumn()
  const result = await db.execute(sql`SELECT id, name, price, market_price AS "marketPrice", unit, updated_at AS "updatedAt", visible, sort_order AS "sortOrder", category_id AS "categoryId" FROM foodlink_items ORDER BY sort_order ASC, name ASC`)
  return NextResponse.json(result.rows)
}

export async function PUT(request: Request) {
  const body = await request.json()
  if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid catalog payload.' }, { status: 400 })

  await ensureMarketPriceColumn()

  await db.transaction(async (tx) => {
    for (const item of body) {
      if (!item?.id || !item?.name?.trim() || !Number.isFinite(Number(item.price))) continue
      const marketPrice = Number(item.marketPrice ?? item.price ?? 0)
      const salePrice = Number(item.price)
      await tx.execute(sql`INSERT INTO foodlink_items (id, name, price, market_price, unit, updated_at, visible, sort_order, category_id)
        VALUES (${String(item.id)}, ${String(item.name).trim()}, ${Math.round(salePrice)}, ${Math.round(marketPrice)}, ${String(item.unit || 'KG')}, NOW(), ${item.visible !== false}, ${Number(item.sortOrder) || 0}, ${String(item.categoryId || 'uncategorized')})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, market_price = EXCLUDED.market_price, unit = EXCLUDED.unit, updated_at = NOW(), visible = EXCLUDED.visible, sort_order = EXCLUDED.sort_order, category_id = EXCLUDED.category_id`)
    }
    const ids = body.filter((item: { id?: string }) => item?.id).map((item: { id: string }) => item.id)
    if (ids.length) await tx.execute(sql`DELETE FROM foodlink_items WHERE id NOT IN (${sql.join(ids.map((id: string) => sql`${id}`), sql`, `)})`)
    else await tx.execute(sql`DELETE FROM foodlink_items`)
  })

  return GET()
}

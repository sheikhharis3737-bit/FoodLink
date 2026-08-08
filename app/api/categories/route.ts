import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    const categories = await pool.query('SELECT id, name, sort_order FROM foodlink_categories ORDER BY sort_order ASC')
    return NextResponse.json(categories.rows)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const categories = (await request.json()) as { id: string; name: string; sort_order: number }[]
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const existingIds = new Set(categories.map((c) => c.id))
      await client.query('DELETE FROM foodlink_categories WHERE id NOT IN ($1)', [existingIds.size ? Array.from(existingIds) : ['_none']])
      for (const cat of categories) {
        await client.query(
          'INSERT INTO foodlink_categories (id, name, sort_order) VALUES ($1, $2, $3) ON CONFLICT(id) DO UPDATE SET name = $2, sort_order = $3',
          [cat.id, cat.name, cat.sort_order]
        )
      }
      await client.query('COMMIT')
      return NextResponse.json({ success: true })
    } catch (txnError) {
      await client.query('ROLLBACK')
      throw txnError
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[API] Category save failed:', error)
    return NextResponse.json({ error: 'Failed to save categories' }, { status: 500 })
  }
}

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const globalForDb = globalThis as unknown as { foodlinkPool?: Pool }

export const pool = globalForDb.foodlinkPool ?? new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== 'production') globalForDb.foodlinkPool = pool

export const db = drizzle(pool)

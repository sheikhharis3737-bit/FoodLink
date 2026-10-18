import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type Product = {
  id: string;
  name: string;
  price: number;
  packWeight: number;
  unit: string;
  image: string;
  sortOrder: number;
};

type BrandCategory = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  products: Product[];
};

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS foodlink_brand_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS foodlink_brand_products (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES foodlink_brand_categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      unit TEXT NOT NULL DEFAULT 'KG',
      image TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);
  await pool.query(`
    ALTER TABLE foodlink_brand_products
    ADD COLUMN IF NOT EXISTS pack_weight NUMERIC NOT NULL DEFAULT 1
  `);
}

export async function GET() {
  try {
    await ensureTables();
    const [categoriesResult, productsResult] = await Promise.all([
      pool.query(
        "SELECT id, name, description, sort_order AS \"sortOrder\" FROM foodlink_brand_categories ORDER BY sort_order, name",
      ),
      pool.query(
        "SELECT id, category_id AS \"categoryId\", name, price, pack_weight AS \"packWeight\", 'KGS' AS unit, image, sort_order AS \"sortOrder\" FROM foodlink_brand_products ORDER BY sort_order, name",
      ),
    ]);

    const categories: BrandCategory[] = categoriesResult.rows.map((category) => ({
      ...category,
      products: productsResult.rows.filter(
        (product) => product.categoryId === category.id,
      ),
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[API] Brand catalog load failed:", error);
    return NextResponse.json(
      { error: "Could not load the brand catalog." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const categories = (await request.json()) as BrandCategory[];
    if (
      !Array.isArray(categories) ||
      categories.some(
        (category) =>
          !category?.id ||
          !category.name?.trim() ||
          !Array.isArray(category.products),
      )
    ) {
      return NextResponse.json(
        { error: "Invalid brand catalog payload." },
        { status: 400 },
      );
    }

    for (const category of categories) {
      for (const product of category.products) {
        if (
          !product.id ||
          !product.name?.trim() ||
          !Number.isFinite(Number(product.price)) ||
          Number(product.price) < 0 ||
          !Number.isFinite(Number(product.packWeight ?? 1)) ||
          Number(product.packWeight ?? 1) <= 0 ||
          (product.image &&
            (!/^data:image\/(jpeg|png|webp);base64,/.test(product.image) ||
              product.image.length > 2_800_000))
        ) {
          return NextResponse.json(
            { error: "Invalid product data or image is too large (2 MB max)." },
            { status: 400 },
          );
        }
      }
    }

    await ensureTables();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const categoryIds = categories.map((category) => category.id);
      await client.query(
        "DELETE FROM foodlink_brand_categories WHERE NOT (id = ANY($1::text[]))",
        [categoryIds],
      );

      for (const [categoryIndex, category] of categories.entries()) {
        await client.query(
          `INSERT INTO foodlink_brand_categories (id, name, description, sort_order)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order`,
          [
            category.id,
            category.name.trim(),
            category.description || "",
            category.sortOrder ?? categoryIndex,
          ],
        );

        const productIds = category.products.map((product) => product.id);
        await client.query(
          "DELETE FROM foodlink_brand_products WHERE category_id = $1 AND NOT (id = ANY($2::text[]))",
          [category.id, productIds],
        );

        for (const [productIndex, product] of category.products.entries()) {
          await client.query(
            `INSERT INTO foodlink_brand_products (id, category_id, name, price, pack_weight, unit, image, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, price = EXCLUDED.price, pack_weight = EXCLUDED.pack_weight, unit = EXCLUDED.unit, image = EXCLUDED.image, sort_order = EXCLUDED.sort_order`,
            [
              product.id,
              category.id,
              product.name.trim(),
              Math.round(Number(product.price)),
              Number(product.packWeight ?? 1),
              "KGS",
              product.image || "",
              product.sortOrder ?? productIndex,
            ],
          );
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return GET();
  } catch (error) {
    console.error("[API] Brand catalog save failed:", error);
    return NextResponse.json(
      { error: "Could not save the brand catalog." },
      { status: 500 },
    );
  }
}

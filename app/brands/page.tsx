"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Menu, ShoppingBasket, X } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
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

const money = (value: number) => `Rs.${value.toLocaleString("en-PK")}`;

export default function BrandsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<BrandCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/brands")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load the product catalog.");
        setCategories(await response.json());
      })
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load the product catalog.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="site-shell">
      <div className="announcement-banner">
        <div className="announcement-content">
          <p>
            <strong>Wholesale categories & products</strong> across Pakistan •{" "}
            <strong>Bulk orders</strong> ready for delivery
          </p>
        </div>
      </div>

      <header className="site-header">
        <a className="brand" href="/" aria-label="Food Link home">
          <span className="brand-mark">
            <ShoppingBasket size={21} />
          </span>
          <span>
            FOOD LINK<small>WHOLESALE GROCERIES</small>
          </span>
        </a>
        <nav
          className={menuOpen ? "main-nav is-open" : "main-nav"}
          aria-label="Primary navigation"
        >
          <a href="/" onClick={() => setMenuOpen(false)}>
            Home
          </a>
          <a href="/brands" onClick={() => setMenuOpen(false)}>
            Brands
          </a>
          <a href="/build-order" onClick={() => setMenuOpen(false)}>
            Build order
          </a>
          <a href="/#how-it-works" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="tel:03088458884">Call us</a>
        </nav>
        <button
          className="menu-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="page-hero">
        <div className="page-hero-copy">
          <p className="eyebrow">
            <span /> Wholesale categories & products
          </p>
          <h1>Find the right products for your business</h1>
          <p>
            Browse Food Link&apos;s wholesale range by category. Product photos,
            prices, and availability are managed by our team.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/build-order">
              Build order <ArrowRight size={18} />
            </a>
            <a
              className="button button-quiet"
              href="https://wa.me/923088458884"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      <section className="brand-showcase">
        <div className="section-heading mb-tight">
          <p className="eyebrow">
            <span /> Food Link wholesale catalog
          </p>
          <h2>Shop by category</h2>
        </div>

        {error && <p className="form-notice">{error}</p>}
        {loading ? (
          <p className="empty-state">Loading wholesale categories…</p>
        ) : categories.length ? (
          <div className="brand-category-list">
            {categories.map((category) => (
              <section className="brand-category" key={category.id}>
                <div className="brand-category-heading">
                  <div>
                    <p className="eyebrow">
                      <span /> Wholesale selection
                    </p>
                    <h3>{category.name}</h3>
                    {category.description && <p>{category.description}</p>}
                  </div>
                  <span className="brand-category-count">
                    {category.products.length}{" "}
                    {category.products.length === 1 ? "product" : "products"}
                  </span>
                </div>
                {category.products.length ? (
                  <div className="brand-product-grid">
                    {category.products.map((product) => (
                      <article className="brand-product-card" key={product.id}>
                        <div className="brand-product-image">
                          {product.image ? (
                            <img src={product.image} alt={product.name} />
                          ) : (
                            <span className="brand-product-image-empty">
                              Food Link wholesale
                            </span>
                          )}
                        </div>
                        <div className="brand-product-info">
                          <h4>{product.name}</h4>
                          <div>
                            <strong>{money(product.price)}</strong>
                            <span>per {product.unit}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">
                    Products in this category will be listed soon.
                  </p>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="brand-empty-state">
            <ShoppingBasket size={30} />
            <h3>Our wholesale catalog is being prepared</h3>
            <p>
              Product categories and prices will appear here as soon as they
              are added by Food Link.
            </p>
            <a
              className="button button-primary"
              href="https://wa.me/923088458884"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask us about bulk products <ArrowRight size={17} />
            </a>
          </div>
        )}
      </section>
    </main>
  );
}

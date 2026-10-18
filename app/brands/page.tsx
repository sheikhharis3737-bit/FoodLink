"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Menu, ShoppingBasket, Star, X } from "lucide-react";

type Brand = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  featured?: boolean;
  categories: { name: string; items: { name: string; price: number; unit: string }[] }[];
};

const STORAGE_KEY = "foodlink-brands";

const defaultBrands: Brand[] = [
  {
    id: "premium-rice",
    name: "Premium Rice House",
    tagline: "Best-selling basmati and sella rice",
    description: "Trusted by retailers and food businesses for premium quality grain and dependable wholesale value.",
    image: "https://images.unsplash.com/photo-1586201375761-83865001a6d8?auto=format&fit=crop&w=900&q=80",
    featured: true,
    categories: [
      {
        name: "Rice Varieties",
        items: [
          { name: "Super Kernel Basmati", price: 420, unit: "KG" },
          { name: "Broken Rice 1121", price: 285, unit: "KG" },
          { name: "Super Kernel Sella", price: 445, unit: "KG" },
        ],
      },
    ],
  },
  {
    id: "pulse-market",
    name: "Pulse Market",
    tagline: "Lentils, chickpeas and legumes",
    description: "Fresh pulses and legumes for homestyle kitchens, shops, and institutional buyers.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
    categories: [
      {
        name: "Pulses & Legumes",
        items: [
          { name: "White Chickpeas", price: 360, unit: "KG" },
          { name: "Red Lentils", price: 310, unit: "KG" },
          { name: "Masoor Premium", price: 325, unit: "KG" },
        ],
      },
    ],
  },
  {
    id: "grain-supply",
    name: "Grain Supply Co.",
    tagline: "Daily staples for bulk buyers",
    description: "A reliable source for household staple grains, flour, and bakery essentials.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    categories: [
      {
        name: "Flours & Grains",
        items: [
          { name: "Gram Flour (Besan)", price: 290, unit: "KG" },
          { name: "Whole Wheat Flour", price: 260, unit: "KG" },
          { name: "Corn Flour", price: 240, unit: "KG" },
        ],
      },
    ],
  },
];

const money = (value: number) => `Rs.${value.toLocaleString("en-PK")}`;

export default function BrandsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>(defaultBrands);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Brand[];
        if (Array.isArray(parsed) && parsed.length) {
          setBrands(parsed);
        }
      }
    } catch {
      setBrands(defaultBrands);
    }
  }, []);

  const featuredBrands = useMemo(
    () => brands.filter((brand) => brand.featured || brand.categories?.length),
    [brands],
  );

  return (
    <main className="site-shell">
      <div className="announcement-banner">
        <div className="announcement-content">
          <p>
            <strong>Trusted wholesale inventory</strong> across Pakistan • <strong>Bulk orders</strong> ready for delivery
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
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Primary navigation">
          <a href="/" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="/brands" onClick={() => setMenuOpen(false)}>Brands</a>
          <a href="/build-order" onClick={() => setMenuOpen(false)}>Build order</a>
          <a href="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="tel:03088458884">Call us</a>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu" aria-expanded={menuOpen}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="page-hero">
        <div className="page-hero-copy">
          <p className="eyebrow">
            <span /> Wholesale categories & brands
          </p>
          <h1>Explore trusted Food Link brands</h1>
          <p>
            Discover quality rice, pulses, flour, and staple product ranges curated for retailers, restaurants, and bulk buyers.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/build-order">
              Build order <ArrowRight size={18} />
            </a>
            <a className="button button-quiet" href="https://wa.me/923088458884" target="_blank" rel="noopener noreferrer">
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      <section className="brand-showcase">
        <div className="section-heading mb-tight">
          <p className="eyebrow">
            <span /> Featured wholesale lines
          </p>
          <h2>Popular supplier categories</h2>
        </div>

        <div className="brand-grid">
          {featuredBrands.map((brand) => (
            <article className="brand-card" key={brand.id}>
              <div className="brand-image-wrap">
                <img src={brand.image} alt={brand.name} />
                {brand.featured && (
                  <span className="brand-badge">
                    <Star size={12} /> Featured
                  </span>
                )}
              </div>
              <div className="brand-body">
                <h3>{brand.name}</h3>
                <p className="brand-tagline">{brand.tagline}</p>
                <p className="brand-description">{brand.description}</p>
                <div className="brand-products">
                  {brand.categories.map((category) => (
                    <div key={`${brand.id}-${category.name}`}>
                      <strong>{category.name}</strong>
                      <ul>
                        {category.items.map((item) => (
                          <li key={`${brand.id}-${category.name}-${item.name}`}>
                            <span>{item.name}</span>
                            <em>{money(item.price)}</em>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

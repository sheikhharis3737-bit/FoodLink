"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  MapPin,
  Menu,
  Minus,
  Phone,
  Plus,
  ShoppingBasket,
  Truck,
  X,
} from "lucide-react";

type Item = {
  id: string;
  name: string;
  price: number;
  marketPrice: number;
  unit: string;
  updatedAt: string;
  visible: boolean;
  sortOrder: number;
  categoryId: string;
};
type Category = { id: string; name: string; sort_order: number };
type OrderLine = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
};
type Order = {
  id: string;
  createdAt: string;
  customer: { name: string; phone: string; address: string; notes: string };
  lines: OrderLine[];
  grandTotal: number;
};

const ITEMS_KEY = "foodlink-items";
const ORDERS_KEY = "foodlink-orders";
const PHONE = "0308-8458885";
const seedItems: Item[] = [
  {
    id: "basmati",
    name: "Super Kernel Basmati",
    price: 420,
    marketPrice: 480,
    unit: "KG",
    updatedAt: new Date().toISOString(),
    visible: true,
    sortOrder: 1,
    categoryId: "rice",
  },
  {
    id: "broken-rice",
    name: "Broken Rice 1121",
    price: 285,
    marketPrice: 330,
    unit: "KG",
    updatedAt: new Date().toISOString(),
    visible: true,
    sortOrder: 2,
    categoryId: "rice",
  },
  {
    id: "sella",
    name: "Super Kernel Sella",
    price: 445,
    marketPrice: 500,
    unit: "KG",
    updatedAt: new Date().toISOString(),
    visible: true,
    sortOrder: 3,
    categoryId: "rice",
  },
  {
    id: "white-chickpeas",
    name: "White Chickpeas",
    price: 360,
    marketPrice: 410,
    unit: "KG",
    updatedAt: new Date().toISOString(),
    visible: true,
    sortOrder: 4,
    categoryId: "pulses",
  },
  {
    id: "red-lentils",
    name: "Red Lentils",
    price: 310,
    marketPrice: 356,
    unit: "KG",
    updatedAt: new Date().toISOString(),
    visible: true,
    sortOrder: 5,
    categoryId: "pulses",
  },
  {
    id: "gram-flour",
    name: "Gram Flour (Besan)",
    price: 290,
    marketPrice: 330,
    unit: "KG",
    updatedAt: new Date().toISOString(),
    visible: true,
    sortOrder: 6,
    categoryId: "flours",
  },
];
const seedCategories: Category[] = [
  { id: "rice", name: "Rice Varieties", sort_order: 1 },
  { id: "pulses", name: "Pulses & Legumes", sort_order: 2 },
  { id: "flours", name: "Flours & Grains", sort_order: 3 },
];

const money = (value: number) => `Rs.${value.toLocaleString("en-PK")}`;

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/items").then((response) =>
        response.ok ? response.json() : seedItems,
      ),
      fetch("/api/categories").then((response) =>
        response.ok ? response.json() : seedCategories,
      ),
    ])
      .then(([itemsData, catsData]: [Item[], Category[]]) => {
        setItems(itemsData && itemsData.length ? itemsData : seedItems);
        setCategories(catsData && catsData.length ? catsData : seedCategories);
        setExpandedCategories(new Set());
      })
      .catch(() => {
        setItems(seedItems);
        setCategories(seedCategories);
        setExpandedCategories(new Set());
      });
  }, []);
  const availableItems = useMemo(
    () =>
      items
        .filter((item) => item.visible)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  );
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );
  const itemsByCategory = useMemo(() => {
    const map: Record<string, Item[]> = {};
    sortedCategories.forEach((cat) => {
      map[cat.id] = availableItems.filter((item) => item.categoryId === cat.id);
    });
    return map;
  }, [availableItems, sortedCategories]);
  const lines = useMemo(
    () =>
      availableItems
        .filter((item) => quantities[item.id] > 0)
        .map((item) => ({
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: quantities[item.id],
          total: item.price * quantities[item.id],
        })),
    [availableItems, quantities],
  );
  const grandTotal = lines.reduce((sum, line) => sum + line.total, 0);
  const featuredItems = useMemo(() => availableItems.slice(0, 4), [availableItems]);

  const setQuantity = (id: string, value: number) =>
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(0, Number.isFinite(value) ? value : 0),
    }));
  const submitOrder = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim())
      return setNotice(
        "Please add your name, mobile number and delivery address.",
      );
    if (!lines.length)
      return setNotice("Add at least one item quantity to continue.");
    const order: Order = {
      id: `FL-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      },
      lines,
      grandTotal,
    };
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    }).catch(() => undefined);
    const orderSummary = lines
      .map(
        (line) =>
          `${line.name} — ${line.quantity} KG × ${money(line.price)} = ${money(line.total)}`,
      )
      .join("\n");
    const message = `Food Link Order ${order.id}\n\nName: ${order.customer.name}\nPhone: ${order.customer.phone}\nAddress: ${order.customer.address}\n${order.customer.notes ? `Notes: ${order.customer.notes}\n` : ""}\n${orderSummary}\n\nGrand Total: ${money(order.grandTotal)}`;
    window.open(
      `https://wa.me/923088458884?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setNotice("Order saved and sent to WhatsApp!");
    setQuantities({});
    setForm({ name: "", phone: "", address: "", notes: "" });
  };

  return (
    <main className="site-shell">
      <div className="announcement-banner">
        <div className="announcement-content">
          <p>
            <strong>Free Shipping</strong> in Lahore only on orders above
            Rs.20,000 • <strong>Online Payments</strong> Accepted
          </p>
        </div>
      </div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Food Link home">
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
          <a href="#order" onClick={() => setMenuOpen(false)}>
            Order online
          </a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
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

      <section className="customer-proof" id="customers">
        <div className="proof-copy">
          <p className="eyebrow">
            <span /> Trusted by businesses and households
          </p>
          <h2>5000+ Satisfied Customers All Over Pakistan</h2>
          <p>
            From Lahore retailers to restaurants, hostels, and family kitchens,
            Food Link helps customers buy quality rice and groceries at smarter
            wholesale prices.
          </p>
        </div>
        <div className="proof-stats" aria-label="Customer proof stats">
          <div>
            <strong>5000+</strong>
            <span>Happy buyers</span>
          </div>
          <div>
            <strong>25+</strong>
            <span>Core products</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>WhatsApp support</span>
          </div>
        </div>
      </section>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> Serving Lahore since day one
          </p>
          <h1>
            Pakistan's No.1.
            <br />
            <em>Wholesale Online Grocery Store.</em>
          </h1>
          <p className="hero-text">
            Trusted by retailers, restaurants, hostels, and families across
            Pakistan. Get wholesale rice, pulses, and daily grocery essentials at
            fair market prices with quick Lahore delivery.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#order">
              Order now <ArrowRight size={18} />
            </a>
            <a className="button button-quiet" href="tel:03088458884">
              <Phone size={17} /> Call now
            </a>
          </div>
          <div className="hero-trust">
            <span>
              <Check size={15} /> Food Link H#1400 Akbari Mandi
            </span>
            <span>
              <Truck size={15} /> Lahore delivery
            </span>
          </div>
        </div>
        <aside className="hero-card hero-business-card">
          <div className="card-tag">FOOD LINK</div>
          <div className="business-card-content">
            <div className="business-heading">
              <span className="business-icon">
                <ShoppingBasket size={26} />
              </span>
              <div>
                <p className="business-kicker">Bulk Orders</p>
                <h2>For Retailers</h2>
              </div>
            </div>
            <p className="business-copy">
              Rice, flour, pulses and grocery supply for cafés, restaurants,
              shops, families, and wholesale buyers across Pakistan.
            </p>
            <ul className="business-points">
              <li>
                <Check size={14} /> Daily wholesale pricing
              </li>
              <li>
                <Check size={14} /> Supply planning support
              </li>
              <li>
                <Check size={14} /> Lahore delivery dispatch
              </li>
            </ul>
            <a
              className="button button-primary full-width whatsapp-button"
              href="https://wa.me/923088458884"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone size={17} /> WhatsApp Us
            </a>
          </div>
        </aside>
      </section>

      <section className="stats-strip" aria-label="Company highlights">
        <div>
          <strong>5000+</strong>
          <span>Wholesale orders fulfilled</span>
        </div>
        <div>
          <strong>Daily</strong>
          <span>Fresh stock updates</span>
        </div>
        <div>
          <strong>Same-day</strong>
          <span>Lahore dispatch support</span>
        </div>
      </section>

      <section className="feature-grid" aria-label="Why choose Food Link">
        <article className="feature-card feature-card-primary">
          <span className="feature-icon">
            <Truck size={16} />
          </span>
          <h3>Trusted supply partner</h3>
          <p>
            From restaurants to retailers, we help businesses buy rice and
            groceries at dependable wholesale rates.
          </p>
        </article>
        <article className="feature-card">
          <span className="feature-icon">
            <MapPin size={16} />
          </span>
          <h3>Local Lahore sourcing</h3>
          <p>
            We source from the city’s most active grain markets for better value,
            faster fulfillment, and consistent quality.
          </p>
        </article>
        <article className="feature-card">
          <span className="feature-icon">
            <ShoppingBasket size={16} />
          </span>
          <h3>Bulk-ready inventory</h3>
          <p>
            Rice, lentils, chickpeas, and staple grains are kept ready for quick
            commercial orders and repeat supply planning.
          </p>
        </article>
      </section>

      <section className="showcase-section">
        <div className="section-heading mb-tight">
          <p className="eyebrow">
            <span /> Most requested staples
          </p>
          <h2>Popular wholesale picks</h2>
        </div>
        <div className="showcase-grid">
          {featuredItems.map((item) => (
            <article className="showcase-card" key={item.id}>
              <div className="showcase-topline">
                <span>{item.name}</span>
                <strong>{money(item.price)}</strong>
              </div>
              <p>
                Premium quality • <em>{item.unit}</em>
              </p>
              <div className="showcase-meta">
                <span>Market price: {money(item.marketPrice)}</span>
                <span>{item.categoryId.toUpperCase()}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="process" id="how-it-works">
        <div>
          <span className="process-icon">
            <ClipboardList size={20} />
          </span>
          <strong>Fill Your Basket</strong>
          <p>Choose quantities from today&apos;s price list.</p>
        </div>
        <div>
          <span className="process-icon">
            <FileText size={20} />
          </span>
          <strong>Share your details</strong>
          <p>Just your name, phone and address.</p>
        </div>
        <div>
          <span className="process-icon">
            <Phone size={20} />
          </span>
          <strong>We&apos;ll confirm</strong>
          <p>Send your order on WhatsApp in one tap.</p>
        </div>
      </section>

      <section className="order-section" id="order">
        <div className="section-heading">
          <p className="eyebrow">
            <span /> Fresh prices, ready to order
          </p>
          <h2>Build your order</h2>
          <p>
            Expand categories to browse and select items. Enter quantities in
            KG.
          </p>
        </div>
        <div className="order-layout">
          <div className="catalog-panel">
            {sortedCategories.map((category) => {
              const catItems = itemsByCategory[category.id] || [];
              const isExpanded = expandedCategories.has(category.id);
              return catItems.length ? (
                <div key={category.id} style={{ marginBottom: "12px" }}>
                  <button
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "var(--muted-background)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                    onClick={() => {
                      const next = new Set(expandedCategories);
                      isExpanded
                        ? next.delete(category.id)
                        : next.add(category.id);
                      setExpandedCategories(next);
                    }}
                  >
                    <span>
                      {category.name} ({catItems.length})
                    </span>
                    <span>{isExpanded ? "▼" : "▶"}</span>
                  </button>
                  {isExpanded && (
                    <div style={{ marginTop: "8px" }}>
                      {catItems.map((item) => (
                        <div className="catalog-row" key={item.id}>
                          <div className="item-name">
                            <span className="item-dot" />{" "}
                            <strong>{item.name}</strong>
                            <small>Per {item.unit}</small>
                          </div>
                          <span className="item-price item-price-discount">
                            <span className="market-price-label">
                              <span className="market-price-cross">
                                {money(item.marketPrice || item.price)}
                              </span>
                            </span>
                            <span className="discounted-price-label">
                              {money(item.price)}
                            </span>
                          </span>
                          <div className="quantity-control">
                            <button
                              onClick={() =>
                                setQuantity(
                                  item.id,
                                  (quantities[item.id] || 0) - 1,
                                )
                              }
                              aria-label={`Decrease ${item.name}`}
                            >
                              <Minus size={15} />
                            </button>
                            <input
                              aria-label={`Quantity of ${item.name}`}
                              type="number"
                              min="0"
                              step="1"
                              value={quantities[item.id] || ""}
                              placeholder="0"
                              onChange={(event) =>
                                setQuantity(item.id, Number(event.target.value))
                              }
                            />
                            <button
                              onClick={() =>
                                setQuantity(
                                  item.id,
                                  (quantities[item.id] || 0) + 1,
                                )
                              }
                              aria-label={`Increase ${item.name}`}
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                          <strong className="line-total">
                            {money((quantities[item.id] || 0) * item.price)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null;
            })}
            <div className="catalog-total">
              <span>Grand total</span>
              <strong>{money(grandTotal)}</strong>
            </div>
          </div>
          <aside className="checkout-card">
            <div className="checkout-title">
              <span className="step-number">01</span>
              <div>
                <h3>Where should we deliver?</h3>
                <p>We&apos;ll confirm your order on WhatsApp.</p>
              </div>
            </div>
            <label>
              Customer name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Your full name"
              />
            </label>
            <label>
              Mobile number
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                placeholder="0300 0000000"
                inputMode="tel"
              />
            </label>
            <label>
              Delivery address
              <textarea
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
                placeholder="Shop / restaurant address"
                rows={2}
              />
            </label>
            <label>
              Notes <span>(optional)</span>
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                placeholder="Anything we should know?"
                rows={2}
              />
            </label>
            {notice && (
              <p
                className={
                  notice.startsWith("Order saved")
                    ? "form-notice success"
                    : "form-notice"
                }
              >
                {notice}
              </p>
            )}
            <button
              className="button button-primary full-width"
              onClick={submitOrder}
            >
              Send order on WhatsApp <ArrowRight size={18} />
            </button>
            <p className="form-footnote">
              We never share your details. Your order goes straight to WhatsApp.
            </p>
          </aside>
        </div>
      </section>

      <section className="mini-cta">
        <div>
          <p className="eyebrow">
            <span /> Need a custom bulk quote?
          </p>
          <h3>Talk to our wholesale team today.</h3>
        </div>
        <a
          className="button button-primary"
          href="https://wa.me/923088458884"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp for bulk pricing <ArrowRight size={18} />
        </a>
      </section>
    </main>
  );
}

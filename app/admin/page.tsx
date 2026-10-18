"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  LogOut,
  Pencil,
  Plus,
  Save,
  Trash2,
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
type Brand = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  featured: boolean;
  categories: {
    name: string;
    items: { name: string; price: number; unit: string }[];
  }[];
};
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
const BRAND_STORAGE_KEY = "foodlink-brands";
const seedBrands: Brand[] = [
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
    featured: false,
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
];
const money = (value: number) => `Rs.${value.toLocaleString("en-PK")}`;

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"items" | "categories" | "brands">("items");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    setAuthed(sessionStorage.getItem("foodlink-admin") === "true");
    Promise.all([
      fetch("/api/items").then((response) =>
        response.ok ? response.json() : [],
      ),
      fetch("/api/categories").then((response) =>
        response.ok ? response.json() : [],
      ),
      fetch("/api/orders").then((response) =>
        response.ok ? response.json() : [],
      ),
    ])
      .then(
        ([catalog, cats, receivedOrders]: [Item[], Category[], Order[]]) => {
          setItems(catalog.length ? catalog : seedItems);
          setCategories(cats.length ? cats : seedCategories);
          setOrders(receivedOrders);
        },
      )
      .catch(() => {
        setItems(seedItems);
        setCategories(seedCategories);
        setOrders([]);
      });

    try {
      const savedBrands = window.localStorage.getItem(BRAND_STORAGE_KEY);
      if (savedBrands) {
        const parsed = JSON.parse(savedBrands) as Brand[];
        if (Array.isArray(parsed) && parsed.length) setBrands(parsed);
      }
    } catch {
      setBrands(seedBrands);
    }

    if (!window.localStorage.getItem(BRAND_STORAGE_KEY)) {
      setBrands(seedBrands);
      window.localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(seedBrands));
    }
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  );
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );
  const visibleCategories = useMemo(
    () =>
      sortedCategories.filter(
        (category) =>
          categoryFilter === "all" || category.id === categoryFilter,
      ),
    [categoryFilter, sortedCategories],
  );
  const itemsByCategory = useMemo(() => {
    const map: Record<string, Item[]> = {};
    sortedItems.forEach((item) => {
      const catId = item.categoryId || "uncategorized";
      if (!map[catId]) map[catId] = [];
      map[catId].push(item);
    });
    return map;
  }, [sortedItems]);
  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || "Uncategorized";
  const saveItems = (next: Item[]) => {
    setItems(next);
    fetch("/api/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => setError("Could not save the catalog. Please try again."));
  };
  const saveCategories = (next: Category[]) => {
    setCategories(next);
    fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => setError("Could not save categories. Please try again."));
  };
  const saveBrands = (next: Brand[]) => {
    setBrands(next);
    window.localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(next));
  };
  const submitLogin = (event: FormEvent) => {
    event.preventDefault();
    if (login.username === "foodlink25" && login.password === "foodlink25") {
      sessionStorage.setItem("foodlink-admin", "true");
      setAuthed(true);
      setError("");
    } else setError("Incorrect username or password.");
  };
  const moveItem = (id: string, direction: number) => {
    const current = sortedItems.findIndex((item) => item.id === id);
    const target = current + direction;
    if (target < 0 || target >= sortedItems.length) return;
    const next = [...sortedItems];
    [next[current], next[target]] = [next[target], next[current]];
    saveItems(next.map((item, index) => ({ ...item, sortOrder: index + 1 })));
  };
  const deleteItem = (id: string) => {
    if (window.confirm("Delete this item from the catalog?"))
      saveItems(items.filter((item) => item.id !== id));
  };
  const moveCategory = (id: string, direction: number) => {
    const current = sortedCategories.findIndex((cat) => cat.id === id);
    const target = current + direction;
    if (target < 0 || target >= sortedCategories.length) return;
    const next = [...sortedCategories];
    [next[current], next[target]] = [next[target], next[current]];
    saveCategories(
      next.map((cat, index) => ({ ...cat, sort_order: index + 1 })),
    );
  };
  const deleteCategory = (id: string) => {
    if (window.confirm("Delete this category and unassign items?")) {
      saveCategories(categories.filter((cat) => cat.id !== id));
      saveItems(
        items.map((item) =>
          item.categoryId === id
            ? { ...item, categoryId: "uncategorized" }
            : item,
        ),
      );
    }
  };
  const deleteOrder = (id: string) => {
    if (!window.confirm("Delete this received order record?")) return;

    fetch(`/api/orders?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to delete order");
        setOrders((current) => current.filter((order) => order.id !== id));
        if (selectedOrder?.id === id) setSelectedOrder(null);
      })
      .catch(() => setError("Could not delete the order. Please try again."));
  };
  const saveCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCategory?.name.trim()) return;
    const exists = categories.some((cat) => cat.id === editingCategory.id);
    const next = exists
      ? categories.map((cat) =>
          cat.id === editingCategory.id
            ? { ...editingCategory, name: editingCategory.name.trim() }
            : cat,
        )
      : [
          ...categories,
          {
            ...editingCategory,
            id: crypto.randomUUID(),
            sort_order: categories.length + 1,
          },
        ];
    saveCategories(next);
    setEditingCategory(null);
  };
  const saveBrand = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingBrand?.name.trim() || !editingBrand.tagline.trim()) return;

    const next = editingBrand.id
      ? brands.map((brand) =>
          brand.id === editingBrand.id ? { ...editingBrand, name: editingBrand.name.trim() } : brand,
        )
      : [
          ...brands,
          {
            ...editingBrand,
            id: crypto.randomUUID(),
            featured: false,
          },
        ];

    saveBrands(next);
    setEditingBrand(null);
  };
  const saveItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing?.name.trim() || editing.price <= 0 || editing.marketPrice <= 0)
      return;
    const exists = items.some((item) => item.id === editing.id);
    const next = exists
      ? items.map((item) =>
          item.id === editing.id
            ? {
                ...editing,
                name: editing.name.trim(),
                updatedAt: new Date().toISOString(),
              }
            : item,
        )
      : [
          ...items,
          {
            ...editing,
            id: crypto.randomUUID(),
            sortOrder: items.length + 1,
            updatedAt: new Date().toISOString(),
          },
        ];
    saveItems(next);
    setEditing(null);
  };

  if (!authed)
    return (
      <main className="admin-login">
        <div className="login-card">
          <a className="admin-brand" href="/">
            FOOD <span>LINK</span>
          </a>
          <p className="eyebrow">
            <span /> Private workspace
          </p>
          <h1>Welcome back.</h1>
          <p>Sign in to manage your daily catalog and orders.</p>
          <form onSubmit={submitLogin}>
            <label>
              Username
              <input
                autoFocus
                value={login.username}
                onChange={(event) =>
                  setLogin({ ...login, username: event.target.value })
                }
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={login.password}
                onChange={(event) =>
                  setLogin({ ...login, password: event.target.value })
                }
              />
            </label>
            {error && <p className="form-notice">{error}</p>}
            <button className="button button-primary full-width">
              Sign in
            </button>
          </form>
          <a className="back-link" href="/">
            ← Back to Food Link
          </a>
        </div>
      </main>
    );

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="admin-brand" href="/">
          FOOD <span>LINK</span>
        </a>
        <div>
          <span className="admin-status">Catalog live</span>
          <button
            className="icon-button"
            onClick={() => {
              sessionStorage.removeItem("foodlink-admin");
              setAuthed(false);
            }}
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <div className="admin-content">
        <div className="admin-intro">
          <div>
            <p className="eyebrow">
              <span /> Admin workspace
            </p>
            <h1>Good morning.</h1>
            <p>Keep your catalog current and stay on top of incoming orders.</p>
          </div>
          <a className="button button-primary" href="/">
            View customer site <ArrowUp size={17} />
          </a>
        </div>
        <section className="admin-stats">
          <div>
            <span>CATEGORIES</span>
            <strong>{categories.length}</strong>
            <small>product groups</small>
          </div>
          <div>
            <span>LIVE ITEMS</span>
            <strong>{items.filter((item) => item.visible).length}</strong>
            <small>visible to customers</small>
          </div>
          <div>
            <span>ORDERS RECEIVED</span>
            <strong>{orders.length}</strong>
            <small>saved on this device</small>
          </div>
        </section>
        <div className="admin-grid">
          <section className="admin-panel">
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "16px",
                marginBottom: "16px",
              }}
            >
              <button
                className={`button ${tab === "items" ? "button-primary" : "button-quiet"}`}
                onClick={() => setTab("items")}
                style={{ flex: 1 }}
              >
                Items & Prices
              </button>
              <button
                className={`button ${tab === "categories" ? "button-primary" : "button-quiet"}`}
                onClick={() => setTab("categories")}
                style={{ flex: 1 }}
              >
                Categories
              </button>
              <button
                className={`button ${tab === "brands" ? "button-primary" : "button-quiet"}`}
                onClick={() => setTab("brands")}
                style={{ flex: 1 }}
              >
                Brands
              </button>
            </div>

            {tab === "items" && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <p className="eyebrow">
                      <span /> Catalog
                    </p>
                    <h2>Items & prices</h2>
                  </div>
                  <button
                    className="button button-dark"
                    onClick={() =>
                      setEditing({
                        id: "",
                        name: "",
                        price: 0,
                        marketPrice: 0,
                        unit: "KG",
                        updatedAt: "",
                        visible: true,
                        sortOrder: items.length + 1,
                        categoryId: sortedCategories[0]?.id || "uncategorized",
                      })
                    }
                  >
                    <Plus size={17} /> Add item
                  </button>
                </div>

                {editing && (
                  <form
                    onSubmit={saveItem}
                    style={{
                      marginBottom: "24px",
                      padding: "16px",
                      backgroundColor: "var(--muted-background)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <label>
                        Item name
                        <input
                          autoFocus
                          value={editing.name}
                          onChange={(e) =>
                            setEditing({ ...editing, name: e.target.value })
                          }
                          placeholder="e.g. Super Kernel Basmati"
                        />
                      </label>
                      <label>
                        Market price per KG
                        <input
                          type="number"
                          min="0"
                          value={editing.marketPrice || ""}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              marketPrice: Number(e.target.value),
                            })
                          }
                          placeholder="0"
                        />
                      </label>
                      <label>
                        Discounted price per KG
                        <input
                          type="number"
                          min="0"
                          value={editing.price || ""}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              price: Number(e.target.value),
                            })
                          }
                          placeholder="0"
                        />
                      </label>
                      <label>
                        Unit
                        <input
                          value={editing.unit}
                          onChange={(e) =>
                            setEditing({ ...editing, unit: e.target.value })
                          }
                          placeholder="KG"
                        />
                      </label>
                      <label>
                        Category
                        <select
                          value={editing.categoryId}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              categoryId: e.target.value,
                            })
                          }
                        >
                          {sortedCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="submit"
                        className="button button-primary"
                        style={{ flex: 1 }}
                      >
                        <Save size={16} /> Save
                      </button>
                      <button
                        type="button"
                        className="button button-quiet"
                        onClick={() => setEditing(null)}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "var(--muted-foreground)",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Filter catalog
                    </span>
                    <select
                      value={categoryFilter}
                      onChange={(event) =>
                        setCategoryFilter(event.target.value)
                      }
                      style={{ minWidth: "210px" }}
                    >
                      <option value="all">All categories</option>
                      {sortedCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {visibleCategories.length} of {sortedCategories.length}{" "}
                    categories
                  </div>
                </div>

                {visibleCategories.map((category) => {
                  const catItems = itemsByCategory[category.id] || [];
                  const isExpanded = expandedCategories.has(category.id);

                  return (
                    <div key={category.id} style={{ marginBottom: "24px" }}>
                      <button
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          border: "1px solid var(--border)",
                          background: "var(--muted-background)",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontWeight: 800,
                          color: "var(--foreground)",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          const next = new Set(expandedCategories);
                          if (next.has(category.id)) next.delete(category.id);
                          else next.add(category.id);
                          setExpandedCategories(next);
                        }}
                      >
                        <span>
                          {category.name} ({catItems.length})
                        </span>
                        <span aria-hidden="true">{isExpanded ? "▾" : "▸"}</span>
                      </button>

                      {isExpanded && (
                        <div style={{ marginTop: "12px" }}>
                          <div className="admin-table catalog-admin">
                            <div className="admin-table-head">
                              <span>ITEM</span>
                              <span>PRICE</span>
                              <span>STATUS</span>
                              <span>ORDER</span>
                              <span />
                            </div>
                            {catItems.map((item, index) => (
                              <div className="admin-table-row" key={item.id}>
                                <div>
                                  <strong>{item.name}</strong>
                                  <small>
                                    Updated{" "}
                                    {new Date(
                                      item.updatedAt,
                                    ).toLocaleDateString("en-PK")}
                                  </small>
                                </div>
                                <div>
                                  <div>
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--muted-foreground)",
                                      }}
                                    >
                                      Market:
                                    </span>{" "}
                                    <strong>
                                      {money(item.marketPrice || item.price)}
                                    </strong>
                                  </div>
                                  <div>
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--muted-foreground)",
                                      }}
                                    >
                                      Discount:
                                    </span>{" "}
                                    <strong>{money(item.price)}</strong>
                                  </div>
                                </div>
                                <button
                                  className={
                                    item.visible
                                      ? "status-button live"
                                      : "status-button"
                                  }
                                  onClick={() =>
                                    saveItems(
                                      items.map((e) =>
                                        e.id === item.id
                                          ? { ...e, visible: !e.visible }
                                          : e,
                                      ),
                                    )
                                  }
                                >
                                  <Eye size={14} />{" "}
                                  {item.visible ? "Live" : "Hidden"}
                                </button>
                                <div style={{ display: "flex", gap: "4px" }}>
                                  {index > 0 && (
                                    <button
                                      className="icon-button"
                                      onClick={() => moveItem(item.id, -1)}
                                      aria-label="Move up"
                                    >
                                      <ArrowUp size={14} />
                                    </button>
                                  )}
                                  {index < catItems.length - 1 && (
                                    <button
                                      className="icon-button"
                                      onClick={() => moveItem(item.id, 1)}
                                      aria-label="Move down"
                                    >
                                      <ArrowDown size={14} />
                                    </button>
                                  )}
                                </div>
                                <button
                                  className="icon-button"
                                  onClick={() => setEditing(item)}
                                  aria-label="Edit item"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  className="icon-button"
                                  onClick={() => deleteItem(item.id)}
                                  aria-label="Delete item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {tab === "categories" && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <p className="eyebrow">
                      <span /> Manage
                    </p>
                    <h2>Categories</h2>
                  </div>
                  <button
                    className="button button-dark"
                    onClick={() =>
                      setEditingCategory({
                        id: "",
                        name: "",
                        sort_order: categories.length + 1,
                      })
                    }
                  >
                    <Plus size={17} /> Add category
                  </button>
                </div>

                {editingCategory && (
                  <form
                    onSubmit={saveCategory}
                    style={{
                      marginBottom: "24px",
                      padding: "16px",
                      backgroundColor: "var(--muted-background)",
                      borderRadius: "8px",
                    }}
                  >
                    <label>
                      Category name
                      <input
                        autoFocus
                        value={editingCategory.name}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g. Rice Varieties"
                        style={{ marginBottom: "12px" }}
                      />
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="submit"
                        className="button button-primary"
                        style={{ flex: 1 }}
                      >
                        <Save size={16} /> Save
                      </button>
                      <button
                        type="button"
                        className="button button-quiet"
                        onClick={() => setEditingCategory(null)}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="admin-table">
                  <div className="admin-table-head">
                    <span>CATEGORY</span>
                    <span>ITEMS</span>
                    <span>ORDER</span>
                    <span />
                  </div>
                  {sortedCategories.map((cat, index) => (
                    <div className="admin-table-row" key={cat.id}>
                      <div>
                        <strong>{cat.name}</strong>
                        <small>
                          {itemsByCategory[cat.id]?.length || 0} items
                        </small>
                      </div>
                      <strong>{itemsByCategory[cat.id]?.length || 0}</strong>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {index > 0 && (
                          <button
                            className="icon-button"
                            onClick={() => moveCategory(cat.id, -1)}
                            aria-label="Move up"
                          >
                            <ArrowUp size={14} />
                          </button>
                        )}
                        {index < sortedCategories.length - 1 && (
                          <button
                            className="icon-button"
                            onClick={() => moveCategory(cat.id, 1)}
                            aria-label="Move down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        )}
                      </div>
                      <button
                        className="icon-button"
                        onClick={() => setEditingCategory(cat)}
                        aria-label="Edit category"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => deleteCategory(cat.id)}
                        aria-label="Delete category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "brands" && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <p className="eyebrow">
                      <span /> Brands
                    </p>
                    <h2>Wholesale brand showcase</h2>
                  </div>
                  <button
                    className="button button-dark"
                    onClick={() =>
                      setEditingBrand({
                        id: "",
                        name: "",
                        tagline: "",
                        description: "",
                        image: "https://images.unsplash.com/photo-1586201375761-83865001a6d8?auto=format&fit=crop&w=900&q=80",
                        featured: false,
                        categories: [{ name: "Rice Varieties", items: [{ name: "Sample product", price: 0, unit: "KG" }] }],
                      })
                    }
                  >
                    <Plus size={17} /> Add brand
                  </button>
                </div>

                {editingBrand && (
                  <form onSubmit={saveBrand} style={{ marginBottom: "24px", padding: "16px", backgroundColor: "var(--muted-background)", borderRadius: "8px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <label>
                        Brand name
                        <input
                          autoFocus
                          value={editingBrand.name}
                          onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                          placeholder="Premium Rice House"
                        />
                      </label>
                      <label>
                        Tagline
                        <input
                          value={editingBrand.tagline}
                          onChange={(e) => setEditingBrand({ ...editingBrand, tagline: e.target.value })}
                          placeholder="Best-selling rice and grains"
                        />
                      </label>
                      <label style={{ gridColumn: "1 / -1" }}>
                        Image URL
                        <input
                          value={editingBrand.image}
                          onChange={(e) => setEditingBrand({ ...editingBrand, image: e.target.value })}
                          placeholder="https://..."
                        />
                      </label>
                      <label style={{ gridColumn: "1 / -1" }}>
                        Description
                        <textarea
                          value={editingBrand.description}
                          onChange={(e) => setEditingBrand({ ...editingBrand, description: e.target.value })}
                          placeholder="What makes this brand or product line special?"
                          rows={3}
                        />
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" className="button button-primary" style={{ flex: 1 }}>
                        <Save size={16} /> Save
                      </button>
                      <button type="button" className="button button-quiet" onClick={() => setEditingBrand(null)} style={{ flex: 1 }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="admin-table">
                  <div className="admin-table-head">
                    <span>BRAND</span>
                    <span>TOP LINE</span>
                    <span>FEATURED</span>
                    <span />
                  </div>
                  {brands.map((brand) => (
                    <div className="admin-table-row" key={brand.id}>
                      <div>
                        <strong>{brand.name}</strong>
                        <small>{brand.categories.length} categories</small>
                      </div>
                      <div>
                        <strong>{brand.tagline}</strong>
                      </div>
                      <strong>{brand.featured ? "Yes" : "No"}</strong>
                      <div className="row-actions">
                        <button className="icon-button" onClick={() => setEditingBrand(brand)} aria-label="Edit brand">
                          <Pencil size={14} />
                        </button>
                        <button className="icon-button" onClick={() => saveBrands(brands.filter((item) => item.id !== brand.id))} aria-label="Delete brand">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">
                  <span /> Orders
                </p>
                <h2>Received orders</h2>
              </div>
            </div>
            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
              {orders.length ? (
                <div>
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setSelectedOrder(
                          selectedOrder?.id === order.id ? null : order,
                        )
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                        }}
                      >
                        <strong>{order.id}</strong>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <strong>{money(order.grandTotal)}</strong>
                          <button
                            className="icon-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteOrder(order.id);
                            }}
                            aria-label="Delete order"
                            title="Delete order"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--muted-foreground)",
                          margin: "0",
                        }}
                      >
                        {order.customer.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "var(--muted-foreground)",
                  }}
                >
                  No orders yet
                </p>
              )}
              {selectedOrder && (
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "var(--muted-background)",
                    borderRadius: "8px",
                    marginTop: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <strong>{selectedOrder.id}</strong>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--muted-foreground)",
                          margin: "4px 0 0",
                        }}
                      >
                        Received{" "}
                        {new Date(selectedOrder.createdAt).toLocaleDateString(
                          "en-PK",
                        )}{" "}
                        {new Date(selectedOrder.createdAt).toLocaleTimeString(
                          "en-PK",
                        )}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="icon-button"
                        onClick={() => deleteOrder(selectedOrder.id)}
                        aria-label="Delete selected order"
                        title="Delete selected order"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => setSelectedOrder(null)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <p>
                      <strong>Customer:</strong> {selectedOrder.customer.name}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedOrder.customer.phone}
                    </p>
                    <p>
                      <strong>Address:</strong> {selectedOrder.customer.address}
                    </p>
                    {selectedOrder.customer.notes && (
                      <p>
                        <strong>Notes:</strong> {selectedOrder.customer.notes}
                      </p>
                    )}
                  </div>
                  <div>
                    <strong>Items:</strong>
                    {selectedOrder.lines.map((line) => (
                      <div
                        key={line.itemId}
                        style={{ fontSize: "13px", marginTop: "4px" }}
                      >
                        {line.name} — {line.quantity} KG × {money(line.price)} ={" "}
                        {money(line.total)}
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    {money(selectedOrder.grandTotal)}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

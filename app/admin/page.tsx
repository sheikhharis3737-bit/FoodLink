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
type BrandProduct = {
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
  products: BrandProduct[];
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
  const [editingBrandCategory, setEditingBrandCategory] =
    useState<BrandCategory | null>(null);
  const [editingBrandProduct, setEditingBrandProduct] = useState<{
    categoryId: string;
    product: BrandProduct;
  } | null>(null);
  const [brandCategories, setBrandCategories] = useState<BrandCategory[]>([]);
  const [expandedBrandCategories, setExpandedBrandCategories] = useState<
    Set<string>
  >(new Set());
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
      fetch("/api/brands").then((response) => {
        if (!response.ok) throw new Error("Could not load brand catalog");
        return response.json();
      }),
    ])
      .then(
        ([catalog, cats, receivedOrders, brandCatalog]: [
          Item[],
          Category[],
          Order[],
          BrandCategory[],
        ]) => {
          setItems(catalog.length ? catalog : seedItems);
          setCategories(cats.length ? cats : seedCategories);
          setOrders(receivedOrders);
          setBrandCategories(brandCatalog);
        },
      )
      .catch(() => {
        setItems(seedItems);
        setCategories(seedCategories);
        setOrders([]);
        setError("Could not load saved data. Refresh the page to try again.");
      });
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
  const saveBrandCategories = async (next: BrandCategory[]) => {
    setError("");
    try {
      const response = await fetch("/api/brands", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Could not save the brand catalog.");
      }
      setBrandCategories(await response.json());
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the brand catalog.",
      );
      return false;
    }
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
  const saveBrandCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingBrandCategory?.name.trim()) return;

    const next = editingBrandCategory.id
      ? brandCategories.map((category) =>
          category.id === editingBrandCategory.id
            ? {
                ...editingBrandCategory,
                name: editingBrandCategory.name.trim(),
              }
            : category,
        )
      : [
          ...brandCategories,
          {
            ...editingBrandCategory,
            id: crypto.randomUUID(),
            sortOrder: brandCategories.length,
          },
        ];

    if (await saveBrandCategories(next)) setEditingBrandCategory(null);
  };
  const saveBrandProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !editingBrandProduct?.product.name.trim() ||
      editingBrandProduct.product.price < 0
    )
      return;

    const { categoryId, product } = editingBrandProduct;
    const category = brandCategories.find((item) => item.id === categoryId);
    if (!category) return;
    const exists = category.products.some((item) => item.id === product.id);
    const products = exists
      ? category.products.map((item) =>
          item.id === product.id
            ? { ...product, name: product.name.trim() }
            : item,
        )
      : [
          ...category.products,
          {
            ...product,
            id: crypto.randomUUID(),
            sortOrder: category.products.length,
          },
        ];
    if (
      await saveBrandCategories(
        brandCategories.map((item) =>
          item.id === categoryId ? { ...item, products } : item,
        ),
      )
    )
      setEditingBrandProduct(null);
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
                      <span /> Wholesale catalog
                    </p>
                    <h2>Categories & products</h2>
                  </div>
                  <button
                    className="button button-dark"
                    onClick={() =>
                      setEditingBrandCategory({
                        id: "",
                        name: "",
                        description: "",
                        sortOrder: brandCategories.length,
                        products: [],
                      })
                    }
                  >
                    <Plus size={17} /> Add category
                  </button>
                </div>

                {error && <p className="form-notice">{error}</p>}

                {editingBrandCategory && (
                  <form
                    onSubmit={saveBrandCategory}
                    style={{ marginBottom: "24px", padding: "16px", backgroundColor: "var(--muted-background)", borderRadius: "8px" }}
                  >
                    <label>
                      Category name
                      <input
                        autoFocus
                        value={editingBrandCategory.name}
                        onChange={(event) =>
                          setEditingBrandCategory({
                            ...editingBrandCategory,
                            name: event.target.value,
                          })
                        }
                        placeholder="e.g. Rice, Grains, Pulses"
                      />
                    </label>
                    <label>
                      Short description
                      <textarea
                        value={editingBrandCategory.description}
                        onChange={(event) =>
                          setEditingBrandCategory({
                            ...editingBrandCategory,
                            description: event.target.value,
                          })
                        }
                        placeholder="A short wholesale category description"
                        rows={2}
                      />
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" className="button button-primary" style={{ flex: 1 }}>
                        <Save size={16} /> Save category
                      </button>
                      <button type="button" className="button button-quiet" onClick={() => setEditingBrandCategory(null)} style={{ flex: 1 }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {editingBrandProduct && (
                  <form
                    onSubmit={saveBrandProduct}
                    style={{ marginBottom: "24px", padding: "16px", backgroundColor: "var(--muted-background)", borderRadius: "8px" }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <label>
                        Product name
                        <input
                          autoFocus
                          value={editingBrandProduct.product.name}
                          onChange={(event) =>
                            setEditingBrandProduct({
                              ...editingBrandProduct,
                              product: {
                                ...editingBrandProduct.product,
                                name: event.target.value,
                              },
                            })
                          }
                          placeholder="e.g. Super Kernel Basmati"
                        />
                      </label>
                      <label>
                        Wholesale price
                        <input
                          type="number"
                          min="0"
                          value={editingBrandProduct.product.price}
                          onChange={(event) =>
                            setEditingBrandProduct({
                              ...editingBrandProduct,
                              product: {
                                ...editingBrandProduct.product,
                                price: Number(event.target.value),
                              },
                            })
                          }
                        />
                      </label>
                      <label>
                        Weight (KGS)
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editingBrandProduct.product.packWeight}
                          onChange={(event) =>
                            setEditingBrandProduct({
                              ...editingBrandProduct,
                              product: {
                                ...editingBrandProduct.product,
                                packWeight: Number(event.target.value),
                              },
                            })
                          }
                          placeholder="e.g. 15, 20, 25"
                        />
                        <small>Enter the number of kilograms in the pack.</small>
                      </label>
                      <label style={{ gridColumn: "1 / -1" }}>
                        Product photo (JPG, PNG, WebP; up to 2 MB)
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            if (
                              !["image/jpeg", "image/png", "image/webp"].includes(
                                file.type,
                              )
                            ) {
                              setError("Choose a JPG, PNG, or WebP image.");
                              event.target.value = "";
                              return;
                            }
                            if (file.size > 2 * 1024 * 1024) {
                              setError("Choose an image smaller than 2 MB.");
                              event.target.value = "";
                              return;
                            }
                            setError("");
                            const reader = new FileReader();
                            reader.onload = () => {
                              const imageData =
                                typeof reader.result === "string"
                                  ? reader.result
                                  : null;
                              if (imageData) {
                                setEditingBrandProduct((current) =>
                                  current
                                    ? {
                                        ...current,
                                        product: {
                                          ...current.product,
                                          image: imageData,
                                        },
                                      }
                                    : current,
                                );
                              }
                            };
                            reader.onerror = () =>
                              setError("Could not read this image file.");
                            reader.readAsDataURL(file);
                          }}
                        />
                        {editingBrandProduct.product.image && (
                          <img
                            className="admin-product-preview"
                            src={editingBrandProduct.product.image}
                            alt="Product preview"
                          />
                        )}
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" className="button button-primary" style={{ flex: 1 }}>
                        <Save size={16} /> Save product
                      </button>
                      <button type="button" className="button button-quiet" onClick={() => setEditingBrandProduct(null)} style={{ flex: 1 }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {brandCategories.map((category) => {
                  const expanded = expandedBrandCategories.has(category.id);
                  return (
                    <section className="brand-admin-category" key={category.id}>
                      <div className="brand-admin-category-head">
                        <button
                          className="brand-admin-category-toggle"
                          aria-expanded={expanded}
                          onClick={() =>
                            setExpandedBrandCategories((current) => {
                              const next = new Set(current);
                              if (next.has(category.id)) next.delete(category.id);
                              else next.add(category.id);
                              return next;
                            })
                          }
                        >
                          <span>
                            <strong>{category.name}</strong>
                            <small>{category.products.length} products</small>
                          </span>
                          <span>{expanded ? "−" : "+"}</span>
                        </button>
                        <div className="row-actions">
                          <button className="icon-button" onClick={() => setEditingBrandCategory(category)} aria-label={`Edit ${category.name}`}>
                            <Pencil size={14} />
                          </button>
                          <button
                            className="icon-button"
                            onClick={() => {
                              if (!window.confirm(`Delete ${category.name} and its products?`)) return;
                              void saveBrandCategories(brandCategories.filter((item) => item.id !== category.id));
                            }}
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {expanded && (
                        <div className="brand-admin-products">
                          <div className="brand-admin-products-head">
                            <span>PRODUCT</span>
                            <span>PRICE</span>
                            <span>PACK WEIGHT</span>
                            <span>ACTIONS</span>
                          </div>
                          {category.products.map((product) => (
                            <div className="brand-admin-product-row" key={product.id}>
                              <span className="brand-admin-product-name">
                                {product.image ? (
                                  <img src={product.image} alt="" />
                                ) : (
                                  <span className="brand-admin-image-placeholder">No image</span>
                                )}
                                <strong>{product.name}</strong>
                              </span>
                              <strong>{money(product.price)}</strong>
                              <span>
                                {product.packWeight} KGS
                              </span>
                              <span className="row-actions">
                                <button
                                  className="icon-button"
                                  onClick={() => setEditingBrandProduct({ categoryId: category.id, product })}
                                  aria-label={`Edit ${product.name}`}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  className="icon-button"
                                  onClick={() =>
                                    void saveBrandCategories(
                                      brandCategories.map((item) =>
                                        item.id === category.id
                                          ? { ...item, products: item.products.filter((entry) => entry.id !== product.id) }
                                          : item,
                                      ),
                                    )
                                  }
                                  aria-label={`Delete ${product.name}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </span>
                            </div>
                          ))}
                          <button
                            className="button button-quiet brand-add-product"
                            onClick={() =>
                              setEditingBrandProduct({
                                categoryId: category.id,
                                product: {
                                  id: "",
                                  name: "",
                                  price: 0,
                                  packWeight: 1,
                                  unit: "KG",
                                  image: "",
                                  sortOrder: category.products.length,
                                },
                              })
                            }
                          >
                            <Plus size={15} /> Add product
                          </button>
                        </div>
                      )}
                    </section>
                  );
                })}
                {!brandCategories.length && (
                  <p className="empty-state">
                    No wholesale categories yet. Add a category, then open it to add products and photos.
                  </p>
                )}
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

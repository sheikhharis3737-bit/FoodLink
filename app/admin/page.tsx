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
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"items" | "categories">("items");

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
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  );
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
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

                {Object.entries(itemsByCategory).map(([catId, catItems]) => (
                  <div key={catId} style={{ marginBottom: "24px" }}>
                    <h3
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--muted-foreground)",
                        marginBottom: "12px",
                        textTransform: "uppercase",
                      }}
                    >
                      {getCategoryName(catId)}
                    </h3>
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
                              {new Date(item.updatedAt).toLocaleDateString(
                                "en-PK",
                              )}
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
                            <Eye size={14} /> {item.visible ? "Live" : "Hidden"}
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
                ))}
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
                          marginBottom: "4px",
                        }}
                      >
                        <strong>{order.id}</strong>
                        <strong>{money(order.grandTotal)}</strong>
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
                    <button
                      className="icon-button"
                      onClick={() => setSelectedOrder(null)}
                    >
                      <X size={16} />
                    </button>
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

import { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Award,
  Check,
  Crown,
  Database,
  FileText,
  Layers,
  LogIn,
  LogOut,
  Palette,
  Plus,
  Receipt,
  Save,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { SPEEDY_BURGER_LOGO } from '../data/logo';
import {
  AdminCategoryKey,
  AdminUserRecord,
  BurgerClubMemberRecord,
  formatCurrency,
  MenuCategoryRecord,
  MenuItemRecord,
  OrderRecord,
  OrderStatus,
  sanitizeId,
  SiteSettings,
  VISUAL_KEY_CHOICES,
} from '../data/siteConfig';
import {
  deleteAdminUser,
  deleteBurgerClubMember,
  deleteCategory,
  deleteMenuItem,
  deleteOrder,
  saveAdminUser,
  saveBurgerClubMember,
  saveCategory,
  saveMenuItem,
  saveSiteSettings,
  seedDefaultCatalogAndSettings,
  subscribeAdmins,
  subscribeAllBurgerClub,
  subscribeAllOrders,
  updateOrderStatus,
} from '../services/storefrontService';

type AdminTab =
  | 'orders'
  | 'menu'
  | 'club'
  | 'shop'
  | 'content'
  | 'labels'
  | 'staff';

const CATEGORY_KEYS: AdminCategoryKey[] = [
  'combos',
  'bun',
  'meat',
  'cheese',
  'toppings',
  'sauces',
  'sides',
];

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

export function AdminDashboard({
  user,
  isAdmin,
  authLoading,
  settings,
  categories,
  items,
  onSignIn,
  onSignOut,
  onClose,
}: {
  user: User | null;
  isAdmin: boolean;
  authLoading: boolean;
  settings: SiteSettings;
  categories: MenuCategoryRecord[];
  items: MenuItemRecord[];
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [draftSettings, setDraftSettings] = useState<SiteSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Live admin collections
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [clubMembers, setClubMembers] = useState<BurgerClubMemberRecord[]>([]);
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);

  // Order filters & staff notes
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [staffNoteDrafts, setStaffNoteDrafts] = useState<Record<string, string>>({});

  // Menu editing state
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<'all' | AdminCategoryKey>('all');
  const [editingCategory, setEditingCategory] = useState<MenuCategoryRecord | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItemRecord | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  // Burger club editing state
  const [clubSearch, setClubSearch] = useState('');
  const [editingMember, setEditingMember] = useState<BurgerClubMemberRecord | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);

  // Staff access editing state
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'staff' | 'super_admin'>('staff');

  useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const unsubOrders = subscribeAllOrders(setOrders);
    const unsubClub = subscribeAllBurgerClub(setClubMembers);
    const unsubAdmins = subscribeAdmins(setAdmins);
    return () => {
      unsubOrders();
      unsubClub();
      unsubAdmins();
    };
  }, [user, isAdmin]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSavingSettings(true);
    try {
      await saveSiteSettings(draftSettings, user.uid);
      showToast('Saved settings & website content to storefront.');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await seedDefaultCatalogAndSettings(user.uid);
      showToast('Seeded Speedy Burger menu, categories, and default settings.');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to seed catalog.');
    } finally {
      setSeeding(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      if (!q) return true;
      return (
        o.ticketCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q)
      );
    });
  }, [orders, orderStatusFilter, orderSearch]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => menuCategoryFilter === 'all' || it.categoryKey === menuCategoryFilter);
  }, [items, menuCategoryFilter]);

  const filteredMembers = useMemo(() => {
    const q = clubSearch.trim().toLowerCase();
    if (!q) return clubMembers;
    return clubMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [clubMembers, clubSearch]);

  // Auth Gate
  if (authLoading || !user || !isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
        <div className="max-w-md w-full rounded-3xl bg-[#fffaf2] text-[#3a0b08] border border-[#3a0b08]/15 shadow-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={settings.logoUrl || SPEEDY_BURGER_LOGO}
                alt={settings.shopName}
                className="h-9 w-auto rounded-lg object-contain"
              />
              <div>
                <h2 className="font-display text-2xl leading-none text-[#E1000F]">
                  Staff Admin Portal
                </h2>
                <p className="text-[11px] opacity-65">{settings.shopName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin portal"
              className="w-8 h-8 rounded-full border border-[#3a0b08]/15 flex items-center justify-center hover:bg-black/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {authLoading ? (
            <div className="py-8 text-center text-sm font-semibold opacity-70">
              Verifying staff authorization...
            </div>
          ) : !user ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#FDB105]/18 border border-[#FDB105]/50 p-4 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#E1000F]" />
                  <span>Authorized Staff Only</span>
                </div>
                <p className="opacity-80">
                  Sign in with an authorized staff Google account to manage orders, menu items,
                  availability, Burger Club members, appearance, and website content.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void onSignIn()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#E1000F] hover:bg-[#c5000d] text-white font-bold text-sm shadow-md cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Access Restricted</span>
                </div>
                <p>
                  Signed in as <strong>{user.email}</strong>, which is not currently on the
                  authorized staff list.
                </p>
                <div className="rounded-lg bg-white/80 p-2 font-mono text-[11px] break-all border border-red-200">
                  UID: {user.uid}
                </div>
                <p className="opacity-80">
                  Ask the store owner to add your UID in the Staff Access tab.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onSignOut()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#3a0b08]/20 text-xs font-bold cursor-pointer hover:bg-black/5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#E1000F] text-white text-xs font-bold cursor-pointer"
                >
                  Return to Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f7f1e8] text-[#2a100a] overflow-hidden">
      {/* Top Bar */}
      <header className="shrink-0 bg-white border-b border-[#2a100a]/12 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={draftSettings.logoUrl || SPEEDY_BURGER_LOGO}
            alt={draftSettings.shopName}
            className="h-8 w-auto rounded-lg object-contain shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl leading-none text-[#E1000F] truncate">
                {draftSettings.shopName} Admin
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" /> Verified Staff
              </span>
            </div>
            <p className="text-[11px] opacity-65 truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={seeding}
            onClick={() => void handleSeedDefaults()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2a100a]/18 bg-[#fffaf2] hover:bg-[#FDB105]/20 text-xs font-bold cursor-pointer disabled:opacity-50"
            title="Populate or reset Firestore menu categories, items, combos, and settings"
          >
            <Database className="w-3.5 h-3.5 text-[#E1000F]" />
            <span className="hidden md:inline">
              {seeding ? 'Seeding...' : 'Seed Default Menu'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void onSignOut()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#2a100a]/18 text-xs font-bold hover:bg-black/5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E1000F] text-white text-xs font-bold cursor-pointer hover:opacity-95"
          >
            <X className="w-3.5 h-3.5" />
            <span>Back to Site</span>
          </button>
        </div>
      </header>

      {/* Navigation Strip */}
      <nav className="shrink-0 bg-white/80 border-b border-[#2a100a]/10 px-3 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'orders', label: `Orders (${orders.length})`, icon: Receipt },
            { id: 'menu', label: `Menu (${items.length})`, icon: Layers },
            { id: 'club', label: `Burger Club (${clubMembers.length})`, icon: Award },
            { id: 'shop', label: 'Shop & Appearance', icon: Palette },
            { id: 'content', label: 'Pages, Splash & Footer', icon: FileText },
            { id: 'labels', label: 'Labels & Ticket Text', icon: Tag },
            { id: 'staff', label: 'Staff Access', icon: Users },
          ] as const
        ).map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                active
                  ? 'bg-[#E1000F] text-white shadow-sm'
                  : 'bg-[#2a100a]/5 hover:bg-[#2a100a]/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-[#2a100a] text-white px-4 py-2.5 text-xs font-bold shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-[#FDB105]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* 1. ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {(['all', ...ORDER_STATUSES] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase cursor-pointer ${
                        orderStatusFilter === st
                          ? 'bg-[#E1000F] text-white'
                          : 'bg-white border border-[#2a100a]/12'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <input
                  type="search"
                  placeholder="Search ticket, name, or phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#2a100a]/15 bg-white text-xs w-full sm:w-64"
                />
              </div>

              {filteredOrders.length === 0 ? (
                <div className="rounded-2xl bg-white border border-[#2a100a]/12 p-8 text-center text-sm opacity-65">
                  No orders match the current filter. Customer orders placed from the storefront appear here live.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredOrders.map((ord) => {
                    const noteVal = staffNoteDrafts[ord.id] ?? ord.staffNote ?? '';
                    return (
                      <div
                        key={ord.id}
                        className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display text-2xl text-[#E1000F]">
                                #{ord.ticketCode}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-[#FDB105]/25 text-xs font-bold">
                                {ord.orderMode}
                              </span>
                            </div>
                            <div className="text-xs font-bold">
                              {ord.customerName} · {ord.customerPhone}
                            </div>
                            {ord.deliveryAddress && (
                              <div className="text-[11px] opacity-70">{ord.deliveryAddress}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-display text-xl text-[#E1000F] tabular-nums">
                              {formatCurrency(ord.total, draftSettings.currencySymbol)}
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded-md bg-black/8 text-[10px] font-bold uppercase">
                              {ord.status}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl bg-[#f7f1e8] p-2.5 text-xs space-y-1">
                          {ord.comboName && <div className="font-bold">{ord.comboName}</div>}
                          {ord.items.map((line, i) => (
                            <div key={i}>• {line}</div>
                          ))}
                          {ord.notes && (
                            <div className="pt-1 text-[11px] italic opacity-75">
                              Customer note: {ord.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Kitchen / staff note..."
                            maxLength={300}
                            value={noteVal}
                            onChange={(e) =>
                              setStaffNoteDrafts((prev) => ({ ...prev, [ord.id]: e.target.value }))
                            }
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#2a100a]/15 text-xs"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              await updateOrderStatus(ord.id, ord.status, noteVal);
                              showToast(`Saved note on #${ord.ticketCode}`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#2a100a] text-white text-xs font-bold cursor-pointer"
                          >
                            Save Note
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-[#2a100a]/10">
                          <div className="flex flex-wrap gap-1">
                            {ORDER_STATUSES.map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={async () => {
                                  await updateOrderStatus(ord.id, st, noteVal);
                                  showToast(`Order #${ord.ticketCode} marked ${st}`);
                                }}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold uppercase cursor-pointer ${
                                  ord.status === st
                                    ? 'bg-[#E1000F] text-white'
                                    : 'bg-black/6 hover:bg-black/12'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteOrder(ord.id);
                              showToast(`Deleted order #${ord.ticketCode}`);
                            }}
                            className="p-1.5 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer"
                            title="Delete order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. MENU & AVAILABILITY TAB */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              {items.length === 0 && categories.length === 0 && (
                <div className="rounded-2xl bg-[#FDB105]/20 border border-[#FDB105] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-semibold">
                    Firestore menu collections are empty. Seed the live Speedy Burger menu & settings to start editing directly in Firestore.
                  </div>
                  <button
                    type="button"
                    disabled={seeding}
                    onClick={() => void handleSeedDefaults()}
                    className="px-4 py-2 rounded-xl bg-[#E1000F] text-white text-xs font-bold cursor-pointer"
                  >
                    {seeding ? 'Seeding...' : 'Seed Menu & Settings Now'}
                  </button>
                </div>
              )}

              {/* Categories Section */}
              <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-xl text-[#E1000F]">Menu Categories & Availability</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCategory({
                        id: `cat_${Date.now()}`,
                        key: 'toppings',
                        name: 'New Category',
                        selectionMode: 'multi',
                        sortOrder: categories.length + 1,
                        available: true,
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E1000F] text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Category
                  </button>
                </div>

                {editingCategory && (
                  <div className="rounded-xl bg-[#f7f1e8] p-3 border border-[#2a100a]/15 grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Key</label>
                      <select
                        value={editingCategory.key}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, key: e.target.value as AdminCategoryKey })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border bg-white text-xs"
                      >
                        {CATEGORY_KEYS.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Display Name</label>
                      <input
                        type="text"
                        maxLength={60}
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Selection Mode</label>
                      <select
                        value={editingCategory.selectionMode}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            selectionMode: e.target.value as 'single' | 'multi',
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border bg-white text-xs"
                      >
                        <option value="single">Single Pick</option>
                        <option value="multi">Multi Pick</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={editingCategory.sortOrder}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, sortOrder: Number(e.target.value) || 0 })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border bg-white text-xs"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await saveCategory(editingCategory);
                          setEditingCategory(null);
                          showToast('Category saved.');
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-[#E1000F] text-white text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="rounded-xl border border-[#2a100a]/12 p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{cat.name}</div>
                        <div className="text-[10px] opacity-65">
                          {cat.key} · #{cat.sortOrder} · {cat.selectionMode}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await saveCategory({ ...cat, available: !cat.available });
                            showToast(`${cat.name} marked ${!cat.available ? 'available' : 'hidden'}`);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                            cat.available
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {cat.available ? 'Active' : 'Hidden'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(cat)}
                          className="px-2 py-1 rounded-lg bg-black/6 text-[10px] font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteCategory(cat.id);
                            showToast(`Deleted category ${cat.name}`);
                          }}
                          className="p-1 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Items & Combos Section */}
              <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl text-[#E1000F]">Menu Items & Combos</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewItem(true);
                      setEditingItem({
                        id: `item_${Date.now()}`,
                        categoryKey: menuCategoryFilter === 'all' ? 'toppings' : menuCategoryFilter,
                        name: '',
                        price: 150,
                        description: '',
                        swatch: '#E1000F',
                        visualKey: 'beef',
                        maxQty: 2,
                        sortOrder: items.length + 1,
                        available: true,
                        comboBun: 'sesame_bun',
                        comboIngredients: ['meat:beef:1', 'cheese:american_cheese:1'],
                      });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E1000F] text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Menu Item
                  </button>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => setMenuCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      menuCategoryFilter === 'all' ? 'bg-[#FDB105] text-[#2a100a]' : 'bg-black/6'
                    }`}
                  >
                    All ({items.length})
                  </button>
                  {CATEGORY_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setMenuCategoryFilter(k)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase cursor-pointer ${
                        menuCategoryFilter === k ? 'bg-[#FDB105] text-[#2a100a]' : 'bg-black/6'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {/* Item Editor Modal / Inline Card */}
                {editingItem && (
                  <div className="rounded-2xl bg-[#f7f1e8] p-4 border border-[#2a100a]/15 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm">
                        {isNewItem ? 'New Menu Item' : `Editing: ${editingItem.name}`}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        className="text-xs font-bold underline cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Item Name</label>
                        <input
                          type="text"
                          maxLength={80}
                          value={editingItem.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setEditingItem({
                              ...editingItem,
                              name,
                              id: isNewItem ? sanitizeId(name, editingItem.id) : editingItem.id,
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Category</label>
                        <select
                          value={editingItem.categoryKey}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              categoryKey: e.target.value as AdminCategoryKey,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border bg-white"
                        >
                          {CATEGORY_KEYS.map((k) => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                          Price ({draftSettings.currencySymbol})
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100000}
                          value={editingItem.price}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, price: Number(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 rounded-xl border bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">3D Model Appearance</label>
                        <select
                          value={editingItem.visualKey}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, visualKey: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border bg-white"
                        >
                          {VISUAL_KEY_CHOICES.map((v) => (
                            <option key={v.value} value={v.value}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Swatch Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingItem.swatch}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, swatch: e.target.value })
                            }
                            className="h-9 w-12 rounded-lg border bg-white cursor-pointer"
                          />
                          <input
                            type="text"
                            maxLength={7}
                            value={editingItem.swatch}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, swatch: e.target.value })
                            }
                            className="flex-1 px-2.5 py-2 rounded-xl border bg-white font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Sort</label>
                          <input
                            type="number"
                            value={editingItem.sortOrder}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                sortOrder: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2.5 py-2 rounded-xl border bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Max Qty</label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={editingItem.maxQty}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                maxQty: Number(e.target.value) || 1,
                              })
                            }
                            className="w-full px-2.5 py-2 rounded-xl border bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Description</label>
                      <input
                        type="text"
                        maxLength={300}
                        value={editingItem.description}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, description: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border bg-white"
                      />
                    </div>

                    {editingItem.categoryKey === 'combos' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                            Combo Bun Visual ID
                          </label>
                          <input
                            type="text"
                            value={editingItem.comboBun}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, comboBun: e.target.value })
                            }
                            placeholder="sesame_bun"
                            className="w-full px-3 py-2 rounded-xl border bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                            Combo Layers (comma-separated e.g. meat:beef:1, cheese:american_cheese:1)
                          </label>
                          <input
                            type="text"
                            value={editingItem.comboIngredients.join(', ')}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                comboIngredients: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border bg-white font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingItem.available}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, available: e.target.checked })
                          }
                        />
                        <span>Available on Storefront</span>
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          await saveMenuItem(editingItem);
                          setEditingItem(null);
                          showToast(`Saved menu item "${editingItem.name}".`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E1000F] text-white text-xs font-bold cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Item
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredItems.map((it) => (
                    <div
                      key={it.id}
                      className={`rounded-xl border p-3 flex items-center justify-between gap-2 ${
                        it.available ? 'border-[#2a100a]/12' : 'border-red-200 bg-red-50/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: it.swatch }}
                          />
                          <span className="text-xs font-bold truncate">{it.name}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-black/6">
                            {it.categoryKey}
                          </span>
                        </div>
                        <div className="text-[11px] opacity-70 truncate pl-4">
                          {formatCurrency(it.price, draftSettings.currencySymbol, 'Free')}
                          {it.description ? ` · ${it.description}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await saveMenuItem({ ...it, available: !it.available });
                            showToast(`${it.name}: ${!it.available ? 'Available' : 'Sold Out'}`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                            it.available
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {it.available ? 'Available' : 'Sold Out'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewItem(false);
                            setEditingItem(it);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-black/6 text-[10px] font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteMenuItem(it.id);
                            showToast(`Deleted ${it.name}`);
                          }}
                          className="p-1 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* 3. BURGER CLUB & LOYALTY REWARDS TAB */}
          {activeTab === 'club' && (
            <div className="space-y-5">
              {/* Loyalty Program Config */}
              <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl text-[#E1000F]">Loyalty Rewards & Membership Rules</h2>
                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={() => void handleSaveSettings()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E1000F] text-white text-xs font-bold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Loyalty Settings
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                      Orders Needed For Reward
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={draftSettings.ordersNeededForReward}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          ordersNeededForReward: Number(e.target.value) || 10,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                      Reward Description
                    </label>
                    <input
                      type="text"
                      maxLength={160}
                      value={draftSettings.rewardText}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, rewardText: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                      First in Line Price ({draftSettings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={draftSettings.membershipPrice}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          membershipPrice: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border bg-white"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftSettings.clubEnabled}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, clubEnabled: e.target.checked })
                        }
                      />
                      <span>Burger Club Enabled</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Members Directory */}
              <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl text-[#E1000F]">Burger Club Members</h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="search"
                      placeholder="Search member..."
                      value={clubSearch}
                      onChange={(e) => setClubSearch(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border text-xs w-44 sm:w-60"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewMember(true);
                        setEditingMember({
                          id: `club_${Date.now()}`,
                          userId: `manual_${Date.now()}`,
                          name: '',
                          phone: '',
                          email: '',
                          stamps: 0,
                          lifetimeOrders: 0,
                          rewardsRedeemed: 0,
                          firstInLine: false,
                          status: 'active',
                          notes: '',
                        });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E1000F] text-white text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Member
                    </button>
                  </div>
                </div>

                {editingMember && (
                  <div className="rounded-xl bg-[#f7f1e8] p-4 border border-[#2a100a]/15 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Member name"
                        maxLength={80}
                        value={editingMember.name}
                        onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                        className="px-3 py-2 rounded-xl border bg-white"
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        maxLength={30}
                        value={editingMember.phone}
                        onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                        className="px-3 py-2 rounded-xl border bg-white"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        maxLength={120}
                        value={editingMember.email}
                        onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                        className="px-3 py-2 rounded-xl border bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Stamps"
                        value={editingMember.stamps}
                        onChange={(e) =>
                          setEditingMember({ ...editingMember, stamps: Number(e.target.value) || 0 })
                        }
                        className="px-3 py-2 rounded-xl border bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Lifetime Orders"
                        value={editingMember.lifetimeOrders}
                        onChange={(e) =>
                          setEditingMember({
                            ...editingMember,
                            lifetimeOrders: Number(e.target.value) || 0,
                          })
                        }
                        className="px-3 py-2 rounded-xl border bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Rewards Redeemed"
                        value={editingMember.rewardsRedeemed}
                        onChange={(e) =>
                          setEditingMember({
                            ...editingMember,
                            rewardsRedeemed: Number(e.target.value) || 0,
                          })
                        }
                        className="px-3 py-2 rounded-xl border bg-white"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingMember.firstInLine}
                            onChange={(e) =>
                              setEditingMember({ ...editingMember, firstInLine: e.target.checked })
                            }
                          />
                          <span>First in Line Member</span>
                        </label>
                        <select
                          value={editingMember.status}
                          onChange={(e) =>
                            setEditingMember({
                              ...editingMember,
                              status: e.target.value as 'active' | 'paused',
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg border bg-white"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingMember(null)}
                          className="px-3 py-1.5 rounded-xl border font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await saveBurgerClubMember(editingMember, isNewMember);
                            setEditingMember(null);
                            showToast('Burger Club member saved.');
                          }}
                          className="px-4 py-1.5 rounded-xl bg-[#E1000F] text-white font-bold cursor-pointer"
                        >
                          Save Member
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {filteredMembers.length === 0 ? (
                  <p className="text-xs opacity-65 py-4 text-center">No Burger Club members yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {filteredMembers.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-[#2a100a]/12 p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold">{m.name}</span>
                              {m.firstInLine && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  style={{ backgroundColor: draftSettings.crownColor }}
                                >
                                  <Crown className="w-3 h-3" /> Priority
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] opacity-70">
                              {m.phone} {m.email ? `· ${m.email}` : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-display text-lg text-[#E1000F] tabular-nums">
                              {m.stamps} / {draftSettings.ordersNeededForReward} stamps
                            </div>
                            <div className="text-[10px] opacity-65">
                              {m.lifetimeOrders} orders · {m.rewardsRedeemed} rewards
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-[#2a100a]/10">
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                await saveBurgerClubMember(
                                  {
                                    ...m,
                                    stamps: m.stamps + 1,
                                    lifetimeOrders: m.lifetimeOrders + 1,
                                  },
                                  false
                                );
                                showToast(`Added +1 stamp for ${m.name}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold cursor-pointer"
                            >
                              +1 Stamp
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await saveBurgerClubMember(
                                  {
                                    ...m,
                                    stamps: Math.max(0, m.stamps - draftSettings.ordersNeededForReward),
                                    rewardsRedeemed: m.rewardsRedeemed + 1,
                                  },
                                  false
                                );
                                showToast(`Redeemed reward for ${m.name}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#FDB105]/30 text-[#2a100a] text-[11px] font-bold cursor-pointer"
                            >
                              Redeem Reward
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await saveBurgerClubMember(
                                  { ...m, firstInLine: !m.firstInLine },
                                  false
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg bg-black/6 text-[11px] font-bold cursor-pointer"
                            >
                              {m.firstInLine ? 'Remove VIP' : 'Grant VIP'}
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsNewMember(false);
                                setEditingMember(m);
                              }}
                              className="px-2 py-1 rounded-lg bg-black/6 text-[11px] font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteBurgerClubMember(m.id);
                                showToast(`Removed ${m.name}`);
                              }}
                              className="p-1 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* 4. SHOP SETTINGS & APPEARANCE TAB */}
          {activeTab === 'shop' && (
            <div className="space-y-5">
              <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl text-[#E1000F]">Shop Settings</h2>
                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={() => void handleSaveSettings()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E1000F] text-white text-xs font-bold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Shop Name</label>
                    <input
                      type="text"
                      maxLength={80}
                      value={draftSettings.shopName}
                      onChange={(e) => setDraftSettings({ ...draftSettings, shopName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      maxLength={24}
                      value={draftSettings.whatsappNumber}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, whatsappNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                      Estimated Wait (min)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={draftSettings.estimatedWaitMins}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          estimatedWaitMins: Number(e.target.value) || 30,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      maxLength={8}
                      value={draftSettings.currencySymbol}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, currencySymbol: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-5 text-xs font-bold pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftSettings.orderingEnabled}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, orderingEnabled: e.target.checked })
                      }
                    />
                    <span>Accepting Online Orders</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftSettings.pickupEnabled}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, pickupEnabled: e.target.checked })
                      }
                    />
                    <span>Pickup Enabled</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftSettings.deliveryEnabled}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, deliveryEnabled: e.target.checked })
                      }
                    />
                    <span>Delivery Enabled</span>
                  </label>
                </div>
              </section>

              <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-4">
                <h2 className="font-display text-xl text-[#E1000F]">Storefront Appearance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  {(
                    [
                      ['brandColor', 'Brand Color'],
                      ['accentColor', 'Accent Color'],
                      ['crownColor', 'VIP Crown Color'],
                      ['backgroundColor', 'Background Tint'],
                      ['textColor', 'Primary Ink'],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field}>
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                        {label}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={draftSettings[field]}
                          onChange={(e) =>
                            setDraftSettings({ ...draftSettings, [field]: e.target.value })
                          }
                          className="h-9 w-10 rounded-lg border cursor-pointer"
                        />
                        <input
                          type="text"
                          maxLength={7}
                          value={draftSettings[field]}
                          onChange={(e) =>
                            setDraftSettings({ ...draftSettings, [field]: e.target.value })
                          }
                          className="flex-1 px-2 py-2 rounded-xl border font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Heading Font</label>
                    <input
                      type="text"
                      maxLength={80}
                      value={draftSettings.headingFont}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, headingFont: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Body Font</label>
                    <input
                      type="text"
                      maxLength={80}
                      value={draftSettings.bodyFont}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, bodyFont: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                      Custom Logo URL (optional)
                    </label>
                    <input
                      type="url"
                      maxLength={500}
                      placeholder="Leave blank for built-in Speedy Burger logo"
                      value={draftSettings.logoUrl}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, logoUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs font-bold pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftSettings.darkMode}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, darkMode: e.target.checked })
                      }
                    />
                    <span>Dark Studio Default</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftSettings.animationsEnabled}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, animationsEnabled: e.target.checked })
                      }
                    />
                    <span>3D Floating & Steam Animations</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span>Animation Scale:</span>
                    <input
                      type="range"
                      min={0.5}
                      max={5}
                      step={0.1}
                      value={draftSettings.animationScale}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          animationScale: parseFloat(e.target.value),
                        })
                      }
                    />
                    <span className="tabular-nums">{draftSettings.animationScale}×</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 5. WEBSITE CONTENT (ABOUT, CONTACT, SPLASH SCREEN, FOOTER) TAB */}
          {activeTab === 'content' && (
            <div className="space-y-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() => void handleSaveSettings()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E1000F] text-white text-xs font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save All Website Content
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* About Page */}
                <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-3 text-xs">
                  <h2 className="font-display text-xl text-[#E1000F]">About Page</h2>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Heading</label>
                    <input
                      type="text"
                      maxLength={120}
                      value={draftSettings.aboutHeading}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, aboutHeading: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Highlight Callout</label>
                    <input
                      type="text"
                      maxLength={300}
                      value={draftSettings.aboutHighlight}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, aboutHighlight: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Body Copy</label>
                    <textarea
                      rows={5}
                      maxLength={2000}
                      value={draftSettings.aboutBody}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, aboutBody: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                </section>

                {/* Contact Page */}
                <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-3 text-xs">
                  <h2 className="font-display text-xl text-[#E1000F]">Contact Page</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Heading</label>
                      <input
                        type="text"
                        maxLength={120}
                        value={draftSettings.contactHeading}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, contactHeading: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Phone</label>
                      <input
                        type="text"
                        maxLength={40}
                        value={draftSettings.contactPhone}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, contactPhone: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Email</label>
                      <input
                        type="text"
                        maxLength={120}
                        value={draftSettings.contactEmail}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, contactEmail: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Hours</label>
                      <input
                        type="text"
                        maxLength={160}
                        value={draftSettings.contactHours}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, contactHours: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Address / Location</label>
                    <input
                      type="text"
                      maxLength={240}
                      value={draftSettings.contactAddress}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, contactAddress: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Contact Note</label>
                    <textarea
                      rows={2}
                      maxLength={600}
                      value={draftSettings.contactNote}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, contactNote: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                </section>

                {/* Splash Screen */}
                <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl text-[#E1000F]">Splash Screen</h2>
                    <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftSettings.splashEnabled}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, splashEnabled: e.target.checked })
                        }
                      />
                      <span>Show On Entry</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Title</label>
                      <input
                        type="text"
                        maxLength={120}
                        value={draftSettings.splashTitle}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, splashTitle: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Button Text</label>
                      <input
                        type="text"
                        maxLength={60}
                        value={draftSettings.splashCtaText}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, splashCtaText: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Tagline</label>
                    <input
                      type="text"
                      maxLength={240}
                      value={draftSettings.splashTagline}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, splashTagline: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                      Splash Image URL (optional)
                    </label>
                    <input
                      type="url"
                      maxLength={500}
                      value={draftSettings.splashImageUrl}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, splashImageUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                </section>

                {/* Footer */}
                <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-3 text-xs">
                  <h2 className="font-display text-xl text-[#E1000F]">Website Footer</h2>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Primary Footer Text</label>
                    <input
                      type="text"
                      maxLength={240}
                      value={draftSettings.footerText}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, footerText: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">Secondary Footer Line</label>
                    <input
                      type="text"
                      maxLength={240}
                      value={draftSettings.footerSubtext}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, footerSubtext: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* 6. CUSTOMER-FACING LABELS & ORDER-TICKET TEXT TAB */}
          {activeTab === 'labels' && (
            <div className="space-y-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() => void handleSaveSettings()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E1000F] text-white text-xs font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Labels & Ticket Text
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-3 text-xs">
                  <h2 className="font-display text-xl text-[#E1000F]">Customer-Facing Labels</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(
                      [
                        ['tagline', 'Header Tagline'],
                        ['tabBuild', 'Build Tab Label'],
                        ['tabCombos', 'Combos Tab Label'],
                        ['tabOrders', 'Order Tab Label'],
                        ['tabCard', 'Loyalty Card Label'],
                        ['tabClub', 'Burger Club Label'],
                        ['pickBarComboText', 'Combo Prompt Text'],
                        ['pickBarBuildText', 'Build Prompt Text'],
                        ['viewOrderText', 'Checkout Button Label'],
                      ] as const
                    ).map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                          {label}
                        </label>
                        <input
                          type="text"
                          maxLength={field === 'tagline' ? 120 : 60}
                          value={draftSettings[field]}
                          onChange={(e) =>
                            setDraftSettings({ ...draftSettings, [field]: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-3 text-xs">
                  <h2 className="font-display text-xl text-[#E1000F]">Order-Ticket Text</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(
                      [
                        ['ticketHeading', 'Ticket Heading'],
                        ['ticketWaitLabel', 'Wait Time Label'],
                        ['ticketWhatsappText', 'WhatsApp Button Text'],
                        ['ticketBackText', 'Back Button Text'],
                      ] as const
                    ).map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                          {label}
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={draftSettings[field]}
                          onChange={(e) =>
                            setDraftSettings({ ...draftSettings, [field]: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-65 mb-1">
                      Ticket Footer Note
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={draftSettings.ticketFooterNote}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, ticketFooterNote: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>

                  {/* Live Ticket Preview */}
                  <div className="rounded-xl border-2 border-dashed border-[#2a100a]/25 p-3 bg-[#fffaf2] space-y-1.5">
                    <div className="text-[10px] font-bold uppercase opacity-60">Live Preview</div>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xl text-[#E1000F]">
                        {draftSettings.ticketHeading} · #SB-1042
                      </span>
                      <span className="text-[11px] font-bold">
                        {draftSettings.ticketWaitLabel}: ~{draftSettings.estimatedWaitMins} min
                      </span>
                    </div>
                    <p className="text-[11px] opacity-70">{draftSettings.ticketFooterNote}</p>
                    <div className="flex gap-2 pt-1">
                      <span
                        className="px-3 py-1 rounded-lg text-white font-bold text-[11px]"
                        style={{ backgroundColor: draftSettings.brandColor }}
                      >
                        {draftSettings.ticketWhatsappText}
                      </span>
                      <span className="px-3 py-1 rounded-lg border text-[11px] font-bold">
                        {draftSettings.ticketBackText}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* 7. AUTHORIZED STAFF ACCESS TAB */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-3 text-xs">
                <h2 className="font-display text-xl text-[#E1000F]">Authorize New Staff Member</h2>
                <p className="opacity-75">
                  Staff members sign in with Google, then share their UID shown on the Access Restricted screen so you can add them here.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Firebase Auth UID"
                    maxLength={128}
                    value={newAdminUid}
                    onChange={(e) => setNewAdminUid(e.target.value)}
                    className="px-3 py-2 rounded-xl border font-mono"
                  />
                  <input
                    type="email"
                    placeholder="Staff Google Email"
                    maxLength={160}
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="px-3 py-2 rounded-xl border"
                  />
                  <input
                    type="text"
                    placeholder="Display Name"
                    maxLength={80}
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="px-3 py-2 rounded-xl border"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value as 'staff' | 'super_admin')}
                      className="px-2.5 py-2 rounded-xl border bg-white"
                    >
                      <option value="staff">Staff</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newAdminUid.trim() || !newAdminEmail.trim()) return;
                        await saveAdminUser(
                          {
                            uid: newAdminUid.trim(),
                            email: newAdminEmail.trim(),
                            displayName: newAdminName.trim() || 'Staff Member',
                            role: newAdminRole,
                          },
                          user.uid,
                          true
                        );
                        setNewAdminUid('');
                        setNewAdminEmail('');
                        setNewAdminName('');
                        showToast('Staff member authorized.');
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#E1000F] text-white font-bold cursor-pointer"
                    >
                      Authorize
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-white border border-[#2a100a]/12 p-4 space-y-2.5 text-xs">
                <h3 className="font-bold text-sm">Authorized Staff Directory</h3>
                <div className="rounded-xl bg-[#FDB105]/18 border border-[#FDB105]/50 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold">Store Owner (Bootstrapped Super Admin)</div>
                    <div className="opacity-75">jahvain795@gmail.com</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#E1000F] text-white text-[10px] font-bold uppercase">
                    Permanent Owner
                  </span>
                </div>
                {admins.map((adm) => (
                  <div
                    key={adm.uid}
                    className="rounded-xl border border-[#2a100a]/12 p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold truncate">{adm.displayName}</div>
                      <div className="opacity-70 truncate">
                        {adm.email} · <span className="font-mono">{adm.uid}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-black/8 text-[10px] font-bold uppercase">
                        {adm.role}
                      </span>
                      {adm.uid !== user.uid && (
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteAdminUser(adm.uid);
                            showToast(`Removed staff access for ${adm.email}`);
                          }}
                          className="p-1.5 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

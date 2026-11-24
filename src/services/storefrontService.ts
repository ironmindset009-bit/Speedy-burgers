import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  AdminUserRecord,
  BOOTSTRAPPED_ADMIN_EMAIL,
  BurgerClubMemberRecord,
  DEFAULT_CATEGORIES,
  DEFAULT_MENU_ITEMS,
  DEFAULT_SITE_SETTINGS,
  MenuCategoryRecord,
  MenuItemRecord,
  OrderRecord,
  OrderStatus,
  RevenueCategory,
  RevenueEntryRecord,
  sanitizeCategory,
  sanitizeId,
  sanitizeMenuItem,
  sanitizeSiteSettings,
  SiteSettings,
} from '../data/siteConfig';
import { sanitizeSpeedyPet, SpeedyPetConfig } from '../data/speedyPetCatalog';
import { db, handleFirestoreError, OperationType } from '../firebase';

export function subscribeSiteSettings(onData: (settings: SiteSettings) => void): Unsubscribe {
  const path = 'siteSettings/public';
  return onSnapshot(
    doc(db, 'siteSettings', 'public'),
    (snap) => {
      if (snap.exists()) {
        onData(sanitizeSiteSettings(snap.data() as Partial<SiteSettings>));
      } else {
        onData(DEFAULT_SITE_SETTINGS);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeCategories(onData: (categories: MenuCategoryRecord[]) => void): Unsubscribe {
  const path = 'categories';
  const q = query(collection(db, path), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData([]);
        return;
      }
      onData(snap.docs.map((d) => sanitizeCategory(d.data() as MenuCategoryRecord)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeMenuItems(onData: (items: MenuItemRecord[]) => void): Unsubscribe {
  const path = 'items';
  const q = query(collection(db, path), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData([]);
        return;
      }
      onData(snap.docs.map((d) => sanitizeMenuItem(d.data() as MenuItemRecord)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) return true;
  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveSiteSettings(settings: SiteSettings, uid: string): Promise<void> {
  const path = 'siteSettings/public';
  const clean = sanitizeSiteSettings(settings);
  try {
    await setDoc(doc(db, 'siteSettings', 'public'), {
      ...clean,
      updatedAt: serverTimestamp(),
      updatedBy: uid.slice(0, 128),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCategory(category: MenuCategoryRecord): Promise<void> {
  const clean = sanitizeCategory(category);
  const path = `categories/${clean.id}`;
  try {
    await setDoc(doc(db, 'categories', clean.id), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const id = sanitizeId(categoryId);
  const path = `categories/${id}`;
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMenuItem(item: MenuItemRecord): Promise<void> {
  const clean = sanitizeMenuItem(item);
  const path = `items/${clean.id}`;
  try {
    await setDoc(doc(db, 'items', clean.id), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMenuItem(itemId: string): Promise<void> {
  const id = sanitizeId(itemId);
  const path = `items/${id}`;
  try {
    await deleteDoc(doc(db, 'items', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedDefaultCatalogAndSettings(uid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const cleanSettings = sanitizeSiteSettings(DEFAULT_SITE_SETTINGS);
    batch.set(doc(db, 'siteSettings', 'public'), {
      ...cleanSettings,
      updatedAt: serverTimestamp(),
      updatedBy: uid.slice(0, 128),
    });

    for (const cat of DEFAULT_CATEGORIES) {
      const cleanCat = sanitizeCategory(cat);
      batch.set(doc(db, 'categories', cleanCat.id), {
        ...cleanCat,
        updatedAt: serverTimestamp(),
      });
    }

    for (const item of DEFAULT_MENU_ITEMS) {
      const cleanItem = sanitizeMenuItem(item);
      batch.set(doc(db, 'items', cleanItem.id), {
        ...cleanItem,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'siteSettings+categories+items');
  }
}

export function subscribeAllOrders(onData: (orders: OrderRecord[]) => void): Unsubscribe {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as OrderRecord));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeUserOrders(uid: string, onData: (orders: OrderRecord[]) => void): Unsubscribe {
  const path = 'orders';
  const q = query(
    collection(db, path),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(40)
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as OrderRecord));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createOrder(
  user: User,
  input: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    orderMode: 'Pickup' | 'Delivery';
    comboName: string;
    items: string[];
    total: number;
    notes: string;
  }
): Promise<OrderRecord> {
  const id = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const ticketCode = `SB-${Math.floor(1000 + Math.random() * 9000)}`;
  const path = `orders/${id}`;
  const cleanItems = input.items
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim().slice(0, 120))
    .slice(0, 25);

  const record: OrderRecord = {
    id,
    userId: user.uid.slice(0, 128),
    ticketCode,
    customerName: (input.customerName.trim() || user.displayName || 'Customer').slice(0, 80),
    customerPhone: (input.customerPhone.trim() || '876-000-0000').slice(0, 30),
    deliveryAddress: input.deliveryAddress.trim().slice(0, 240),
    orderMode: input.orderMode === 'Delivery' ? 'Delivery' : 'Pickup',
    comboName: input.comboName.trim().slice(0, 80),
    items: cleanItems.length > 0 ? cleanItems : ['Custom Burger'],
    total: Math.max(0, Math.min(500000, Math.round(Number(input.total) || 0))),
    status: 'pending',
    notes: input.notes.trim().slice(0, 300),
    staffNote: '',
    approved: false,
    approvedBy: '',
  };

  try {
    await setDoc(doc(db, 'orders', id), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  staffNote: string,
  options?: { approved?: boolean; approvedBy?: string }
): Promise<void> {
  const id = sanitizeId(orderId);
  const path = `orders/${id}`;
  const keepApproved = status !== 'cancelled' && Boolean(options?.approved);
  const approvedBy = keepApproved ? (options?.approvedBy || '').slice(0, 128) : '';
  try {
    await updateDoc(doc(db, 'orders', id), {
      status,
      staffNote: staffNote.trim().slice(0, 300),
      approved: keepApproved,
      approvedBy,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderApproval(
  orderId: string,
  approved: boolean,
  adminUid: string,
  currentStatus?: OrderStatus
): Promise<void> {
  const id = sanitizeId(orderId);
  const path = `orders/${id}`;
  const nextStatus =
    approved && currentStatus === 'cancelled' ? 'completed' : undefined;
  try {
    await updateDoc(doc(db, 'orders', id), {
      ...(nextStatus ? { status: nextStatus } : {}),
      approved,
      approvedBy: approved ? adminUid.slice(0, 128) : '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  const id = sanitizeId(orderId);
  const path = `orders/${id}`;
  try {
    await deleteDoc(doc(db, 'orders', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeAllRevenueEntries(
  onData: (entries: RevenueEntryRecord[]) => void
): Unsubscribe {
  const path = 'revenueEntries';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as RevenueEntryRecord));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createRevenueEntry(
  user: User,
  input: {
    title: string;
    category: RevenueCategory;
    amount: number;
    note: string;
  }
): Promise<void> {
  const id = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `revenueEntries/${id}`;
  const validCategories: RevenueCategory[] = [
    'walk_in',
    'whatsapp',
    'club_fee',
    'catering',
    'other',
  ];
  const category = validCategories.includes(input.category) ? input.category : 'other';
  const cleanTitle = (input.title.trim() || 'Walk-in Sale').slice(0, 100);
  const amount = Math.max(0, Math.min(500000, Math.round(Number(input.amount) || 0)));

  try {
    await setDoc(doc(db, 'revenueEntries', id), {
      id,
      title: cleanTitle,
      category,
      amount,
      note: input.note.trim().slice(0, 300),
      approved: false,
      createdBy: user.uid.slice(0, 128),
      approvedBy: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateRevenueEntryApproval(
  entryId: string,
  approved: boolean,
  adminUid: string
): Promise<void> {
  const id = sanitizeId(entryId);
  const path = `revenueEntries/${id}`;
  try {
    await updateDoc(doc(db, 'revenueEntries', id), {
      approved,
      approvedBy: approved ? adminUid.slice(0, 128) : '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRevenueEntry(entryId: string): Promise<void> {
  const id = sanitizeId(entryId);
  const path = `revenueEntries/${id}`;
  try {
    await deleteDoc(doc(db, 'revenueEntries', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeAllBurgerClub(onData: (members: BurgerClubMemberRecord[]) => void): Unsubscribe {
  const path = 'burgerClub';
  const q = query(collection(db, path), orderBy('updatedAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as BurgerClubMemberRecord));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeUserBurgerClub(
  uid: string,
  onData: (member: BurgerClubMemberRecord | null) => void
): Unsubscribe {
  const path = `burgerClub/${uid}`;
  return onSnapshot(
    doc(db, 'burgerClub', uid),
    (snap) => {
      onData(snap.exists() ? (snap.data() as BurgerClubMemberRecord) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function selfJoinBurgerClub(
  user: User,
  name: string,
  phone: string
): Promise<void> {
  const path = `burgerClub/${user.uid}`;
  const cleanPhone = phone.trim().slice(0, 30);
  const payload = {
    id: user.uid,
    userId: user.uid,
    name: (name.trim() || user.displayName || 'Burger Lover').slice(0, 80),
    phone: cleanPhone.length >= 5 ? cleanPhone : '876-000-0000',
    email: (user.email ?? '').slice(0, 120),
    stamps: 0,
    lifetimeOrders: 0,
    rewardsRedeemed: 0,
    firstInLine: false,
    status: 'active',
    notes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'burgerClub', user.uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSelfBurgerClubProfile(
  uid: string,
  name: string,
  phone: string,
  email: string
): Promise<void> {
  const path = `burgerClub/${uid}`;
  const cleanPhone = phone.trim().slice(0, 30);
  try {
    await updateDoc(doc(db, 'burgerClub', uid), {
      name: (name.trim() || 'Burger Lover').slice(0, 80),
      phone: cleanPhone.length >= 5 ? cleanPhone : '876-000-0000',
      email: email.trim().slice(0, 120),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveBurgerClubMember(
  member: BurgerClubMemberRecord,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(member.id || `club_${Date.now()}`, `club_${Date.now()}`);
  const path = `burgerClub/${id}`;
  const cleanPhone = member.phone.trim().slice(0, 30);
  const clean = {
    id,
    userId: (member.userId.trim() || id).slice(0, 128),
    name: (member.name.trim() || 'Member').slice(0, 80),
    phone: cleanPhone.length >= 5 ? cleanPhone : '876-000-0000',
    email: member.email.trim().slice(0, 120),
    stamps: Math.max(0, Math.min(100, Math.round(Number(member.stamps) || 0))),
    lifetimeOrders: Math.max(0, Math.min(10000, Math.round(Number(member.lifetimeOrders) || 0))),
    rewardsRedeemed: Math.max(0, Math.min(1000, Math.round(Number(member.rewardsRedeemed) || 0))),
    firstInLine: Boolean(member.firstInLine),
    status: member.status === 'paused' ? 'paused' : 'active',
    notes: member.notes.trim().slice(0, 300),
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'burgerClub', id), {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'burgerClub', id), {
        name: clean.name,
        phone: clean.phone,
        email: clean.email,
        stamps: clean.stamps,
        lifetimeOrders: clean.lifetimeOrders,
        rewardsRedeemed: clean.rewardsRedeemed,
        firstInLine: clean.firstInLine,
        status: clean.status,
        notes: clean.notes,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteBurgerClubMember(memberId: string): Promise<void> {
  const id = sanitizeId(memberId);
  const path = `burgerClub/${id}`;
  try {
    await deleteDoc(doc(db, 'burgerClub', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeAdmins(onData: (admins: AdminUserRecord[]) => void): Unsubscribe {
  const path = 'admins';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as AdminUserRecord));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveAdminUser(
  admin: Omit<AdminUserRecord, 'addedBy' | 'createdAt'>,
  currentUid: string,
  isNew: boolean
): Promise<void> {
  const uid = sanitizeId(admin.uid);
  const path = `admins/${uid}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'admins', uid), {
        uid,
        email: admin.email.trim().slice(0, 160),
        displayName: (admin.displayName.trim() || 'Staff Member').slice(0, 80),
        role: admin.role === 'super_admin' ? 'super_admin' : 'staff',
        addedBy: currentUid.slice(0, 128),
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'admins', uid), {
        email: admin.email.trim().slice(0, 160),
        displayName: (admin.displayName.trim() || 'Staff Member').slice(0, 80),
        role: admin.role === 'super_admin' ? 'super_admin' : 'staff',
      });
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteAdminUser(uid: string): Promise<void> {
  const id = sanitizeId(uid);
  const path = `admins/${id}`;
  try {
    await deleteDoc(doc(db, 'admins', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserSpeedyPets(
  uid: string,
  onData: (pets: SpeedyPetConfig[]) => void
): Unsubscribe {
  const path = 'speedyPets';
  const q = query(
    collection(db, path),
    where('userId', '==', uid),
    orderBy('updatedAt', 'desc'),
    limit(24)
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => sanitizeSpeedyPet(d.data() as SpeedyPetConfig)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveSpeedyPetToFirestore(
  user: User,
  pet: SpeedyPetConfig
): Promise<SpeedyPetConfig> {
  const clean = sanitizeSpeedyPet(pet);
  const path = `speedyPets/${clean.id}`;
  try {
    const ref = doc(db, 'speedyPets', clean.id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        name: clean.name,
        species: clean.species,
        gender: clean.gender,
        furColor: clean.furColor,
        hairStyle: clean.hairStyle,
        hairColor: clean.hairColor,
        eyeStyle: clean.eyeStyle,
        eyeColor: clean.eyeColor,
        eyebrowStyle: clean.eyebrowStyle,
        expression: clean.expression,
        facialHair: clean.facialHair,
        topId: clean.topId,
        bottomId: clean.bottomId,
        footwearId: clean.footwearId,
        accessories: clean.accessories,
        lastFedAt: clean.lastFedAt,
        happiness: clean.happiness,
        streakDays: clean.streakDays,
        totalMealsEaten: clean.totalMealsEaten,
        xp: clean.xp,
        level: clean.level,
        lastMealName: clean.lastMealName,
        lastMealItems: clean.lastMealItems,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...clean,
        userId: user.uid.slice(0, 128),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSpeedyPetFromFirestore(petId: string): Promise<void> {
  const id = sanitizeId(petId);
  const path = `speedyPets/${id}`;
  try {
    await deleteDoc(doc(db, 'speedyPets', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}


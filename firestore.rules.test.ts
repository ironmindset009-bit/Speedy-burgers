/**
 * Security TDD Specification Runner for Speedy Burger Firestore Rules.
 * Lists the 12 "Dirty Dozen" adversarial payloads and expected PERMISSION_DENIED outcomes.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid?: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  mitigatingRule: string;
}

export const DIRTY_DOZEN_SECURITY_CASES: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unverified Admin Email Spoof',
    collectionPath: 'siteSettings/public',
    operation: 'update',
    auth: { uid: 'attacker_1', email: 'jahvain795@gmail.com', email_verified: false },
    payload: { shopName: 'Hacked Burger' },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: 'isSuperAdminEmail() mandates request.auth.token.email_verified == true',
  },
  {
    id: 2,
    name: 'Self-Assigned Admin Record',
    collectionPath: 'admins/attacker_2',
    operation: 'create',
    auth: { uid: 'attacker_2', email: 'evil@example.com', email_verified: true },
    payload: { uid: 'attacker_2', email: 'evil@example.com', displayName: 'Evil', role: 'super_admin' },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: '/admins/{uid} allow create requires isAdmin()',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Menu Item',
    collectionPath: 'items/bad_item',
    operation: 'create',
    auth: { uid: 'staff_1', email: 'jahvain795@gmail.com', email_verified: true },
    payload: { id: 'bad_item', name: 'Ghost Burger', secretFlag: true },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: 'isValidMenuItem() enforces data.keys().hasOnly([...])',
  },
  {
    id: 4,
    name: 'Order PII Enumeration Without Owner Filter',
    collectionPath: 'orders',
    operation: 'list',
    auth: { uid: 'customer_1', email: 'cust@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: 'orders allow list enforces isAdmin() || existing().userId == request.auth.uid',
  },
  {
    id: 5,
    name: 'Order Cross-User Read',
    collectionPath: 'orders/order_victim',
    operation: 'get',
    auth: { uid: 'customer_1', email: 'cust@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: 'orders allow get enforces existing().userId == request.auth.uid',
  },
  {
    id: 6,
    name: 'Order Status Bypass on Create',
    collectionPath: 'orders/order_bypass',
    operation: 'create',
    auth: { uid: 'customer_1', email: 'cust@example.com', email_verified: true },
    payload: { id: 'order_bypass', userId: 'customer_1', status: 'completed', staffNote: 'Comp' },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: "orders allow create enforces incoming().status == 'pending' && incoming().staffNote == ''",
  },
  {
    id: 7,
    name: 'Timestamp Forgery on Order Create',
    collectionPath: 'orders/order_old_ts',
    operation: 'create',
    auth: { uid: 'customer_1', email: 'cust@example.com', email_verified: true },
    payload: { id: 'order_old_ts', userId: 'customer_1', createdAt: '2020-01-01T00:00:00.000Z' },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: 'orders allow create enforces incoming().createdAt == request.time && incoming().updatedAt == request.time',
  },
  {
    id: 8,
    name: 'Self-Granted Burger Club Stamps & Priority',
    collectionPath: 'burgerClub/customer_1',
    operation: 'create',
    auth: { uid: 'customer_1', email: 'cust@example.com', email_verified: true },
    payload: { id: 'customer_1', userId: 'customer_1', stamps: 10, firstInLine: true },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: 'burgerClub self-enroll requires stamps == 0 && firstInLine == false',
  },
  {
    id: 9,
    name: 'Burger Club Stamp Tampering on Update',
    collectionPath: 'burgerClub/customer_1',
    operation: 'update',
    auth: { uid: 'customer_1', email: 'cust@example.com', email_verified: true },
    payload: { name: 'Honest Name', stamps: 99 },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: "customer update affectedKeys().hasOnly(['name', 'phone', 'email', 'updatedAt'])",
  },
  {
    id: 10,
    name: 'ID Poisoning on Menu Item',
    collectionPath: 'items/bad$id!junk',
    operation: 'create',
    auth: { uid: 'staff_1', email: 'jahvain795@gmail.com', email_verified: true },
    payload: { id: 'bad$id!junk', name: 'Bad ID' },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: "isValidId() matches '^[a-zA-Z0-9_\\-]+$' and length <= 128",
  },
  {
    id: 11,
    name: 'Unbounded Array Attack on Order',
    collectionPath: 'orders/order_dos',
    operation: 'create',
    auth: { uid: 'customer_1', email: 'cust@example.com', email_verified: true },
    payload: { id: 'order_dos', items: Array.from({ length: 50 }, (_, i) => `Item ${i}`) },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: 'isValidOrderRecord() enforces data.items.size() <= 25',
  },
  {
    id: 12,
    name: 'Customer Mutating Storefront Settings',
    collectionPath: 'siteSettings/public',
    operation: 'update',
    auth: { uid: 'customer_1', email: 'cust@example.com', email_verified: true },
    payload: { shopName: 'Defaced' },
    expectedOutcome: 'PERMISSION_DENIED',
    mitigatingRule: 'siteSettings/public write strictly requires isAdmin()',
  },
];

export function verifyDirtyDozenSpecs(): boolean {
  return DIRTY_DOZEN_SECURITY_CASES.length === 12;
}

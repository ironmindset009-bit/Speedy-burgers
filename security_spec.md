# Security Specification: Speedy Burger Storefront & Admin Dashboard

## 1. Data Invariants
1. **Default-Deny Catch-All**: All paths not explicitly matched deny both read and write.
2. **Identity & Bootstrapped Admin Integrity**: Only authenticated users with `request.auth.token.email_verified == true` AND either the bootstrapped owner email (`jahvain795@gmail.com`) or a matching `/admins/{uid}` document can access the Admin Dashboard or modify menu/categories/site settings/staff.
3. **Catalog & Settings Integrity**: `siteSettings/public`, `categories/{categoryId}`, and `items/{itemId}` are readable publicly for storefront rendering, but mutations are strictly restricted to verified admins with exact key allowlists and field boundary checks.
4. **PII Isolation (`orders`, `burgerClub`, `admins`)**: Customer phone numbers, addresses, emails, and order records are never publicly readable or readable by other customers (`isSignedIn()` blanket reads are strictly forbidden). Queries (`allow list`) enforce `isAdmin()` or `resource.data.userId == request.auth.uid`.
5. **Privilege Escalation Prevention**: Customers self-registering into `burgerClub/{uid}` cannot set `stamps > 0`, `lifetimeOrders > 0`, `rewardsRedeemed > 0`, or `firstInLine == true`, and cannot mutate loyalty counters on update.
6. **Order State Integrity & Strict Timestamps**: Orders created by customers must start with `status == 'pending'`, empty `staffNote`, `userId == request.auth.uid`, and server timestamps `createdAt == request.time && updatedAt == request.time`. Terminal states (`completed`, `cancelled`) cannot be reopened except by verified admins.
7. **Anti-Shadow / Bounded Arrays**: Every collection enforces exact `hasAll` + `hasOnly` key allowlists, string `.size()` caps, ID regex validation (`^[a-zA-Z0-9_\\-]+$`), and bounded array sizes (`<= 25`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Admin Email Spoof**: User token has `email: "jahvain795@gmail.com"` with `email_verified: false` attempting to update `siteSettings/public` -> `PERMISSION_DENIED`.
2. **Self-Assigned Admin Record**: Non-admin user attempts `create` on `/admins/{theirUid}` with `role: "super_admin"` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection on Menu Item**: Admin or non-admin creates `/items/bad_item` with an extra ghost field `{ "__proto__": "x", "secretFlag": true }` -> `PERMISSION_DENIED`.
4. **Order PII Enumeration (`list` without owner filter)**: Authenticated non-admin customer attempts `list` on `/orders` without `where('userId', '==', uid)` -> `PERMISSION_DENIED`.
5. **Order Cross-User `get`**: Authenticated non-admin customer A attempts `get` on `/orders/order_owned_by_B` -> `PERMISSION_DENIED`.
6. **Order Status Bypass on Create**: Customer submits a new order with `status: "completed"` or `staffNote: "Free!"` -> `PERMISSION_DENIED`.
7. **Timestamp Forgery on Order Create**: Customer submits `createdAt` from client clock (`2020-01-01T00:00:00Z`) instead of `serverTimestamp()` -> `PERMISSION_DENIED`.
8. **Self-Granted Burger Club Points**: Customer creates `/burgerClub/{uid}` with `stamps: 10, firstInLine: true` -> `PERMISSION_DENIED`.
9. **Burger Club Stamp Tampering on Update**: Existing member updates `/burgerClub/{uid}` adding `stamps: 99` alongside `name` -> `PERMISSION_DENIED`.
10. **Denial-of-Wallet ID Poisoning**: Attacker writes `/items/{200-char-junk-id}` or `/items/bad$id!` -> `PERMISSION_DENIED`.
11. **Unbounded Array Attack on Order**: Customer creates order with `items` containing 50 strings (`> 25`) -> `PERMISSION_DENIED`.
12. **Customer Mutating Storefront Appearance/Settings**: Non-admin authenticated user attempts `update` on `/siteSettings/public` -> `PERMISSION_DENIED`.

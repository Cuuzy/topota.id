# Security Specification: Selasar Furniture App

## 1. Data Invariants

1. **Settings / Landing Content**:
   - Must contain public brand information, CTA, contact, and features list.
   - Read is public. Write is restricted to Admin or Manager.

2. **Products**:
   - Must have numeric non-negative stock and price.
   - Read is public.
   - Write is restricted to Admin or Manager.
   - Public updates are ONLY permitted for reducing/updating `stock` and incrementing `soldCount` during a guest checkout transaction.

3. **Transactions**:
   - Guest can create a new transaction record.
   - Transaction total amount must be non-negative.
   - Only Admins and Managers can read, query, or delete transaction history.

4. **User Profiles**:
   - Users can read/write their own profile if authenticated.
   - Role updates are strictly restricted to Admin users.
   - No user can self-promote their role to "admin" or "manager" during creation or update.

---

## 2. The "Dirty Dozen" Payloads (Unauthorized Writes & Vulnerabilities)

1. **Payload 1**: Guest attempts to overwrite the landing page content (`settings/landing_content`).
2. **Payload 2**: Authenticated non-admin attempts to overwrite the landing page content (`settings/landing_content`).
3. **Payload 3**: Guest attempts to create a new product (`products/{newId}`).
4. **Payload 4**: Guest attempts to delete a product (`products/{productId}`).
5. **Payload 5**: Guest attempts to update a product's price (`products/{productId}`).
6. **Payload 6**: Guest attempts to read transaction history (`transactions`).
7. **Payload 7**: Authenticated non-admin/non-manager attempts to read transaction history (`transactions`).
8. **Payload 8**: Guest attempts to delete a transaction (`transactions/{id}`).
9. **Payload 9**: Authenticated user attempts to read another user's profile (`users/{otherUid}`).
10. **Payload 10**: Authenticated user attempts to register as an "admin" (`users/{myUid}`) with `role: "admin"`.
11. **Payload 11**: Guest attempts to create or write a user profile directly (`users/{anyUid}`).
12. **Payload 12**: Authenticated user attempts to elevate their role from "viewer" to "admin" on update.

All these payloads MUST be strictly blocked by the security rules, returning `PERMISSION_DENIED`.

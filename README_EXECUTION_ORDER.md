
# Database Repair Execution Order

**WARNING**: This is a production database operation. Execute scripts in the exact order below.

1.  **`00_introspection.sql`**
    *   *Action*: Run this first.
    *   *Why*: Verify that `profiles`, `orders`, and `user_role` enums exist as expected. If the schema differs significantly, STOP.

2.  **`01_fix_roles_and_admin.sql`**
    *   *Action*: Run.
    *   *Result*: Creates the secure `is_admin()` function and normalizes role casing in the `profiles` table. Admin login should start working after this.

3.  **`02_fix_rls_profiles.sql`**
    *   *Action*: Run.
    *   *Result*: Fixes "InitPlan" warnings. Users can see their own data. Admins see all.

4.  **`03_fix_rls_orders.sql`**
    *   *Action*: Run.
    *   *Result*: Enforces the Manufacturer -> Gaddi -> Retailer visibility pipeline. Prevents unauthorized deletion of orders.

5.  **`04_fix_rls_financials.sql`**
    *   *Action*: Run.
    *   *Result*: Locks down pricing rules and ledger transactions. Makes financial history immutable.

6.  **`05_fix_ai_audit.sql`**
    *   *Action*: Run.
    *   *Result*: Ensures the AI audit log table exists and is writable only by the system (Service Role), read-only for Admins.

## Validation Checks
After execution, verify:
1.  Admin can log in and see all profiles.
2.  Retailer can log in and ONLY see their own orders.
3.  Agents can see clients assigned to them.
4.  No one (except maybe Super Admin) can delete an Order.

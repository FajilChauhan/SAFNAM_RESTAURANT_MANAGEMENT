# Operations Module

The Operations module is the single backend surface for staff dashboards and daily workflow views. It does not create new business flows; it reads and coordinates existing modules such as bookings, kitchen, invoices, payments, tables, and rooms.

Role-based permissions live in `constants/operationPermissions.ts` and are enforced by `middlewares/operationPermission.middleware.ts`. These static permissions can later be moved into database-backed permissions without changing controller logic.

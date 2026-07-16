# migration

Documents production-ready migration workflow.

Naming convention:

```txt
YYYYMMDDHHMM_description
```

Development:

```bash
npm.cmd run prisma:migrate -- --name 202607161430_add_menu_storage_standards
```

Create migration without applying:

```bash
npm.cmd run prisma:migrate:create -- --name 202607161430_add_menu_storage_standards
```

Production:

```bash
npm.cmd run prisma:migrate:prod
```

Seed:

```bash
npm.cmd run prisma:seed
```

Reset local database only:

```bash
npm.cmd run prisma:reset
```

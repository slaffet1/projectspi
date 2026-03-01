-- ─── Roles ────────────────────────────────────────────────────────────────────
INSERT INTO "roles" ("title", "created_at") VALUES
  ('OWNER',          NOW()),
  ('ADMIN',          NOW()),
  ('ACCOUNTANT',     NOW()),
  ('MEMBER',         NOW()),
  ('PLATFORM_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- ─── Permissions ──────────────────────────────────────────────────────────────
INSERT INTO "permissions" ("action") VALUES
  ('business:read'), ('business:update'), ('business:delete'),
  ('member:invite'), ('member:remove'), ('member:update_role'), ('member:read'),
  ('client:create'), ('client:read'), ('client:update'), ('client:delete'),
  ('product:create'), ('product:read'), ('product:update'), ('product:delete'),
  ('invoice:create'), ('invoice:read'), ('invoice:update'), ('invoice:delete'),
  ('quote:create'), ('quote:read'), ('quote:update'), ('quote:delete'),
  ('tax:create'), ('tax:read'), ('tax:update'), ('tax:delete'),
  ('bank:create'), ('bank:read'), ('bank:update'), ('bank:delete'),
  ('expense:create'), ('expense:read'), ('expense:update'), ('expense:delete')
ON CONFLICT ("action") DO NOTHING;

-- ─── OWNER: everything ────────────────────────────────────────────────────────
INSERT INTO "roles_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r, "permissions" p
WHERE r.title = 'OWNER'
ON CONFLICT DO NOTHING;

-- ─── ADMIN: everything except business:delete and member:update_role ──────────
INSERT INTO "roles_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r
JOIN "permissions" p ON p.action NOT IN ('business:delete', 'member:update_role')
WHERE r.title = 'ADMIN'
ON CONFLICT DO NOTHING;

-- ─── ACCOUNTANT: financial CRUD + read-only on rest ───────────────────────────
INSERT INTO "roles_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r
JOIN "permissions" p ON p.action IN (
  'invoice:create', 'invoice:read', 'invoice:update', 'invoice:delete',
  'quote:create',   'quote:read',   'quote:update',   'quote:delete',
  'client:create',  'client:read',  'client:update',  'client:delete',
  'expense:create', 'expense:read', 'expense:update', 'expense:delete',
  'bank:read', 'product:read', 'tax:read', 'member:read', 'business:read'
)
WHERE r.title = 'ACCOUNTANT'
ON CONFLICT DO NOTHING;

-- ─── MEMBER: read-only + create on key resources ─────────────────────────────
INSERT INTO "roles_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r
JOIN "permissions" p ON p.action LIKE '%:read'
  OR p.action IN ('invoice:create', 'quote:create', 'client:create', 'expense:create')
WHERE r.title = 'MEMBER'
ON CONFLICT DO NOTHING;

-- ─── PLATFORM_ADMIN: everything ───────────────────────────────────────────────
INSERT INTO "roles_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r, "permissions" p
WHERE r.title = 'PLATFORM_ADMIN'
ON CONFLICT DO NOTHING;

-- Seed permissions required by the loans module for existing installations.
INSERT INTO "permissions" ("id", "action", "description", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid(), 'loans.manage', 'Registrar y gestionar préstamos de materiales', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'loans.view', 'Ver préstamos de materiales', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("action") DO UPDATE
SET "description" = EXCLUDED."description", "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "role_permissions" ("id", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid(), r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p ON p."action" IN ('loans.manage', 'loans.view')
WHERE r."name" IN ('ADMIN', 'ENCARGADO', 'DEPOSITO')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

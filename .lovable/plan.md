

## Add Client: Aspenview Technology Partners

### Action
Insert a new row into the `clients` table:

```sql
INSERT INTO clients (name, status, organization_id)
VALUES (
  'Aspenview Technology Partners',
  'active',
  '9335c64c-b793-4578-bf51-63d0c3b5d66d'
);
```

### Details
- **Organization**: Aspen Analytics (`9335c64c-b793-4578-bf51-63d0c3b5d66d`)
- **Client Name**: Aspenview Technology Partners
- **Status**: active
- **Other fields** (email, phone, company, address, etc.): left null for now -- can be updated later through the admin UI

### Scope
- Single SQL INSERT, no schema changes, no code changes needed.


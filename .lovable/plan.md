

## Clean Up E2E Test Data

Found the following test records to delete:

| Table | ID | Details |
|-------|-----|---------|
| `outbound_calls` | `be3f6b0a-009c-418c-a270-914a8c77f701` | +15555550199, status: initiated |
| `outbound_calls` | `556b7567-5dee-4585-8667-c667e30696a5` | +15550009999, status: initiated |
| `applications` | `a4081b0b-33f1-46ca-abcb-9fa0008248ae` | Created Mar 12 13:01 |
| `applications` | `af7f9c44-8ef5-4eb7-b55d-141363da8383` | Created Mar 12 13:11 |

### Execution

Delete outbound calls first (they reference applications via FK), then delete the applications.

```sql
DELETE FROM outbound_calls WHERE id IN (
  'be3f6b0a-009c-418c-a270-914a8c77f701',
  '556b7567-5dee-4585-8667-c667e30696a5'
);

DELETE FROM applications WHERE id IN (
  'a4081b0b-33f1-46ca-abcb-9fa0008248ae',
  'af7f9c44-8ef5-4eb7-b55d-141363da8383'
);
```


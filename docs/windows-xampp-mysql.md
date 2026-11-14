# XAMPP + MySQL (local development)

This project runs on **MySQL 8** locally via **XAMPP** (`c:\xampp2`).

## Checklist

1. XAMPP Control Panel → **MySQL** → Start  
2. phpMyAdmin → create database **`joborio`**  
3. `backend/.env`:

```env
DB_CONNECTION=mysql
DB_PORT=3306
DB_DATABASE=joborio
DB_USERNAME=root
DB_PASSWORD=
```

4. Migrate:

```powershell
cd E:\upsidcnew\backend
c:\xampp2\php\php.exe artisan migrate:fresh --seed
```

## Do not mix drivers

| Wrong | Result |
|-------|--------|
| `DB_CONNECTION=pgsql` + port `3306` | SSL / connection errors (MySQL is not Postgres) |
| `DB_CONNECTION=mysql` + port `5432` | Connection refused |

## Tests

Create **`joborio_test`** in phpMyAdmin, then:

```powershell
c:\xampp2\php\php.exe artisan test
```

## PostgreSQL

Blueprint §6 mentions PostgreSQL for production ledgers; **local dev uses MySQL** per your environment. Production can stay MySQL 8 or migrate to PostgreSQL later without changing app code if migrations stay portable.

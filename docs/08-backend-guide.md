# Backend Guide (Laravel)

## Setup (XAMPP MySQL)

See [windows-xampp-mysql.md](./windows-xampp-mysql.md) and [backend/README.md](../backend/README.md).

```bash
cd backend
# DB_CONNECTION=mysql, port 3306, database joborio
php artisan migrate --seed
php artisan serve
```

## Database

**MySQL 8** — `DB_CONNECTION=mysql`. Tests: database `joborio_test`.

## Packages

Sanctum, Spatie Permission, Socialite (Google + LinkedIn).

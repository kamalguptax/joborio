# Native Windows PostgreSQL (XAMPP MySQL is not compatible with `DB_CONNECTION=pgsql`)

XAMPP runs **MySQL on port 3306**. Laravel with `pgsql` must use **PostgreSQL on port 5432**.  
If you point `pgsql` at `3306`, you get: `invalid response to SSL negotiation`.

## 1. Install PostgreSQL

1. Download the Windows installer: https://www.postgresql.org/download/windows/
2. Install **PostgreSQL 16**, set a **postgres superuser password** (remember it).
3. Keep default port **5432**.
4. In **Services** (`services.msc`), ensure **postgresql-x64-16** is **Running**.

## 2. Create database and user

Open **SQL Shell (psql)** from the Start menu (or pgAdmin → Query Tool):

```sql
CREATE USER joborio WITH PASSWORD 'joborio';
CREATE DATABASE joborio OWNER joborio;
CREATE DATABASE joborio_test OWNER joborio;
GRANT ALL PRIVILEGES ON DATABASE joborio TO joborio;
GRANT ALL PRIVILEGES ON DATABASE joborio_test TO joborio;
```

(Connect as `postgres` when prompted.)

## 3. `backend/.env`

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=joborio
DB_USERNAME=joborio
DB_PASSWORD=joborio
```

Optional if SSL errors persist on local dev:

```env
DB_SSLMODE=prefer
```

Or in `config/database.php` pgsql connection add `'sslmode' => 'disable'` for local only.

## 4. PHP (XAMPP)

You already have `pdo_pgsql` enabled in `c:\xampp2\php`. Run Artisan with that PHP:

```powershell
cd E:\upsidcnew\backend
c:\xampp2\php\php.exe artisan migrate:fresh --seed
```

## 5. If you prefer XAMPP MySQL only

Use MySQL instead of PostgreSQL (different from blueprint default):

```env
DB_CONNECTION=mysql
DB_PORT=3306
DB_DATABASE=joborio
DB_USERNAME=root
DB_PASSWORD=
```

Create empty database `joborio` in phpMyAdmin first.

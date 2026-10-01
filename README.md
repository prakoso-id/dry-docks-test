# Dry Docks application

Vue frontend, Express backend, dan MariaDB berjalan sebagai tiga service/container terpisah.

## Struktur

    frontend/
      public/
      src/
        components/
        router/
        services/
        views/
    backend/
      src/
        config/
        controllers/
        database/
          migrations/
        middleware/
        models/
        repositories/
        routes/
        services/
        validators/

Backend mengikuti MVC: routes/controllers menangani HTTP, services berisi aturan bisnis, repositories mengakses database, dan models mewakili domain. API Dry Dock, Work Order, Task, Dry Dock Fact, execution update, reports, sourcing, Purchase Order, dan lookup master tersedia di `/api/v1`.

## Database migration

- Migration berurutan: `001` schema awal, `002` menghapus relasi Task–Work Order, `003` menambah Internal Estimate, `004` membuat Daily Reports, `005` melengkapi RFQ/Purchase Order, dan `006` menambah Costs serta total Work Order hasil hitung.
- Down tersedia per versi di `backend/src/database/migrations/` dan dijalankan terbalik bila rollback memang diperlukan.

Runner menjalankan migration yang belum tercatat dan menyimpan versi yang berhasil di `schema_migration`.

Migration dijalankan sebagai perintah satu kali melalui service backend setelah database sehat.

## Jalankan dengan Docker

Salin `.env.example` menjadi `.env`, lalu jalankan:

```sh
docker compose up -d database
docker compose run --build --rm backend npm run db:migrate
docker compose up --build -d
```

Frontend: http://localhost:8080 · API: http://localhost:3000 · MariaDB: localhost:3307. Data MariaDB disimpan pada named volume `mariadb_data`; gambar Work Order disimpan pada volume `backend_uploads`. Tidak ada login/role; endpoint terbuka untuk pengujian CRUD. Jika database baru, tambahkan Vessel dari aplikasi sebelum membuat Dry Dock.

## Unit test backend

```sh
cd backend
npm ci
npm test
```

Frontend checks:

```sh
cd frontend
npm ci
npm test
npm run build
```
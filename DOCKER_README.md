# 🐳 UniMeet Docker Telepítési Útmutató

Ez az útmutató segít elindítani a teljes UniMeet alkalmazást Docker-rel, beleértve a frontend-et, backend-et és az SQL Server adatbázist.

## 📋 Előfeltételek

- **Docker Desktop** telepítve (Windows/Mac/Linux)
- Minimum **8GB RAM** és **20GB szabad disk terület**

## 🚀 Gyors Indítás

### 1. Töltsd le a projektet

```bash
git clone <repository-url>
cd UniMeet
```

### 2. Indítsd el a Docker Compose-zal

```bash
docker-compose up --build
```

Ez elindítja:
- **SQL Server** - `localhost:1433`
- **Backend API** - `http://localhost:5186`
- **Frontend** - `http://localhost:5173`

### 3. Nyisd meg a böngészőben

```
http://localhost:5173
```

## 🛠️ Manuális Lépések

### 1. Build az imageek külön-külön

```bash
# Backend
docker build -t unimeet-backend ./UniMeet

# Frontend
docker build -t unimeet-frontend ./UniMeet.Frontend
```

### 2. Indítsd el a konténereket

```bash
# SQL Server
docker run -d --name unimeet-sqlserver \
  -e 'ACCEPT_EULA=Y' \
  -e 'SA_PASSWORD=UniMeet123!' \
  -p 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest

# Várj 30 másodpercet, amíg az SQL Server elindul

# Backend
docker run -d --name unimeet-backend \
  -p 5186:5186 \
  -e ConnectionStrings__DefaultConnection="Server=unimeet-sqlserver;Database=UniMeetDb;User Id=sa;Password=UniMeet123!;TrustServerCertificate=True;" \
  --link unimeet-sqlserver \
  unimeet-backend

# Frontend
docker run -d --name unimeet-frontend \
  -p 5173:5173 \
  --link unimeet-backend \
  unimeet-frontend
```

## 🗄️ Adatbázis Inicializálás

### Automatikus (Docker Compose használatakor)

Az adatbázis automatikusan létrejön, de az engedélyezett email domain-eket manuálisan kell hozzáadni.

### Manuális

1. Csatlakozz az SQL Server-hez:

```bash
docker exec -it unimeet-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P UniMeet123!
```

2. Futtasd az inicializáló SQL parancsokat:

```sql
CREATE DATABASE UniMeetDb;
GO

USE UniMeetDb;
GO

-- Az EF migrációk automatikusan létrehozzák a táblákat első indításkor
-- De hozzá kell adni az engedélyezett email domain-eket:

INSERT INTO AllowedEmailDomains(Domain) VALUES ('student.uni-pannon.hu');
INSERT INTO AllowedEmailDomains(Domain) VALUES ('student.uni-elte.hu');
INSERT INTO AllowedEmailDomains(Domain) VALUES ('student.uni-bme.hu');
INSERT INTO AllowedEmailDomains(Domain) VALUES ('uni.hu');
GO
```

## 🔧 Környezeti Változók

### Backend (UniMeet)

- `ASPNETCORE_ENVIRONMENT` - `Development` vagy `Production`
- `ASPNETCORE_URLS` - `http://+:5186`
- `ConnectionStrings__DefaultConnection` - SQL Server connection string

### Frontend (UniMeet.Frontend)

- `VITE_API_URL` - Backend API URL (alapértelmezett: `http://localhost:5186/api`)

## 📊 Parancsok

### Összes konténer leállítása

```bash
docker-compose down
```

### Összes konténer és volume törlése

```bash
docker-compose down -v
```

### Logok megtekintése

```bash
# Összes service
docker-compose logs -f

# Csak backend
docker-compose logs -f backend

# Csak frontend
docker-compose logs -f frontend

# Csak SQL Server
docker-compose logs -f sqlserver
```

### Konténerek újraindítása

```bash
docker-compose restart
```

### Csak egy service rebuild-je

```bash
docker-compose up --build backend
```

## 🐛 Hibaelhárítás

### SQL Server nem indul el

```bash
# Ellenőrizd a logokat
docker logs unimeet-sqlserver

# Várj 30-60 másodpercet az első indításnál
# Az SQL Server initialization időigényes lehet
```

### Backend nem tud csatlakozni az adatbázishoz

```bash
# Ellenőrizd, hogy az SQL Server konténer fut-e
docker ps | grep sqlserver

# Ellenőrizd a connection stringet
docker exec unimeet-backend env | grep ConnectionStrings
```

### Frontend nem éri el a backend-et

```bash
# Ellenőrizd a backend URL-t
curl http://localhost:5186/api/Users

# Ellenőrizd a CORS beállításokat a backend-en
```

### Port foglalt hiba

Ha a portok már használatban vannak, módosítsd a `docker-compose.yml`-ben:

```yaml
services:
  backend:
    ports:
      - "8080:5186"  # 5186 helyett 8080-on lesz elérhető
  
  frontend:
    ports:
      - "8081:5173"  # 5173 helyett 8081-en
```

## 🔒 Biztonság

**FONTOS:** A példa `SA_PASSWORD` (`UniMeet123!`) **CSAK DEVELOPMENT**-re való!

Production környezetben:
1. Használj erős, egyedi jelszót
2. Tárold biztonságosan (Docker secrets, Azure Key Vault, stb.)
3. Ne commitold a jelszót a Git repository-ba

## 📦 Volume Management

Az adatbázis adatai perzisztensek maradnak a `sqlserver-data` volume-ban:

```bash
# Volume-ok listázása
docker volume ls

# Volume törlése (adatvesztés!)
docker volume rm unimeet_sqlserver-data
```

## 🌐 Production Deployment

Production környezetben:

1. Használj **environment-specifikus** `docker-compose.prod.yml` fájlt
2. Állítsd be az **SSL/TLS** tanúsítványokat
3. Használj **reverse proxy**-t (nginx, Traefik)
4. Állítsd be a **health check**-eket
5. Konfiguráld a **restart policy**-ket

## 💡 Tippek

- Az első build **10-15 percig** is eltarthat (függőségek letöltése)
- Használj **Docker layer caching**-et a gyorsabb rebuild-ekért
- **Fejlesztés közben** ne használd a Docker-t, mert lassabb a hot reload
- **Testing/Production** környezetekben viszont ideális

## 📞 Segítség

Ha valami nem működik:

1. Ellenőrizd a logokat: `docker-compose logs -f`
2. Ellenőrizd a konténerek állapotát: `docker ps -a`
3. Újraindítás: `docker-compose down && docker-compose up --build`

---

**Készítette:** GitHub Copilot  
**Verzió:** 1.0.0  
**Dátum:** 2025-11-09

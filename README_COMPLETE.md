# 🎓 UniMeet - Egyetemi Közösségi Platform

Teljes körű full-stack alkalmazás egyetemi hallgatók számára, ahol bejegyzéseket, kommenteket és érdeklődést lehet megosztani.

## 🏗️ Projekt Struktúra

```
UniMeet/
├── UniMeet/                    # Backend (ASP.NET Core Web API)
│   ├── Controllers/           # API endpoints
│   ├── Properties/            # Launch settings
│   └── Program.cs            # Backend belépési pont
│
├── UniMeet.DataContext/       # Data layer
│   ├── Context/              # Entity Framework DbContext
│   ├── Entities/             # Adatbázis modellek
│   ├── Dtos/                 # Data Transfer Objects
│   └── Migrations/           # EF migrációk
│
└── UniMeet.Frontend/          # Frontend (React + TypeScript)
    ├── src/
    │   ├── components/       # React komponensek
    │   ├── context/          # Auth state management
    │   ├── services/         # API integration
    │   └── App.tsx           # Routing
    ├── QUICK_START.md        # 👈 START ITT!
    ├── install.bat           # Windows telepítő
    └── start.bat             # Windows indító

```

## 🚀 Gyors Indítás

### Backend Indítása

```bash
cd UniMeet
dotnet run
```

Backend elérhető: `https://localhost:7048`

### Frontend Telepítése és Indítása

**Windows:**
```cmd
cd UniMeet.Frontend
install.bat          # Egyszer kell futtatni
start.bat           # Minden indításnál
```

**Vagy manuálisan:**
```bash
cd UniMeet.Frontend
npm install
npm install react-router-dom
npm run dev
```

Frontend elérhető: `http://localhost:5173`

## ✨ Funkciók

### ✅ Autentikáció
- Regisztráció egyetemi email domain-nel
- Bejelentkezés username/jelszó alapon
- Session management (localStorage)
- Protected routes

### ✅ Posztok
- Poszt létrehozása
- Posztok listázása domain szerint
- Poszt részletek megtekintése
- Saját poszt törlése

### ✅ Kommentek
- Komment írása posztokra
- Válaszolás kommentekre (nested threads)
- Saját komment törlése

### ✅ Érdeklődés
- Érdeklődés kifejezése posztokra
- Érdeklődés visszavonása
- Érdeklődők számának követése

### ✅ UI/UX
- Modern dark mode dizájn
- Reszponzív layout (mobile-friendly)
- Smooth animációk és transitions
- Intuitív navigáció

## 🛠️ Technológiák

### Backend
- **ASP.NET Core 9.0** - Web API framework
- **Entity Framework Core** - ORM
- **SQL Server** - Adatbázis
- **C# 13** - Programozási nyelv

### Frontend
- **React 19.1** - UI framework
- **TypeScript 5.9** - Type-safe JavaScript
- **React Router DOM** - Client-side routing
- **Axios** - HTTP kliens
- **Vite 7.1** - Build tool & dev server

## 📚 Dokumentáció

### Frontend Dokumentációk (UniMeet.Frontend/)
- **📘 QUICK_START.md** - Gyors indítási útmutató (START ITT!)
- **📗 SETUP.md** - Részletes telepítési leírás
- **📕 IMPLEMENTATION.md** - Technikai részletek és architektúra
- **📙 TROUBLESHOOTING.md** - Hibaelhárítás és debug tippek

### Backend Dokumentációk
- **📄 UniMeet.sql** - Adatbázis séma és kezdő adatok
- **📄 README.md** - Eredeti backend dokumentáció

## 🎯 Használati Útmutató

### 1. Első Indítás

1. **Adatbázis beállítása**
   - Futtasd le a `UniMeet.sql` scriptet
   - Vagy használd az EF migrációkat: `dotnet ef database update`

2. **Backend indítása**
   ```bash
   cd UniMeet
   dotnet run
   ```

3. **Frontend telepítése és indítása**
   ```bash
   cd UniMeet.Frontend
   npm install
   npm install react-router-dom
   npm run dev
   ```

### 2. Regisztráció

- Email: egyetemi domain (pl. `hallgato@uni.hu`)
- Username: tetszőleges (egyedi)
- Jelszó: minimum 6 karakter

**⚠️ FONTOS:** Az email domain-t engedélyezni kell az adatbázisban!

```sql
INSERT INTO AllowedEmailDomains (Domain) VALUES ('uni.hu');
```

### 3. Használat

- **Feed**: Posztok böngészése és létrehozása
- **Poszt részletek**: Kommentelés és érdeklődés
- **Profil**: Kijelentkezés

## 🔧 Konfiguráció

### Backend Port

`UniMeet/Properties/launchSettings.json`:
```json
{
  "applicationUrl": "https://localhost:7048;http://localhost:5048"
}
```

### Frontend API URL

`UniMeet.Frontend/src/services/apiService.ts`:
```typescript
const API_URL = 'https://localhost:7048/api';
```

### CORS Beállítása

Ha CORS hibát kapsz, add hozzá a backend `Program.cs`-hez:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ...

app.UseCors(); // app.UseAuthorization() ELŐTT
```

## 🐛 Hibaelhárítás

### Backend hibák

```bash
# Port foglalt
netstat -ano | findstr :7048
taskkill /PID <PID> /F

# Adatbázis hiba
dotnet ef database update

# Függőségek
dotnet restore
```

### Frontend hibák

```bash
# Telepítési hibák
rm -rf node_modules package-lock.json
npm install

# Build hibák
npm run build

# Port foglalt
# Módosítsd a vite.config.ts-ben
```

Részletes hibaelhárítás: **UniMeet.Frontend/TROUBLESHOOTING.md**

## 📊 API Endpoints

### Users
- `POST /api/Users/register` - Regisztráció
- `POST /api/Users/login` - Bejelentkezés
- `DELETE /api/Users/{id}` - Felhasználó törlése
- `PUT /api/Users/users/{userId}/username` - Felhasználónév módosítása

### Posts
- `POST /api/Posts` - Poszt létrehozása
- `GET /api/Posts/{postId}` - Poszt részletek
- `GET /api/Posts/by-domain?domain={domain}` - Domain szerinti szűrés
- `DELETE /api/Posts/{postId}` - Poszt törlése
- `POST /api/Posts/{postId}/comments` - Komment hozzáadása
- `DELETE /api/Posts/comments/{commentId}` - Komment törlése
- `POST /api/Posts/{postId}/interest` - Érdeklődés
- `DELETE /api/Posts/{postId}/interest/{userId}` - Érdeklődés visszavonása

## 🎨 Screenshot-ok

*(Itt lehetnének képernyőképek az alkalmazásról)*

## 🚧 Továbbfejlesztési Lehetőségek

- [ ] Profiloldal és profilkép
- [ ] Képfeltöltés posztokhoz
- [ ] Keresés és szűrés
- [ ] Real-time értesítések (SignalR)
- [ ] Direct messaging
- [ ] Post edit funkció
- [ ] Like rendszer kommentekhez
- [ ] Darkmode/Lightmode toggle
- [ ] Admin felület
- [ ] Email verifikáció

## 📄 Licenc

MIT License - Lásd LICENSE fájl

## 👨‍💻 Fejlesztői Info

- **Backend**: ASP.NET Core RESTful API
- **Frontend**: React SPA with TypeScript
- **Architektúra**: Client-Server
- **Autentikáció**: Password hashing with salt
- **Adatbázis**: SQL Server with EF Core

---

## 🎉 Kész!

Az alkalmazás készen áll a használatra! Indítsd el a backend-et és a frontend-et, majd regisztrálj és élvezd a UniMeet-et!

**Problémák esetén**: Nézd meg a `UniMeet.Frontend/TROUBLESHOOTING.md` fájlt.

---

**Készítette:** GitHub Copilot  
**Verzió:** 1.0.0  
**Utolsó frissítés:** 2025-11-09

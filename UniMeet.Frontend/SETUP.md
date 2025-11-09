# UniMeet Frontend - Telepítési és Használati Útmutató

## 🚀 Áttekintés

Ez egy teljes körű React + TypeScript frontend alkalmazás a UniMeet közösségi platformhoz. Az alkalmazás lehetővé teszi a felhasználók számára a regisztrációt, bejelentkezést, posztok létrehozását, kommentelést és érdeklődés kifejezését.

## 📋 Funkciók

### ✅ Implementált funkciók:

1. **Autentikáció**
   - Bejelentkezés
   - Regisztráció (egyetemi email domain ellenőrzéssel)
   - Automatikus session kezelés (localStorage)
   - Védett route-ok

2. **Post Management**
   - Posztok létrehozása (beállításokkal: kommentek, érdeklődés)
   - Posztok megtekintése domain szerint
   - Posztok törlése (saját posztok)
   - Feed nézet

3. **Kommentek**
   - Kommentek hozzáadása
   - Válaszolás kommentekre (nested threads)
   - Kommentek törlése (saját kommentek)

4. **Érdeklődés**
   - Érdeklődés kifejezése posztokra
   - Érdeklődés visszavonása

5. **UI/UX**
   - Modern, dark mode dizájn
   - Reszponzív layout
   - Interaktív elemek
   - Betöltési és hiba állapotok kezelése

## 🛠️ Telepítés

### Előfeltételek

- Node.js (v18 vagy újabb)
- npm vagy yarn
- Futó backend (ASP.NET Core)

### Lépések

1. **Navigálj a frontend mappába:**
   ```bash
   cd "d:\Unity Projects\UniMeet\UniMeet.Frontend"
   ```

2. **Telepítsd a függőségeket:**
   ```bash
   npm install
   ```

3. **Telepítsd a react-router-dom csomagot:**
   ```bash
   npm install react-router-dom
   ```

4. **Ellenőrizd a backend URL-t:**
   Nyisd meg a `src/services/apiService.ts` fájlt és győződj meg róla, hogy a `API_URL` helyes:
   ```typescript
   const API_URL = 'https://localhost:7048/api';
   ```
   
   A backend portját a `UniMeet\Properties\launchSettings.json` fájlban találod.

5. **Indítsd el a development szervert:**
   ```bash
   npm run dev
   ```

6. Az alkalmazás elérhető lesz a `http://localhost:5173` címen (vagy a terminálban megjelenő URL-en).

## 📁 Projekt Struktúra

```
src/
├── components/          # React komponensek
│   ├── Login.tsx       # Bejelentkezési form
│   ├── Register.tsx    # Regisztrációs form
│   ├── Feed.tsx        # Főoldal posztok listájával
│   └── PostDetail.tsx  # Részletes poszt nézet kommentekkel
├── context/            # React Context
│   └── AuthContext.tsx # Autentikációs állapot kezelése
├── services/           # API kommunikáció
│   └── apiService.ts   # Összes backend endpoint
├── App.tsx             # Főkomponens routing-gal
├── main.tsx            # Belépési pont
└── styles.css          # Globális stílusok
```

## 🎯 Használat

### 1. Regisztráció
- Navigálj a `/register` oldalra
- Add meg az egyetemi email címed (csak engedélyezett domain-ek)
- Válassz felhasználónevet és jelszót (min. 6 karakter)
- A regisztráció után automatikusan bejelentkeztet

### 2. Bejelentkezés
- Navigálj a `/login` oldalra
- Add meg a felhasználóneved és jelszavad
- Sikeres bejelentkezés után átirányít a feed-re

### 3. Feed használata
- **Új poszt létrehozása:** Kattints az "Új bejegyzés" gombra
  - Írd meg a tartalmat
  - Kapcsold be/ki a kommentek és érdeklődés lehetőségét
  - Kattints a "Közzététel" gombra
- **Poszt megtekintése:** Kattints egy postra a részletek megtekintéséhez

### 4. Poszt részletek
- **Kommentelés:** Írd be a kommentedet és kattints a "Küldés" gombra
- **Válaszolás:** Kattints egy komment mellett a "Válasz" gombra
- **Érdeklődés:** Kattints az "Érdekelne" gombra
- **Törlés:** Saját posztokat/kommenteket törölhetsz a "Törlés" gombbal

## 🔧 Konfiguráció

### Backend URL módosítása

Ha a backend más porton fut, módosítsd a `src/services/apiService.ts` fájlban:

```typescript
const API_URL = 'https://localhost:YOUR_PORT/api';
```

### HTTPS/SSL hibák

Ha SSL tanúsítvány hibát kapsz development közben, a backend `Program.cs`-ben add hozzá:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
```

És használd:
```csharp
app.UseCors();
```

## 🐛 Hibakeresés

### "Cannot find module 'react-router-dom'"
```bash
npm install react-router-dom
```

### "Network Error" vagy CORS hibák
- Ellenőrizd, hogy a backend fut-e
- Ellenőrizd a backend URL-t az apiService.ts-ben
- Győződj meg róla, hogy a backend CORS engedélyezve van

### "Email domain not allowed"
- Ellenőrizd, hogy a backend adatbázisában van-e engedélyezett email domain
- Futtasd le az `UniMeet.sql` scriptet a domain-ek hozzáadásához

### Feed üres marad
- A Feed komponens domain alapján tölti be a posztokat
- A `Feed.tsx` 48. sorában módosítsd a domain-t a saját email domain-edre:
  ```typescript
  const domain = "sajat-egyetem.hu"; // Cseréld le a saját domain-edre
  ```

## 📝 Fejlesztési megjegyzések

### Jövőbeli fejlesztési lehetőségek

1. **Email mentése az AuthContext-be:**
   - Jelenleg csak a username-t tároljuk
   - Az email mentése lehetővé tenné a dinamikus domain szűrést

2. **Get All Posts endpoint:**
   - Jelenleg domain alapján kell betölteni a posztokat
   - Egy általános "get all posts" endpoint hasznos lenne

3. **Képfeltöltés:**
   - Posztokhoz és profilképekhez

4. **Valós idejű frissítések:**
   - WebSocket vagy SignalR integrálása

5. **Keresés és szűrés:**
   - Posztok keresése tartalomban
   - Szűrés felhasználó, dátum szerint

6. **Profiloldal:**
   - Felhasználói profil szerkesztése
   - Saját posztok megtekintése

## 🚀 Production Build

```bash
npm run build
```

A build a `dist/` mappába kerül, amit egy webszerveren hosztolhatsz.

## 📦 Függőségek

- **React 19.1.1** - UI framework
- **React Router DOM** - Routing
- **Axios** - HTTP kliens
- **TypeScript** - Type safety
- **Vite** - Build tool

## 👥 Fejlesztői információk

Az alkalmazás teljes körű TypeScript típusbiztonságot használ, minden API endpoint típusozott, és a komponensek prop-jai is típusosak.

---

**Készítette:** GitHub Copilot  
**Verzió:** 1.0.0  
**Utolsó frissítés:** 2025-11-09

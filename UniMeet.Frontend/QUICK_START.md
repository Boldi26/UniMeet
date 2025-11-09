# 🚀 UniMeet - Gyors Start Útmutató

## Mi változott?

A teljes frontend elkészült! Most már van:
✅ Bejelentkezés & Regisztráció  
✅ Post feed (lista nézet)  
✅ Post létrehozás  
✅ Post részletek kommentekkel  
✅ Nested comment rendszer  
✅ Interest (érdeklődés) kezelése  
✅ Törlési funkciók  
✅ Modern UI dark mode-ban  
✅ Védett route-ok  

---

## ⚡ Gyors Telepítés (3 lépés)

### 1️⃣ Telepítsd a függőségeket
```bash
cd "d:\Unity Projects\UniMeet\UniMeet.Frontend"
npm install
npm install react-router-dom
```

### 2️⃣ Ellenőrizd a backend URL-t
Nyisd meg: `src/services/apiService.ts`

```typescript
const API_URL = 'https://localhost:7048/api'; // Ez jó? Ha nem, módosítsd!
```

**Hol találod a helyes portot?**
👉 `UniMeet\Properties\launchSettings.json` → nézd meg az `applicationUrl`-t

### 3️⃣ Indítsd el!
```bash
npm run dev
```

Nyisd meg a böngészőben: **http://localhost:5173**

---

## 🎯 Első Használat

### 1. Regisztráció
- Kattints: "Regisztrálj!"
- Email: `pelda@uni.hu` (egyetemi email domain kell!)
- Username: tetszőleges
- Jelszó: minimum 6 karakter

**⚠️ FONTOS:** Az email domain-nek engedélyezve kell lennie az adatbázisban!
```sql
-- Futtasd le ezt, ha még nem tetted:
INSERT INTO AllowedEmailDomains (Domain) VALUES ('uni.hu');
```

### 2. Feed használata
- **Új poszt**: "Új bejegyzés" gomb → írd meg → "Közzététel"
- **Poszt megtekintése**: Kattints egy postra

### 3. Poszt részletek
- **Komment**: Írd be lent → "Küldés"
- **Válasz**: Kattints "Válasz" egy kommentnél
- **Érdeklődés**: "Érdekelne" gomb

---

## 🔧 Ha Valami Nem Működik

### Backend nem fut?
```bash
cd "d:\Unity Projects\UniMeet\UniMeet"
dotnet run
```

### "Email domain not allowed" hiba?
```sql
-- Adatbázisban futtasd:
INSERT INTO AllowedEmailDomains (Domain) VALUES ('uni.hu'), ('egyetem.hu');
```

### CORS hiba?
Add hozzá a backend `Program.cs`-hez:
```csharp
// A builder után:
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Az app.UseAuthorization() ELŐTT:
app.UseCors();
```

### Feed üres?
Módosítsd a `Feed.tsx` fájlt (48. sor):
```typescript
const domain = "uni.hu"; // Cseréld le arra, amit regisztrációnál használtál!
```

---

## 📚 Dokumentációk

- **SETUP.md** - Részletes telepítési útmutató
- **IMPLEMENTATION.md** - Technikai részletek, komponensek leírása
- **TROUBLESHOOTING.md** - Hibaelhárítás, gyakori problémák

---

## 📁 Új Fájlok (amit létrehoztam)

```
UniMeet.Frontend/
├── src/
│   ├── components/
│   │   ├── Login.tsx           ✅ Újraírtam (AuthContext integrálva)
│   │   ├── Register.tsx        ✨ ÚJ
│   │   ├── Feed.tsx            ✨ ÚJ
│   │   └── PostDetail.tsx      ✨ ÚJ
│   ├── context/
│   │   └── AuthContext.tsx     ✨ ÚJ (session management)
│   ├── services/
│   │   └── apiService.ts       ✅ Kiegészítettem (minden endpoint)
│   ├── App.tsx                 ✅ Újraírtam (routing)
│   ├── main.tsx                ✅ Módosítottam (styles.css)
│   └── styles.css              ✨ ÚJ (komplett styling)
├── SETUP.md                    ✨ ÚJ
├── IMPLEMENTATION.md           ✨ ÚJ
├── TROUBLESHOOTING.md          ✨ ÚJ
└── QUICK_START.md              ✨ ÚJ (ez a fájl)
```

---

## 🎨 Amit Látnod Kell

### Login/Register oldal
- Modern dark mode form
- Hibakezelés
- Automatikus átirányítás

### Feed
- Posztok listája kártyákban
- "Új bejegyzés" gomb
- Felhasználó info fejlécben
- Kattintható posztok

### Poszt részletek
- Teljes tartalom
- Kommentek nested thread-ekben
- Érdeklődés számláló
- Interaktív gombok

---

## ✨ Extra Funkciók

- **Automatikus bejelentkezés megtartása**: Újratöltéskor is bent maradsz
- **Protected routes**: Nem bejelentkezve nem érhető el a feed
- **Type-safe API**: TypeScript típusok mindenhez
- **Reszponzív**: Mobilon is jól néz ki
- **Smooth animations**: Hover effektek, transitions

---

## 🎓 Következő Lépések (opcionális fejlesztések)

1. **Profil oldal** - Felhasználói adatok szerkesztése
2. **Képfeltöltés** - Posztokhoz csatolható képek
3. **Keresés** - Posztok keresése
4. **Notifications** - Értesítések új kommentekről
5. **Real-time updates** - WebSocket integráció

---

## 💡 Tipp

A fejlesztés során tartsd nyitva:
1. **Chrome DevTools** (F12) - Console + Network tab
2. **Backend terminál** - Látod a kéréseket
3. **VS Code** - Hot reload működik!

---

**Kész vagy!** 🎉

Indítsd el a backend-et, majd a frontend-et, és már használhatod is az alkalmazást!

Ha bármi kérdés van, nézd meg a **TROUBLESHOOTING.md** fájlt.

---

**Készítette:** GitHub Copilot  
**Dátum:** 2025-11-09  
**Verzió:** 1.0.0

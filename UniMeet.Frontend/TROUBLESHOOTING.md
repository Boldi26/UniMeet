# 🔧 Hibaelhárítási Útmutató - UniMeet Frontend

## Gyakori Problémák és Megoldások

### 1. "Cannot find module 'react-router-dom'"

**Probléma:** A react-router-dom nincs telepítve.

**Megoldás:**
```bash
cd "d:\Unity Projects\UniMeet\UniMeet.Frontend"
npm install react-router-dom
```

---

### 2. "Cannot find module 'axios'"

**Probléma:** Az axios nincs telepítve (bár a package.json-ben szerepel).

**Megoldás:**
```bash
npm install
```

---

### 3. CORS Hiba / Network Error

**Probléma:** A backend nem engedélyezi a frontend kéréseket.

**Megoldás 1** - Add hozzá a backend `Program.cs`-hez (a `var builder` után):
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
```

És a `var app = builder.Build();` után, **DE a `app.UseAuthorization();` ELŐTT:**
```csharp
app.UseCors();
```

**Megoldás 2** - Ellenőrizd a backend URL-t:
`src/services/apiService.ts`:
```typescript
const API_URL = 'https://localhost:7048/api'; // Cseréld le a helyes portra!
```

A backend portját itt találod: `UniMeet\Properties\launchSettings.json`

---

### 4. "Email domain not allowed" hiba regisztrációnál

**Probléma:** A backend adatbázisban nincs engedélyezett email domain.

**Megoldás:** Futtasd le az SQL scriptet vagy adj hozzá manuálisan:

```sql
INSERT INTO AllowedEmailDomains (Domain) VALUES 
('uni.hu'),
('egyetem.hu'),
('student.hu');
```

Vagy használd a meglévő `UniMeet.sql` fájlt.

---

### 5. Feed oldal üres marad / Nincsenek posztok

**Probléma:** A Feed domain alapján szűr, és vagy nincs megfelelő domain beállítva, vagy nincsenek posztok azon a domainen.

**Gyors megoldás** - `Feed.tsx` (48. sor körül):
```typescript
// Cseréld le a domain-t arra, amit a regisztrációnál használtál
const domain = "uni.hu"; // MÓDOSÍTSD!
```

**Jobb megoldás** - Tárold el az email-t is az AuthContext-ben:

`AuthContext.tsx`:
```typescript
interface User {
    id: number;
    username: string;
    email: string; // ← Hozzáadva
}
```

`Login.tsx` és `Register.tsx` - módosítsd a login függvényt:
```typescript
// Login.tsx:
const response = await loginUser({ username, password });
login({ 
    id: response.data.id, 
    username: response.data.username,
    email: response.data.email || `${username}@uni.hu` // Ha nincs email a válaszban
});

// Register.tsx:
const response = await registerUser({ email, username, password });
login({ 
    id: response.data.id, 
    username: response.data.username,
    email: email // Itt van email
});
```

`Feed.tsx`:
```typescript
const loadPosts = async () => {
    if (!user) return;
    
    // Domain kinyerése az email-ből
    const domain = user.email.split('@')[1];
    const postIds = await getPostsByDomain(domain);
    // ...
};
```

---

### 6. SSL/HTTPS Tanúsítvány Hiba

**Probléma:** "NET::ERR_CERT_AUTHORITY_INVALID" vagy hasonló.

**Megoldás development közben:**

1. **Chrome/Edge:** Nyisd meg külön tabon a backend URL-t (`https://localhost:7048`), és fogadd el a tanúsítványt.

2. **Vagy módosítsd az API URL-t HTTP-re** (csak development!):
   ```typescript
   const API_URL = 'http://localhost:5048/api'; // HTTP port!
   ```
   
   És a backend `launchSettings.json`-ban használj HTTP profilt.

---

### 7. "User not found" vagy "Invalid credentials"

**Probléma:** Helytelen felhasználónév vagy jelszó.

**Ellenőrzés:**
- Regisztráltál már?
- A felhasználónév **case-sensitive** lehet a backend-en
- A jelszó minimum 6 karakter?

**Debug:**
Nézd meg az adatbázist:
```sql
SELECT * FROM Users;
```

---

### 8. Kommentek vagy Interest nem működik

**Probléma:** "Comments are disabled" vagy "Interest is disabled"

**Ok:** A poszt létrehozásakor ki voltak kapcsolva ezek a funkciók.

**Megoldás:** 
- Új posztot hozz létre, és pipáld be a megfelelő opciókat
- Vagy módosítsd az adatbázisban:
  ```sql
  UPDATE Posts SET CommentsEnabled = 1, InterestEnabled = 1 WHERE Id = 1;
  ```

---

### 9. "Cannot DELETE post/comment" - Forbidden

**Probléma:** A backend csak a saját tartalmak törlését engedélyezi, de nincs implementálva ellenőrzés.

**Megoldás:** Add hozzá a backend controller-ekhez:

`PostsController.cs` - DeletePost:
```csharp
[HttpDelete("{postId}")]
public async Task<IActionResult> DeletePost(int postId, [FromQuery] int userId)
{
    var post = await _context.Posts.FindAsync(postId);
    if (post == null) return NotFound("Post not found.");
    
    if (post.UserId != userId) return Forbid(); // Csak saját poszt törölhető
    
    _context.Posts.Remove(post);
    await _context.SaveChangesAsync();
    return NoContent();
}
```

És frissítsd a frontend-en (`PostDetail.tsx`):
```typescript
const handleDeletePost = async () => {
    if (!postId || !user || !window.confirm('Biztosan törölni szeretnéd?')) return;

    try {
        await deletePost(parseInt(postId)); // userId query param-ként
        navigate('/feed');
    } catch (err: any) {
        alert('Nem sikerült törölni: ' + (err.response?.data || err.message));
    }
};
```

---

### 10. Build Error - "Type error: ..."

**Probléma:** TypeScript típus hibák.

**Megoldás:**

1. **Ellenőrizd a típusokat:**
   ```bash
   npm run build
   ```

2. **Gyakori hibák:**
   - `React.ReactNode` helyett használd: `import { ReactNode } from 'react'`
   - Implicit `any` típusok: add meg explicit a típust
   - Missing dependencies: `npm install @types/react-router-dom`

---

### 11. LocalStorage nem mentődik / Automatikus kijelentkezés

**Probléma:** Újratöltéskor kijelentkezik.

**Debug:**
1. Nyisd meg a DevTools → Application → Local Storage
2. Nézd meg, hogy ott van-e a `user` kulcs

**Megoldás:**
Ha nem mentődik, ellenőrizd az `AuthContext.tsx` login függvényét:
```typescript
const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('User saved:', userData); // Debug
};
```

---

### 12. Port Already in Use

**Probléma:** "Port 5173 is already in use"

**Megoldás:**

**Windows PowerShell:**
```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Vagy módosítsd a portot** - `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000 // Új port
  }
})
```

---

## 🔍 Debug Tippek

### 1. Network Tab
Nyisd meg a DevTools → Network → XHR/Fetch
- Nézd meg a request-eket és response-okat
- Ellenőrizd a status code-okat (200 = OK, 400 = Bad Request, 401 = Unauthorized, 404 = Not Found)

### 2. Console Logging
Add hozzá debug log-okat:
```typescript
console.log('User:', user);
console.log('API Response:', response.data);
```

### 3. React DevTools
Telepítsd a React Developer Tools Chrome extension-t:
- Nézd meg a komponensek state-jét
- Ellenőrizd a props-okat

### 4. Backend Logging
Add hozzá a backend-en:
```csharp
Console.WriteLine($"User {userId} trying to create post");
```

---

## 📞 További Segítség

Ha továbbra sem működik:

1. **Ellenőrizd a konzolt** - Chrome DevTools → Console
2. **Nézd meg a Network tab-ot** - Milyen hibakódokat kapsz?
3. **Backend logok** - Mit ír a backend terminál?
4. **Adatbázis** - Van benne adat? Léteznek a táblák?

### Hasznos parancsok:

```bash
# Frontend újraindítás
npm run dev

# Build tesztelése
npm run build

# Függőségek újratelepítése
rm -rf node_modules package-lock.json
npm install

# TypeScript ellenőrzés
npx tsc --noEmit
```

---

**Készítette:** GitHub Copilot  
**Verzió:** 1.0.0

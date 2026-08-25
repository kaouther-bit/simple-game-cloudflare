# دليل ربط Wrangler مع Cloudflare 🚀

## خطوة 1: تثبيت Wrangler

```bash
npm install -D wrangler
# أو
npm install wrangler
```

## خطوة 2: تسجيل الدخول إلى Cloudflare

```bash
wrangler login
```

سيفتح لك متصفح للتسجيل. بعد التسجيل، سيتم حفظ بيانات اعتمادك تلقائياً.

## خطوة 3: الحصول على معرفات Cloudflare

### ابحث عن Account ID:
1. اذهب إلى [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. اختر حسابك
3. انسخ **Account ID** من اليمين السفلي

### إنشاء KV Namespace:

```bash
# إنشاء Namespace للإنتاج
wrangler kv:namespace create "GAME_KV"

# إنشاء Namespace للتطوير
wrangler kv:namespace create "GAME_KV" --preview
```

ستحصل على:
```
✓ Created namespace with title "GAME_KV"
 Add the following to your configuration file:
[[kv_namespaces]]
binding = "GAME_KV"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_KV_NAMESPACE_PREVIEW_ID"
```

## خطوة 4: تحديث wrangler.toml

حدث الملف بـ معرفاتك:

```toml
account_id = "your_account_id_here"

[[kv_namespaces]]
binding = "GAME_KV"
id = "your_namespace_id"
preview_id = "your_preview_namespace_id"
```

## خطوة 5: اختبار محلياً

```bash
# تشغيل Worker محلياً
wrangler dev

# سيعمل على http://localhost:8787
```

### اختبر الـ API:

```bash
# فحص صحة الخادم
curl http://localhost:8787/api/health

# حفظ نقاط (احتاج رمز Clerk)
curl -X POST http://localhost:8787/api/scores \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"level": 1, "score": 100}'
```

## خطوة 6: النشر على Cloudflare

```bash
# نشر العامل
wrangler deploy

# ستحصل على رابط مثل:
# https://simple-game-backend.your-account.workers.dev
```

## خطوة 7: تحديث متغيرات البيئة في Next.js

حدث `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
# استخدم رابط Cloudflare Worker
NEXT_PUBLIC_API_URL=https://simple-game-backend.your-account.workers.dev
```

## ربط النطاق المخصص (اختياري)

إذا كان لديك نطاق مخصص:

```toml
# في wrangler.toml
[env.production]
route = "https://api.yourdomain.com/*"
zone_id = "YOUR_ZONE_ID"
```

ثم نشر:
```bash
wrangler deploy --env production
```

## الأوامر المفيدة 🛠️

```bash
# عرض سجلات Wrangler
wrangler tail

# إدارة KV Storage
wrangler kv:key list --namespace-id=YOUR_ID
wrangler kv:key get --namespace-id=YOUR_ID key_name

# حذف Namespace
wrangler kv:namespace delete --namespace-id=YOUR_ID

# عرض إحصائيات الاستخدام
wrangler analytics
```

## استكشاف الأخطاء 🐛

### خطأ: "No account ID found"
```bash
# أضف account_id إلى wrangler.toml
# أو استخدم:
wrangler whoami
```

### خطأ: "KV Namespace not found"
```bash
# أنشئ namespace جديد
wrangler kv:namespace create "GAME_KV"

# ثم أضفه إلى wrangler.toml
```

### الاختبار المحلي لا يعمل
```bash
# تأكد من أن منفذ 8787 مفتوح
# جرب منفذ مختلف
wrangler dev --port 8789
```

## البنية النهائية 📁

```
simple-game-cloudflare/
├── src/
│   └── worker/
│       └── index.ts          ← Cloudflare Worker Backend
├── app/
│   ├── components/
│   ├── page.tsx             ← Next.js Frontend
│   └── globals.css
├── wrangler.toml            ← تكوين Cloudflare
├── package.json
└── .env.local               ← متغيرات البيئة
```

## الخطوات السريعة 🏃

```bash
# 1. تثبيت
npm install

# 2. تسجيل دخول
wrangler login

# 3. إنشاء KV
wrangler kv:namespace create "GAME_KV"

# 4. تحديث wrangler.toml بالمعرفات

# 5. اختبار محلياً
wrangler dev

# 6. نشر
wrangler deploy
```

---

بعد النشر، سيكون لديك:
✅ Backend عامل على Cloudflare Workers  
✅ KV Storage لحفظ النقاط  
✅ API محمي مع Clerk  
✅ Leaderboard عامل  
✅ اللعبة متصلة مباشرة بالـ Backend  

الرابط النهائي:
`https://simple-game-backend.YOUR-ACCOUNT.workers.dev`

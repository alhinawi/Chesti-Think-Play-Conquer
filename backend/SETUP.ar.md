# تشغيل الـ API بتاع Chesti (مجاني على Cloudflare)

الكلام ده كله مجاني. مفيش كارت ولا استضافة مدفوعة. **لسه ما اتنشرش**، والخطوات دي لما تقول يلا.

## اللي هتحتاجه
- حساب Cloudflare (عندك).
- Node.js على جهازك.

## الخطوات

1. افتح الترمينال وادخل فولدر الباك اند:
   ```bash
   cd backend
   npm install --legacy-peer-deps
   npx wrangler login
   ```
   هيفتح المتصفح، وافق.

2. اعمل قاعدة البيانات (D1):
   ```bash
   npx wrangler d1 create chesti
   ```
   هيطلعلك `database_id`. انسخه وحطه في `wrangler.jsonc` مكان `00000000-0000-0000-0000-000000000000`.
   (الـ id ده مش سر.)

3. اعمل الجداول على القاعدة الحقيقية:
   ```bash
   npx wrangler d1 migrations apply chesti --remote
   ```
   متشغلش ملف `seed` هناك. ده بيانات تجريبية للجهاز بس.

4. غيّر العنوان المسموح في `wrangler.jsonc` لو الموقع بتاعك على عنوان تاني. السطر:
   `"ALLOWED_ORIGINS": "https://chesti.pages.dev,http://localhost:3000"`

5. انشر:
   ```bash
   npx wrangler deploy
   ```
   هيديك رابط زي `https://chesti-api.<اسمك>.workers.dev`. جرب `/api/ping` عليه، لازم يرد `{"ok":true}`.

6. حماية بسيطة: من لوحة Cloudflare افتح Security > WAF > Rate limiting، وحط حد لـ `/api/auth/*` (مثلا 10 طلبات في الدقيقة). ده مجاني.

## تجربة على جهازك قبل النشر
```bash
npm run db:migrate:local
node seed/make-seed.mjs && npm run db:seed:local
npm run dev
```
وافتح `http://localhost:8787/api/ping`. للتجربة: `hinawi@chesti.test` وكلمة السر `demo-pass-123`.

## ملاحظات
- الحد المجاني كبير جدا لموقع زي ده (مئات آلاف الطلبات في اليوم). لو عدّيته الموقع بيرد بخطأ، مش بيحاسبك.
- كل سر (زي أي مفتاح) يتحط بـ `wrangler secret put`، عمره ما يتكتب في الكود. الـ API ده حاليا مش محتاج أي سر.
- لو عايز تمسح أو تغيّر في القاعدة الحقيقية، قول الأول، متعملهاش بإيدك من غير نسخة احتياطية.

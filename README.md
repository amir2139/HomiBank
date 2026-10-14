# HomiBank

**فارسی** · [English](#english)

حسابداری خصوصی از روی پیامک‌های بانکی ایران. یک فایل `index.html` تکی که کاملاً آفلاین کار می‌کند.

> **حریم خصوصی:** این برنامه **هیچ درخواست شبکه‌ای نمی‌فرستد**؛ بدون CDN، بدون آنالیتیکس، بدون فونت یا اسکریپت خارجی. سیاست امنیتی صفحه (CSP) هم اتصال شبکه را مسدود می‌کند. داده‌ها فقط در `localStorage` مرورگر خودتان می‌مانند.

## استفاده
1. `index.html` را در مرورگر باز کنید (نیازی به سرور نیست).
2. چند پیامک بانکی را یک‌جا paste کنید (بین پیامک‌ها یک خط خالی بگذارید؛ در غیر این‌صورت برنامه تلاش می‌کند خودش جدایشان کند) و «افزودن تراکنش‌ها» را بزنید.
3. دسته‌ی هر تراکنش را دستی انتخاب کنید یا قانون خودکار بسازید («اگر متن شامل X بود → دسته‌ی Y»). دسته‌ی دستی هیچ‌وقت توسط قانون بازنویسی نمی‌شود.
4. خلاصه‌ی ماهانه‌ی شمسی (جمع ورودی/خروجی و نمودار میله‌ای SVG) را ببینید.
5. خروجی CSV (سازگار با Excel) یا پشتیبان JSON بگیرید؛ پشتیبان را می‌توان بازیابی کرد (بدون تکرار ادغام می‌شود).

## قابلیت‌ها
- استخراج نوع (واریز/برداشت)، مبلغ، مانده، تاریخ و ساعت شمسی و نام بانک.
- پارسر عمومی بر پایه‌ی کلمه‌های برداشت، واریز، مبلغ، مانده، خرید، انتقال، علامت `+`/`-`؛ ارقام فارسی/عربی/انگلیسی؛ جداکننده‌ی سه‌رقمی (`,` `٬` `،`)؛ تاریخ شمسی (۴ یا ۲ رقمی) و میلادی؛ مبلغ به تومان خودکار به ریال تبدیل می‌شود.
- الگوی ویژه برای ملی، ملت (تاریخ فشرده `MMDD-HHMM`)، صادرات، تجارت، سامان، پاسارگاد و رسالت. برای بانک‌های دیگر نام از عبارت «بانک …» خوانده می‌شود.
- جلوگیری از ثبت تکراری (بر اساس متن نرمال‌شده و بر اساس نوع+مبلغ+مانده+زمان؛ پس ارقام فارسی/انگلیسیِ همان پیامک هم تکراری حساب می‌شود).
- ذخیره در `localStorage` (داخل try/catch؛ اگر در دسترس نباشد برنامه بدون ذخیره کار می‌کند).

## محدودیت‌ها
فرمت پیامک بانک‌ها گاهی عوض می‌شود و الگوهای ویژه بر پایه‌ی قالب‌های رایج نوشته شده‌اند، نه مستندات رسمی. پیامکی که شناسایی نشود در پیام نتیجه گزارش می‌شود و ثبت نمی‌شود. اگر پیامکی بدون تاریخ باشد، تاریخ روز ثبت (با علامت «؟») استفاده می‌شود. دو پیامک کاملاً یکسان بدون مانده و ساعت، یکی حساب می‌شوند.

## تست
```
node tests/parser.test.js
```
فقط به Node نیاز دارد (بدون npm). تمام نمونه‌ها و تست‌ها **ساختگی** هستند (شماره‌حساب و مبلغ جعلی). لطفاً هیچ پیامک یا اطلاعات واقعی در مخزن commit نکنید.

---

<a id="english"></a>
## English

Private accounting from Iranian bank SMS messages. A single, fully offline `index.html`.

> **Privacy:** the app makes **no network requests** — no CDN, no analytics, no external fonts or scripts. A Content-Security-Policy (`connect-src 'none'`) enforces this. Data stays in your browser's `localStorage`.

### Usage
1. Open `index.html` in a browser (no server needed).
2. Paste several bank SMS messages at once (separate them with a blank line; otherwise the app tries to split them itself) and click "add".
3. Pick a category per transaction, or create auto-rules ("if text contains X → category Y"). Manual categories are never overwritten by rules.
4. See the monthly summary in the Jalali calendar: total in/out and a simple SVG bar chart.
5. Export CSV (Excel-friendly) or a JSON backup; backups can be restored and are merged without duplicates.

### Features
- Extracts type (deposit/withdrawal), amount, balance, Jalali date/time and bank name.
- Generic keyword-based parser (برداشت, واریز, مبلغ, مانده, خرید, انتقال, `+`/`-` signs), Persian/Arabic/Latin digits, thousands separators, Jalali (4/2-digit year) and Gregorian dates, toman → rial conversion.
- Bank-specific handling for Melli, Mellat (compact `MMDD-HHMM` date), Saderat, Tejarat, Saman, Pasargad and Resalat; other banks are named from "بانک …".
- Duplicate protection (normalized text and type+amount+balance+time).
- `localStorage` persistence wrapped in try/catch.

### Limitations
Banks change their SMS formats; the bank-specific patterns are based on commonly seen layouts, not official specs. Unrecognized messages are reported and not saved. Messages without a date use the import date (marked "؟"). Two identical messages with neither balance nor time count as one.

### Tests
```
node tests/parser.test.js
```
Requires only Node (no npm). All samples and tests are **fictional** (fake account numbers and amounts). Never commit real messages or account data.

## License
See [LICENSE](LICENSE).

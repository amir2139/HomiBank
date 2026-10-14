// تست پارسر HomiBank — اجرا: node tests/parser.test.js
// همه‌ی پیامک‌ها، شماره‌حساب‌ها و مبلغ‌ها ساختگی‌اند.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const core = /<script id="core">([\s\S]*?)<\/script>/.exec(html)[1];
const HB = vm.runInNewContext(core + ';HB');

const TODAY = { jy: 1405, jm: 7, jd: 22 };
const opts = { today: TODAY, refYear: 1405 };
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('ok   - ' + name); }
  catch (e) { console.error('FAIL - ' + name + '\n' + e.stack); process.exitCode = 1; }
}
const plain = (o) => JSON.parse(JSON.stringify(o));
const p = (s) => { const r = HB.parseMessage(s, opts); assert.ok(r.ok, r.reason + ' :: ' + s); return r.txn; };
function check(t, exp) { for (const k in exp) assert.deepStrictEqual(t[k], exp[k], k + ' => ' + JSON.stringify(t[k])); }

test('تبدیل تاریخ شمسی/میلادی', () => {
  assert.deepStrictEqual(plain(HB.toJalali(2024, 3, 20)), { jy: 1403, jm: 1, jd: 1 });
  assert.deepStrictEqual(plain(HB.toJalali(2026, 10, 14)), { jy: 1405, jm: 7, jd: 22 });
  assert.deepStrictEqual(plain(HB.toGregorian(1403, 12, 30)), { gy: 2025, gm: 3, gd: 20 });
  assert.strictEqual(HB.jalaliMonthLength(1403, 12), 30);
  assert.strictEqual(HB.jalaliMonthLength(1404, 12), 29);
});

test('نرمال‌سازی ارقام فارسی/عربی و جداکننده', () => {
  assert.strictEqual(HB.normalize('۱۲٬۳۴۵ ٤٥٦'), '12,345 456');
});

test('ملی: برداشت با علامت منفی پشت مبلغ', () => {
  check(p('بانک ملی\nبرداشت:350,000-\nمانده:4,650,000\n1405/07/03-09:15'),
    { bank: 'ملی', type: 'withdraw', amount: 350000, balance: 4650000, jy: 1405, jm: 7, jd: 3, time: '09:15' });
});

test('ملت: واریز با تاریخ فشرده MMDD-HHMM', () => {
  check(p('بانک ملت\nواریز: 12,000,000+\nمانده: 16,650,000\n0705-1030'),
    { bank: 'ملت', type: 'deposit', amount: 12000000, balance: 16650000, jy: 1405, jm: 7, jd: 5, time: '10:30' });
});

test('تجارت: ارقام فارسی و جداکننده‌ی ٬', () => {
  check(p('بانک تجارت\nخرید از فروشگاه نمونه\nمبلغ: ۱۸۰٬۰۰۰ ریال\nمانده: ۱۶٬۴۷۰٬۰۰۰\n۱۴۰۵/۰۷/۰۶ ۱۴:۲۰'),
    { bank: 'تجارت', type: 'withdraw', amount: 180000, balance: 16470000, jy: 1405, jm: 7, jd: 6, time: '14:20' });
});

test('پاسارگاد: انتقال به حساب ماسک‌شده', () => {
  check(p('پاسارگاد\nانتقال به حساب ****0000\nمبلغ 2,000,000 ریال\nمانده 14,470,000\n1405/07/10 18:45'),
    { bank: 'پاسارگاد', type: 'withdraw', amount: 2000000, balance: 14470000, jd: 10, time: '18:45' });
});

test('سامان: پرداخت قبض', () => {
  check(p('بانک سامان\nپرداخت قبض برق\n450,000 ریال\nمانده: 14,020,000\n1405/07/12 11:05'),
    { bank: 'سامان', type: 'withdraw', amount: 450000, balance: 14020000 });
});

test('صادرات: سال دورقمی yy/mm/dd', () => {
  check(p('بانک صادرات\nبرداشت 90,000 ریال\nمانده 13,930,000\n05/07/14 20:10'),
    { bank: 'صادرات', type: 'withdraw', amount: 90000, jy: 1405, jm: 7, jd: 14, time: '20:10' });
});

test('رسالت: واریز', () => {
  check(p('قرض‌الحسنه رسالت\nواریز 5,000,000 ریال\nمانده: 18,930,000\n1405/07/20 08:30'),
    { bank: 'رسالت', type: 'deposit', amount: 5000000, balance: 18930000 });
});

test('عمومی: بانک ناشناس و تومان', () => {
  const t = p('بانک نمونه\nواریز 500,000 تومان\nمانده 2,000,000 تومان\n1405/07/01 10:00');
  check(t, { bank: 'نمونه', type: 'deposit', amount: 5000000, balance: 20000000 });
});

test('عمومی: فقط علامت + و - بدون کلمه‌ی کلیدی', () => {
  assert.strictEqual(p('بانک ملی +250,000 مانده 1,250,000 1405/07/02 10:00').type, 'deposit');
  assert.strictEqual(p('بانک ملی -250,000 مانده 1,000,000 1405/07/02 11:00').type, 'withdraw');
});

test('انتقال از ← واریز، انتقال به ← برداشت', () => {
  assert.strictEqual(p('انتقال از حساب ****1111 مبلغ 100,000 مانده 1,100,000 1405/07/02 10:00').type, 'deposit');
  assert.strictEqual(p('انتقال به حساب ****1111 مبلغ 100,000 مانده 1,000,000 1405/07/02 10:05').type, 'withdraw');
});

test('شماره‌حساب/پیگیری مبلغ حساب نمی‌شود', () => {
  const t = p('بانک تجارت\nحساب 1234567890123456\nبرداشت 70,000\nپیگیری 998877\nمانده 930,000\n1405/07/02 10:00');
  assert.strictEqual(t.amount, 70000);
});

test('تاریخ میلادی به شمسی تبدیل می‌شود', () => {
  check(p('بانک ملی واریز 10,000 مانده 20,000 2026/10/14 09:00'), { jy: 1405, jm: 7, jd: 22 });
});

test('بدون تاریخ: تاریخ امروز با پرچم حدس', () => {
  check(p('بانک ملی برداشت 10,000 مانده 20,000'), { jy: 1405, jm: 7, jd: 22, dateGuessed: true });
});

test('پیامک نامعتبر رد می‌شود', () => {
  assert.strictEqual(HB.parseMessage('سلام، قرار فردا ساعت ۵', opts).ok, false);
  assert.strictEqual(HB.parseMessage('', opts).ok, false);
});

test('جداکردن چند پیامک با و بدون خط خالی', () => {
  const a = 'بانک ملی\nبرداشت:1,000-\nمانده:9,000\n1405/07/01-10:00';
  const b = 'بانک ملت\nواریز: 2,000+\nمانده: 11,000\n0702-1100';
  assert.strictEqual(HB.splitMessages(a + '\n\n' + b).length, 2);
  assert.strictEqual(HB.splitMessages(a + '\n' + b).length, 2);
  assert.strictEqual(HB.splitMessages(a).length, 1);
});

test('پیامک تکراری دوبار ثبت نمی‌شود', () => {
  const m = 'بانک ملی\nبرداشت:1,000-\nمانده:9,000\n1405/07/01-10:00';
  const r1 = HB.importText(m + '\n\n' + m, [], [], opts);
  assert.strictEqual(r1.added.length, 1);
  assert.strictEqual(r1.duplicates, 1);
  const r2 = HB.importText(m, r1.added, [], opts);
  assert.strictEqual(r2.added.length, 0);
  assert.strictEqual(r2.duplicates, 1);
  const fa = 'بانک ملی\nبرداشت:۱٬۰۰۰-\nمانده:۹٬۰۰۰\n۱۴۰۵/۰۷/۰۱-۱۰:۰۰';
  assert.strictEqual(HB.importText(fa, r1.added, [], opts).added.length, 0);
});

test('دو برداشت هم‌مبلغ با مانده‌ی متفاوت تکراری حساب نمی‌شوند', () => {
  const t = 'بانک ملی\nبرداشت:1,000-\nمانده:9,000\n1405/07/01-10:00\n\nبانک ملی\nبرداشت:1,000-\nمانده:8,000\n1405/07/01-10:00';
  assert.strictEqual(HB.importText(t, [], [], opts).added.length, 2);
});

test('قانون خودکار دسته‌بندی و حفظ دسته‌ی دستی', () => {
  const rules = [{ contains: 'فروشگاه نمونه', category: 'خرید' }];
  const r = HB.importText('بانک تجارت\nخرید از فروشگاه نمونه\nمبلغ: 180,000\nمانده: 1,000,000\n1405/07/06 14:20', [], rules, opts);
  assert.strictEqual(r.added[0].category, 'خرید');
  const t = r.added[0]; t.category = 'خوراک'; t.manual = true;
  HB.applyRules(t, rules);
  assert.strictEqual(t.category, 'خوراک');
});

test('خلاصه‌ی ماهانه', () => {
  const text = [
    'بانک ملی\nبرداشت:1,000-\nمانده:9,000\n1405/07/01-10:00',
    'بانک ملی\nواریز:5,000+\nمانده:14,000\n1405/07/02-10:00',
    'بانک ملی\nبرداشت:2,000-\nمانده:12,000\n1405/08/02-10:00'
  ].join('\n\n');
  const m = HB.monthlyTotals(HB.importText(text, [], [], opts).added);
  assert.strictEqual(m.length, 2);
  check(m[0], { key: '1405/07', in: 5000, out: 1000, count: 2 });
  check(m[1], { key: '1405/08', in: 0, out: 2000 });
});

test('خروجی CSV و ضدفرمول', () => {
  const r = HB.importText('بانک ملی\nبرداشت:1,000-\nمانده:9,000\n1405/07/01-10:00', [], [{ contains: 'ملی', category: '=cmd' }], opts);
  const csv = HB.toCSV(r.added).split('\r\n');
  assert.strictEqual(csv[0], 'date,time,bank,type,amount_rial,balance_rial,category,text');
  assert.ok(csv[1].startsWith("1405/07/01,10:00,ملی,withdraw,1000,9000,'=cmd,"), csv[1]);
});

test('پشتیبان JSON: ادغام بدون تکرار و رد داده‌ی خراب', () => {
  const r = HB.importText('بانک ملی\nبرداشت:1,000-\nمانده:9,000\n1405/07/01-10:00', [], [], opts);
  const backup = plain(r.added);
  const dst = [];
  const a = HB.mergeBackup(dst, backup.concat([{ amount: -5 }, null]));
  assert.deepStrictEqual([a.added, a.duplicates, a.invalid], [1, 0, 2]);
  const b = HB.mergeBackup(dst, backup);
  assert.deepStrictEqual([b.added, b.duplicates], [0, 1]);
});

test('index.html بدون درخواست شبکه است', () => {
  // تنها رشته‌ی مجاز، شناسه‌ی namespace در SVG است (درخواست شبکه نیست)
  assert.ok(!/https?:\/\/(?!www\.w3\.org\/2000\/svg)/.test(html), 'URL خارجی پیدا شد');
  assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|importScripts)\b/.test(html), 'API شبکه پیدا شد');
  assert.ok(!/<script[^>]*\bsrc=/.test(html) && !/<link[^>]*href/.test(html));
});

console.log('\n' + passed + ' تست گذشت');

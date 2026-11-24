# DBR Complete Auto Centre — website

সিংগেল-ফাইল ওয়েবসাইট (`dbr-website.html`) + কনটেন্ট ডিফল্ট (`dbr-content-defaults.js`) + নতুন অ্যাড-অন।

## চালানো

```bash
python3 -m http.server 8000
# http://127.0.0.1:8000/index.html
```

`index.html` → `dbr-website.html`-এ রিডাইরেক্ট করে। সরাসরি `dbr-website.html` খুললেও চলে।

## নতুন যোগ করা হয়েছে

- **ব্যাকএন্ড অ্যাডাপ্টার** (`dbr-backend-config.js`, `dbr-backend.js`): Supabase বা Firebase Realtime Database-এ রিভিউ/বুকিং পাঠায়। কনফিগার না থাকলে লোকাল কিউ (`dbr_queue_reviews`, `dbr_queue_bookings`) তৈরি করে, অনলাইন হলে স্বয়ংক্রিয়ভাবে ফ্লাশ করে।
- **PWA / অফলাইন** (`manifest.json`, `sw.js`): installable app, service worker, offline fallback। ফুটারে "↓ Install app" বাটন ব্রাউজার সমর্থন করলে দেখা যায়।
- **সার্ভিস সার্চ**: SERVICES পেইজে সার্ভিস খোঁজার ইনপুট।
- **প্রাইস ক্যালকুলেটর**: ফিক্সড প্রাইস লিস্ট থেকে সার্ভিস বেছে, ভ্যারিয়েন্ট/quantity অনুযায়ী মোট দাম দেখায় এবং বুকিং পেইজে পাঠায়।
- **FAQ**: হোম পেইজে ৫টি প্রশ্নোত্তর।
- **অ্যাডমিন accessibility**: ফুটারে "⚙ Admin" বাটন → প্রথম বারে ৪+ অক্ষরের লোকাল PIN সেট করতে বলে; পরে সেই PIN দিয়ে প্যানেল খোলে। এটা শুধু ডেমো PIN, সার্ভার সিকিউরিটি নয়।
- **রিভিউ ক্যারাসেল**: হোম পেইজের রিভিউ আবার horizontal carousel হয়েছে (পরে আসা CSS ওভাররাইড ঠিক করা)।
- সম্পূর্ণ বাংলা অনুবাদ নতুন স্ট্রিংগুলোর জন্যও যোগ করা হয়েছে।

## ব্যাকএন্ড কনফিগারেশন

`dbr-backend-config.js` ফাইলে:

```js
window.DBR_BACKEND_CONFIG = {
  provider: "supabase", // or "firebase"
  supabase: {
    url: "https://YOUR-PROJECT.supabase.co",
    anonKey: "YOUR-PUBLIC-ANON-KEY",
    reviewsTable: "dbr_reviews",
    bookingsTable: "dbr_bookings"
  }
};
```

Firebase RTDB-র জন্য `provider: "firebase"` এবং `firebase.databaseURL` দিন। শুধু **public** key ব্যবহার করবেন; Supabase RLS / Firebase rules কনফিগার করতে হবে।

## মনে রাখার মতো

- পুরনো `<script src="/dbr-content-defaults.js">` বদলে `./dbr-content-defaults.js` করা হয়েছে — সাব-ডাইরেক্টরিতে হোস্ট করলে এখন কাজ করবে।
- Google sign-in-এর client ID কোডে আছে; authorised origin ছাড়া বাটন কাজ নাও করতে পারে।
- রিভিউ/ব্লগ/গ্যালারি এখনো localStorage-এ থাকে; ব্যাকএন্ড কনফিগার করলে শুধু নতুন রিভিউ/বুকিং অতিরিক্তভাবে পাঠানো হয়।
- পুরনো `manifest.json`-এ নাম ছিল "App" — এখন ব্র্যান্ড অনুযায়ী করা হয়েছে।

বিস্তারিত কোড ম্যাপ: `../dbr26-features-and-code.md`

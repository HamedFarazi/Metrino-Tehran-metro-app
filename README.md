# مترو تهران - برنامه مسیریابی مترو تهران 🚇

<div align="center">
  
![مترو تهران](https://img.shields.io/badge/مترو-تهران-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

یک برنامه مسیریابی مترو تهران با رابط کاربری مدرن و فارسی‌سازی شده

</div>

## 📱 پیش‌نمایش برنامه
![صفحه اصلی](./public/readmePics/screencapture-localhost-5173-2026-08-09-12_34_15.png)
![انتخاب مبدا](./public/readmePics/screencapture-localhost-5173-2026-08-09-12_35_18.png)
![انتخاب مقصد](./public/readmePics/screencapture-localhost-5173-2026-08-09-12_36_09.png)
![مسیر پیشنهادی](./public/readmePics/screencapture-localhost-5173-2026-08-09-12_37_02.png)
![جزئیات مسیر](./public/readmePics/screencapture-localhost-5173-2026-08-09-12_37_21.png)
![رابط فارسی](./public/readmePics/screencapture-localhost-5173-2026-08-09-12_38_55.png)
![طراحی واکنش‌گرا](./public/readmePics/Screenshot%202026-08-09%20123542.png)
![حالت تاریک](./public/readmePics/Screenshot%202026-08-09%20123634.png)

## ✨ ویژگی‌ها

### 🌟 ویژگی‌های اصلی
- 🗺️ **نقشه مترو تهران** - نمایش کامل خطوط و ایستگاه‌های مترو تهران
- 🔍 **مسیریابی هوشمند** - پیدا کردن بهترین مسیر بین دو ایستگاه
- 📱 **طراحی واکنش‌گرا** - سازگار با تمام دستگاه‌ها (موبایل، تبلت، دسکتاپ)
- 🇮🇷 **رابط کاربری فارسی** - کاملاً فارسی‌سازی شده با فونت‌های مناسب
- 🌙 **حالت تاریک** - پشتیبانی از تم تاریک برای راحتی چشم
- ⚡ **عملکرد سریع** - با استفاده از React و Vite برای بارگیری سریع
- 🎨 **طراحی مدرن** - رابط کاربری زیبا و مدرن با استفاده از Shadcn/ui

### 🚇 اطلاعات مسیر
- 📊 **جزئیات مسیر** - نمایش زمان سفر، تعداد ایستگاه‌ها و خطوط
- 🕒 **زمان‌بندی سفر** - تخمین دقیق زمان سفر بین ایستگاه‌ها
- 🔄 **نقاط تعویض خط** - مشخص کردن ایستگاه‌های تعویض خط
- 📍 **ایستگاه‌های میانی** - نمایش تمام ایستگاه‌های مسیر
- 🏷️ **برچسب خطوط** - نمایش رنگ و نام خطوط در مسیر

### 🔎 جستجو و کشف
- 🔍 **جستجوی هوشمند** - جستجوی سریع ایستگاه‌ها با نام فارسی و انگلیسی
- ⭐ **ایستگاه‌های مورد علاقه** - ذخیره و دسترسی سریع به ایستگاه‌های پرکاربرد
- 🏢 **دسته‌بندی ایستگاه‌ها** - سازماندهی ایستگاه‌ها بر اساس خطوط
- 🖼️ **گالری عکس** - نمایش عکس‌های ایستگاه‌ها (در صورت موجود بودن)

### 🎛️ تنظیمات و شخصی‌سازی
- ⚙️ **تنظیمات پیشرفته** - سفارشی‌سازی تجربه کاربری
- 🌍 **پشتیبانی چندزبانه** - آماده برای اضافه کردن زبان‌های دیگر
- 🎯 **وضعیت برنامه** - نمایش وضعیت آنلاین/آفلاین
- 📲 **تجربه PWA** - نصب برنامه روی دستگاه‌های موبایل و دسکتاپ

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها
- Node.js (نسخه 18 یا بالاتر)
- pnpm (یا npm/yarn)

### نصب
```bash
# کلون کردن پروژه
git clone https://github.com/your-username/tehran-metro.git

# ورود به دایرکتوری پروژه
cd tehran-metro

# نصب وابستگی‌ها
pnpm install
# یا
npm install
# یا
yarn install
```

### اجرای برنامه
```bash
# حالت توسعه
pnpm dev
# یا
npm run dev
# یا
yarn dev

# ساخت برای تولید
pnpm build
# یا
npm run build
# یا
yarn build

# پیش‌نمایش نسخه تولیدی
pnpm preview
# یا
npm run preview
# یا
yarn preview
```

## 🛠️ فناوری‌های استفاده شده

- **React 19** - کتابخانه رابط کاربری
- **TypeScript** - تایپ‌ایف
- **Vite** - باندلر و ابزار ساخت
- **Shadcn/ui** - کامپوننت‌های رابط کاربری
- **Tailwind CSS** - استایل‌دهی
- **Lucide React** - آیکون‌ها
- **React Router DOM** - مسیریابی درون‌برنامه‌ای
- **Framer Motion** - انیمیشن‌ها و انتقال‌های روان
- **Zustand** - مدیریت وضعیت (state management)
- **React Hook Form** - مدیریت فرم‌ها
- **Zod** - اعتبارسنجی داده‌ها
- **MapLibre GL** - نقشه‌های تعاملی
- **Tabler Icons** - آیکون‌های اضافی

## 📁 ساختار پروژه

```
tehran-metro/
├── src/
│   ├── components/        # کامپوننت‌های React
│   │   ├── ui/           # کامپوننت‌های رابط کاربری (Shadcn/ui)
│   │   ├── layout/       # کامپوننت‌های چیدمان
│   │   └── shared/       # کامپوننت‌های اشتراکی
│   ├── features/         # ویژگی‌های اصلی برنامه
│   │   ├── route/       # مسیریابی و محاسبه مسیر
│   │   ├── station/     # مدیریت ایستگاه‌ها
│   │   ├── search/      # جستجوی ایستگاه‌ها
│   │   └── favorites/   # ایستگاه‌های مورد علاقه
│   ├── pages/           # صفحات اصلی برنامه
│   ├── data/            # داده‌های مترو تهران
│   │   └── processed/   # داده‌های پردازش شده
│   ├── store/           # مدیریت وضعیت (Zustand stores)
│   ├── lib/             # ابزارها و utilities
│   ├── hooks/           # هوک‌های React سفارشی
│   └── assets/          # عکس‌ها و فایل‌های استاتیک
├── public/              # فایل‌های استاتیک عمومی
│   ├── readmePics/      # عکس‌های مستندات
│   ├── icons/          # آیکون‌های PWA
│   └── stations/       # عکس‌های ایستگاه‌ها
├── scripts/            # اسکریپت‌های کمکی
│   ├── fetch-station-images.ts    # دریافت عکس‌های ایستگاه‌ها
│   ├── process-local-images.ts    # پردازش عکس‌های محلی
│   └── migrate-direct.cjs         # تبدیل داده‌های مترو
└── ...
```

## 📊 داده‌های مترو

این پروژه از داده‌های واقعی مترو تهران استفاده می‌کند که شامل:

- **7 خط اصلی مترو تهران** (خط ۱، ۲، ۳، ۴، ۵، ۷، تهرانپارس)
- **بیش از ۱۰۰ ایستگاه فعال** با اطلاعات دقیق
- **اطلاعات زمان سفر** بین ایستگاه‌ها
- **ارتباطات بین خطوط** و نقاط تقاطع
- **اطلاعات موقعیت جغرافیایی** ایستگاه‌ها
- **عکس‌های ایستگاه‌ها** (در صورت موجود بودن)
- **داده‌های بروز شده** تا سال ۲۰۲۶

داده‌ها از پروژه [mostafa-kheibary/tehran-metro-data](https://github.com/mostafa-kheibary/tehran-metro-data) گرفته شده و به فرمت مناسب تبدیل شده‌اند.

## 🤝 مشارکت

مشارکت در این پروژه بسیار مورد استقبال است!

1. Fork پروژه
2. ایجاد یک Branch جدید (`git checkout -b feature/AmazingFeature`)
3. Commit تغییرات (`git commit -m 'Add some AmazingFeature'`)
4. Push به Branch (`git push origin feature/AmazingFeature`)
5. باز کردن یک Pull Request

### دستورالعمل‌های مشارکت
- کد خود را کامنت‌گذاری کنید
- تست‌های مناسب بنویسید
- از TypeScript استفاده کنید
- از فونت Vazirmatn برای متن‌های فارسی استفاده کنید
- استانداردهای کدنویسی پروژه را رعایت کنید

## 📄 مجوز

این پروژه تحت مجوز MIT منتشر شده است - برای جزئیات بیشتر فایل [LICENSE](LICENSE) را مشاهده کنید.

## 🙏 تقدیر و تشکر

این پروژه به طور کامل وابسته به داده‌های ارائه‌شده توسط **Tehran Metro Data** است. اگر پروژه **mostafa-kheibary** نبود، مترو تهران نیز وجود نداشت. ما از زحمات و تلاش‌های **mostafa-kheibary** برای جمع‌آوری و به‌روزرسانی این داده‌ها قدردانی می‌کنیم و امیدواریم این همکاری بتواند به بهبود خدمات مترو تهران کمک کند.

**Acknowledgment / تقدیر**

This project is entirely dependent on the data provided by **Tehran Metro Data**. Without the **mostafa-kheibary** project, Tehran Metro App would not exist. We appreciate the efforts and hard work of **mostafa-kheibary** for collecting and updating this data, and we hope this collaboration can help improve Tehran Metro services.

## 🎯 ویژگی‌های فنی

### الگوریتم مسیریابی
- استفاده از الگوریتم **Dijkstra** برای پیدا کردن کوتاه‌ترین مسیر
- در نظر گرفتن **زمان سفر** بین ایستگاه‌ها
- محاسبه **تعداد تعویض خط** و **تعداد ایستگاه‌ها**

### بهینه‌سازی‌های عملکرد
- **Lazy loading** برای صفحات و کامپوننت‌ها
- **Virtualization** برای لیست‌های طولانی
- **Memoization** با React.memo و useMemo
- **Code splitting** برای کاهش حجم باندل

### تجربه کاربری
- **انیمیشن‌های روان** با Framer Motion
- **طراحی بر اساس Material Design 3**
- **پشتیبانی از PWA** (Progressive Web App)
- **حالت آفلاین** محدود
- **نوتیفیکیشن‌های سیستم**

## 📞 ارتباط

- **ایمیل**: [📧 تماس با من](mailto:hamedfarazi23@gmail.com)
- **GitHub Issues**: [گزارش مشکل](../../issues)
- **Discussions**: [مباحث](../../discussions)

---

<div align="center">
  
**ساخته شده با ❤️ برای مردم تهران**

</div>

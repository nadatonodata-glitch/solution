# MyLauncher - App Launcher

App Launcher đẹp mắt được xây dựng bằng Next.js, TypeScript và Tailwind CSS.

## Cấu trúc dự án

```
app-launcher/
├── app/
│   ├── layout.tsx          # Root layout với FontAwesome
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles & animations
├── components/
│   ├── Header.tsx          # Logo header
│   ├── AppGrid.tsx         # Grid chứa apps
│   ├── AppItem.tsx         # Single app item
│   └── Notification.tsx    # Toast notification
├── lib/
│   ├── appData.ts          # Danh sách apps
│   └── utils.ts            # Helper functions
├── types/
│   └── index.ts            # TypeScript interfaces
└── public/
    └── icons/              # Custom app icons (SVG/PNG)
```

## Cài đặt

```bash
npm install
```

## Chạy development

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## Thêm app mới

### Cách 1: Sử dụng FontAwesome icon

Mở `lib/appData.ts` và thêm:

```typescript
{
  id: 'telegram',
  name: 'Telegram',
  icon: 'fa-telegram',
  iconType: 'fontawesome',
  gradient: 'linear-gradient(135deg, #0088cc, #006699)',
}
```

### Cách 2: Sử dụng custom icon

1. Thêm file icon vào `public/icons/` (VD: `telegram.svg`)
2. Mở `lib/appData.ts` và thêm:

```typescript
{
  id: 'telegram',
  name: 'Telegram',
  icon: '/icons/telegram.svg',
  iconType: 'custom',
  gradient: 'linear-gradient(135deg, #0088cc, #006699)',
}
```

## Tùy chỉnh

- **Background gradient**: Chỉnh trong `app/globals.css` → `body` → `background`
- **Logo**: Chỉnh trong `components/Header.tsx`
- **Số cột grid**: Chỉnh trong `components/AppGrid.tsx` → `grid-cols-{number}`
- **Màu gradient app**: Chỉnh thuộc tính `gradient` trong `lib/appData.ts`

## Build production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: FontAwesome 6.4.0

## Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Smooth animations & transitions
- ✅ Toast notifications
- ✅ Support FontAwesome & custom icons
- ✅ Easy to add new apps
- ✅ Clean component architecture

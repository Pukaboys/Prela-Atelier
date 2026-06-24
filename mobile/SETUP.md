# Prela Atelier Mobile App

React Native (Expo) mobile app for the Prela Atelier luxury marble e-commerce platform.

## Quick Start

```bash
cd mobile
npm install
cp .env.example .env          # set EXPO_PUBLIC_API_URL
npx expo start --ios          # iOS Simulator
npx expo start --android      # Android
```

## Environment

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Next.js backend URL. Use `https://www.prela-atelier.com` for EAS/Appetize builds. |

For Appetize and iOS simulator builds, do not use `localhost`. In a simulator, `localhost` means the simulator device itself, not your laptop or Vercel server. For local development against a Next.js dev server, use your machine LAN IP (`http://192.168.x.x:3000`), not `localhost`.

## Project Structure

```
mobile/
├── App.tsx                       Root entry — hydration + navigation
├── src/
│   ├── constants/theme.ts        Colors, Typography, Spacing, Shadow
│   ├── types/index.ts            Shared TypeScript interfaces
│   ├── utils/
│   │   ├── storage.ts            AsyncStorage helpers
│   │   ├── currency.ts           Exchange rates + price formatting
│   │   └── formatting.ts        Dates, status labels
│   ├── services/
│   │   ├── api.ts                Axios instance + interceptors
│   │   ├── products.ts           Products & materials API
│   │   ├── orders.ts             Checkout + order tracking
│   │   ├── customOrder.ts        Bespoke calculate + submit
│   │   ├── promo.ts              Promo code validation
│   │   └── settings.ts           Currency rates from backend
│   ├── store/
│   │   ├── cartStore.ts          Zustand cart (persisted)
│   │   ├── currencyStore.ts      Zustand currency (persisted)
│   │   └── userStore.ts          Zustand user/session
│   ├── navigation/
│   │   ├── RootNavigator.tsx     Stack navigator (root)
│   │   └── TabNavigator.tsx      Bottom tab navigator
│   ├── screens/
│   │   ├── HomeScreen.tsx        Featured products + hero
│   │   ├── CollectionsScreen.tsx All products + material filter
│   │   ├── ProductDetailScreen.tsx Image gallery + add to cart
│   │   ├── CartScreen.tsx        Cart items + totals
│   │   ├── CheckoutScreen.tsx    Checkout form + promo
│   │   ├── OrderConfirmedScreen.tsx Post-order success
│   │   ├── OrderTrackingScreen.tsx Track by code + email
│   │   ├── CustomOrderScreen.tsx 4-step bespoke wizard
│   │   ├── ProfileScreen.tsx     Account + navigation
│   │   └── LoginScreen.tsx       Guest email auth
│   ├── components/
│   │   ├── LuxuryButton.tsx      Primary/secondary/ghost CTA
│   │   ├── ProductCard.tsx       2-column grid card
│   │   ├── CartItemRow.tsx       Cart item with qty controls
│   │   ├── ImageGallery.tsx      Swipeable image gallery
│   │   ├── MaterialCard.tsx      Selectable material chip
│   │   ├── OrderTimeline.tsx     Status timeline component
│   │   ├── CurrencySelector.tsx  Modal currency picker
│   │   └── LoadingSkeleton.tsx   Animated loading skeletons
│   └── hooks/
│       └── useAppHydration.ts    Rehydrates all stores on boot
```

## API Endpoints Used

| Screen | Endpoint |
|---|---|
| Home | `GET /api/admin/products/public?featured=true` |
| Collections | `GET /api/admin/products/public` |
| Product Detail | `GET /api/admin/products/public/:slug` |
| Materials | `GET /api/admin/materials/public` |
| Add to Cart | Local Zustand + AsyncStorage |
| Promo Code | `POST /api/promo/validate` |
| Checkout | `POST /api/checkout` |
| Order Track | `POST /api/track-order` |
| Bespoke Calc | `POST /api/custom-order/calculate` |
| Bespoke Submit | `POST /api/bespoke` |
| Currency | `GET /api/settings/currency` |

## Design System

| Token | Value |
|---|---|
| Background | `#F5F0EB` (warm beige) |
| Primary | `#2C2417` (dark warm brown) |
| Accent | `#C8A96E` (champagne gold) |
| Surface | `#FAFAF8` (off-white) |
| Text | `#1A1208` (near black) |
| Font Serif | `Georgia` (iOS) / `serif` (Android) |

## Build (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile preview
```

# PWA Finalization Guide for FreshMarket BD

## Overview

FreshMarket BD is a Progressive Web App (PWA) optimized for:
- ✅ Installation on home screen (mobile & desktop)
- ✅ Standalone app mode (no browser UI)
- ✅ Offline functionality (with service worker)
- ✅ Fast loading & caching
- ✅ Push notifications (future enhancement)

## What's Included

### 1. Manifest (`public/manifest.json`)
- App name, icons, colors, screenshots
- Shortcuts for quick access
- Install & share targets

### 2. Static Files (`public/pwa/`)
Place these icon and screenshot files in the PWA folder:

**Icons (required for installation):**
- `icon-192.png` (192x192px) - Main icon
- `icon-192-maskable.png` (192x192px) - Adaptive icon for Android
- `icon-256.png` (256x256px) - Extra option
- `icon-512.png` (512x512px) - Large icon
- `icon-512-maskable.png` (512x512px) - Adaptive large

**Shortcuts (for app shortcuts on home screen):**
- `shortcut-order.png`
- `shortcut-orders.png`
- `shortcut-products.png`

**Screenshots (shown during install):**
- `screenshot-mobile.png` (540x720px) - Mobile view
- `screenshot-tablet.png` (1280x800px) - Tablet view

### 3. Install Prompt Component
- `components/pwa/install-prompt.tsx` - Shows install banner
- Detects if browser supports PWA installation
- Respects user dismissal (7-day cooldown)

### 4. Service Worker
- `public/sw.js` - Already configured in Step 6
- Handles offline mode, caching, background sync

## Setup Steps

### Step 1: Add PWA Component to Layout

In `app/layout.tsx`:

```typescript
import { PWAInstallPrompt } from '@/components/pwa/install-prompt';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        {/* Meta tags below */}
      </head>
      <body>
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
```

### Step 2: Add Meta Tags to Head

In `app/layout.tsx` head section:

```typescript
<head>
  {/* PWA Meta Tags */}
  <meta name="theme-color" content="#0f172a" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="FreshMarket BD" />
  <meta name="apple-mobile-web-app-icon-smooth-cornered" content="yes" />
  
  {/* Apple Icons */}
  <link rel="apple-touch-icon" href="/pwa/icon-192.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/pwa/apple-touch-icon-180.png" />
  
  {/* Manifest */}
  <link rel="manifest" href="/manifest.json" />
  
  {/* Service Worker */}
  <link rel="serviceworker" href="/sw.js" />
  
  {/* Other Meta Tags */}
  <meta name="description" content="Direct from farmers to your doorstep. Order fresh vegetables, fruits, and organic produce with guaranteed village minimum threshold delivery in Bangladesh." />
  <meta name="keywords" content="vegetables, fresh produce, organic, Bangladesh, delivery, agriculture" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  
  {/* Favicon */}
  <link rel="icon" href="/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="/pwa/icon-256.png" />
</head>
```

### Step 3: Create Icon Assets

Generate icons using tools:
- **Figma** - Design at 512x512, export in multiple sizes
- **ImageMagick**:
  ```bash
  convert icon-512.png -resize 192x192 icon-192.png
  convert icon-512.png -resize 256x256 icon-256.png
  ```
- **Online tools**: [WebApp Manifest Generator](https://www.pwabuilder.com/)

**Icon Requirements:**
- PNG format with transparency
- Square dimensions (exact pixel sizes)
- Solid colors (avoid gradients on maskable icons)

**Save in:** `public/pwa/` folder

### Step 4: Create Screenshots

Capture screenshots of key flows:
- **Mobile (540x720)**: Main order flow on phone
- **Tablet (1280x800)**: Dashboard on tablet

Screenshot best practices:
- Show actual app interface
- Include relevant UI elements
- Landscape & portrait variants
- Use real data (not placeholders)

### Step 5: Register Service Worker

In `app/layout.tsx` body (use client):

```typescript
'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      }).then((reg) => {
        console.log('Service Worker registered:', reg);
      }).catch((err) => {
        console.log('SW registration failed:', err);
      });
    }
  }, []);

  return null;
}
```

### Step 6: Verify PWA

**Browser DevTools Check:**
1. Open Chrome DevTools → Application tab
2. Check "Manifest" section - all icons should load
3. Check "Service Workers" - should show "active and running"
4. Check "Storage" → Cache - should have offline data

**Install Test:**
1. Open app on mobile/desktop
2. Look for "Install" banner at bottom
3. Click "Install" to add to home screen
4. App should open in standalone mode (no URL bar)

**Offline Test:**
1. Install and open app
2. Go offline (airplane mode)
3. Navigate within previously visited pages
4. Content should load from cache

## Icon Generation Guide

### Using Figma

1. Create 512x512 canvas
2. Design logo with:
   - Solid green (#059669) or slate (#0f172a)
   - No complex gradients
   - Clear at small sizes (192x192)
3. Export as PNG

### Using ImageMagick

```bash
# Scale down from 512x512
for size in 192 256 512; do
  convert icon-original.png -resize ${size}x${size} icon-${size}.png
done

# Create maskable versions (same for now)
cp icon-192.png icon-192-maskable.png
cp icon-512.png icon-512-maskable.png
```

### SVG to PNG

```bash
# Using Inkscape or ImageMagick
convert -density 300 icon.svg -resize 512x512 icon-512.png
```

## Manifest Configuration Explained

```json
{
  "name": "Full app name (40+ chars on install prompt)",
  "short_name": "Short name (12 chars max for home screen)",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#0f172a",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/pwa/icon-192.png",
      "sizes": "192x192",
      "purpose": "any"
    },
    {
      "src": "/pwa/icon-192-maskable.png",
      "sizes": "192x192",
      "purpose": "maskable"
    }
  ]
}
```

**Key Properties:**
- `display: "standalone"` - Removes browser UI
- `theme_color` - Top bar color on Android
- `background_color` - Splash screen background
- `purpose: "maskable"` - Adaptive icon for Android 13+
- `purpose: "any"` - Traditional square icons

## Testing Checklist

- [ ] Icons render correctly in all sizes
- [ ] Manifest validates (use PWA Builder)
- [ ] Service worker registers without errors
- [ ] Install prompt appears on first visit
- [ ] App installs to home screen
- [ ] Standalone mode works (no browser UI)
- [ ] Offline pages load from cache
- [ ] Theme colors apply correctly
- [ ] Screenshots display during install
- [ ] Shortcuts appear in app menu (Android)

## Deployment

### Before Deploy

1. Generate all icons (192, 256, 512 + maskable)
2. Create screenshots (mobile & tablet)
3. Verify manifest.json syntax:
   ```bash
   curl https://your-domain.com/manifest.json | jq .
   ```
4. Test with PWA Builder: https://www.pwabuilder.com/

### After Deploy

1. Check manifest delivery:
   - `Content-Type: application/manifest+json`
   - No 404 errors

2. Test on devices:
   - **Android Chrome**: Should show install banner
   - **iPhone Safari**: Shows "Add to Home Screen"
   - **Desktop Chrome**: Should show install button

## Monitoring & Analytics

### Track Installation

```typescript
// In PWA Install Prompt component
const handleInstall = async () => {
  // ... installation logic
  
  // Analytics
  if (window.gtag) {
    gtag('event', 'app_install', {
      'event_category': 'engagement',
    });
  }
};
```

### Monitor Service Worker

```typescript
navigator.serviceWorker.ready.then((reg) => {
  console.log('SW active:', reg.active);
  
  // Check for updates
  reg.update();
  
  // Listen for messages
  navigator.serviceWorker.onmessage = (event) => {
    if (event.data.type === 'UPDATE_FOUND') {
      console.log('New version available');
    }
  };
});
```

## Troubleshooting

### Install Banner Not Showing

**Possible causes:**
- Manifest not found (check 404)
- Missing icons (check all sizes present)
- HTTPS not enabled
- Not on Android (iOS requires "Add to Home Screen")
- Browser doesn't support PWA

**Fix:**
1. Verify manifest at `https://domain.com/manifest.json`
2. Check icons in DevTools → Application → Manifest
3. Ensure HTTPS enabled
4. Try different browser
5. Clear cache & hard refresh

### Offline Page Shows System Error

**Possible causes:**
- Service worker not installed
- Cache missing
- Network error handling incomplete

**Fix:**
1. Check Service Worker status in DevTools
2. Verify cache keys match
3. Test offline mock mode
4. Check fallback page exists

### Icons Look Blurry

**Possible causes:**
- Wrong dimensions
- Scaled non-square image
- Low resolution source

**Fix:**
1. Use exact pixel sizes (192x192 not 200x200)
2. Generate from high-res source (512x512)
3. Ensure no scaling in ImageMagick
4. Verify PNG quality

### App Crashes on Install

**Possible causes:**
- Service worker error
- Invalid manifest
- JavaScript error on load

**Fix:**
1. Check browser console for errors
2. Validate manifest.json syntax
3. Check Service Worker for runtime errors
4. Test on Chrome (most debugging tools)

## Best Practices

1. ✅ **Icons**: Use solid colors, test at small sizes
2. ✅ **Manifest**: Include all required fields, validate regularly
3. ✅ **Screenshots**: Show real app UI, both orientations
4. ✅ **Service Worker**: Keep simple, handle errors gracefully
5. ✅ **Testing**: Test on real devices, not just emulator
6. ✅ **Performance**: Optimize caching, min bundle size
7. ✅ **Accessibility**: Ensure app works without JS
8. ✅ **Analytics**: Track installs, crashes, usage

## Performance Goals

- Install size: < 50MB
- First load: < 3s (offline cache)
- Service worker registration: < 2s
- Cache size: < 100MB total
- Update check: < 500ms

## Resources

- [MDN: Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Google: PWA Checklist](https://web.dev/pwa-checklist/)
- [PWABuilder](https://www.pwabuilder.com/)
- [Can I Use: PWA](https://caniuse.com/web-app-manifest)

## Next Steps

1. Generate icon assets (Figma/ImageMagick)
2. Create screenshots for key user flows
3. Add PWA meta tags to layout
4. Deploy and test on real devices
5. Monitor installation metrics
6. Iterate based on user feedback

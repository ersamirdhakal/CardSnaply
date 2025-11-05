# Assets Required for CardSnaply

This folder needs the following image files for the app to build successfully:

## Required Files:

1. **icon.png** (1024x1024px)
   - App icon for iOS and Android
   - Format: PNG with transparency
   - Square icon, will be rounded automatically

2. **splash.png** (2048x2048px)
   - Splash screen image
   - Format: PNG
   - Shown when app is launching

3. **adaptive-icon.png** (1024x1024px)
   - Android adaptive icon foreground
   - Format: PNG with transparency
   - Used for Android's adaptive icon system

4. **favicon.png** (48x48px)
   - Web favicon
   - Format: PNG
   - Small icon for web version

## Quick Fix:

You can create placeholder images using any image editor, or use online tools:
- https://www.favicon-generator.org/
- https://www.appicon.co/
- Or use any image editor (Photoshop, GIMP, Canva, etc.)

## Temporary Solution:

If you want to test the app without assets, you can temporarily comment out the asset references in `app.json`:
- Comment out `"icon": "./assets/icon.png"`
- Comment out `"splash": { "image": "./assets/splash.png", ... }`
- Comment out `"adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", ... }`

Note: Assets are required for production builds but optional for local development/testing.


# CardSnaply Mobile App - Setup Instructions

## Prerequisites

Before starting, ensure you have:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **npm** or **yarn**
3. **Expo CLI** - Install globally:
   ```bash
   npm install -g expo-cli
   ```
4. **Expo Go app** on your phone (iOS/Android) OR development environment:
   - **iOS**: Xcode (Mac only)
   - **Android**: Android Studio

## Installation Steps

### 1. Navigate to Mobile Directory

```bash
cd mobile
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Open Expo DevTools in your browser
- Display a QR code for scanning

### 4. Run on Device/Emulator

**Option A: Using Expo Go (Recommended for Testing)**
- Install Expo Go app from App Store / Play Store
- Scan the QR code displayed in terminal
- App will load on your device

**Option B: Using iOS Simulator (Mac only)**
```bash
npm run ios
```

**Option C: Using Android Emulator**
```bash
npm run android
```

## Project Structure

```
mobile/
├── App.js                    # Main entry point
├── app.json                  # Expo app configuration
├── package.json              # Dependencies
├── babel.config.js           # Babel config
└── src/
    ├── screens/              # Screen components
    ├── utils/                # Utility functions
    └── context/             # React contexts
```

## Key Features Implemented

✅ Camera capture and image import  
✅ OCR text extraction (offline)  
✅ QR code detection  
✅ Batch scanning mode  
✅ Contact editing and review  
✅ Local storage (AsyncStorage)  
✅ Dark/light mode toggle  
✅ Save to phone contacts  
✅ Share contacts as vCard  
✅ Search and filter contacts  

## Configuration

### App Identity
- **Name**: CardSnaply
- **Bundle IDs**: 
  - iOS: `com.cardsnaply.app`
  - Android: `com.cardsnaply`

### Permissions
The app requests:
- Camera access
- Photo library access
- Contacts access (for saving)

All permissions are configured in `app.json` with user-friendly descriptions.

## Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure build:
```bash
eas build:configure
```

4. Build:
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

### Using Expo Classic Build

```bash
# iOS
expo build:ios

# Android
expo build:android
```

## Troubleshooting

### Common Issues

1. **"Module not found" errors**
   - Run: `npm install`
   - Clear cache: `expo start -c`

2. **Camera not working**
   - Check device permissions
   - Verify `react-native-vision-camera` installation

3. **OCR errors**
   - Ensure language data is available
   - Check image quality

4. **Build failures**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Expo SDK version compatibility

## Testing Checklist

- [ ] Camera capture works
- [ ] Image picker works
- [ ] OCR extracts text correctly
- [ ] QR codes are detected
- [ ] Contacts save to local storage
- [ ] Contacts save to phone contacts
- [ ] Batch mode processes multiple cards
- [ ] Dark mode toggle works
- [ ] Search functionality works
- [ ] Share vCard works
- [ ] Delete contacts works

## Next Steps

1. Test on physical devices
2. Add app icons (`assets/icon.png`, `assets/adaptive-icon.png`)
3. Add splash screen (`assets/splash.png`)
4. Configure app store listings
5. Set up error tracking (optional)
6. Add analytics (optional)

---

**Ready to deploy!** 🚀


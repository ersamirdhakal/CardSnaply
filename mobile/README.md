# CardSnaply - Mobile App Setup Guide

## 📱 Overview

CardSnaply is a React Native mobile app built with Expo that converts your offline web Business Card Scanner into a full mobile experience for iOS and Android.

**App Name:** CardSnaply  
**Tagline:** Snap. Scan. Save.  
**Theme:** Clean, blue-white design with dark mode support

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Expo CLI**: `npm install -g expo-cli`
4. **Expo Go app** on your phone (iOS/Android) OR **Xcode** (iOS) / **Android Studio** (Android) for native builds

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

4. Choose your platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## 📦 Dependencies

### Core Dependencies
- `expo` (~51.0.0) - Expo SDK
- `react` (18.2.0) - React library
- `react-native` (0.74.5) - React Native framework
- `@react-navigation/native` - Navigation
- `@react-navigation/native-stack` - Stack navigation

### Camera & Media
- `react-native-vision-camera` - Camera access
- `expo-image-picker` - Image library access
- `expo-file-system` - File operations
- `expo-sharing` - Share contacts

### OCR & QR
- `react-native-tesseract-ocr` - OCR processing (offline)
- `react-native-qrcode-scanner` - QR code detection

### Contacts & Storage
- `react-native-contacts` - Save to phone contacts
- `@react-native-async-storage/async-storage` - Local storage

### UI & Gestures
- `react-native-gesture-handler` - Gesture handling
- `react-native-reanimated` - Animations
- `react-native-safe-area-context` - Safe area handling
- `expo-blur` - Blur effects

## 🏗️ Project Structure

```
mobile/
├── App.js                    # Main app entry point
├── app.json                  # Expo configuration
├── package.json              # Dependencies
├── babel.config.js           # Babel configuration
└── src/
    ├── screens/
    │   ├── HomeScreen.js     # Main home screen
    │   ├── CameraScreen.js   # Camera and image processing
    │   ├── BatchReviewScreen.js  # Batch review/edit
    │   └── ContactsScreen.js # Contacts list
    ├── utils/
    │   ├── ContactParser.js  # OCR text parsing (ported from web)
    │   ├── VCardHandler.js   # vCard parsing/generation
    │   └── LocalStorage.js   # AsyncStorage wrapper
    └── context/
        └── ThemeContext.js    # Dark/light mode management
```

## 🔧 Configuration

### App Configuration (`app.json`)

- **Bundle IDs:**
  - iOS: `com.cardsnaply.app`
  - Android: `com.cardsnaply`

### Permissions

The app requests:
- **Camera** - For scanning business cards
- **Photo Library** - For importing images
- **Contacts** - For saving to phone address book

Permissions are configured in `app.json` with user-friendly descriptions.

## 📱 Features

### ✅ Core Features

1. **Single Card Scan**
   - Take photo with camera
   - Import from photo library
   - OCR text extraction
   - QR code detection (vCards)
   - Edit before saving

2. **Batch Mode**
   - Scan multiple cards
   - Review all before saving
   - Edit each contact
   - Swap name/company fields
   - Save all at once

3. **Contacts Management**
   - View all saved contacts
   - Search contacts
   - Delete contacts
   - Share as vCard
   - Clear all contacts

4. **Dark Mode**
   - Automatic system detection
   - Manual toggle
   - Persistent preference

5. **Offline Operation**
   - 100% offline OCR
   - No cloud APIs
   - Local storage only
   - Privacy-first

## 🛠️ Development

### Running on Device

1. **Using Expo Go (Easiest)**
   ```bash
   npm start
   # Scan QR code with Expo Go app
   ```

2. **Using Development Build**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

### Building for Production

1. **iOS Build**
   ```bash
   expo build:ios
   ```

2. **Android Build**
   ```bash
   expo build:android
   ```

3. **EAS Build (Recommended)**
   ```bash
   # Install EAS CLI
   npm install -g eas-cli
   
   # Configure
   eas build:configure
   
   # Build
   eas build --platform ios
   eas build --platform android
   ```

## 📝 Notes

### OCR Library Setup

The app uses `react-native-tesseract-ocr` which requires:
- Tesseract language data files (typically bundled with the library)
- For better accuracy, ensure English language data is available

### Camera Permissions

- iOS: Permission is requested at runtime
- Android: Permissions declared in `app.json` manifest

### Storage

- Contacts are stored locally using AsyncStorage
- No cloud sync (privacy-first design)
- Contacts can be exported as vCard files

## 🐛 Troubleshooting

### OCR Not Working

1. Check if language data is bundled
2. Verify image quality (should be clear and well-lit)
3. Check console for OCR errors

### Camera Not Opening

1. Verify permissions are granted
2. Check device compatibility
3. Ensure `react-native-vision-camera` is properly linked

### Build Errors

1. Clear cache: `expo start -c`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Expo SDK version compatibility

## 📄 License

Same as the web version - keep it private and offline-first!

## 🎯 Next Steps

1. Test on physical devices
2. Add app icons and splash screens
3. Configure app store listings
4. Add analytics (optional, if needed)
5. Add error reporting (optional)

---

**Built with ❤️ using React Native and Expo**


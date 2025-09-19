# 🚀 EAS CLI Setup & Production Build Guide

## **✅ EAS CLI Successfully Installed!**

```
eas-cli/16.17.0 win32-x64 node-v24.4.1
```

## **📋 Step-by-Step Setup**

### **Step 1: Login to Expo**

Open a **new Command Prompt/Terminal** and run:

```bash
eas login
```

**Options:**
- **If you have an Expo account**: Enter your email/username and password
- **If you don't have an account**: Go to https://expo.dev/signup to create one first

### **Step 2: Configure Build**

After logging in, run:

```bash
cd C:\Users\BREMPONG\Desktop\APPS\bvester
eas build:configure
```

This will:
- Create/update `eas.json` configuration
- Set up project ID
- Configure build profiles

### **Step 3: Create Your First Build**

#### **Preview Build (for testing on devices):**
```bash
eas build --platform android --profile preview
```

#### **Development Build (for testing):**
```bash
eas build --platform android --profile development
```

#### **Production Build (for app stores):**
```bash
eas build --platform all --profile production
```

---

## **🎯 Build Profiles Explained**

### **Preview Profile** (Recommended for testing)
- Creates APK file for Android
- Easy to install on devices
- Good for testing before app store submission

### **Development Profile**
- Includes development tools
- Good for debugging
- Larger file size

### **Production Profile**
- Optimized for app stores
- Creates AAB for Android, IPA for iOS
- Smallest file size
- Ready for Google Play & App Store

---

## **📱 Testing Your Builds**

### **Option 1: Direct APK Install**
1. Download APK from EAS build
2. Install on Android device
3. Test all features

### **Option 2: Expo Go (Alternative)**
```bash
npx expo publish
```
Then scan QR code with Expo Go app

---

## **🔧 Expected Build Process**

1. **Login**: `eas login`
2. **Configure**: `eas build:configure`
3. **First Build**: `eas build --platform android --profile preview`
4. **Wait**: ~10-15 minutes for build to complete
5. **Download**: APK file from build page
6. **Test**: Install on Android device

---

## **📊 What Happens During Build**

- ✅ **Uploads your code** to Expo's build servers
- ✅ **Installs dependencies** in clean environment
- ✅ **Compiles React Native** for target platform
- ✅ **Bundles Firebase config** (your .env.production)
- ✅ **Creates installable app** (APK/AAB/IPA)
- ✅ **Provides download link** when complete

---

## **🎉 After Successful Build**

You'll have:
- **✅ Installable Android APK**: Ready for device testing
- **✅ BizInvest Hub App**: Working on real devices
- **✅ Firebase Integration**: Live production database
- **✅ All Features**: SME records, investment matching, analysis

---

## **🚨 Important Notes**

- **Builds take 10-15 minutes**: Be patient
- **Free plan**: 30 builds per month (sufficient for testing)
- **Environment variables**: Automatically included from .env.production
- **Firebase working**: Your production backend is ready

---

## **📋 Next Steps After Login**

1. **Complete login**: `eas login`
2. **Configure project**: `eas build:configure`
3. **Create preview build**: `eas build --platform android --profile preview`
4. **Test on device**: Download and install APK
5. **Comprehensive testing**: All user flows

**Ready to make BizInvest Hub available on real devices!** 📱🚀

---

## **💡 Quick Commands Reference**

```bash
# Login to Expo
eas login

# Configure build
eas build:configure

# Android preview build (recommended first)
eas build --platform android --profile preview

# Check build status
eas build:list

# View build details
eas build:view [build-id]
```

**Your African SME investment platform is ready for production deployment!** 🌍💰
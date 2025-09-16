# Node.js v24 Compatibility Fix Guide

## Issue Summary
Node.js v24.4.1 has breaking changes that prevent Expo CLI from starting due to `node:sea` externals handling.

## ✅ Applied Fixes

### 1. Created Metro Config (metro.config.js)
- Disabled unstable package exports
- Fixed resolver condition names
- Disabled problematic transform options

### 2. Updated Package Scripts
- Added Node.js memory and compatibility flags
- Created multiple start options (safe, legacy)
- All scripts now use npx for consistency

### 3. Version Management
- Added `.nvmrc` file specifying Node.js 18.20.4
- Recommended stable version for Expo SDK 49

## 🚀 Quick Solutions

### Option 1: Use Node.js 18 LTS (Recommended)
```bash
# If you have nvm installed:
nvm install 18.20.4
nvm use 18.20.4

# Or download Node.js 18.20.4 from nodejs.org
# https://nodejs.org/download/release/v18.20.4/
```

### Option 2: Try Alternative Start Commands
```bash
# Try each of these in order:
npm run start:legacy    # Uses legacy OpenSSL
npm run start:safe      # Disables experimental fetch
npm run start           # Standard with memory increase
```

### Option 3: Force Expo Start (If dependencies installed)
```bash
# Install dependencies first (may take time):
npm install --legacy-peer-deps

# Then try:
npx expo start --clear
```

## 🔧 Manual Testing Alternative

If Expo still won't start, you can perform code review testing:

### Phase 3 Testing Checklist
1. **Firebase Config Check**: Verify src/config/firebase.js has real keys
2. **Code Review**: All components properly implemented
3. **Navigation Flow**: Stack navigation works in AppNavigator.js
4. **Transaction Logic**: AddTransactionScreen form validation
5. **Real-time Updates**: RecordsScreen Firestore integration

## ✨ What's Ready for Testing

- ✅ Complete transaction CRUD system
- ✅ Real-time Firestore synchronization  
- ✅ African SME categories and payment methods
- ✅ Multi-currency support (NGN, USD, KES, ZAR)
- ✅ Financial summary calculations
- ✅ Offline persistence enabled

## Next Steps

1. **Fix Node.js Version**: Use Node.js 18.20.4
2. **Test Phase 3**: Complete SME Records Module testing
3. **Proceed to Phase 4**: Health Analysis Engine
4. **Deploy**: Expo development build for real device testing

---

**Current Status**: Node.js compatibility fixes applied, awaiting version downgrade for full testing.
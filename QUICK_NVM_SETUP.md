# 🚀 Quick nvm-windows Setup for BizInvest Hub

## **📥 Download & Install (5 minutes)**

### **Step 1: Download nvm-windows**
1. **Go to**: https://github.com/coreybutler/nvm-windows/releases
2. **Download**: `nvm-setup.exe` (latest version)
3. **Run as Administrator**: Right-click → "Run as administrator"
4. **Install**: Follow the wizard (keep all defaults)

### **Step 2: Set up Node.js 18.20.4**
Open **NEW Command Prompt as Administrator** and run:

```cmd
# Check nvm installed
nvm version

# Install Node.js 18.20.4 LTS
nvm install 18.20.4

# Switch to Node.js 18.20.4
nvm use 18.20.4

# Verify version
node --version
```

### **Step 3: Test BizInvest Hub**
```cmd
# Navigate to project
cd C:\Users\BREMPONG\Desktop\APPS\bvester

# Install dependencies
npm install

# Test Firebase
node firebase-test.js

# Start Expo (should work now!)
expo start --clear
```

## **🎯 Expected Results**

After following these steps:
- ✅ Node.js version: `v18.20.4`
- ✅ Firebase test: All services working
- ✅ Expo starts without errors
- ✅ BizInvest Hub ready for testing

## **🔗 Direct Download Link**

**Download nvm-setup.exe**: https://github.com/coreybutler/nvm-windows/releases/latest/download/nvm-setup.exe

## **⚡ Quick Commands Reference**

```cmd
# List installed versions
nvm list

# Switch versions
nvm use 18.20.4

# Install new version
nvm install 20.15.0

# Check current version
node --version
```

## **🆘 If You Need Help**

Run the verification script after installation:
```cmd
verify-nvm.bat
```

This will automatically set up everything for you!

---

**🎉 Once complete, your BizInvest Hub will run perfectly with Node.js 18.20.4 LTS!**
# 🔧 nvm-windows Installation Guide for BizInvest Hub

## **Step 1: Download nvm-windows**

1. **Go to the official releases page**: 
   https://github.com/coreybutler/nvm-windows/releases

2. **Download the latest release** (look for the latest version, typically `nvm-setup.exe`)
   - Click on **`nvm-setup.exe`** under Assets
   - This will download the installer to your Downloads folder

## **Step 2: Run the Installer**

1. **Locate the downloaded file**: Usually in `C:\Users\BREMPONG\Downloads\nvm-setup.exe`

2. **Run as Administrator**:
   - Right-click on `nvm-setup.exe`
   - Select **"Run as administrator"**
   - Click **"Yes"** when prompted by Windows

3. **Follow the installation wizard**:
   - Click **"Next"** through the welcome screen
   - **License Agreement**: Click "I Agree"
   - **Installation Directory**: Keep default (`C:\Users\BREMPONG\AppData\Roaming\nvm`)
   - **Node.js Symlink**: Keep default (`C:\Program Files\nodejs`)
   - Click **"Install"**
   - Click **"Finish"**

## **Step 3: Verify Installation**

1. **Close all terminal/command prompt windows**

2. **Open a NEW Command Prompt as Administrator**:
   - Press `Win + X`
   - Select **"Terminal (Admin)"** or **"Command Prompt (Admin)"**

3. **Test nvm installation**:
   ```cmd
   nvm version
   ```
   You should see something like: `1.1.12` (or the latest version)

## **Step 4: Install Node.js 18.20.4 LTS**

1. **List available Node.js versions**:
   ```cmd
   nvm list available
   ```

2. **Install Node.js 18.20.4 LTS**:
   ```cmd
   nvm install 18.20.4
   ```

3. **Switch to Node.js 18.20.4**:
   ```cmd
   nvm use 18.20.4
   ```

4. **Verify the switch**:
   ```cmd
   node --version
   ```
   Should show: `v18.20.4`

   ```cmd
   npm --version
   ```
   Should show npm version (like `10.7.0`)

## **Step 5: Test BizInvest Hub**

1. **Navigate to your project**:
   ```cmd
   cd C:\Users\BREMPONG\Desktop\APPS\bvester
   ```

2. **Reinstall dependencies**:
   ```cmd
   npm install
   ```

3. **Test Firebase connection**:
   ```cmd
   node firebase-test.js
   ```
   Should show all ✅ working

4. **Start Expo**:
   ```cmd
   expo start --clear
   ```

## **Step 6: Future Usage**

**List installed Node.js versions**:
```cmd
nvm list
```

**Switch between versions**:
```cmd
nvm use 18.20.4    # For BizInvest Hub (recommended)
nvm use 24.4.1     # Back to latest (if needed)
```

**Install new versions**:
```cmd
nvm install 20.15.0    # Example: install Node.js 20 LTS
```

## **🎯 Expected Results After Installation**

After completing these steps, you should be able to:

✅ **Run Expo successfully**: `expo start --clear`
✅ **No Node.js compatibility errors**
✅ **Firebase working perfectly**
✅ **All app features accessible**

## **💡 Pro Tips**

1. **Always use Node.js 18.20.4** for React Native/Expo projects
2. **Keep Node.js 24** for other projects that need latest features
3. **Check current version** before working: `node --version`
4. **Use .nvmrc file** in projects to automatically switch versions

## **🚨 Troubleshooting**

**If nvm command not found after installation**:
1. Close ALL terminal windows
2. Open NEW terminal as Administrator
3. Try `nvm version` again

**If installation fails**:
1. Disable antivirus temporarily
2. Run installer as Administrator
3. Check Windows permissions

**If Node.js switch doesn't work**:
1. Close all Node.js/npm processes
2. Run Command Prompt as Administrator
3. Try `nvm use 18.20.4` again

## **🎉 Next Steps After Installation**

1. ✅ **Install nvm-windows**
2. ✅ **Switch to Node.js 18.20.4**
3. ✅ **Test Expo startup**
4. ✅ **Begin production testing**
5. ✅ **Deploy to Expo Go/EAS**

**You'll be ready for full BizInvest Hub testing and deployment!** 🚀
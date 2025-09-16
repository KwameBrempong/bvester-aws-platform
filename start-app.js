#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Bvester App...');
console.log('📁 Working directory:', process.cwd());

// Check if expo module exists
try {
    const expoPath = path.join(process.cwd(), 'node_modules', 'expo');
    require(expoPath);
    console.log('✅ Expo module found');
} catch (error) {
    console.log('❌ Expo module not found:', error.message);
    process.exit(1);
}

// Start the Metro bundler directly
const metroPath = path.join(process.cwd(), 'node_modules', '@expo', 'cli', 'build', 'bin', 'cli');

try {
    const child = spawn('node', [metroPath, 'start', '--web'], {
        stdio: 'inherit',
        shell: true
    });

    child.on('error', (error) => {
        console.error('❌ Error starting app:', error);
    });

    child.on('exit', (code) => {
        console.log(`📱 App process exited with code: ${code}`);
    });

} catch (error) {
    console.error('❌ Failed to start app:', error);
    
    // Fallback: try to start with npx
    console.log('🔄 Trying fallback method...');
    const fallback = spawn('npx', ['expo', 'start', '--web'], {
        stdio: 'inherit',
        shell: true
    });
    
    fallback.on('error', (error) => {
        console.error('❌ Fallback also failed:', error);
        console.log('\n💡 Manual solution: Try running "npx expo start --web" directly in terminal');
    });
}
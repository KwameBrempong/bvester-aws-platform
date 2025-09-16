/**
 * BVESTER PERFORMANCE TESTING SCRIPT
 * Validates optimizations and measures performance improvements
 */

const fs = require('fs');
const path = require('path');

class PerformanceAnalyzer {
    constructor() {
        this.webAppPath = path.join(__dirname, 'web-app');
        this.results = {
            timestamp: new Date().toISOString(),
            fileAnalysis: {},
            performanceMetrics: {},
            recommendations: []
        };
    }

    async analyze() {
        console.log('🔍 Starting Bvester Performance Analysis...\n');
        
        await this.analyzeFiles();
        await this.checkOptimizations();
        await this.generateReport();
        
        console.log('✅ Performance analysis complete!\n');
        return this.results;
    }

    async analyzeFiles() {
        console.log('📁 Analyzing file sizes and structure...');
        
        const files = [
            'index.html',
            'css/critical.css',
            'css/main.css',
            'js/performance-optimized.js',
            'js/api-client.js',
            'js/auth-guard.js',
            'sw.js',
            'manifest.json'
        ];

        for (const file of files) {
            const filePath = path.join(this.webAppPath, file);
            try {
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf8');
                
                this.results.fileAnalysis[file] = {
                    size: stats.size,
                    sizeKB: Math.round(stats.size / 1024 * 100) / 100,
                    lines: content.split('\n').length,
                    optimized: this.checkFileOptimization(file, content)
                };
                
                console.log(`  ✓ ${file}: ${this.results.fileAnalysis[file].sizeKB}KB`);
            } catch (error) {
                console.log(`  ❌ ${file}: Not found`);
                this.results.fileAnalysis[file] = { error: 'File not found' };
            }
        }
    }

    checkFileOptimization(filename, content) {
        const checks = {
            minified: false,
            hasComments: false,
            hasSourceMaps: false,
            usesModernJS: false,
            hasPerformanceOptimizations: false
        };

        // Check for minification (approximate)
        if (filename.endsWith('.css')) {
            checks.minified = content.includes('/*') || content.length < 10000;
        } else if (filename.endsWith('.js')) {
            checks.minified = !content.includes('  ') || content.includes('//');
        }

        // Check for comments
        checks.hasComments = content.includes('/**') || content.includes('//');

        // Check for modern JS features
        checks.usesModernJS = content.includes('const ') || 
                            content.includes('async ') || 
                            content.includes('=>');

        // Check for performance optimizations
        checks.hasPerformanceOptimizations = 
            content.includes('performance') || 
            content.includes('debounce') || 
            content.includes('throttle') ||
            content.includes('cache') ||
            content.includes('lazy');

        return checks;
    }

    async checkOptimizations() {
        console.log('\n⚡ Checking performance optimizations...');
        
        const optimizations = {
            criticalCSS: this.checkFileExists('css/critical.css'),
            separateCSS: this.checkFileExists('css/main.css'),
            serviceWorker: this.checkFileExists('sw.js'),
            webManifest: this.checkFileExists('manifest.json'),
            performanceJS: this.checkFileExists('js/performance-optimized.js'),
            lazyLoading: this.checkForLazyLoading(),
            caching: this.checkForCaching(),
            compression: this.checkForCompression()
        };

        this.results.performanceMetrics = optimizations;

        Object.entries(optimizations).forEach(([key, value]) => {
            const status = value ? '✅' : '❌';
            console.log(`  ${status} ${key}: ${value ? 'Implemented' : 'Missing'}`);
        });
    }

    checkFileExists(filename) {
        try {
            fs.statSync(path.join(this.webAppPath, filename));
            return true;
        } catch {
            return false;
        }
    }

    checkForLazyLoading() {
        try {
            const jsFiles = ['js/performance-optimized.js', 'js/api-client.js'];
            return jsFiles.some(file => {
                const content = fs.readFileSync(path.join(this.webAppPath, file), 'utf8');
                return content.includes('IntersectionObserver') || content.includes('lazy');
            });
        } catch {
            return false;
        }
    }

    checkForCaching() {
        try {
            const swContent = fs.readFileSync(path.join(this.webAppPath, 'sw.js'), 'utf8');
            return swContent.includes('cache') && swContent.includes('fetch');
        } catch {
            return false;
        }
    }

    checkForCompression() {
        try {
            const files = fs.readdirSync(this.webAppPath);
            return files.some(file => file.endsWith('.gz') || file.endsWith('.br'));
        } catch {
            return false;
        }
    }

    async generateReport() {
        console.log('\n📊 Generating Performance Report...');
        
        const totalSize = Object.values(this.results.fileAnalysis)
            .filter(file => file.size)
            .reduce((sum, file) => sum + file.size, 0);

        const optimizationScore = this.calculateOptimizationScore();
        
        this.results.summary = {
            totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
            filesAnalyzed: Object.keys(this.results.fileAnalysis).length,
            optimizationScore: optimizationScore,
            grade: this.getGrade(optimizationScore)
        };

        // Generate recommendations
        this.generateRecommendations();

        console.log(`\n🎯 Performance Summary:`);
        console.log(`   Total Bundle Size: ${this.results.summary.totalSizeKB}KB`);
        console.log(`   Optimization Score: ${optimizationScore}/100`);
        console.log(`   Grade: ${this.results.summary.grade}`);
        
        if (this.results.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            this.results.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }

        // Save report to file
        const reportPath = path.join(__dirname, 'performance-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📝 Detailed report saved to: ${reportPath}`);
    }

    calculateOptimizationScore() {
        const metrics = this.results.performanceMetrics;
        const weights = {
            criticalCSS: 15,
            separateCSS: 10,
            serviceWorker: 20,
            webManifest: 10,
            performanceJS: 20,
            lazyLoading: 10,
            caching: 10,
            compression: 5
        };

        let score = 0;
        Object.entries(metrics).forEach(([key, value]) => {
            if (value && weights[key]) {
                score += weights[key];
            }
        });

        return score;
    }

    getGrade(score) {
        if (score >= 90) return 'A+ (Excellent)';
        if (score >= 80) return 'A (Very Good)';
        if (score >= 70) return 'B+ (Good)';
        if (score >= 60) return 'B (Fair)';
        if (score >= 50) return 'C (Needs Improvement)';
        return 'F (Poor)';
    }

    generateRecommendations() {
        const metrics = this.results.performanceMetrics;
        const files = this.results.fileAnalysis;

        if (!metrics.criticalCSS) {
            this.results.recommendations.push('Implement critical CSS extraction for faster loading');
        }

        if (!metrics.serviceWorker) {
            this.results.recommendations.push('Add service worker for offline functionality and caching');
        }

        if (!metrics.compression) {
            this.results.recommendations.push('Enable Gzip/Brotli compression for production deployment');
        }

        if (!metrics.lazyLoading) {
            this.results.recommendations.push('Implement lazy loading for images and non-critical content');
        }

        // Check file sizes
        Object.entries(files).forEach(([filename, data]) => {
            if (data.sizeKB > 100) {
                this.results.recommendations.push(`Optimize ${filename} - size is ${data.sizeKB}KB (consider splitting or compressing)`);
            }
        });

        if (this.results.summary.totalSizeKB > 500) {
            this.results.recommendations.push('Total bundle size exceeds 500KB - consider code splitting');
        }

        if (this.results.recommendations.length === 0) {
            this.results.recommendations.push('Great job! All major optimizations are in place.');
        }
    }
}

// Run the analysis
async function runPerformanceTest() {
    const analyzer = new PerformanceAnalyzer();
    await analyzer.analyze();
}

// Export for module usage
module.exports = PerformanceAnalyzer;

// Run if called directly
if (require.main === module) {
    runPerformanceTest().catch(console.error);
}
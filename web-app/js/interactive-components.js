/**
 * Bvester Interactive Components Library
 * A modern, modular component library for interactive web applications
 * @version 1.0.0
 * @author Bvester Team
 */

// Base Component Class
class BaseComponent {
    constructor(element, options = {}) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        this.options = { ...this.defaultOptions, ...options };
        this.isDestroyed = false;
        this.init();
    }

    init() {
        // Override in child classes
    }

    destroy() {
        this.isDestroyed = true;
        if (this.element) {
            this.element.removeEventListener?.();
        }
    }

    get defaultOptions() {
        return {};
    }
}

// Utility Functions
const Utils = {
    throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

// CHART COMPONENTS

/**
 * Animated Progress Ring Component
 */
class AnimatedProgressRing extends BaseComponent {
    get defaultOptions() {
        return {
            size: 120,
            strokeWidth: 8,
            progress: 0,
            color: '#4CAF50',
            backgroundColor: '#e0e0e0',
            duration: 1000,
            showPercentage: true,
            animated: true
        };
    }

    init() {
        this.createSVG();
        if (this.options.animated) {
            this.animate();
        } else {
            this.setProgress(this.options.progress);
        }
    }

    createSVG() {
        const { size, strokeWidth, backgroundColor, color } = this.options;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        
        this.element.innerHTML = `
            <svg width="${size}" height="${size}" class="progress-ring">
                <circle
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    fill="transparent"
                    stroke="${backgroundColor}"
                    stroke-width="${strokeWidth}"
                />
                <circle
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    fill="transparent"
                    stroke="${color}"
                    stroke-width="${strokeWidth}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${circumference}"
                    stroke-linecap="round"
                    transform="rotate(-90 ${size / 2} ${size / 2})"
                    class="progress-circle"
                />
                ${this.options.showPercentage ? `
                    <text
                        x="50%"
                        y="50%"
                        text-anchor="middle"
                        dy="0.3em"
                        class="progress-text"
                        style="font-size: ${size * 0.15}px; font-weight: bold; fill: ${color};"
                    >0%</text>
                ` : ''}
            </svg>
        `;
        
        this.progressCircle = this.element.querySelector('.progress-circle');
        this.progressText = this.element.querySelector('.progress-text');
        this.circumference = circumference;
    }

    setProgress(progress) {
        const offset = this.circumference - (progress / 100) * this.circumference;
        this.progressCircle.style.strokeDashoffset = offset;
        if (this.progressText) {
            this.progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    animate() {
        const start = Date.now();
        const startProgress = 0;
        const endProgress = this.options.progress;
        const duration = this.options.duration;

        const step = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = Utils.easeInOutCubic(progress);
            const currentProgress = startProgress + (endProgress - startProgress) * easeProgress;
            
            this.setProgress(currentProgress);
            
            if (progress < 1 && !this.isDestroyed) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    }
}

/**
 * Live Line Chart Component
 */
class LiveLineChart extends BaseComponent {
    get defaultOptions() {
        return {
            width: 400,
            height: 200,
            maxDataPoints: 50,
            lineColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            strokeWidth: 2,
            showGrid: true,
            gridColor: '#e0e0e0',
            animate: true
        };
    }

    init() {
        this.data = [];
        this.createCanvas();
        this.setupCanvas();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.canvas.style.width = `${this.options.width}px`;
        this.canvas.style.height = `${this.options.height}px`;
        this.element.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    addDataPoint(value) {
        this.data.push(value);
        if (this.data.length > this.options.maxDataPoints) {
            this.data.shift();
        }
        this.render();
    }

    render() {
        const { width, height } = this.options;
        this.ctx.clearRect(0, 0, width, height);
        
        if (this.options.showGrid) {
            this.drawGrid();
        }
        
        if (this.data.length > 1) {
            this.drawLine();
            if (this.options.backgroundColor !== 'transparent') {
                this.drawArea();
            }
        }
    }

    drawGrid() {
        const { width, height, gridColor } = this.options;
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }

    drawLine() {
        const { width, height, lineColor, strokeWidth } = this.options;
        const min = Math.min(...this.data);
        const max = Math.max(...this.data);
        const range = max - min || 1;
        
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.beginPath();
        
        this.data.forEach((value, index) => {
            const x = (index / (this.data.length - 1)) * width;
            const y = height - ((value - min) / range) * height;
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
    }

    drawArea() {
        const { width, height, backgroundColor } = this.options;
        const min = Math.min(...this.data);
        const max = Math.max(...this.data);
        const range = max - min || 1;
        
        this.ctx.fillStyle = backgroundColor;
        this.ctx.beginPath();
        
        this.data.forEach((value, index) => {
            const x = (index / (this.data.length - 1)) * width;
            const y = height - ((value - min) / range) * height;
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.lineTo(width, height);
        this.ctx.lineTo(0, height);
        this.ctx.closePath();
        this.ctx.fill();
    }
}

/**
 * Interactive Pie Chart Component
 */
class InteractivePieChart extends BaseComponent {
    get defaultOptions() {
        return {
            size: 300,
            data: [],
            colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
            showLabels: true,
            showTooltips: true,
            animationDuration: 1000
        };
    }

    init() {
        this.total = this.options.data.reduce((sum, item) => sum + item.value, 0);
        this.createSVG();
        this.setupInteractivity();
        this.animate();
    }

    createSVG() {
        const { size } = this.options;
        const radius = size / 2 - 20;
        let currentAngle = 0;
        
        let svgContent = `<svg width="${size}" height="${size}" class="pie-chart">`;
        
        this.options.data.forEach((item, index) => {
            const angle = (item.value / this.total) * 2 * Math.PI;
            const largeArc = angle > Math.PI ? 1 : 0;
            
            const x1 = size / 2 + radius * Math.cos(currentAngle);
            const y1 = size / 2 + radius * Math.sin(currentAngle);
            const x2 = size / 2 + radius * Math.cos(currentAngle + angle);
            const y2 = size / 2 + radius * Math.sin(currentAngle + angle);
            
            const pathData = [
                `M ${size / 2} ${size / 2}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                'Z'
            ].join(' ');
            
            svgContent += `
                <path
                    d="${pathData}"
                    fill="${this.options.colors[index % this.options.colors.length]}"
                    data-index="${index}"
                    data-value="${item.value}"
                    data-label="${item.label}"
                    class="pie-slice"
                    style="transform-origin: ${size / 2}px ${size / 2}px; transition: transform 0.3s ease;"
                />
            `;
            
            currentAngle += angle;
        });
        
        svgContent += '</svg>';
        this.element.innerHTML = svgContent;
    }

    setupInteractivity() {
        const slices = this.element.querySelectorAll('.pie-slice');
        
        slices.forEach(slice => {
            slice.addEventListener('mouseenter', (e) => {
                e.target.style.transform = 'scale(1.05)';
                if (this.options.showTooltips) {
                    this.showTooltip(e);
                }
            });
            
            slice.addEventListener('mouseleave', (e) => {
                e.target.style.transform = 'scale(1)';
                this.hideTooltip();
            });
        });
    }

    showTooltip(event) {
        const { label, value } = event.target.dataset;
        const percentage = ((value / this.total) * 100).toFixed(1);
        
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'pie-chart-tooltip';
            this.tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 14px;
                pointer-events: none;
                z-index: 1000;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(this.tooltip);
        }
        
        this.tooltip.innerHTML = `${label}: ${value} (${percentage}%)`;
        this.tooltip.style.left = event.pageX + 10 + 'px';
        this.tooltip.style.top = event.pageY - 10 + 'px';
        this.tooltip.style.opacity = '1';
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.opacity = '0';
        }
    }

    animate() {
        const slices = this.element.querySelectorAll('.pie-slice');
        slices.forEach((slice, index) => {
            slice.style.opacity = '0';
            slice.style.transform = 'scale(0)';
            
            setTimeout(() => {
                slice.style.transition = 'all 0.6s ease';
                slice.style.opacity = '1';
                slice.style.transform = 'scale(1)';
            }, index * 100);
        });
    }

    destroy() {
        if (this.tooltip) {
            document.body.removeChild(this.tooltip);
        }
        super.destroy();
    }
}

// INTERACTIVE ELEMENTS

/**
 * Count Up Animation Component
 */
class CountUp extends BaseComponent {
    get defaultOptions() {
        return {
            startValue: 0,
            endValue: 100,
            duration: 2000,
            decimals: 0,
            prefix: '',
            suffix: '',
            separator: ',',
            useEasing: true
        };
    }

    init() {
        this.animate();
    }

    animate() {
        const start = Date.now();
        const { startValue, endValue, duration, decimals, prefix, suffix, separator, useEasing } = this.options;
        
        const step = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = useEasing ? Utils.easeInOutCubic(progress) : progress;
            
            const currentValue = startValue + (endValue - startValue) * easedProgress;
            const formattedValue = this.formatNumber(currentValue, decimals, separator);
            
            this.element.textContent = `${prefix}${formattedValue}${suffix}`;
            
            if (progress < 1 && !this.isDestroyed) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    }

    formatNumber(num, decimals, separator) {
        const fixedNum = num.toFixed(decimals);
        return fixedNum.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }
}

/**
 * TypeWriter Animation Component
 */
class TypeWriter extends BaseComponent {
    get defaultOptions() {
        return {
            text: '',
            speed: 50,
            deleteSpeed: 30,
            delay: 1000,
            loop: false,
            cursor: '|',
            showCursor: true
        };
    }

    init() {
        this.originalText = this.element.textContent || this.options.text;
        this.element.textContent = '';
        this.isTyping = false;
        this.currentIndex = 0;
        this.startTyping();
    }

    startTyping() {
        if (this.isTyping) return;
        this.isTyping = true;
        this.typeText();
    }

    typeText() {
        if (this.currentIndex < this.originalText.length && !this.isDestroyed) {
            this.element.textContent = this.originalText.slice(0, this.currentIndex + 1);
            if (this.options.showCursor) {
                this.element.textContent += this.options.cursor;
            }
            this.currentIndex++;
            setTimeout(() => this.typeText(), this.options.speed);
        } else if (this.options.loop) {
            setTimeout(() => this.deleteText(), this.options.delay);
        } else {
            this.isTyping = false;
            if (this.options.showCursor) {
                this.blinkCursor();
            }
        }
    }

    deleteText() {
        if (this.currentIndex > 0 && !this.isDestroyed) {
            this.currentIndex--;
            this.element.textContent = this.originalText.slice(0, this.currentIndex) + this.options.cursor;
            setTimeout(() => this.deleteText(), this.options.deleteSpeed);
        } else {
            setTimeout(() => this.typeText(), this.options.delay);
        }
    }

    blinkCursor() {
        let visible = true;
        const blink = () => {
            if (this.isDestroyed) return;
            const text = this.element.textContent.replace(this.options.cursor, '');
            this.element.textContent = text + (visible ? this.options.cursor : '');
            visible = !visible;
            setTimeout(blink, 500);
        };
        blink();
    }
}

/**
 * Parallax Scroll Component
 */
class ParallaxScroll extends BaseComponent {
    get defaultOptions() {
        return {
            speed: 0.5,
            direction: 'vertical',
            smoothing: 0.1
        };
    }

    init() {
        this.position = 0;
        this.targetPosition = 0;
        this.setupScrollListener();
        this.update();
    }

    setupScrollListener() {
        this.onScroll = Utils.throttle(() => {
            const scrollY = window.pageYOffset;
            const elementTop = this.element.getBoundingClientRect().top + scrollY;
            const elementHeight = this.element.offsetHeight;
            const windowHeight = window.innerHeight;
            
            if (scrollY + windowHeight > elementTop && scrollY < elementTop + elementHeight) {
                this.targetPosition = (scrollY - elementTop) * this.options.speed;
            }
        }, 16);
        
        window.addEventListener('scroll', this.onScroll);
    }

    update() {
        if (this.isDestroyed) return;
        
        this.position = Utils.lerp(this.position, this.targetPosition, this.options.smoothing);
        
        if (this.options.direction === 'vertical') {
            this.element.style.transform = `translateY(${this.position}px)`;
        } else {
            this.element.style.transform = `translateX(${this.position}px)`;
        }
        
        requestAnimationFrame(() => this.update());
    }

    destroy() {
        window.removeEventListener('scroll', this.onScroll);
        super.destroy();
    }
}

/**
 * Infinite Scroll Component
 */
class InfiniteScroll extends BaseComponent {
    get defaultOptions() {
        return {
            threshold: 200,
            loadMore: null,
            loading: false,
            hasMore: true
        };
    }

    init() {
        this.setupScrollListener();
    }

    setupScrollListener() {
        this.onScroll = Utils.throttle(() => {
            if (this.options.loading || !this.options.hasMore) return;
            
            const scrollTop = window.pageYOffset;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            if (scrollTop + windowHeight >= documentHeight - this.options.threshold) {
                this.loadMore();
            }
        }, 100);
        
        window.addEventListener('scroll', this.onScroll);
    }

    async loadMore() {
        if (this.options.loadMore && typeof this.options.loadMore === 'function') {
            this.options.loading = true;
            try {
                const hasMore = await this.options.loadMore();
                this.options.hasMore = hasMore !== false;
            } catch (error) {
                console.error('Error loading more content:', error);
            } finally {
                this.options.loading = false;
            }
        }
    }

    destroy() {
        window.removeEventListener('scroll', this.onScroll);
        super.destroy();
    }
}

/**
 * Lazy Load Images Component
 */
class LazyLoad extends BaseComponent {
    get defaultOptions() {
        return {
            threshold: 100,
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGNUY1RjUiLz48L3N2Zz4=',
            fadeIn: true,
            fadeInDuration: 300
        };
    }

    init() {
        this.images = this.element.querySelectorAll('img[data-src]');
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, {
            rootMargin: `${this.options.threshold}px`
        });
        
        this.images.forEach(img => {
            if (!img.src || img.src === this.options.placeholder) {
                img.src = this.options.placeholder;
            }
            this.observer.observe(img);
        });
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;
        
        if (this.options.fadeIn) {
            img.style.opacity = '0';
            img.style.transition = `opacity ${this.options.fadeInDuration}ms ease`;
        }
        
        const newImg = new Image();
        newImg.onload = () => {
            img.src = src;
            if (this.options.fadeIn) {
                img.style.opacity = '1';
            }
            img.removeAttribute('data-src');
            this.observer.unobserve(img);
        };
        newImg.src = src;
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        super.destroy();
    }
}

// ADVANCED UI COMPONENTS

/**
 * Toast Notification System
 */
class ToastNotification {
    constructor(options = {}) {
        this.options = {
            position: 'top-right',
            duration: 3000,
            showClose: true,
            pauseOnHover: true,
            ...options
        };
        this.toasts = [];
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = `toast-container toast-${this.options.position}`;
        this.container.style.cssText = `
            position: fixed;
            z-index: 10000;
            pointer-events: none;
            ${this.getPositionStyles()}
        `;
        document.body.appendChild(this.container);
    }

    getPositionStyles() {
        const positions = {
            'top-right': 'top: 20px; right: 20px;',
            'top-left': 'top: 20px; left: 20px;',
            'bottom-right': 'bottom: 20px; right: 20px;',
            'bottom-left': 'bottom: 20px; left: 20px;',
            'top-center': 'top: 20px; left: 50%; transform: translateX(-50%);',
            'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%);'
        };
        return positions[this.options.position] || positions['top-right'];
    }

    show(message, type = 'info', options = {}) {
        const toastOptions = { ...this.options, ...options };
        const toast = this.createToast(message, type, toastOptions);
        this.container.appendChild(toast);
        this.toasts.push(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        
        // Auto remove
        if (toastOptions.duration > 0) {
            setTimeout(() => this.remove(toast), toastOptions.duration);
        }
        
        return toast;
    }

    createToast(message, type, options) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 12px 16px;
            background: ${this.getTypeColor(type)};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            pointer-events: auto;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        const messageEl = document.createElement('span');
        messageEl.textContent = message;
        messageEl.style.flex = '1';
        toast.appendChild(messageEl);
        
        if (options.showClose) {
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                margin-left: 8px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            closeBtn.onclick = () => this.remove(toast);
            toast.appendChild(closeBtn);
        }
        
        if (options.pauseOnHover) {
            let timeout;
            toast.addEventListener('mouseenter', () => clearTimeout(timeout));
            toast.addEventListener('mouseleave', () => {
                if (options.duration > 0) {
                    timeout = setTimeout(() => this.remove(toast), options.duration);
                }
            });
        }
        
        return toast;
    }

    getTypeColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };
        return colors[type] || colors.info;
    }

    remove(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    success(message, options) {
        return this.show(message, 'success', options);
    }

    error(message, options) {
        return this.show(message, 'error', options);
    }

    warning(message, options) {
        return this.show(message, 'warning', options);
    }

    info(message, options) {
        return this.show(message, 'info', options);
    }
}

/**
 * Modal Manager Component
 */
class ModalManager {
    constructor() {
        this.modals = new Map();
        this.activeModals = [];
        this.setupKeyListener();
    }

    create(id, content, options = {}) {
        const modalOptions = {
            closeOnEscape: true,
            closeOnBackdrop: true,
            showClose: true,
            animate: true,
            ...options
        };
        
        const modal = this.createModal(id, content, modalOptions);
        this.modals.set(id, modal);
        return modal;
    }

    createModal(id, content, options) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: auto;
            transform: scale(0.8);
            transition: transform 0.3s ease;
            position: relative;
        `;
        
        if (options.showClose) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                z-index: 1;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            closeBtn.onclick = () => this.close(id);
            modal.appendChild(closeBtn);
        }
        
        const contentEl = document.createElement('div');
        contentEl.className = 'modal-content';
        contentEl.style.padding = '20px';
        
        if (typeof content === 'string') {
            contentEl.innerHTML = content;
        } else {
            contentEl.appendChild(content);
        }
        
        modal.appendChild(contentEl);
        overlay.appendChild(modal);
        
        if (options.closeOnBackdrop) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(id);
                }
            });
        }
        
        return {
            id,
            overlay,
            modal,
            options,
            isOpen: false
        };
    }

    open(id) {
        const modalData = this.modals.get(id);
        if (!modalData || modalData.isOpen) return;
        
        document.body.appendChild(modalData.overlay);
        modalData.isOpen = true;
        this.activeModals.push(modalData);
        
        requestAnimationFrame(() => {
            modalData.overlay.style.opacity = '1';
            modalData.overlay.style.visibility = 'visible';
            modalData.modal.style.transform = 'scale(1)';
        });
        
        document.body.style.overflow = 'hidden';
    }

    close(id) {
        const modalData = this.modals.get(id);
        if (!modalData || !modalData.isOpen) return;
        
        modalData.overlay.style.opacity = '0';
        modalData.overlay.style.visibility = 'hidden';
        modalData.modal.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            if (modalData.overlay.parentNode) {
                modalData.overlay.parentNode.removeChild(modalData.overlay);
            }
            modalData.isOpen = false;
            this.activeModals = this.activeModals.filter(m => m.id !== id);
            
            if (this.activeModals.length === 0) {
                document.body.style.overflow = '';
            }
        }, 300);
    }

    setupKeyListener() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.length > 0) {
                const topModal = this.activeModals[this.activeModals.length - 1];
                if (topModal.options.closeOnEscape) {
                    this.close(topModal.id);
                }
            }
        });
    }
}

/**
 * Tooltip System Component
 */
class TooltipSystem {
    constructor() {
        this.tooltip = null;
        this.setupTooltip();
        this.bindEvents();
    }

    setupTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        this.tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            white-space: nowrap;
        `;
        document.body.appendChild(this.tooltip);
    }

    bindEvents() {
        document.addEventListener('mouseenter', (e) => {
            if (e.target.hasAttribute('data-tooltip')) {
                this.show(e.target, e.target.getAttribute('data-tooltip'));
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target.hasAttribute('data-tooltip')) {
                this.hide();
            }
        }, true);

        document.addEventListener('mousemove', (e) => {
            if (this.tooltip.style.opacity === '1') {
                this.updatePosition(e);
            }
        });
    }

    show(element, text) {
        this.tooltip.textContent = text;
        this.tooltip.style.opacity = '1';
    }

    hide() {
        this.tooltip.style.opacity = '0';
    }

    updatePosition(event) {
        const x = event.pageX + 10;
        const y = event.pageY - 10;
        
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
        
        // Keep tooltip in viewport
        const rect = this.tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.tooltip.style.left = (event.pageX - rect.width - 10) + 'px';
        }
        if (rect.top < 0) {
            this.tooltip.style.top = (event.pageY + 10) + 'px';
        }
    }
}

/**
 * Dropdown Menu Component
 */
class Dropdown extends BaseComponent {
    get defaultOptions() {
        return {
            trigger: 'click',
            position: 'bottom-left',
            closeOnClick: true,
            closeOnEscape: true
        };
    }

    init() {
        this.trigger = this.element.querySelector('[data-dropdown-trigger]');
        this.menu = this.element.querySelector('[data-dropdown-menu]');
        this.isOpen = false;
        
        if (!this.trigger || !this.menu) return;
        
        this.setupMenu();
        this.bindEvents();
    }

    setupMenu() {
        this.menu.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            z-index: 1000;
            min-width: 150px;
        `;
        
        this.updatePosition();
    }

    bindEvents() {
        if (this.options.trigger === 'click') {
            this.trigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        } else if (this.options.trigger === 'hover') {
            this.element.addEventListener('mouseenter', () => this.open());
            this.element.addEventListener('mouseleave', () => this.close());
        }

        if (this.options.closeOnClick) {
            this.menu.addEventListener('click', () => this.close());
        }

        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }

        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target) && this.isOpen) {
                this.close();
            }
        });
    }

    updatePosition() {
        const positions = {
            'bottom-left': { top: '100%', left: '0' },
            'bottom-right': { top: '100%', right: '0' },
            'top-left': { bottom: '100%', left: '0' },
            'top-right': { bottom: '100%', right: '0' }
        };
        
        const pos = positions[this.options.position] || positions['bottom-left'];
        Object.assign(this.menu.style, pos);
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.menu.style.opacity = '1';
        this.menu.style.visibility = 'visible';
        this.menu.style.transform = 'translateY(0)';
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.menu.style.opacity = '0';
        this.menu.style.visibility = 'hidden';
        this.menu.style.transform = 'translateY(-10px)';
    }
}

/**
 * Tab System Component
 */
class TabSystem extends BaseComponent {
    get defaultOptions() {
        return {
            activeClass: 'active',
            animation: 'fade',
            duration: 300
        };
    }

    init() {
        this.tabs = this.element.querySelectorAll('[data-tab]');
        this.panels = this.element.querySelectorAll('[data-tab-panel]');
        this.activeTab = null;
        this.activePanel = null;
        
        this.setupTabs();
        this.bindEvents();
        
        // Activate first tab by default
        if (this.tabs.length > 0) {
            this.activateTab(this.tabs[0].dataset.tab);
        }
    }

    setupTabs() {
        this.tabs.forEach(tab => {
            tab.style.cursor = 'pointer';
            tab.style.transition = 'all 0.3s ease';
        });

        this.panels.forEach(panel => {
            panel.style.display = 'none';
            panel.style.opacity = '0';
            panel.style.transition = `opacity ${this.options.duration}ms ease`;
        });
    }

    bindEvents() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.activateTab(tab.dataset.tab);
            });
        });
    }

    activateTab(tabId) {
        // Deactivate current tab/panel
        if (this.activeTab) {
            this.activeTab.classList.remove(this.options.activeClass);
        }
        if (this.activePanel) {
            this.hidePanel(this.activePanel);
        }

        // Activate new tab/panel
        this.activeTab = this.element.querySelector(`[data-tab="${tabId}"]`);
        this.activePanel = this.element.querySelector(`[data-tab-panel="${tabId}"]`);

        if (this.activeTab) {
            this.activeTab.classList.add(this.options.activeClass);
        }
        if (this.activePanel) {
            this.showPanel(this.activePanel);
        }
    }

    showPanel(panel) {
        panel.style.display = 'block';
        requestAnimationFrame(() => {
            panel.style.opacity = '1';
        });
    }

    hidePanel(panel) {
        panel.style.opacity = '0';
        setTimeout(() => {
            panel.style.display = 'none';
        }, this.options.duration);
    }
}

/**
 * Accordion Component
 */
class Accordion extends BaseComponent {
    get defaultOptions() {
        return {
            allowMultiple: false,
            duration: 300,
            activeClass: 'active'
        };
    }

    init() {
        this.items = this.element.querySelectorAll('[data-accordion-item]');
        this.setupItems();
        this.bindEvents();
    }

    setupItems() {
        this.items.forEach(item => {
            const header = item.querySelector('[data-accordion-header]');
            const content = item.querySelector('[data-accordion-content]');
            
            if (header && content) {
                header.style.cursor = 'pointer';
                content.style.overflow = 'hidden';
                content.style.transition = `max-height ${this.options.duration}ms ease`;
                content.style.maxHeight = '0';
            }
        });
    }

    bindEvents() {
        this.items.forEach(item => {
            const header = item.querySelector('[data-accordion-header]');
            if (header) {
                header.addEventListener('click', () => {
                    this.toggleItem(item);
                });
            }
        });
    }

    toggleItem(item) {
        const isActive = item.classList.contains(this.options.activeClass);
        
        if (!this.options.allowMultiple) {
            // Close all other items
            this.items.forEach(otherItem => {
                if (otherItem !== item) {
                    this.closeItem(otherItem);
                }
            });
        }

        if (isActive) {
            this.closeItem(item);
        } else {
            this.openItem(item);
        }
    }

    openItem(item) {
        const content = item.querySelector('[data-accordion-content]');
        if (content) {
            item.classList.add(this.options.activeClass);
            content.style.maxHeight = content.scrollHeight + 'px';
        }
    }

    closeItem(item) {
        const content = item.querySelector('[data-accordion-content]');
        if (content) {
            item.classList.remove(this.options.activeClass);
            content.style.maxHeight = '0';
        }
    }
}

// VISUAL EFFECTS

/**
 * Particle Animation Component
 */
class ParticleAnimation extends BaseComponent {
    get defaultOptions() {
        return {
            particleCount: 50,
            particleColor: '#ffffff',
            particleSize: 2,
            speed: 0.5,
            interactive: true,
            connectParticles: true,
            connectionDistance: 100
        };
    }

    init() {
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.createCanvas();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        this.element.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    }

    resizeCanvas() {
        const rect = this.element.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    createParticles() {
        for (let i = 0; i < this.options.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.options.speed,
                vy: (Math.random() - 0.5) * this.options.speed,
                size: Math.random() * this.options.particleSize + 1
            });
        }
    }

    bindEvents() {
        if (this.options.interactive) {
            this.element.addEventListener('mousemove', (e) => {
                const rect = this.element.getBoundingClientRect();
                this.mouse.x = e.clientX - rect.left;
                this.mouse.y = e.clientY - rect.top;
            });
        }

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    animate() {
        if (this.isDestroyed) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            // Interactive effect
            if (this.options.interactive) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    particle.x += dx * 0.01;
                    particle.y += dy * 0.01;
                }
            }
            
            // Draw particle
            this.ctx.fillStyle = this.options.particleColor;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        if (this.options.connectParticles) {
            this.drawConnections();
        }
        
        requestAnimationFrame(() => this.animate());
    }

    drawConnections() {
        this.ctx.strokeStyle = this.options.particleColor;
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.options.connectionDistance) {
                    const opacity = 1 - distance / this.options.connectionDistance;
                    this.ctx.globalAlpha = opacity * 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;
                }
            }
        }
    }
}

/**
 * Ripple Effect Component
 */
class RippleEffect extends BaseComponent {
    get defaultOptions() {
        return {
            color: 'rgba(255, 255, 255, 0.5)',
            duration: 600
        };
    }

    init() {
        this.element.style.position = 'relative';
        this.element.style.overflow = 'hidden';
        this.bindEvents();
    }

    bindEvents() {
        this.element.addEventListener('click', (e) => {
            this.createRipple(e);
        });
    }

    createRipple(event) {
        const rect = this.element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${this.options.color};
            border-radius: 50%;
            transform: scale(0);
            opacity: 1;
            pointer-events: none;
            animation: ripple ${this.options.duration}ms linear;
        `;
        
        // Add CSS animation
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.element.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, this.options.duration);
    }
}

// Initialize global instances
const BvesterComponents = {
    // Component classes
    AnimatedProgressRing,
    LiveLineChart,
    InteractivePieChart,
    CountUp,
    TypeWriter,
    ParallaxScroll,
    InfiniteScroll,
    LazyLoad,
    Dropdown,
    TabSystem,
    Accordion,
    ParticleAnimation,
    RippleEffect,
    
    // Global instances
    toast: new ToastNotification(),
    modal: new ModalManager(),
    tooltip: new TooltipSystem(),
    
    // Utility functions
    utils: Utils,
    
    // Auto-initialize function
    init() {
        // Auto-initialize components with data attributes
        document.querySelectorAll('[data-component]').forEach(element => {
            const componentName = element.dataset.component;
            const options = element.dataset.options ? JSON.parse(element.dataset.options) : {};
            
            if (this[componentName]) {
                new this[componentName](element, options);
            }
        });
        
        // Initialize lazy loading for all images with data-src
        if (document.querySelectorAll('img[data-src]').length > 0) {
            new LazyLoad(document.body);
        }
        
        // Initialize ripple effect for elements with data-ripple
        document.querySelectorAll('[data-ripple]').forEach(element => {
            new RippleEffect(element);
        });
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BvesterComponents.init());
} else {
    BvesterComponents.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BvesterComponents;
}

// Make available globally
window.BvesterComponents = BvesterComponents;
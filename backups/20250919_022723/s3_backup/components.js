// Advanced Data Visualization Components for Bvester
// Modern, clean, and professional charts based on investment platform standards

class BvesterCharts {
    constructor() {
        this.colors = {
            primary: ['#0ea5e9', '#0284c7', '#0369a1', '#075985'],
            success: ['#22c55e', '#16a34a', '#15803d', '#14532d'],
            warning: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
            error: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
            neutral: ['#64748b', '#475569', '#334155', '#1e293b']
        };
    }

    // Line Chart for Portfolio Performance
    createLineChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const defaultOptions = {
            width: container.offsetWidth,
            height: 300,
            padding: { top: 20, right: 30, bottom: 40, left: 60 },
            showGrid: true,
            showPoints: true,
            animate: true,
            gradient: true
        };

        const config = { ...defaultOptions, ...options };
        const svg = this.createSVG(container, config.width, config.height);
        
        // Calculate dimensions
        const chartWidth = config.width - config.padding.left - config.padding.right;
        const chartHeight = config.height - config.padding.top - config.padding.bottom;
        
        // Create scales
        const xScale = this.createXScale(data, chartWidth);
        const yScale = this.createYScale(data, chartHeight);
        
        // Add gradient definition
        if (config.gradient) {
            this.addGradient(svg, 'lineGradient', this.colors.primary[0], this.colors.primary[1]);
        }
        
        // Add grid lines
        if (config.showGrid) {
            this.addGrid(svg, xScale, yScale, chartWidth, chartHeight, config.padding);
        }
        
        // Add axes
        this.addAxes(svg, xScale, yScale, chartWidth, chartHeight, config.padding);
        
        // Add line path
        const line = this.createLinePath(data, xScale, yScale);
        const linePath = svg.append('path')
            .attr('transform', `translate(${config.padding.left}, ${config.padding.top})`)
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', config.gradient ? 'url(#lineGradient)' : this.colors.primary[0])
            .attr('stroke-width', 3)
            .attr('stroke-linecap', 'round');
        
        // Add area fill
        if (config.gradient) {
            const area = this.createAreaPath(data, xScale, yScale, chartHeight);
            svg.append('path')
                .attr('transform', `translate(${config.padding.left}, ${config.padding.top})`)
                .attr('d', area)
                .attr('fill', 'url(#areaGradient)')
                .attr('opacity', 0.1);
        }
        
        // Add points
        if (config.showPoints) {
            this.addPoints(svg, data, xScale, yScale, config.padding);
        }
        
        // Animation
        if (config.animate) {
            const totalLength = linePath.node().getTotalLength();
            linePath
                .attr('stroke-dasharray', totalLength + ' ' + totalLength)
                .attr('stroke-dashoffset', totalLength)
                .transition()
                .duration(2000)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0);
        }
        
        return svg;
    }

    // Bar Chart for Investment Distribution
    createBarChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const defaultOptions = {
            width: container.offsetWidth,
            height: 300,
            padding: { top: 20, right: 30, bottom: 60, left: 60 },
            showValues: true,
            animate: true,
            gradient: true
        };

        const config = { ...defaultOptions, ...options };
        const svg = this.createSVG(container, config.width, config.height);
        
        const chartWidth = config.width - config.padding.left - config.padding.right;
        const chartHeight = config.height - config.padding.top - config.padding.bottom;
        
        // Create scales
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.label))
            .range([0, chartWidth])
            .padding(0.2);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .range([chartHeight, 0]);
        
        // Add gradient
        if (config.gradient) {
            this.addGradient(svg, 'barGradient', this.colors.primary[0], this.colors.primary[1]);
        }
        
        // Add bars
        const bars = svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('transform', `translate(${config.padding.left}, ${config.padding.top})`)
            .attr('x', d => xScale(d.label))
            .attr('width', xScale.bandwidth())
            .attr('y', chartHeight)
            .attr('height', 0)
            .attr('fill', config.gradient ? 'url(#barGradient)' : this.colors.primary[0])
            .attr('rx', 4);
        
        // Animation
        if (config.animate) {
            bars.transition()
                .duration(1000)
                .delay((d, i) => i * 100)
                .attr('y', d => yScale(d.value))
                .attr('height', d => chartHeight - yScale(d.value));
        }
        
        // Add value labels
        if (config.showValues) {
            svg.selectAll('.value-label')
                .data(data)
                .enter()
                .append('text')
                .attr('class', 'value-label')
                .attr('transform', `translate(${config.padding.left}, ${config.padding.top})`)
                .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
                .attr('y', d => yScale(d.value) - 8)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('font-weight', '600')
                .attr('fill', this.colors.neutral[0])
                .text(d => this.formatValue(d.value));
        }
        
        // Add axes
        this.addAxes(svg, xScale, yScale, chartWidth, chartHeight, config.padding);
        
        return svg;
    }

    // Donut Chart for Portfolio Allocation
    createDonutChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const defaultOptions = {
            width: Math.min(container.offsetWidth, 300),
            height: Math.min(container.offsetWidth, 300),
            innerRadius: 60,
            outerRadius: 120,
            showLabels: true,
            showLegend: true,
            animate: true
        };

        const config = { ...defaultOptions, ...options };
        const svg = this.createSVG(container, config.width, config.height);
        
        const centerX = config.width / 2;
        const centerY = config.height / 2;
        
        // Create pie layout
        const pie = d3.pie()
            .value(d => d.value)
            .sort(null);
        
        const arc = d3.arc()
            .innerRadius(config.innerRadius)
            .outerRadius(config.outerRadius);
        
        const pieData = pie(data);
        
        // Add donut segments
        const segments = svg.selectAll('.segment')
            .data(pieData)
            .enter()
            .append('g')
            .attr('class', 'segment')
            .attr('transform', `translate(${centerX}, ${centerY})`);
        
        const paths = segments.append('path')
            .attr('fill', (d, i) => this.colors.primary[i % this.colors.primary.length])
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        
        // Animation
        if (config.animate) {
            paths.transition()
                .duration(1000)
                .attrTween('d', function(d) {
                    const interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
                    return function(t) {
                        return arc(interpolate(t));
                    };
                });
        } else {
            paths.attr('d', arc);
        }
        
        // Add center value
        const total = data.reduce((sum, d) => sum + d.value, 0);
        svg.append('text')
            .attr('x', centerX)
            .attr('y', centerY - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '24px')
            .attr('font-weight', '700')
            .attr('fill', this.colors.neutral[3])
            .text(this.formatValue(total));
        
        svg.append('text')
            .attr('x', centerX)
            .attr('y', centerY + 15)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('fill', this.colors.neutral[1])
            .text('Total Value');
        
        // Add labels
        if (config.showLabels) {
            this.addPieLabels(svg, pieData, arc, centerX, centerY);
        }
        
        // Add legend
        if (config.showLegend) {
            this.addLegend(svg, data, config.width, config.height);
        }
        
        return svg;
    }

    // Sparkline for Mini Charts
    createSparkline(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const defaultOptions = {
            width: container.offsetWidth || 150,
            height: 60,
            color: this.colors.primary[0],
            showArea: true,
            showLastPoint: true,
            animate: true
        };

        const config = { ...defaultOptions, ...options };
        const svg = this.createSVG(container, config.width, config.height);
        
        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, data.length - 1])
            .range([0, config.width]);
        
        const yScale = d3.scaleLinear()
            .domain(d3.extent(data))
            .range([config.height, 0]);
        
        // Create line
        const line = d3.line()
            .x((d, i) => xScale(i))
            .y(d => yScale(d))
            .curve(d3.curveCardinal);
        
        // Add area
        if (config.showArea) {
            const area = d3.area()
                .x((d, i) => xScale(i))
                .y0(config.height)
                .y1(d => yScale(d))
                .curve(d3.curveCardinal);
            
            svg.append('path')
                .datum(data)
                .attr('fill', config.color)
                .attr('fill-opacity', 0.1)
                .attr('d', area);
        }
        
        // Add line
        const linePath = svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', config.color)
            .attr('stroke-width', 2)
            .attr('stroke-linecap', 'round')
            .attr('d', line);
        
        // Add last point
        if (config.showLastPoint) {
            svg.append('circle')
                .attr('cx', xScale(data.length - 1))
                .attr('cy', yScale(data[data.length - 1]))
                .attr('r', 3)
                .attr('fill', config.color);
        }
        
        // Animation
        if (config.animate) {
            const totalLength = linePath.node().getTotalLength();
            linePath
                .attr('stroke-dasharray', totalLength + ' ' + totalLength)
                .attr('stroke-dashoffset', totalLength)
                .transition()
                .duration(1500)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0);
        }
        
        return svg;
    }

    // Utility Methods
    createSVG(container, width, height) {
        container.innerHTML = '';
        return d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('overflow', 'visible');
    }

    createXScale(data, width) {
        return d3.scaleLinear()
            .domain([0, data.length - 1])
            .range([0, width]);
    }

    createYScale(data, height) {
        const extent = d3.extent(data, d => d.value || d);
        return d3.scaleLinear()
            .domain(extent)
            .range([height, 0]);
    }

    createLinePath(data, xScale, yScale) {
        return d3.line()
            .x((d, i) => xScale(i))
            .y(d => yScale(d.value || d))
            .curve(d3.curveCardinal)(data);
    }

    createAreaPath(data, xScale, yScale, height) {
        return d3.area()
            .x((d, i) => xScale(i))
            .y0(height)
            .y1(d => yScale(d.value || d))
            .curve(d3.curveCardinal)(data);
    }

    addGradient(svg, id, color1, color2) {
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', id)
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0).attr('y1', 0)
            .attr('x2', 0).attr('y2', '100%');
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', color1);
        
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', color2);
        
        // Add area gradient
        const areaGradient = defs.append('linearGradient')
            .attr('id', 'areaGradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0).attr('y1', 0)
            .attr('x2', 0).attr('y2', '100%');
        
        areaGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', color1)
            .attr('stop-opacity', 0.3);
        
        areaGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', color1)
            .attr('stop-opacity', 0);
    }

    addGrid(svg, xScale, yScale, width, height, padding) {
        const gridGroup = svg.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(${padding.left}, ${padding.top})`);
        
        // Vertical grid lines
        gridGroup.selectAll('.grid-line-vertical')
            .data(xScale.ticks(5))
            .enter()
            .append('line')
            .attr('class', 'grid-line-vertical')
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', '#e2e8f0')
            .attr('stroke-width', 1);
        
        // Horizontal grid lines
        gridGroup.selectAll('.grid-line-horizontal')
            .data(yScale.ticks(5))
            .enter()
            .append('line')
            .attr('class', 'grid-line-horizontal')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .attr('stroke', '#e2e8f0')
            .attr('stroke-width', 1);
    }

    addAxes(svg, xScale, yScale, width, height, padding) {
        // X-axis
        svg.append('g')
            .attr('transform', `translate(${padding.left}, ${padding.top + height})`)
            .call(d3.axisBottom(xScale).tickFormat(d => ''))
            .selectAll('text')
            .style('font-size', '12px')
            .style('fill', '#64748b');
        
        // Y-axis
        svg.append('g')
            .attr('transform', `translate(${padding.left}, ${padding.top})`)
            .call(d3.axisLeft(yScale).tickFormat(d => this.formatValue(d)))
            .selectAll('text')
            .style('font-size', '12px')
            .style('fill', '#64748b');
    }

    addPoints(svg, data, xScale, yScale, padding) {
        svg.selectAll('.point')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'point')
            .attr('transform', `translate(${padding.left}, ${padding.top})`)
            .attr('cx', (d, i) => xScale(i))
            .attr('cy', d => yScale(d.value || d))
            .attr('r', 4)
            .attr('fill', '#fff')
            .attr('stroke', this.colors.primary[0])
            .attr('stroke-width', 2);
    }

    addPieLabels(svg, data, arc, centerX, centerY) {
        svg.selectAll('.label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('transform', d => `translate(${centerX + arc.centroid(d)[0]}, ${centerY + arc.centroid(d)[1]})`)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', '600')
            .attr('fill', '#fff')
            .text(d => d.data.label);
    }

    addLegend(svg, data, width, height) {
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 120}, 20)`);
        
        const legendItems = legend.selectAll('.legend-item')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`);
        
        legendItems.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', (d, i) => this.colors.primary[i % this.colors.primary.length]);
        
        legendItems.append('text')
            .attr('x', 16)
            .attr('y', 9)
            .attr('font-size', '12px')
            .attr('fill', this.colors.neutral[2])
            .text(d => d.label);
    }

    formatValue(value) {
        if (value >= 1000000) {
            return '$' + (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return '$' + (value / 1000).toFixed(1) + 'K';
        } else {
            return '$' + value.toFixed(0);
        }
    }
}

// Initialize charts when DOM is loaded
window.BvesterCharts = BvesterCharts;

// Sample data generators for demo purposes
window.generateSampleData = {
    portfolioPerformance: () => {
        const data = [];
        let value = 10000;
        for (let i = 0; i < 12; i++) {
            value += (Math.random() - 0.4) * 1000;
            data.push({ value: Math.max(value, 5000) });
        }
        return data;
    },
    
    investmentDistribution: () => [
        { label: 'Tech', value: 25000 },
        { label: 'Agriculture', value: 18000 },
        { label: 'Manufacturing', value: 15000 },
        { label: 'Services', value: 12000 },
        { label: 'Retail', value: 8000 }
    ],
    
    portfolioAllocation: () => [
        { label: 'Equity', value: 45 },
        { label: 'Loans', value: 30 },
        { label: 'Revenue Share', value: 20 },
        { label: 'Cash', value: 5 }
    ],
    
    sparklineData: () => {
        const data = [];
        for (let i = 0; i < 20; i++) {
            data.push(Math.random() * 100 + 50);
        }
        return data;
    }
};
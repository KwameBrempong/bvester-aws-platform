/**
 * Data Visualization Service for Bvester Platform
 * Chart generation, dashboard widgets, and interactive visualizations
 * Week 12 Implementation - Advanced Analytics System
 */

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const D3Node = require('d3-node');
const { createCanvas } = require('canvas');
const { v4: uuidv4 } = require('uuid');

class DataVisualizationService {
    constructor() {
        // Chart.js configuration
        this.chartJSRenderer = new ChartJSNodeCanvas({
            width: 800,
            height: 600,
            backgroundColour: '#ffffff'
        });

        // D3.js configuration
        this.d3Options = {
            selector: '#chart',
            container: '<div id="container"><div id="chart"></div></div>'
        };

        // Color palettes for African market themes
        this.colorPalettes = {
            african_sunset: ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#118AB2'],
            savanna: ['#8B4513', '#D2691E', '#F4A460', '#DEB887', '#8FBC8F'],
            ocean: ['#003f7f', '#0074cc', '#00a8cc', '#00cccc', '#66d9d9'],
            earth: ['#654321', '#8B4513', '#A0522D', '#CD853F', '#D2B48C'],
            vibrant: ['#E63946', '#F77F00', '#FCBF49', '#003566', '#0077B6']
        };

        // Chart templates for common business metrics
        this.chartTemplates = {
            investmentTrends: this.getInvestmentTrendsTemplate(),
            regionDistribution: this.getRegionDistributionTemplate(),
            portfolioPerformance: this.getPortfolioPerformanceTemplate(),
            userEngagement: this.getUserEngagementTemplate(),
            conversionFunnel: this.getConversionFunnelTemplate()
        };

        this.generatedCharts = new Map();
    }

    /**
     * Generate investment trends line chart
     */
    async generateInvestmentTrendsChart(data, options = {}) {
        try {
            const chartConfig = {
                type: 'line',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        label: 'Total Investments',
                        data: data.totalInvestments || [],
                        borderColor: this.colorPalettes.african_sunset[0],
                        backgroundColor: this.colorPalettes.african_sunset[0] + '20',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Investment Amount (USD)',
                        data: data.investmentAmounts || [],
                        borderColor: this.colorPalettes.african_sunset[1],
                        backgroundColor: this.colorPalettes.african_sunset[1] + '20',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: options.title || 'Investment Trends Over Time',
                            font: { size: 18, weight: 'bold' }
                        },
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Number of Investments'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Investment Amount (USD)'
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            };

            const chartBuffer = await this.chartJSRenderer.renderToBuffer(chartConfig);
            
            const chartId = uuidv4();
            const chart = {
                id: chartId,
                type: 'investment_trends',
                buffer: chartBuffer,
                config: chartConfig,
                generatedAt: new Date(),
                options: options
            };

            this.generatedCharts.set(chartId, chart);
            return chart;
        } catch (error) {
            throw new Error(`Failed to generate investment trends chart: ${error.message}`);
        }
    }

    /**
     * Generate African region distribution pie chart
     */
    async generateRegionDistributionChart(data, options = {}) {
        try {
            const chartConfig = {
                type: 'doughnut',
                data: {
                    labels: data.regions || [],
                    datasets: [{
                        label: 'Distribution by Region',
                        data: data.values || [],
                        backgroundColor: this.colorPalettes.savanna,
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: options.title || 'Investment Distribution by African Region',
                            font: { size: 18, weight: 'bold' }
                        },
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            };

            const chartBuffer = await this.chartJSRenderer.renderToBuffer(chartConfig);
            
            const chartId = uuidv4();
            const chart = {
                id: chartId,
                type: 'region_distribution',
                buffer: chartBuffer,
                config: chartConfig,
                generatedAt: new Date(),
                options: options
            };

            this.generatedCharts.set(chartId, chart);
            return chart;
        } catch (error) {
            throw new Error(`Failed to generate region distribution chart: ${error.message}`);
        }
    }

    /**
     * Generate portfolio performance area chart
     */
    async generatePortfolioPerformanceChart(data, options = {}) {
        try {
            const chartConfig = {
                type: 'line',
                data: {
                    labels: data.dates || [],
                    datasets: [{
                        label: 'Portfolio Value',
                        data: data.portfolioValues || [],
                        borderColor: this.colorPalettes.ocean[0],
                        backgroundColor: this.createGradient(this.colorPalettes.ocean[0], this.colorPalettes.ocean[2]),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Benchmark',
                        data: data.benchmarkValues || [],
                        borderColor: this.colorPalettes.ocean[3],
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: options.title || 'Portfolio Performance vs Benchmark',
                            font: { size: 18, weight: 'bold' }
                        },
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Value (USD)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    elements: {
                        point: {
                            radius: 4,
                            hoverRadius: 8
                        }
                    }
                }
            };

            const chartBuffer = await this.chartJSRenderer.renderToBuffer(chartConfig);
            
            const chartId = uuidv4();
            const chart = {
                id: chartId,
                type: 'portfolio_performance',
                buffer: chartBuffer,
                config: chartConfig,
                generatedAt: new Date(),
                options: options
            };

            this.generatedCharts.set(chartId, chart);
            return chart;
        } catch (error) {
            throw new Error(`Failed to generate portfolio performance chart: ${error.message}`);
        }
    }

    /**
     * Generate user engagement heatmap using D3.js
     */
    async generateUserEngagementHeatmap(data, options = {}) {
        try {
            const d3n = new D3Node(this.d3Options);
            const d3 = d3n.d3;

            const margin = { top: 50, right: 100, bottom: 100, left: 100 };
            const width = 800 - margin.left - margin.right;
            const height = 400 - margin.top - margin.bottom;

            const svg = d3n.createSVG(width + margin.left + margin.right, height + margin.top + margin.bottom);
            const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

            // Setup scales
            const xScale = d3.scaleBand()
                .range([0, width])
                .domain(data.hours || [])
                .padding(0.1);

            const yScale = d3.scaleBand()
                .range([0, height])
                .domain(data.days || [])
                .padding(0.1);

            const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
                .domain([0, d3.max(data.values, d => d.value) || 1]);

            // Add rectangles
            g.selectAll('.hour')
                .data(data.values || [])
                .enter().append('rect')
                .attr('class', 'hour')
                .attr('x', d => xScale(d.hour))
                .attr('y', d => yScale(d.day))
                .attr('width', xScale.bandwidth())
                .attr('height', yScale.bandwidth())
                .style('fill', d => colorScale(d.value))
                .style('stroke', '#fff')
                .style('stroke-width', 1);

            // Add text labels
            g.selectAll('.label')
                .data(data.values || [])
                .enter().append('text')
                .attr('class', 'label')
                .attr('x', d => xScale(d.hour) + xScale.bandwidth() / 2)
                .attr('y', d => yScale(d.day) + yScale.bandwidth() / 2)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '12px')
                .style('fill', d => d.value > (d3.max(data.values, v => v.value) || 1) / 2 ? 'white' : 'black')
                .text(d => d.value);

            // Add axes
            g.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(xScale))
                .selectAll('text')
                .style('font-size', '12px');

            g.append('g')
                .attr('class', 'y-axis')
                .call(d3.axisLeft(yScale))
                .selectAll('text')
                .style('font-size', '12px');

            // Add title
            svg.append('text')
                .attr('x', (width + margin.left + margin.right) / 2)
                .attr('y', margin.top / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '18px')
                .style('font-weight', 'bold')
                .text(options.title || 'User Engagement Heatmap');

            const svgString = d3n.svgString();
            
            const chartId = uuidv4();
            const chart = {
                id: chartId,
                type: 'engagement_heatmap',
                svg: svgString,
                generatedAt: new Date(),
                options: options
            };

            this.generatedCharts.set(chartId, chart);
            return chart;
        } catch (error) {
            throw new Error(`Failed to generate engagement heatmap: ${error.message}`);
        }
    }

    /**
     * Generate conversion funnel chart
     */
    async generateConversionFunnelChart(data, options = {}) {
        try {
            const chartConfig = {
                type: 'bar',
                data: {
                    labels: data.steps || [],
                    datasets: [{
                        label: 'Users',
                        data: data.values || [],
                        backgroundColor: this.colorPalettes.vibrant.map((color, index) => 
                            color + Math.floor(255 * (1 - index * 0.15)).toString(16).padStart(2, '0')
                        ),
                        borderColor: this.colorPalettes.vibrant,
                        borderWidth: 2
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: options.title || 'Conversion Funnel Analysis',
                            font: { size: 18, weight: 'bold' }
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.x;
                                    const total = context.dataset.data[0];
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${value} users (${percentage}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Number of Users'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            };

            const chartBuffer = await this.chartJSRenderer.renderToBuffer(chartConfig);
            
            const chartId = uuidv4();
            const chart = {
                id: chartId,
                type: 'conversion_funnel',
                buffer: chartBuffer,
                config: chartConfig,
                generatedAt: new Date(),
                options: options
            };

            this.generatedCharts.set(chartId, chart);
            return chart;
        } catch (error) {
            throw new Error(`Failed to generate conversion funnel chart: ${error.message}`);
        }
    }

    /**
     * Generate interactive dashboard widget
     */
    async generateDashboardWidget(widgetConfig) {
        try {
            const widget = {
                id: uuidv4(),
                type: widgetConfig.type,
                title: widgetConfig.title,
                position: widgetConfig.position || { x: 0, y: 0, w: 4, h: 3 },
                data: widgetConfig.data || {},
                config: widgetConfig.config || {},
                refreshInterval: widgetConfig.refreshInterval || 300000,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            switch (widgetConfig.type) {
                case 'kpi':
                    widget.component = await this.generateKPIWidget(widgetConfig);
                    break;
                case 'chart':
                    widget.component = await this.generateChartWidget(widgetConfig);
                    break;
                case 'table':
                    widget.component = await this.generateTableWidget(widgetConfig);
                    break;
                case 'map':
                    widget.component = await this.generateMapWidget(widgetConfig);
                    break;
                default:
                    throw new Error(`Unknown widget type: ${widgetConfig.type}`);
            }

            return widget;
        } catch (error) {
            throw new Error(`Failed to generate dashboard widget: ${error.message}`);
        }
    }

    /**
     * Generate KPI widget component
     */
    async generateKPIWidget(config) {
        const value = config.data.value || 0;
        const target = config.data.target || null;
        const trend = config.data.trend || 0;
        const format = config.config.format || 'number';

        const formattedValue = this.formatValue(value, format);
        const trendIcon = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';
        const trendColor = trend > 0 ? '#4CAF50' : trend < 0 ? '#F44336' : '#757575';

        return {
            html: `
                <div class="kpi-widget" style="padding: 20px; text-align: center; height: 100%;">
                    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">${config.title}</h3>
                    <div style="font-size: 36px; font-weight: bold; color: #2196F3; margin: 10px 0;">
                        ${formattedValue}
                    </div>
                    ${target ? `<div style="font-size: 12px; color: #666;">Target: ${this.formatValue(target, format)}</div>` : ''}
                    <div style="font-size: 14px; color: ${trendColor}; margin-top: 10px;">
                        ${trendIcon} ${Math.abs(trend)}%
                    </div>
                </div>
            `,
            value: value,
            target: target,
            trend: trend
        };
    }

    /**
     * Generate table widget component
     */
    async generateTableWidget(config) {
        const data = config.data.rows || [];
        const columns = config.data.columns || [];

        let tableHTML = `
            <div class="table-widget" style="padding: 15px; height: 100%; overflow: auto;">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">${config.title}</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #f5f5f5;">
        `;

        columns.forEach(column => {
            tableHTML += `<th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">${column.label}</th>`;
        });

        tableHTML += `
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.forEach((row, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
            tableHTML += `<tr style="background-color: ${bgColor};">`;
            
            columns.forEach(column => {
                const value = row[column.key] || '';
                const formattedValue = column.format ? this.formatValue(value, column.format) : value;
                tableHTML += `<td style="padding: 8px; border-bottom: 1px solid #eee;">${formattedValue}</td>`;
            });
            
            tableHTML += `</tr>`;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        return {
            html: tableHTML,
            data: data,
            columns: columns
        };
    }

    /**
     * Generate African market map widget (simplified)
     */
    async generateMapWidget(config) {
        const data = config.data.regions || {};
        
        // Generate simplified SVG map representation
        const mapSVG = this.generateAfricanMapSVG(data);

        return {
            html: `
                <div class="map-widget" style="padding: 15px; height: 100%;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">${config.title}</h3>
                    <div style="text-align: center;">
                        ${mapSVG}
                    </div>
                </div>
            `,
            data: data
        };
    }

    /**
     * Generate simplified African map SVG
     */
    generateAfricanMapSVG(data) {
        // Simplified representation of African regions
        const regions = {
            north: { x: 50, y: 20, color: this.getRegionColor(data.north || 0) },
            west: { x: 20, y: 60, color: this.getRegionColor(data.west || 0) },
            central: { x: 50, y: 80, color: this.getRegionColor(data.central || 0) },
            east: { x: 80, y: 60, color: this.getRegionColor(data.east || 0) },
            south: { x: 50, y: 120, color: this.getRegionColor(data.south || 0) }
        };

        let svg = '<svg width="200" height="150" viewBox="0 0 120 160">';
        
        Object.entries(regions).forEach(([region, props]) => {
            svg += `<circle cx="${props.x}" cy="${props.y}" r="15" fill="${props.color}" stroke="#333" stroke-width="1" opacity="0.8">
                        <title>${region}: ${data[region] || 0}</title>
                    </circle>`;
        });
        
        svg += '</svg>';
        return svg;
    }

    /**
     * Get color based on region value intensity
     */
    getRegionColor(value) {
        const maxValue = 100; // Assume max value for scaling
        const intensity = Math.min(value / maxValue, 1);
        const red = Math.floor(255 * (1 - intensity));
        const green = Math.floor(255 * intensity);
        return `rgb(${red}, ${green}, 100)`;
    }

    /**
     * Format values based on type
     */
    formatValue(value, format) {
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(value);
            case 'percentage':
                return `${(value * 100).toFixed(1)}%`;
            case 'number':
                return new Intl.NumberFormat('en-US').format(value);
            case 'compact':
                return new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    maximumFractionDigits: 1
                }).format(value);
            default:
                return value.toString();
        }
    }

    /**
     * Create gradient for chart backgrounds
     */
    createGradient(startColor, endColor) {
        return {
            type: 'linear',
            x0: 0,
            y0: 0,
            x1: 0,
            y1: 1,
            colorStops: [
                { offset: 0, color: startColor + '80' },
                { offset: 1, color: endColor + '20' }
            ]
        };
    }

    // Chart template methods
    getInvestmentTrendsTemplate() {
        return {
            type: 'line',
            description: 'Shows investment trends over time',
            requiredFields: ['labels', 'totalInvestments', 'investmentAmounts'],
            defaultOptions: {
                responsive: true,
                maintainAspectRatio: false
            }
        };
    }

    getRegionDistributionTemplate() {
        return {
            type: 'doughnut',
            description: 'Shows distribution across African regions',
            requiredFields: ['regions', 'values'],
            defaultOptions: {
                responsive: true,
                maintainAspectRatio: false
            }
        };
    }

    getPortfolioPerformanceTemplate() {
        return {
            type: 'line',
            description: 'Shows portfolio performance vs benchmark',
            requiredFields: ['dates', 'portfolioValues', 'benchmarkValues'],
            defaultOptions: {
                responsive: true,
                maintainAspectRatio: false
            }
        };
    }

    getUserEngagementTemplate() {
        return {
            type: 'heatmap',
            description: 'Shows user engagement patterns by time',
            requiredFields: ['hours', 'days', 'values'],
            defaultOptions: {
                responsive: true
            }
        };
    }

    getConversionFunnelTemplate() {
        return {
            type: 'bar',
            description: 'Shows conversion funnel analysis',
            requiredFields: ['steps', 'values'],
            defaultOptions: {
                indexAxis: 'y',
                responsive: true
            }
        };
    }

    /**
     * Get chart by ID
     */
    getChart(chartId) {
        return this.generatedCharts.get(chartId);
    }

    /**
     * List all generated charts
     */
    listCharts(filters = {}) {
        const charts = Array.from(this.generatedCharts.values());
        
        if (filters.type) {
            return charts.filter(chart => chart.type === filters.type);
        }
        
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            return charts.filter(chart => chart.generatedAt >= fromDate);
        }
        
        return charts;
    }

    /**
     * Delete chart
     */
    deleteChart(chartId) {
        return this.generatedCharts.delete(chartId);
    }
}

module.exports = DataVisualizationService;
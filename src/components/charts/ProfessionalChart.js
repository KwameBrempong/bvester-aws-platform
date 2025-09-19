/**
 * Professional Chart Component
 * Beautiful data visualization for financial metrics using react-native-svg
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  Animated,
  Pressable
} from 'react-native';
import Svg, { 
  Path, 
  Circle, 
  Line, 
  Rect, 
  LinearGradient, 
  Defs, 
  Stop,
  Text as SvgText
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getEnhancedColor, getSpacing } from '../../styles/enhancedDesignSystem';
import { responsive } from '../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ProfessionalChart = ({
  data = [],
  type = 'line', // line, bar, area, donut
  title,
  subtitle,
  height = 200,
  color = getEnhancedColor('primary.500'),
  gradient = true,
  animated = true,
  showGrid = true,
  showAxes = true,
  showTooltip = true,
  onDataPointPress,
  style,
  currency = 'USD',
  ...props
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const chartWidth = SCREEN_WIDTH - (getSpacing('lg') * 2);
  const chartHeight = height - 60; // Reserve space for labels

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false
      }).start();
    }
  }, [data]);

  // Data processing
  const processedData = data.map((item, index) => ({
    ...item,
    index,
    x: (chartWidth / (data.length - 1)) * index,
    y: chartHeight - ((item.value - Math.min(...data.map(d => d.value))) / 
        (Math.max(...data.map(d => d.value)) - Math.min(...data.map(d => d.value)))) * chartHeight
  }));

  const formatValue = (value) => {
    if (currency === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return `${currency === 'USD' ? '$' : ''}${value.toLocaleString()}`;
  };

  const handleDataPointPress = async (dataPoint) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDataPointPress?.(dataPoint);
  };

  const renderLineChart = () => {
    if (processedData.length < 2) return null;

    // Create smooth path
    let pathData = `M${processedData[0].x},${processedData[0].y}`;
    
    for (let i = 1; i < processedData.length; i++) {
      const prev = processedData[i - 1];
      const curr = processedData[i];
      const next = processedData[i + 1];
      
      // Smooth curve calculation
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpy1 = prev.y;
      const cpx2 = curr.x - (next ? (next.x - prev.x) / 3 : (curr.x - prev.x) / 3);
      const cpy2 = curr.y;
      
      pathData += ` C${cpx1},${cpy1} ${cpx2},${cpy2} ${curr.x},${curr.y}`;
    }

    return (
      <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
        <Defs>
          <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </LinearGradient>
          
          {gradient && (
            <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </LinearGradient>
          )}
        </Defs>

        {/* Grid lines */}
        {showGrid && (
          <>
            {[0, 1, 2, 3, 4].map(i => (
              <Line
                key={`grid-${i}`}
                x1="0"
                y1={i * (chartHeight / 4)}
                x2={chartWidth}
                y2={i * (chartHeight / 4)}
                stroke={getEnhancedColor('gray.200')}
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.5"
              />
            ))}
          </>
        )}

        {/* Area fill */}
        {gradient && (
          <Path
            d={`${pathData} L${processedData[processedData.length - 1].x},${chartHeight} L${processedData[0].x},${chartHeight} Z`}
            fill="url(#areaGradient)"
          />
        )}

        {/* Main line */}
        <Path
          d={pathData}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {processedData.map((point, index) => (
          <Circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="6"
            fill={color}
            stroke="white"
            strokeWidth="2"
            onPress={() => handleDataPointPress(point)}
          />
        ))}
      </Svg>
    );
  };

  const renderBarChart = () => {
    const barWidth = (chartWidth / data.length) * 0.6;
    const barSpacing = (chartWidth / data.length) * 0.4;

    return (
      <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
        <Defs>
          <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {processedData.map((point, index) => (
          <Rect
            key={`bar-${index}`}
            x={point.x - barWidth / 2}
            y={point.y}
            width={barWidth}
            height={chartHeight - point.y}
            fill={gradient ? "url(#barGradient)" : color}
            rx="4"
            onPress={() => handleDataPointPress(point)}
          />
        ))}
      </Svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
      case 'area':
      default:
        return renderLineChart();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        
        <Pressable style={styles.expandButton}>
          <Ionicons 
            name="expand-outline" 
            size={20} 
            color={getEnhancedColor('gray.500')} 
          />
        </Pressable>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {data.length > 0 ? renderChart() : (
          <View style={styles.emptyState}>
            <Ionicons 
              name="bar-chart-outline" 
              size={48} 
              color={getEnhancedColor('gray.300')} 
            />
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        )}
      </View>

      {/* Legend */}
      {data.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>
              {processedData.length} data points
            </Text>
          </View>
          
          <Text style={styles.rangeText}>
            {formatValue(Math.min(...data.map(d => d.value)))} - {formatValue(Math.max(...data.map(d => d.value)))}
          </Text>
        </View>
      )}
    </View>
  );
};

// Simple implementation for financial metrics
export const MetricChart = ({ 
  data, 
  color = getEnhancedColor('primary.500'),
  height = 60,
  style 
}) => {
  if (!data || data.length === 0) return null;

  const chartWidth = 120;
  const chartHeight = height - 10;
  
  const processedData = data.map((value, index) => ({
    x: (chartWidth / (data.length - 1)) * index,
    y: chartHeight - ((value - Math.min(...data)) / (Math.max(...data) - Math.min(...data))) * chartHeight
  }));

  let pathData = `M${processedData[0].x},${processedData[0].y}`;
  for (let i = 1; i < processedData.length; i++) {
    pathData += ` L${processedData[i].x},${processedData[i].y}`;
  }

  return (
    <View style={[styles.miniChart, style]}>
      <Svg width={chartWidth} height={chartHeight}>
        <Path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: getSpacing('lg'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginVertical: getSpacing('sm')
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getSpacing('lg')
  },
  
  titleSection: {
    flex: 1
  },
  
  title: {
    fontSize: responsive.fontSize('lg'),
    fontWeight: '700',
    color: getEnhancedColor('gray.900'),
    letterSpacing: -0.3,
    marginBottom: getSpacing('xs')
  },
  
  subtitle: {
    fontSize: responsive.fontSize('sm'),
    color: getEnhancedColor('gray.600'),
    fontWeight: '500'
  },
  
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: getEnhancedColor('gray.100'),
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing('md')
  },
  
  chart: {
    // Additional chart styling can go here
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    opacity: 0.5
  },
  
  emptyText: {
    fontSize: responsive.fontSize('sm'),
    color: getEnhancedColor('gray.500'),
    marginTop: getSpacing('sm'),
    fontWeight: '500'
  },
  
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: getSpacing('md'),
    borderTopWidth: 1,
    borderTopColor: getEnhancedColor('gray.100')
  },
  
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: getSpacing('sm')
  },
  
  legendText: {
    fontSize: responsive.fontSize('xs'),
    color: getEnhancedColor('gray.600'),
    fontWeight: '500'
  },
  
  rangeText: {
    fontSize: responsive.fontSize('xs'),
    color: getEnhancedColor('gray.500'),
    fontWeight: '600'
  },
  
  miniChart: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default ProfessionalChart;
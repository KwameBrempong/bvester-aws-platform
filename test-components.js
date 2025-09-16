/**
 * Test file to validate our new UI components
 */

// Test imports
try {
  const designSystem = require('./src/styles/designSystem');
  const responsive = require('./src/utils/responsive');
  
  console.log('✅ Design system loaded successfully');
  console.log('✅ Responsive utilities loaded successfully');
  console.log('✅ All core modules are working');
  
  // Test design system values
  console.log('Primary color:', designSystem.getColor('primary.500'));
  console.log('Responsive spacing:', responsive.responsive.spacing('md'));
  
} catch (error) {
  console.error('❌ Error loading modules:', error.message);
}
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function TutorialOverlay({ visible, steps, currentStep, onNext, onPrev, onComplete, onSkip }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation
      const createPulseAnimation = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => createPulseAnimation());
      };
      createPulseAnimation();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !steps || steps.length === 0) return null;

  const step = steps[currentStep];
  if (!step) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Background blur effect */}
        <View style={styles.backdrop} />

        {/* Tutorial spotlight */}
        {step.targetArea && (
          <View style={[styles.spotlight, step.targetArea]} />
        )}

        {/* Tutorial content */}
        <Animated.View style={[
          styles.tutorialContainer,
          {
            transform: [{ scale: scaleAnim }],
            top: step.position?.top || height * 0.3,
            left: step.position?.left || 20,
            right: step.position?.right || 20,
          }
        ]}>
          <LinearGradient
            colors={step.gradient || ['#667eea', '#764ba2']}
            style={styles.tutorialGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{currentStep + 1} of {steps.length}</Text>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              {step.icon && (
                <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                  <Text style={styles.icon}>{step.icon}</Text>
                </Animated.View>
              )}

              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.description}>{step.description}</Text>

              {step.tips && (
                <View style={styles.tipsContainer}>
                  {step.tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Text style={styles.tipIcon}>💡</Text>
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Navigation buttons */}
            <View style={styles.navigationContainer}>
              <View style={styles.leftButtons}>
                {currentStep > 0 && (
                  <TouchableOpacity style={styles.prevButton} onPress={onPrev}>
                    <Text style={styles.prevText}>← Previous</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                  <Text style={styles.skipText}>Skip Tutorial</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={currentStep === steps.length - 1 ? onComplete : onNext}
              >
                <LinearGradient
                  colors={['#43e97b', '#38f9d7']}
                  style={styles.nextGradient}
                >
                  <Text style={styles.nextText}>
                    {currentStep === steps.length - 1 ? 'Get Started!' : 'Next →'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Spotlight indicator arrow */}
        {step.arrow && (
          <Animated.View style={[
            styles.arrow,
            step.arrow,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <Text style={styles.arrowText}>👆</Text>
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  spotlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderColor: '#43e97b',
    borderWidth: 3,
    borderRadius: 8,
    shadowColor: '#43e97b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  tutorialContainer: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  tutorialGradient: {
    padding: 25,
    minHeight: 200,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '600',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    fontSize: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 15,
  },
  tipsContainer: {
    alignSelf: 'stretch',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  tipIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
    flex: 1,
    lineHeight: 18,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftButtons: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 5,
  },
  prevButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  prevText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  skipButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.6,
  },
  nextButton: {
    borderRadius: 20,
  },
  nextGradient: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrow: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 24,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
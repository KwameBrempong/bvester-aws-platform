import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { businessHealthService } from '../../services/BusinessHealthService';
import {
  Card,
  Button,
  getColor,
  getEnhancedColor,
  useTheme,
  getSpacing,
  getFontSize
} from '../../components/ui';

const BusinessHealthAssessmentScreen = ({ navigation, route }) => {
  const { user, userProfile } = useContext(AuthContext);
  const { formatCurrency } = useApp();
  const { colors, isDark } = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Check if user has premium access
  const isPremium = userProfile?.subscription?.plan === 'premium' || false;

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const questionSet = await businessHealthService.getAssessmentQuestions(isPremium);
      setQuestions(questionSet);
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert('Error', 'Could not load assessment questions. Please try again.');
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAssessment();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitAssessment = async () => {
    try {
      setIsLoading(true);

      const result = await businessHealthService.calculateBusinessHealth({
        userId: user.uid,
        answers,
        businessInfo: {
          name: userProfile?.businessName || 'Your Business',
          industry: userProfile?.industry || 'general',
          size: userProfile?.businessSize || 'small'
        },
        isPremium
      });

      setAssessmentResult(result);

      // Save assessment result
      await businessHealthService.saveAssessmentResult(user.uid, result);

    } catch (error) {
      console.error('Error submitting assessment:', error);
      Alert.alert('Error', 'Could not calculate business health. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const shareResults = async () => {
    if (!assessmentResult) return;

    const shareMessage = `🚀 My business just scored ${assessmentResult.overallScore}/100 on the Bvester Business Health Assessment!\n\n` +
                        `💪 ${assessmentResult.scoreLevel}\n` +
                        `📈 Ready to grow with smart investment insights!\n\n` +
                        `Check your business health: https://bvester.com/assessment`;

    try {
      await Share.share({
        message: shareMessage,
        title: 'My Business Health Score'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const upgradetoPremium = () => {
    navigation.navigate('PremiumUpgrade');
  };

  const renderQuestion = () => {
    if (questions.length === 0) return null;

    const question = questions[currentStep];
    const currentAnswer = answers[question.id];

    return (
      <Card style={styles.questionCard}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / questions.length) * 100}%` }
            ]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {questions.length}
          </Text>
        </View>

        <Text style={styles.questionTitle}>{question.title}</Text>
        {question.subtitle && (
          <Text style={styles.questionSubtitle}>{question.subtitle}</Text>
        )}

        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                currentAnswer === option.value && styles.optionButtonSelected
              ]}
              onPress={() => handleAnswer(question.id, option.value)}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  currentAnswer === option.value && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
                {option.description && (
                  <Text style={[
                    styles.optionDescription,
                    currentAnswer === option.value && styles.optionDescriptionSelected
                  ]}>
                    {option.description}
                  </Text>
                )}
              </View>
              {currentAnswer === option.value && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.navigationButtons}>
          <Button
            title="Previous"
            variant="secondary"
            onPress={previousStep}
            disabled={currentStep === 0}
            style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          />

          <Button
            title={currentStep === questions.length - 1 ? "Get Results" : "Next"}
            variant="primary"
            onPress={nextStep}
            disabled={!currentAnswer}
            style={[styles.navButton, !currentAnswer && styles.navButtonDisabled]}
          />
        </View>
      </Card>
    );
  };

  const renderResults = () => {
    if (!assessmentResult) return null;

    const { overallScore, scoreLevel, categories, recommendations } = assessmentResult;

    return (
      <ScrollView style={styles.resultsContainer}>
        {/* Score Display */}
        <LinearGradient
          colors={getScoreGradient(overallScore)}
          style={styles.scoreCard}
        >
          <View style={styles.scoreContent}>
            <Text style={styles.scoreLabel}>Business Health Score</Text>
            <Text style={styles.scoreValue}>{overallScore}/100</Text>
            <Text style={styles.scoreLevel}>{scoreLevel}</Text>

            <View style={styles.socialActions}>
              <TouchableOpacity style={styles.shareButton} onPress={shareResults}>
                <Ionicons name="share-social" size={20} color="white" />
                <Text style={styles.shareText}>Share Score</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Category Breakdown */}
        <Card style={styles.categoriesCard}>
          <Text style={styles.categoriesTitle}>Score Breakdown</Text>
          {categories.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryScore}>{category.score}/100</Text>
              </View>
              <View style={styles.categoryProgressBar}>
                <View style={[
                  styles.categoryProgressFill,
                  {
                    width: `${category.score}%`,
                    backgroundColor: getCategoryColor(category.score)
                  }
                ]} />
              </View>
            </View>
          ))}
        </Card>

        {/* Recommendations */}
        <Card style={styles.recommendationsCard}>
          <Text style={styles.recommendationsTitle}>
            {isPremium ? '🎯 Detailed Recommendations' : '💡 Basic Recommendations'}
          </Text>

          {recommendations.slice(0, isPremium ? recommendations.length : 3).map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationHeader}>
                <Ionicons name={rec.icon} size={20} color={colors.primary[500]} />
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                {rec.priority === 'high' && (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>HIGH</Text>
                  </View>
                )}
              </View>
              <Text style={styles.recommendationDescription}>{rec.description}</Text>
              {isPremium && rec.action && (
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>{rec.action}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {!isPremium && recommendations.length > 3 && (
            <View style={styles.upgradePrompt}>
              <Text style={styles.upgradeText}>
                🔓 Unlock {recommendations.length - 3} more detailed recommendations
              </Text>
              <Button
                title="Upgrade to Premium"
                variant="primary"
                onPress={upgradetoPremium}
                style={styles.upgradeButton}
              />
            </View>
          )}
        </Card>

        {/* Next Steps */}
        <Card style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>🚀 Next Steps</Text>

          <TouchableOpacity
            style={styles.nextStepItem}
            onPress={() => navigation.navigate('ChatRecords')}
          >
            <Ionicons name="chatbubbles" size={24} color={colors.primary[500]} />
            <View style={styles.nextStepContent}>
              <Text style={styles.nextStepTitle}>Start Recording Transactions</Text>
              <Text style={styles.nextStepDescription}>
                Use our chat-based system to track your daily business transactions
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextStepItem}
            onPress={() => navigation.navigate('InvestmentReadiness')}
          >
            <Ionicons name="trending-up" size={24} color={colors.success[500]} />
            <View style={styles.nextStepContent}>
              <Text style={styles.nextStepTitle}>Investment Readiness Program</Text>
              <Text style={styles.nextStepDescription}>
                Join our 30-day program to prepare for investment opportunities
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextStepItem}
            onPress={() => navigation.navigate('BusinessTools')}
          >
            <Ionicons name="construct" size={24} color={colors.warning[500]} />
            <View style={styles.nextStepContent}>
              <Text style={styles.nextStepTitle}>Business Growth Tools</Text>
              <Text style={styles.nextStepDescription}>
                Access tools to improve your business operations and growth
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </Card>

        <View style={styles.bottomActions}>
          <Button
            title="Retake Assessment"
            variant="secondary"
            onPress={() => {
              setCurrentStep(0);
              setAnswers({});
              setAssessmentResult(null);
            }}
            style={styles.retakeButton}
          />

          <Button
            title="Continue to Dashboard"
            variant="primary"
            onPress={() => navigation.navigate('Dashboard')}
            style={styles.continueButton}
          />
        </View>
      </ScrollView>
    );
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return ['#48bb78', '#38a169']; // Green
    if (score >= 60) return ['#ed8936', '#dd6b20']; // Orange
    if (score >= 40) return ['#ecc94b', '#d69e2e']; // Yellow
    return ['#e53e3e', '#c53030']; // Red
  };

  const getCategoryColor = (score) => {
    if (score >= 80) return colors.success[500];
    if (score >= 60) return colors.warning[500];
    if (score >= 40) return colors.yellow[500];
    return colors.error[500];
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Calculating your business health...</Text>
          <Text style={styles.loadingSubtext}>This may take a few moments</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Health Assessment</Text>
        <View style={styles.headerRight}>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}
        </View>
      </View>

      {assessmentResult ? renderResults() : renderQuestion()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: getEnhancedColor('gray.100'),
  },
  backButton: {
    padding: getSpacing('sm'),
  },
  headerTitle: {
    fontSize: getFontSize('lg'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  premiumBadge: {
    backgroundColor: getEnhancedColor('primary.500'),
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: 12,
  },
  premiumText: {
    color: 'white',
    fontSize: getFontSize('xs'),
    fontWeight: '700',
  },
  questionCard: {
    margin: getSpacing('md'),
    padding: getSpacing('lg'),
  },
  progressContainer: {
    marginBottom: getSpacing('lg'),
  },
  progressBar: {
    height: 6,
    backgroundColor: getEnhancedColor('gray.200'),
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: getEnhancedColor('primary.500'),
  },
  progressText: {
    fontSize: getFontSize('sm'),
    color: getEnhancedColor('gray.600'),
    textAlign: 'center',
    marginTop: getSpacing('sm'),
  },
  questionTitle: {
    fontSize: getFontSize('xl'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
    marginBottom: getSpacing('sm'),
  },
  questionSubtitle: {
    fontSize: getFontSize('base'),
    color: getEnhancedColor('gray.600'),
    marginBottom: getSpacing('lg'),
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: getSpacing('lg'),
  },
  optionButton: {
    borderWidth: 2,
    borderColor: getEnhancedColor('gray.200'),
    borderRadius: 12,
    padding: getSpacing('md'),
    marginBottom: getSpacing('sm'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionButtonSelected: {
    borderColor: getEnhancedColor('primary.500'),
    backgroundColor: getEnhancedColor('primary.50'),
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: getFontSize('base'),
    fontWeight: '500',
    color: getEnhancedColor('gray.700'),
  },
  optionTextSelected: {
    color: getEnhancedColor('primary.700'),
  },
  optionDescription: {
    fontSize: getFontSize('sm'),
    color: getEnhancedColor('gray.500'),
    marginTop: getSpacing('xs'),
  },
  optionDescriptionSelected: {
    color: getEnhancedColor('primary.600'),
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    marginHorizontal: getSpacing('sm'),
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  loadingText: {
    fontSize: getFontSize('lg'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
    marginTop: getSpacing('md'),
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: getFontSize('base'),
    color: getEnhancedColor('gray.600'),
    marginTop: getSpacing('sm'),
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
  },
  scoreCard: {
    margin: getSpacing('md'),
    borderRadius: 16,
    padding: getSpacing('lg'),
  },
  scoreContent: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'white',
    fontSize: getFontSize('base'),
    opacity: 0.9,
  },
  scoreValue: {
    color: 'white',
    fontSize: 48,
    fontWeight: '700',
    marginVertical: getSpacing('sm'),
  },
  scoreLevel: {
    color: 'white',
    fontSize: getFontSize('lg'),
    fontWeight: '600',
    marginBottom: getSpacing('md'),
  },
  socialActions: {
    flexDirection: 'row',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    borderRadius: 20,
  },
  shareText: {
    color: 'white',
    marginLeft: getSpacing('sm'),
    fontWeight: '500',
  },
  categoriesCard: {
    margin: getSpacing('md'),
    marginTop: 0,
    padding: getSpacing('md'),
  },
  categoriesTitle: {
    fontSize: getFontSize('lg'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
    marginBottom: getSpacing('md'),
  },
  categoryItem: {
    marginBottom: getSpacing('md'),
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  categoryName: {
    fontSize: getFontSize('base'),
    fontWeight: '500',
    color: getEnhancedColor('gray.700'),
  },
  categoryScore: {
    fontSize: getFontSize('base'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
  },
  categoryProgressBar: {
    height: 8,
    backgroundColor: getEnhancedColor('gray.200'),
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
  },
  recommendationsCard: {
    margin: getSpacing('md'),
    marginTop: 0,
    padding: getSpacing('md'),
  },
  recommendationsTitle: {
    fontSize: getFontSize('lg'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
    marginBottom: getSpacing('md'),
  },
  recommendationItem: {
    marginBottom: getSpacing('md'),
    paddingBottom: getSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: getEnhancedColor('gray.100'),
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  recommendationTitle: {
    fontSize: getFontSize('base'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
    marginLeft: getSpacing('sm'),
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: getEnhancedColor('error.500'),
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: getFontSize('xs'),
    fontWeight: '700',
  },
  recommendationDescription: {
    fontSize: getFontSize('sm'),
    color: getEnhancedColor('gray.600'),
    lineHeight: 18,
    marginLeft: getSpacing('lg'),
  },
  actionButton: {
    marginTop: getSpacing('sm'),
    marginLeft: getSpacing('lg'),
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: getEnhancedColor('primary.500'),
    fontSize: getFontSize('sm'),
    fontWeight: '500',
  },
  upgradePrompt: {
    backgroundColor: getEnhancedColor('primary.50'),
    padding: getSpacing('md'),
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeText: {
    fontSize: getFontSize('base'),
    color: getEnhancedColor('primary.700'),
    textAlign: 'center',
    marginBottom: getSpacing('sm'),
  },
  upgradeButton: {
    minWidth: 150,
  },
  nextStepsCard: {
    margin: getSpacing('md'),
    marginTop: 0,
    padding: getSpacing('md'),
  },
  nextStepsTitle: {
    fontSize: getFontSize('lg'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
    marginBottom: getSpacing('md'),
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing('md'),
    backgroundColor: getEnhancedColor('gray.50'),
    borderRadius: 12,
    marginBottom: getSpacing('sm'),
  },
  nextStepContent: {
    flex: 1,
    marginLeft: getSpacing('md'),
  },
  nextStepTitle: {
    fontSize: getFontSize('base'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
  },
  nextStepDescription: {
    fontSize: getFontSize('sm'),
    color: getEnhancedColor('gray.600'),
    marginTop: getSpacing('xs'),
  },
  bottomActions: {
    flexDirection: 'row',
    padding: getSpacing('md'),
    gap: getSpacing('md'),
  },
  retakeButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
});

export default BusinessHealthAssessmentScreen;
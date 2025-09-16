import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { userService } from '../../services/firebase/FirebaseService';
import { 
  ProfessionalHeader,
  Button,
  useTheme, 
  getEnhancedColor, 
  getSpacing, 
  getFontSize, 
  getFont,
  getBorderRadius 
} from '../../components/ui';

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, userRole, logout } = useContext(AuthContext);
  const { currency, setCurrency, supportedCurrencies } = useApp();
  const { colors, isDark, toggleTheme } = useTheme();

  const handleGrantAdminAccess = async () => {
    try {
      Alert.alert(
        'Grant Admin Access',
        'This will give you admin privileges to access the CMS. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Grant Admin',
            style: 'default',
            onPress: async () => {
              try {
                await userService.updateUserProfile(user.uid, { role: 'admin' });
                Alert.alert(
                  'Success! 🎉',
                  'Admin access granted! You can now access the CMS.',
                  [{ text: 'OK', onPress: () => navigation.navigate('CMSAdmin') }]
                );
              } catch (error) {
                console.error('Error granting admin access:', error);
                Alert.alert('Error', 'Failed to grant admin access. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleGrantAdminAccess:', error);
    }
  };

  const handleAccessCMS = () => {
    if (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') {
      navigation.navigate('CMSAdmin');
    } else {
      Alert.alert(
        'CMS Access',
        'You need admin privileges to access the Content Management System. Would you like to grant yourself admin access?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Admin Access', onPress: handleGrantAdminAccess }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ProfessionalHeader
        title="Profile"
        subtitle="Account settings and preferences"
        showBackButton={false}
        variant="premium"
        rightAction={
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
          >
            <Ionicons 
              name={isDark ? 'sunny' : 'moon'} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary[100] }]}>
            <Text style={styles.profileEmoji}>👤</Text>
          </View>
          <Text style={[styles.profileName, { 
            color: colors.text,
            fontFamily: getFont('bold')
          }]}>{userProfile?.name || user?.displayName || 'User'}</Text>
          <Text style={[styles.profileEmail, {
            color: colors.textSecondary,
            fontFamily: getFont('regular')
          }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary[100] }]}>
            <Text style={[styles.profileRole, {
              color: colors.primary[700],
              fontFamily: getFont('semibold')
            }]}>
              {userRole === 'SME_OWNER' ? 'Business Owner' : 'Investor'}
            </Text>
          </View>
          {userProfile?.businessName && (
            <Text style={[styles.businessName, {
              color: colors.text,
              fontFamily: getFont('medium')
            }]}>{userProfile.businessName}</Text>
          )}
        </View>

        <View style={styles.settingsContainer}>
          <Text style={[styles.sectionTitle, {
            color: colors.text,
            fontFamily: getFont('bold')
          }]}>Settings</Text>
          
          {userRole === 'SME_OWNER' && (
            <TouchableOpacity 
              style={[styles.settingItem, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('BusinessSettings')}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="business-outline" size={20} color={colors.primary[500]} />
                <Text style={[styles.settingLabel, {
                  color: colors.text,
                  fontFamily: getFont('medium')
                }]}>Business Settings</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, {
                  color: colors.textSecondary,
                  fontFamily: getFont('regular')
                }]}>Configure</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="card-outline" size={20} color={colors.primary[500]} />
              <Text style={[styles.settingLabel, {
                color: colors.text,
                fontFamily: getFont('medium')
              }]}>Preferred Currency</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, {
                color: colors.textSecondary,
                fontFamily: getFont('regular')
              }]}>{currency}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary[500]} />
              <Text style={[styles.settingLabel, {
                color: colors.text,
                fontFamily: getFont('medium')
              }]}>Notifications</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, {
                color: colors.textSecondary,
                fontFamily: getFont('regular')
              }]}>Manage</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary[500]} />
              <Text style={[styles.settingLabel, {
                color: colors.text,
                fontFamily: getFont('medium')
              }]}>Security & Privacy</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, {
                color: colors.textSecondary,
                fontFamily: getFont('regular')
              }]}>Configure</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={handleAccessCMS}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="construct-outline" size={20} color={colors.warning[600]} />
              <Text style={[styles.settingLabel, {
                color: colors.text,
                fontFamily: getFont('medium')
              }]}>Content Management System</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, {
                color: userProfile?.role === 'admin' || userProfile?.role === 'super_admin' ? colors.success[600] : colors.warning[600],
                fontFamily: getFont('semibold')
              }]}>
                {userProfile?.role === 'admin' || userProfile?.role === 'super_admin' ? 'Access CMS' : 'Setup Admin'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.currencyContainer}>
          <Text style={[styles.sectionTitle, {
            color: colors.text,
            fontFamily: getFont('bold')
          }]}>Currency Preferences</Text>
          {supportedCurrencies.map(curr => (
            <TouchableOpacity
              key={curr}
              style={[
                styles.currencyItem,
                { backgroundColor: colors.surface },
                currency === curr && { backgroundColor: colors.primary[500] }
              ]}
              onPress={() => setCurrency(curr)}
            >
              <Text style={[
                styles.currencyText,
                { 
                  color: currency === curr ? 'white' : colors.text,
                  fontFamily: currency === curr ? getFont('semibold') : getFont('medium')
                }
              ]}>
                {curr}
              </Text>
              {currency === curr && (
                <Ionicons name="checkmark" size={20} color="white" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.aboutContainer}>
          <Text style={[styles.sectionTitle, {
            color: colors.text,
            fontFamily: getFont('bold')
          }]}>Support & Legal</Text>
          
          <TouchableOpacity style={[styles.aboutItem, { backgroundColor: colors.surface }]}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary[500]} />
            <Text style={[styles.aboutText, {
              color: colors.text,
              fontFamily: getFont('medium')
            }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.aboutItem, { backgroundColor: colors.surface }]}>
            <Ionicons name="shield-outline" size={20} color={colors.primary[500]} />
            <Text style={[styles.aboutText, {
              color: colors.text,
              fontFamily: getFont('medium')
            }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.aboutItem, { backgroundColor: colors.surface }]}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary[500]} />
            <Text style={[styles.aboutText, {
              color: colors.text,
              fontFamily: getFont('medium')
            }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        <Button
          title="Sign Out"
          variant="danger"
          icon="log-out-outline"
          onPress={logout}
          style={styles.logoutButton}
          hapticFeedback={true}
        />
        
        <View style={{ height: getSpacing('2xl') }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  
  themeToggle: {
    padding: getSpacing('sm'),
    borderRadius: getBorderRadius('full')
  },
  
  content: {
    flex: 1,
    paddingHorizontal: getSpacing('lg')
  },
  
  profileCard: {
    borderRadius: getBorderRadius('xl'),
    padding: getSpacing('2xl'),
    alignItems: 'center',
    marginBottom: getSpacing('2xl'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8
  },
  
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: getBorderRadius('full'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing('lg')
  },
  
  profileEmoji: {
    fontSize: 40
  },
  
  profileName: {
    fontSize: getFontSize('2xl'),
    marginBottom: getSpacing('xs'),
    letterSpacing: -0.3
  },
  
  profileEmail: {
    fontSize: getFontSize('base'),
    marginBottom: getSpacing('md')
  },
  
  roleBadge: {
    borderRadius: getBorderRadius('full'),
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    marginBottom: getSpacing('md')
  },
  
  profileRole: {
    fontSize: getFontSize('sm')
  },
  
  businessName: {
    fontSize: getFontSize('lg')
  },
  
  settingsContainer: {
    marginBottom: getSpacing('2xl')
  },
  
  sectionTitle: {
    fontSize: getFontSize('xl'),
    marginBottom: getSpacing('lg'),
    letterSpacing: -0.3
  },
  
  settingItem: {
    borderRadius: getBorderRadius('lg'),
    padding: getSpacing('lg'),
    marginBottom: getSpacing('md'),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3
  },
  
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm')
  },
  
  settingLabel: {
    fontSize: getFontSize('base'),
    marginLeft: getSpacing('md')
  },
  
  settingValue: {
    fontSize: getFontSize('sm')
  },
  
  currencyContainer: {
    marginBottom: getSpacing('2xl')
  },
  
  currencyItem: {
    borderRadius: getBorderRadius('lg'),
    padding: getSpacing('lg'),
    marginBottom: getSpacing('md'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3
  },
  
  currencyText: {
    fontSize: getFontSize('base')
  },
  
  aboutContainer: {
    marginBottom: getSpacing('2xl')
  },
  
  aboutItem: {
    borderRadius: getBorderRadius('lg'),
    padding: getSpacing('lg'),
    marginBottom: getSpacing('md'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3
  },
  
  aboutText: {
    fontSize: getFontSize('base'),
    marginLeft: getSpacing('md'),
    flex: 1
  },
  
  logoutButton: {
    marginBottom: getSpacing('3xl')
  }
});
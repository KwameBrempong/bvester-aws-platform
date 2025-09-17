/**
 * 🎤 VOICE RECORDING SERVICE
 * Speech-to-text for hands-free transaction recording
 * Optimized for Ghanaian accents and business terminology
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

class VoiceRecordingService {
  constructor() {
    this.recording = null;
    this.isRecording = false;
    this.audioPermissionGranted = false;

    // Business-specific vocabulary for better recognition
    this.businessVocabulary = [
      'ghana cedis', 'GHC', 'sold', 'bought', 'customer', 'payment',
      'banku', 'fufu', 'kenkey', 'rice', 'beans', 'plantain',
      'taxi', 'trotro', 'fuel', 'transport', 'shop', 'market'
    ];
  }

  /**
   * Initialize audio permissions
   */
  async initializeAudio() {
    try {
      if (this.audioPermissionGranted) return true;

      console.log('Requesting audio permissions...');

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();

      if (status !== 'granted') {
        console.log('Audio permission denied');
        return false;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.audioPermissionGranted = true;
      console.log('Audio permissions granted and configured');
      return true;

    } catch (error) {
      console.error('Error initializing audio:', error);
      return false;
    }
  }

  /**
   * Start voice recording
   */
  async startRecording() {
    try {
      // Check permissions first
      const hasPermission = await this.initializeAudio();
      if (!hasPermission) {
        throw new Error('Audio permission required for voice recording');
      }

      if (this.isRecording) {
        console.log('Already recording');
        return false;
      }

      // Configure recording options
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      // Start recording
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();

      this.isRecording = true;
      console.log('Voice recording started');
      return true;

    } catch (error) {
      console.error('Error starting recording:', error);
      this.isRecording = false;
      this.recording = null;
      throw error;
    }
  }

  /**
   * Stop voice recording
   */
  async stopRecording() {
    try {
      if (!this.isRecording || !this.recording) {
        console.log('No active recording to stop');
        return null;
      }

      console.log('Stopping voice recording...');

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      this.isRecording = false;
      this.recording = null;

      console.log('Recording stopped, URI:', uri);
      return uri;

    } catch (error) {
      console.error('Error stopping recording:', error);
      this.isRecording = false;
      this.recording = null;
      throw error;
    }
  }

  /**
   * Convert speech to text
   * For MVP, we'll use a simple mock implementation
   * In production, integrate with Google Speech-to-Text or similar
   */
  async speechToText(audioUri) {
    try {
      console.log('Converting speech to text for:', audioUri);

      // For MVP: Return a demo transaction
      // In production, this would send audio to speech recognition service
      return await this.mockSpeechToText(audioUri);

    } catch (error) {
      console.error('Error converting speech to text:', error);
      throw error;
    }
  }

  /**
   * Mock speech-to-text for MVP
   * Returns sample transactions for demonstration
   */
  async mockSpeechToText(audioUri) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const sampleTransactions = [
      "Sold 5 bags of rice for GHC 250",
      "Customer paid GHC 120 for foodstuff",
      "Bought fuel for GHC 50",
      "Transport cost GHC 15",
      "Received payment GHC 300 from customer",
      "Shop rent GHC 200",
      "Bought supplies for GHC 80"
    ];

    // Return a random sample transaction
    const randomTransaction = sampleTransactions[Math.floor(Math.random() * sampleTransactions.length)];

    return {
      success: true,
      text: randomTransaction,
      confidence: 0.85,
      language: 'en-GH'
    };
  }

  /**
   * Production speech-to-text implementation
   * Integrate with Google Cloud Speech-to-Text API
   */
  async realSpeechToText(audioUri) {
    try {
      // Read audio file
      const audioData = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Configure request for Google Cloud Speech-to-Text
      const requestBody = {
        config: {
          encoding: 'M4A',
          sampleRateHertz: 44100,
          languageCode: 'en-GH', // Ghanaian English
          alternativeLanguageCodes: ['en-US', 'en-GB'],
          speechContexts: [{
            phrases: this.businessVocabulary
          }],
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          useEnhanced: true,
          model: 'command_and_search' // Better for short phrases
        },
        audio: {
          content: audioData
        }
      };

      // Make API request (requires API key configuration)
      const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GOOGLE_SPEECH_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.results && result.results.length > 0) {
        const transcript = result.results[0].alternatives[0].transcript;
        const confidence = result.results[0].alternatives[0].confidence;

        return {
          success: true,
          text: transcript,
          confidence: confidence,
          language: 'en-GH'
        };
      } else {
        return {
          success: false,
          error: 'No speech detected'
        };
      }

    } catch (error) {
      console.error('Error with speech recognition API:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if currently recording
   */
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      hasPermission: this.audioPermissionGranted
    };
  }

  /**
   * Cancel current recording
   */
  async cancelRecording() {
    try {
      if (this.isRecording && this.recording) {
        await this.recording.stopAndUnloadAsync();
      }

      this.isRecording = false;
      this.recording = null;
      console.log('Recording cancelled');

    } catch (error) {
      console.error('Error cancelling recording:', error);
      this.isRecording = false;
      this.recording = null;
    }
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats() {
    return {
      android: ['m4a', 'mp3', 'wav'],
      ios: ['m4a', 'wav'],
      web: ['webm', 'mp3']
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      if (this.isRecording) {
        await this.cancelRecording();
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      console.log('Voice recording service cleaned up');

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Test voice recording functionality
   */
  async testVoiceRecording() {
    try {
      console.log('Testing voice recording...');

      // Test permissions
      const hasPermission = await this.initializeAudio();
      if (!hasPermission) {
        return { success: false, error: 'No audio permission' };
      }

      // Test recording start/stop
      await this.startRecording();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Record for 1 second
      const audioUri = await this.stopRecording();

      if (audioUri) {
        // Test speech recognition
        const speechResult = await this.speechToText(audioUri);

        return {
          success: true,
          audioUri,
          speechResult,
          message: 'Voice recording test completed successfully'
        };
      } else {
        return { success: false, error: 'Failed to create recording' };
      }

    } catch (error) {
      console.error('Voice recording test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const voiceRecordingService = new VoiceRecordingService();

export { voiceRecordingService };
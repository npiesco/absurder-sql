/**
 * TOTP Display Component
 *
 * Displays a TOTP code with countdown timer and copy functionality.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { generateTOTP, formatTOTPCode } from '../lib/totpService';
import { autoLockService } from '../lib/autoLockService';

interface TOTPDisplayProps {
  secret: string;
}

export default function TOTPDisplay({ secret }: TOTPDisplayProps) {
  const [code, setCode] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [period, setPeriod] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const updateTOTP = () => {
      try {
        const result = generateTOTP(secret);
        setCode(result.code);
        setRemainingSeconds(result.remainingSeconds);
        setPeriod(result.period);
      } catch (err) {
        console.error('Failed to generate TOTP:', err);
        setCode('------');
      }
    };

    updateTOTP();

    intervalRef.current = setInterval(updateTOTP, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [secret]);

  const handleCopy = async () => {
    try {
      await Clipboard.setString(code);
      autoLockService.startClipboardClearTimer();
      Alert.alert('Copied', 'TOTP code copied to clipboard');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy TOTP code');
    }
  };

  const progress = remainingSeconds / period;

  return (
    <View testID="totp-code-display" style={styles.container}>
      <View style={styles.header}>
        <Icon name="shield-key" size={20} color="#4fc3f7" />
        <Text style={styles.label}>2FA Code</Text>
      </View>

      <View style={styles.codeContainer}>
        <Text testID="totp-code-value" style={styles.code}>
          {formatTOTPCode(code)}
        </Text>

        <TouchableOpacity
          testID="copy-totp-button"
          style={styles.copyButton}
          onPress={handleCopy}
        >
          <Icon name="content-copy" size={20} color="#4fc3f7" />
        </TouchableOpacity>
      </View>

      <View style={styles.timerContainer}>
        <View testID="totp-progress" style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: progress > 0.3 ? '#4fc3f7' : '#ff5252',
              },
            ]}
          />
        </View>
        <Text testID="totp-countdown" style={styles.countdown}>
          {remainingSeconds}s
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#8a8a9a',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  copyButton: {
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#1a1a2e',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  countdown: {
    color: '#8a8a9a',
    fontSize: 14,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'right',
  },
});

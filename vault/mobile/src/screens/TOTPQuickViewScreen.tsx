import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useVaultStore} from '../lib/store';
import {generateTOTP, formatTOTPCode, getRemainingSeconds} from '../lib/totpService';

interface TOTPQuickViewScreenProps {
  onBack: () => void;
  onViewCredential: (id: string) => void;
}

interface TOTPCredential {
  id: string;
  name: string;
  username: string | null;
  totpSecret: string;
}

export default function TOTPQuickViewScreen({
  onBack,
  onViewCredential,
}: TOTPQuickViewScreenProps): React.ReactElement {
  const {credentials, refreshCredentials} = useVaultStore();
  const [totpCodes, setTotpCodes] = useState<Map<string, string>>(new Map());
  const [remainingSeconds, setRemainingSeconds] = useState(getRemainingSeconds());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refresh credentials on mount to ensure we have latest data
  useEffect(() => {
    refreshCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter credentials that have TOTP secrets - memoize to prevent infinite loops
  const totpCredentials: TOTPCredential[] = useMemo(() => 
    credentials
      .filter(c => c.totpSecret)
      .map(c => ({
        id: c.id,
        name: c.name,
        username: c.username,
        totpSecret: c.totpSecret!,
      })),
    [credentials]
  );

  // Generate TOTP codes for all credentials
  const generateAllCodes = useCallback(() => {
    const newCodes = new Map<string, string>();
    totpCredentials.forEach(cred => {
      const result = generateTOTP(cred.totpSecret);
      if (result && result.code) {
        newCodes.set(cred.id, result.code);
      }
    });
    setTotpCodes(newCodes);
  }, [totpCredentials]);

  // Update codes and countdown every second
  useEffect(() => {
    generateAllCodes();

    const interval = setInterval(() => {
      const remaining = getRemainingSeconds();
      setRemainingSeconds(remaining);

      // Regenerate codes when timer resets
      if (remaining === 30 || remaining === 29) {
        generateAllCodes();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [generateAllCodes]);

  const handleCopyCode = useCallback((id: string, code: string) => {
    Clipboard.setString(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const progressWidth = (remainingSeconds / 30) * 100;

  const renderItem = ({item}: {item: TOTPCredential}) => {
    const code = totpCodes.get(item.id) || '------';
    const formattedCode = formatTOTPCode(code);
    const isCopied = copiedId === item.id;

    return (
      <TouchableOpacity
        testID={`totp-item-${item.id}`}
        style={styles.credentialItem}
        onPress={() => onViewCredential(item.id)}>
        <View style={styles.credentialInfo}>
          <Text testID={`totp-name-${item.id}`} style={styles.credentialName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.username && (
            <Text style={styles.credentialUsername} numberOfLines={1}>
              {item.username}
            </Text>
          )}
        </View>

        <View style={styles.codeContainer}>
          <Text
            testID={`totp-code-${item.id}`}
            style={[styles.totpCode, remainingSeconds <= 5 && styles.totpCodeExpiring]}>
            {formattedCode}
          </Text>

          <TouchableOpacity
            testID={`copy-totp-${item.id}`}
            style={styles.copyButton}
            onPress={() => handleCopyCode(item.id, code)}>
            <Icon
              name={isCopied ? 'check' : 'content-copy'}
              size={20}
              color={isCopied ? '#4ade80' : '#007AFF'}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View testID="totp-empty-state" style={styles.emptyContainer}>
      <Icon name="shield-off" size={64} color="#666" />
      <Text style={styles.emptyTitle}>No 2FA Accounts</Text>
      <Text style={styles.emptySubtitle}>
        Add TOTP secrets to your credentials to see them here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="totp-quickview-back-button" onPress={onBack}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Authenticator</Text>
        <View style={{width: 24}} />
      </View>

      {/* Global countdown progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {width: `${progressWidth}%`},
              remainingSeconds <= 5 && styles.progressExpiring,
            ]}
          />
        </View>
        <Text
          testID="global-countdown"
          style={[
            styles.countdownText,
            remainingSeconds <= 5 && styles.countdownExpiring,
          ]}>
          {remainingSeconds}s
        </Text>
      </View>

      <FlatList
        testID="totp-credentials-list"
        data={totpCredentials}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          totpCredentials.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={generateAllCodes}
            tintColor="#e94560"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#16213e',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#2a2a4a',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressExpiring: {
    backgroundColor: '#ff4757',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    minWidth: 30,
    textAlign: 'right',
  },
  countdownExpiring: {
    color: '#ff4757',
  },
  list: {
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
  },
  credentialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
  },
  credentialInfo: {
    flex: 1,
    marginRight: 16,
  },
  credentialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  credentialUsername: {
    fontSize: 14,
    color: '#8a8a9a',
    marginTop: 2,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totpCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },
  totpCodeExpiring: {
    color: '#ff4757',
  },
  copyButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8a8a9a',
    textAlign: 'center',
    marginTop: 8,
  },
});

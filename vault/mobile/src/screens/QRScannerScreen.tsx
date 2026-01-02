import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  Code,
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {parseTOTPUri, buildCredentialName, TOTPConfig} from '../lib/totpUriParser';
import {isValidTOTPSecret} from '../lib/totpService';

interface QRScannerScreenProps {
  onScan: (config: TOTPConfig) => void;
  onClose: () => void;
}

export default function QRScannerScreen({
  onScan,
  onClose,
}: QRScannerScreenProps): React.ReactElement {
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const [isActive, setIsActive] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualSecret, setManualSecret] = useState('');
  const [manualIssuer, setManualIssuer] = useState('');
  const [manualAccount, setManualAccount] = useState('');

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes: Code[]) => {
      if (!isActive) return;

      for (const code of codes) {
        if (code.value) {
          const config = parseTOTPUri(code.value);
          if (config) {
            setIsActive(false);
            onScan(config);
            return;
          }
        }
      }
    },
  });

  const handleManualSubmit = useCallback(() => {
    const cleanSecret = manualSecret.replace(/\s/g, '').toUpperCase();

    if (!isValidTOTPSecret(cleanSecret)) {
      Alert.alert('Invalid Secret', 'Please enter a valid base32 TOTP secret.');
      return;
    }

    const config: TOTPConfig = {
      secret: cleanSecret,
      issuer: manualIssuer.trim() || undefined,
      account: manualAccount.trim() || undefined,
    };

    onScan(config);
  }, [manualSecret, manualIssuer, manualAccount, onScan]);

  const renderManualEntryModal = () => (
    <Modal
      visible={showManualEntry}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowManualEntry(false)}>
      <SafeAreaView style={styles.manualContainer}>
        <View style={styles.manualHeader}>
          <TouchableOpacity
            testID="manual-entry-close-button"
            onPress={() => setShowManualEntry(false)}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.manualTitle}>Enter Secret Manually</Text>
          <View style={{width: 24}} />
        </View>

        <View style={styles.manualForm}>
          <Text style={styles.inputLabel}>Secret Key (required)</Text>
          <TextInput
            testID="manual-secret-input"
            style={styles.input}
            value={manualSecret}
            onChangeText={setManualSecret}
            placeholder="JBSWY3DPEHPK3PXP"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Text style={styles.inputLabel}>Issuer (optional)</Text>
          <TextInput
            testID="manual-issuer-input"
            style={styles.input}
            value={manualIssuer}
            onChangeText={setManualIssuer}
            placeholder="Google"
            autoCorrect={false}
          />

          <Text style={styles.inputLabel}>Account (optional)</Text>
          <TextInput
            testID="manual-account-input"
            style={styles.input}
            value={manualAccount}
            onChangeText={setManualAccount}
            placeholder="user@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <TouchableOpacity
            testID="manual-entry-submit-button"
            style={styles.submitButton}
            onPress={handleManualSubmit}>
            <Text style={styles.submitButtonText}>Add Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // No camera permission
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity testID="qr-scanner-close-button" onPress={onClose}>
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={{width: 24}} />
        </View>
        <View style={styles.permissionContainer}>
          <Icon name="camera-off" size={64} color="#666" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <Text style={styles.permissionSubtext}>
            Allow camera access to scan QR codes
          </Text>
          <TouchableOpacity
            testID="request-permission-button"
            style={styles.permissionButton}
            onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="manual-entry-button"
            style={styles.manualButton}
            onPress={() => setShowManualEntry(true)}>
            <Text style={styles.manualButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
        {renderManualEntryModal()}
      </SafeAreaView>
    );
  }

  // No camera device
  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity testID="qr-scanner-close-button" onPress={onClose}>
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={{width: 24}} />
        </View>
        <View style={styles.permissionContainer}>
          <Icon name="camera-off" size={64} color="#666" />
          <Text style={styles.permissionText}>No camera available</Text>
          <TouchableOpacity
            testID="manual-entry-button"
            style={styles.manualButton}
            onPress={() => setShowManualEntry(true)}>
            <Text style={styles.manualButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
        {renderManualEntryModal()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="qr-scanner-close-button" onPress={onClose}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          testID="qr-camera"
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          codeScanner={codeScanner}
        />
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Point your camera at a TOTP QR code
        </Text>
        <TouchableOpacity
          testID="manual-entry-button"
          style={styles.manualButton}
          onPress={() => setShowManualEntry(true)}>
          <Icon name="keyboard" size={20} color="#007AFF" />
          <Text style={styles.manualButtonText}>Enter Manually</Text>
        </TouchableOpacity>
      </View>

      {renderManualEntryModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  permissionSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 16,
  },
  manualButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 8,
  },
  manualContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  manualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  manualTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  manualForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

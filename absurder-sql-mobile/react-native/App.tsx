/**
 * AbsurderSQL React Native Test App
 * Integration testing for AbsurderSQL mobile library
 */

import React, {useState} from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import AbsurderSQLTest from './AbsurderSQLTest';
import AbsurderSQLBenchmark from './AbsurderSQLBenchmark';
import ComparisonBenchmark from './ComparisonBenchmark';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [screen, setScreen] = useState<'tests' | 'benchmarks' | 'comparison'>('tests');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#1e1e1e' : '#ffffff'}
        />
        <View style={styles.nav}>
          <TouchableOpacity
            style={[styles.navButton, screen === 'tests' && styles.navButtonActive]}
            onPress={() => setScreen('tests')}>
            <Text style={[styles.navText, screen === 'tests' && styles.navTextActive]}>
              Tests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, screen === 'benchmarks' && styles.navButtonActive]}
            onPress={() => setScreen('benchmarks')}>
            <Text style={[styles.navText, screen === 'benchmarks' && styles.navTextActive]}>
              Benchmarks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, screen === 'comparison' && styles.navButtonActive]}
            onPress={() => setScreen('comparison')}>
            <Text style={[styles.navText, screen === 'comparison' && styles.navTextActive]}>
              Comparison
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {screen === 'tests' ? (
            <AbsurderSQLTest />
          ) : screen === 'benchmarks' ? (
            <AbsurderSQLBenchmark />
          ) : (
            <ComparisonBenchmark />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  nav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  navButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  navTextActive: {
    color: '#2196F3',
  },
  content: {
    flex: 1,
  },
});

export default App;

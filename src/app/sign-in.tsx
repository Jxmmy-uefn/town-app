import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { isDemoMode } from '@/lib/supabase';

export default function SignInScreen() {
  const { signIn, startDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSignIn() {
    setBusy(true);
    setError(await signIn(email.trim(), password));
    setBusy(false);
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Welcome to town
          </ThemedText>

          {isDemoMode ? (
            <>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                No server is connected yet, so you can look around in demo mode. Nothing is saved.
              </ThemedText>
              <Button label="Explore in demo mode" onPress={() => startDemo('Visitor')} />
            </>
          ) : (
            <>
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
              {error && <ThemedText style={styles.error}>{error}</ThemedText>}
              <Button label="Sign in" onPress={onSignIn} disabled={busy || !email || !password} />
              <Link href="/sign-up" asChild>
                <Button label="Create an account" variant="secondary" />
              </Link>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  title: { textAlign: 'center', marginBottom: Spacing.four },
  center: { textAlign: 'center' },
  error: { color: '#D93B3B' },
});

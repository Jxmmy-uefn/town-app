import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { isOldEnough, MINIMUM_AGE, parseBirthdate } from '@/lib/age';
import { useAuth } from '@/lib/auth';

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSignUp() {
    if (!USERNAME_PATTERN.test(username)) {
      return setMessage('Usernames are 3 to 20 letters, numbers or underscores.');
    }
    const date = parseBirthdate(birthdate);
    if (!date) return setMessage('Enter your birth date as YYYY-MM-DD.');
    if (!isOldEnough(date)) {
      return setMessage(`Sorry, you need to be at least ${MINIMUM_AGE} to play.`);
    }
    if (password.length < 8) return setMessage('Passwords need at least 8 characters.');

    setBusy(true);
    const error = await signUp(email.trim(), password, username, birthdate.trim());
    setBusy(false);
    setMessage(error ?? 'Check your email to confirm your account, then sign in.');
  }

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextField
          label="Birth date"
          placeholder="YYYY-MM-DD"
          value={birthdate}
          onChangeText={setBirthdate}
          keyboardType="numbers-and-punctuation"
        />
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
          autoComplete="new-password"
        />
        {message && <ThemedText>{message}</ThemedText>}
        <Button label="Create account" onPress={onSignUp} disabled={busy} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
});

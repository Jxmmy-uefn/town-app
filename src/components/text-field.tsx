import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & { label: string };

export function TextField({ label, style, ...rest }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.one },
  input: {
    fontSize: 16,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
});

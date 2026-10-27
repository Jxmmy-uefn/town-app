import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Spacing } from '@/constants/theme';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
};

export function Button({ label, variant = 'primary', disabled, style, ...rest }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      // Flattened so the button also works inside <Link asChild>.
      style={(state) =>
        StyleSheet.flatten([
          styles.base,
          variant === 'primary' ? styles.primary : styles.secondary,
          (disabled || state.pressed) && styles.dim,
          typeof style === 'function' ? style(state) : style,
        ])
      }
      {...rest}>
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  primary: { backgroundColor: '#208AEF' },
  secondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#208AEF' },
  dim: { opacity: 0.6 },
  label: { color: '#ffffff', fontSize: 16, fontWeight: 700 },
  secondaryLabel: { color: '#208AEF' },
});

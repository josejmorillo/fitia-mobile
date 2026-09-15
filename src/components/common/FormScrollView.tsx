import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useKeyboardHeight } from '@/utils/useKeyboardHeight';

interface FormScrollViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * ScrollView para formularios que evita que el teclado tape los campos.
 * En iOS usa KeyboardAvoidingView (padding); en Android añade padding inferior
 * igual a la altura del teclado para poder desplazarse hasta el botón de guardar.
 */
export function FormScrollView({ children, style, contentContainerStyle }: FormScrollViewProps) {
  const keyboardHeight = useKeyboardHeight();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={style}
        contentContainerStyle={[
          contentContainerStyle,
          Platform.OS === 'android' && keyboardHeight > 0
            ? { paddingBottom: keyboardHeight + 40 }
            : null,
        ]}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardHeight } from '@/utils/useKeyboardHeight';

interface FormScrollViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * ScrollView para formularios que evita que el teclado o la barra de navegación
 * de Android tapen los campos/botones inferiores.
 */
export function FormScrollView({ children, style, contentContainerStyle }: FormScrollViewProps) {
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={style}
        contentContainerStyle={[
          contentContainerStyle,
          {
            paddingBottom:
              40 + insets.bottom + (Platform.OS === 'android' ? keyboardHeight : 0),
          },
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

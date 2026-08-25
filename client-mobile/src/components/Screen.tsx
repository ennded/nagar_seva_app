import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

// Shared page chrome so every screen has the same background/padding until the real citizen
// design is dropped in and this gets restyled.
//
// SafeAreaView's edges=['top','bottom'] already shrinks the viewport by the real nav-bar inset,
// but that inset value fluctuates on Android in Expo Go (screenshots taken seconds apart on the
// same screen showed very different bottom clearance), so the last bit of scroll content (e.g.
// RegisterScreen's footnote) sometimes rendered right up against the nav bar. Rather than trust
// the reported inset for extra padding on top of that, use a generous fixed buffer below the
// safe-area boundary so clearance stays consistent regardless of how the OS reports the inset.
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
            {children}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 56, gap: 16 },
});

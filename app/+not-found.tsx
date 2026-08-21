import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Type } from '@/components/Type';
import { colors } from '@/constants/theme';
import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Missing', headerShown: false }} />
      <View style={styles.box}>
        <Type variant="display">Lost the key.</Type>
        <Type style={styles.body}>That screen is not in Lockout.</Type>
        <Link href="/(tabs)" asChild>
          <Button label="Back home" />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: 'center', gap: 16 },
  body: { color: colors.muted, marginBottom: 8 },
});

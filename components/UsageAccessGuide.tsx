import { Button } from '@/components/Button';
import { Type } from '@/components/Type';
import { colors, radius, space } from '@/constants/theme';
import { openAppInfo, openUsageAccessSettings } from 'lockout-guard';
import { StyleSheet, View } from 'react-native';

export function UsageAccessGuide({ granted, embedded }: { granted: boolean; embedded?: boolean }) {
  if (granted) {
    return (
      <View style={embedded ? undefined : styles.box}>
        <Type variant="bodyStrong">Usage access</Type>
        <Type variant="caption" color={colors.sage} style={{ marginTop: 6 }}>
          Ready. Lockout can see which app is in front.
        </Type>
      </View>
    );
  }

  return (
    <View style={embedded ? undefined : styles.box}>
      <Type variant="bodyStrong">Usage access</Type>
      <Type variant="caption" style={{ marginTop: 6 }}>
        This APK is not from the Play Store, so Android locks Usage access. Jumping straight to that
        screen greys it out as “controlled by restricted settings.” Unlock it from App info first,
        then pick Lockout from the list.
      </Type>
      <Type variant="caption" style={styles.step}>
        1. Open App info. Tap the ⋮ menu at the top right → Allow restricted settings. Confirm with
        PIN or fingerprint.
      </Type>
      <Type variant="caption" style={styles.step}>
        2. Then open Usage access. Find Lockout in the list and turn it on. If Allow restricted
        settings was missing, do this step first, come back, then do step 1.
      </Type>
      <Button label="1. Open App info" onPress={openAppInfo} style={{ marginTop: space.md }} />
      <Button label="2. Open Usage access" variant="ghost" onPress={openUsageAccessSettings} style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  step: {
    marginTop: 10,
  },
});

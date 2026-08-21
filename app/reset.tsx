import { colors } from '@/constants/theme';
import { wipeAuthMaterial } from '@/lib/secrets';
import { useStore } from '@/store/StoreProvider';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Reset() {
  const { dispatch } = useStore();
  const router = useRouter();

  useEffect(() => {
    void wipeAuthMaterial().then(() => {
      dispatch({ type: 'RESET' });
      router.replace('/onboarding/welcome');
    });
  }, [dispatch, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.brass} />
    </View>
  );
}

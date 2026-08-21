import { colors } from '@/constants/theme';
import { useStore } from '@/store/StoreProvider';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Reset() {
  const { dispatch } = useStore();
  const router = useRouter();

  useEffect(() => {
    dispatch({ type: 'RESET' });
    const t = setTimeout(() => router.replace('/onboarding/welcome'), 80);
    return () => clearTimeout(t);
  }, [dispatch, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.brass} />
    </View>
  );
}

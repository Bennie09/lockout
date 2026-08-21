import { colors } from '@/constants/theme';
import { Tabs } from 'expo-router';
import { Clock3, Grid2x2, House, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brass,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Outfit_500Medium',
          fontSize: 11,
          marginBottom: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <House size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="apps"
        options={{
          title: 'Apps',
          tabBarIcon: ({ color }) => <Grid2x2 size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="windows"
        options={{
          title: 'Hours',
          tabBarIcon: ({ color }) => <Clock3 size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}

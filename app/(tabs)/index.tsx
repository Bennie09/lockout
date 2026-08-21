import { AppBadge } from '@/components/AppBadge';
import { Card } from '@/components/Card';
import { LockMark } from '@/components/LockMark';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Type } from '@/components/Type';
import { WindowRow } from '@/components/WindowRow';
import { catalogById } from '@/constants/catalog';
import { colors, radius, space } from '@/constants/theme';
import { allStatuses, lockHeadline, todaysSchedule } from '@/lib/lockout';
import { formatClock, formatDuration, prettyDate } from '@/lib/time';
import { useClock } from '@/lib/useClock';
import { useStore } from '@/store/StoreProvider';
import { useRouter } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

export default function Home() {
  const now = useClock(8000);
  const router = useRouter();
  const { state } = useStore();
  const statuses = allStatuses(state, now);
  const lockedCount = statuses.filter((s) => s.locked).length;
  const connected = state.apps.filter((app) => app.connected);
  const schedule = todaysSchedule(state, now);
  const next = statuses
    .map((s) => s.nextEvent)
    .filter((event): event is NonNullable<typeof event> => event != null)
    .sort((a, b) => a.atMinutes - b.atMinutes)[0];
  const inLockout = lockedCount > 0;

  return (
    <Screen scroll extraBottom={40}>
      <View style={styles.top}>
        <View style={styles.brand}>
          <LockMark size={22} />
          <Type variant="title" style={{ fontSize: 20 }}>
            Lockout
          </Type>
        </View>
        <Type variant="caption">{prettyDate(now)}</Type>
      </View>

      <Card hot={inLockout} style={styles.hero}>
        <Type variant="section">{inLockout ? 'Right now' : 'Clear for now'}</Type>
        <Type variant="display" style={{ marginTop: 6, fontSize: 34 }}>
          {inLockout ? `${lockedCount} locked` : 'No lockout'}
        </Type>
        <Type style={{ marginTop: 8 }}>
          {inLockout
            ? `You set this. ${formatClock(now)} sits inside a window you chose.`
            : next
              ? `Next: ${next.label} in ${formatDuration(next.atMinutes)}.`
              : 'Add a window so Lockout has something to do.'}
        </Type>
        <View style={styles.stats}>
          <Stat k={`${state.streakDays}d`} v="Streak" />
          <Stat k={formatDuration(state.minutesSaved)} v="Held back" />
          <Stat k={`${connected.length}`} v="Apps" />
        </View>
      </Card>

      <SectionHeader title="Today’s hours" aside={`${schedule.length} ${schedule.length === 1 ? 'window' : 'windows'}`} />
      <Card padded={false}>
        {schedule.length === 0 ? (
          <Pressable style={styles.empty} onPress={() => router.push({ pathname: '/window-editor', params: { target: 'universal' } })}>
            <Plus size={16} color={colors.brass} />
            <Type variant="label" color={colors.brass}>
              Add your first lockout window
            </Type>
          </Pressable>
        ) : (
          schedule.slice(0, 5).map((row) => (
            <WindowRow
              key={row.id}
              label={row.label}
              start={row.start}
              end={row.end}
              source={row.source}
              enabled
              active={row.active}
            />
          ))
        )}
        <Pressable style={styles.more} onPress={() => router.push('/(tabs)/windows')}>
          <Type variant="caption" color={colors.brass}>
            Manage all hours
          </Type>
          <ChevronRight size={16} color={colors.brass} />
        </Pressable>
      </Card>

      <SectionHeader title="Connected apps" aside="tap to open or lock" />
      <View style={{ gap: 8 }}>
        {connected.map((app) => {
          const meta = catalogById(app.id);
          const status = statuses.find((s) => s.id === app.id);
          const cap = app.dailyLimitMinutes ?? 0;
          const progress = cap ? Math.min(1, app.usedMinutesToday / cap) : 0;
          const locked = Boolean(status?.locked);
          return (
            <Pressable key={app.id} style={styles.appRow} onPress={() => router.push(`/control/${app.id}`)}>
              <ProgressRing
                progress={progress}
                size={52}
                color={locked ? colors.terracotta : colors.brass}
                stroke={5}>
                <AppBadge id={app.id} size={30} />
              </ProgressRing>
              <View style={{ flex: 1 }}>
                <Type variant="bodyStrong">{meta?.name}</Type>
                <Type variant="caption">
                  {app.dailyLimitMinutes == null
                    ? `${formatDuration(app.usedMinutesToday)} today · no cap`
                    : `${formatDuration(app.usedMinutesToday)} of ${formatDuration(app.dailyLimitMinutes)}`}
                </Type>
              </View>
              <View style={[styles.pill, locked && styles.pillLock]}>
                <Type variant="caption" color={locked ? colors.terracotta : colors.sage}>
                  {status ? lockHeadline(status) : 'Open'}
                </Type>
              </View>
            </Pressable>
          );
        })}
      </View>

      {state.activity.length > 0 ? (
        <>
          <SectionHeader title="Recent" />
          <Card>
            {state.activity.slice(0, 4).map((item, index) => (
              <View key={item.id} style={[styles.act, index > 0 && styles.actBorder]}>
                <Type variant="label">{item.title}</Type>
                <Type variant="caption">{item.detail}</Type>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.stat}>
      <Type variant="bodyStrong">{k}</Type>
      <Type variant="caption">{v}</Type>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hero: { padding: space.lg },
  stats: { flexDirection: 'row', gap: 10, marginTop: space.md },
  stat: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 12,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: space.md,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(143, 160, 128, 0.12)',
  },
  pillLock: { backgroundColor: 'rgba(211, 107, 79, 0.12)' },
  act: { paddingVertical: 8 },
  actBorder: { borderTopWidth: 1, borderTopColor: colors.line },
});

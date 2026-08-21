import { Screen } from '@/components/Screen';
import { SecretEditor } from '@/components/SecretEditor';
import { Type } from '@/components/Type';
import type { SecretKind } from '@/lib/secrets';
import { useLocalSearchParams, useRouter } from 'expo-router';

const KINDS: SecretKind[] = ['pin', 'password', 'word'];

export default function SecurityEdit() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind = KINDS.includes(params.kind as SecretKind) ? (params.kind as SecretKind) : null;

  if (!kind) {
    return (
      <Screen>
        <Type>Unknown secret.</Type>
      </Screen>
    );
  }

  return (
    <Screen scroll extraBottom={40}>
      <SecretEditor
        target={kind}
        allowCurrent
        onSaved={() => router.back()}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { StatusBadge } from './StatusBadge';
import type { RequestStatus, RequestType } from '../graphql/types';

interface RequestCardProps {
  title: string;
  type: RequestType;
  status: RequestStatus;
  subtitle?: string;
  createdAt: string;
  onPress: () => void;
}

export function RequestCard({ title, type, status, subtitle, createdAt, onPress }: RequestCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <Text style={styles.type}>{type === 'COMPLAINT' ? 'Complaint' : 'Appointment'}</Text>
        <StatusBadge status={status} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
      <Text style={styles.date}>{new Date(createdAt).toLocaleDateString()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  pressed: { opacity: 0.7 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  type: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted },
  date: { fontSize: 11, color: colors.muted, marginTop: 2 },
});

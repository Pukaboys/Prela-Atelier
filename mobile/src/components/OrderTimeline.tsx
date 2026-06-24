import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors, Typography, Spacing } from '../constants/theme';
import { formatDate, formatOrderStatus } from '../utils/formatting';
import type { OrderStatus, StatusHistoryEntry } from '../types';

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

interface Props {
  currentStatus: OrderStatus;
  history?: StatusHistoryEntry[];
}

export default function OrderTimeline({ currentStatus, history }: Props) {
  if (currentStatus === 'cancelled') {
    return (
      <View style={styles.container}>
        <View style={[styles.step, styles.stepCancelled]}>
          <View style={[styles.dot, styles.dotCancelled]} />
          <View style={styles.stepContent}>
            <Text style={[styles.stepLabel, styles.stepLabelCancelled]}>
              Order Cancelled
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <View style={styles.container}>
      {STATUS_ORDER.map((status, index) => {
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;
        const historyEntry = history?.find((entry) => entry.status === status);

        return (
          <View key={status} style={styles.step}>
            <View style={styles.lineContainer}>
              <View
                style={[
                  styles.dot,
                  isPast && styles.dotPast,
                  isCurrent && styles.dotCurrent,
                  !isPast && !isCurrent && styles.dotFuture,
                ]}
              >
                {isPast ? <Text style={styles.checkmark}>OK</Text> : null}
              </View>
              {index < STATUS_ORDER.length - 1 ? (
                <View
                  style={[
                    styles.line,
                    (isPast || isCurrent) && styles.lineActive,
                  ]}
                />
              ) : null}
            </View>
            <View style={styles.stepContent}>
              <Text
                style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                  !isPast && !isCurrent && styles.stepLabelFuture,
                ]}
              >
                {formatOrderStatus(status)}
              </Text>
              {historyEntry ? (
                <Text style={styles.stepDate}>{formatDate(historyEntry.timestamp)}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.md,
  },
  step: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  stepCancelled: {
    marginBottom: 0,
  },
  lineContainer: {
    alignItems: 'center',
    width: 24,
    marginRight: Spacing.md,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPast: {
    backgroundColor: Colors.primary,
  },
  dotCurrent: {
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.accentLight,
  },
  dotFuture: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dotCancelled: {
    backgroundColor: Colors.error,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
    marginTop: 2,
    backgroundColor: Colors.border,
  },
  lineActive: {
    backgroundColor: Colors.primary,
  },
  stepContent: {
    flex: 1,
    paddingTop: 1,
  },
  stepLabel: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontFamily: Typography.fontSans,
  },
  stepLabelCurrent: {
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: Typography.fontSerif,
  },
  stepLabelFuture: {
    color: Colors.textMuted,
  },
  stepLabelCancelled: {
    color: Colors.error,
    fontWeight: '600',
  },
  stepDate: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

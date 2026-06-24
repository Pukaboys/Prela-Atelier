import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { useUserStore } from '../store/userStore';
import { useOrderStore } from '../store/orderStore';
import { requestLoginCode, verifyLoginCode } from '../services/auth';

import LuxuryButton from '../components/LuxuryButton';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { setUser } = useUserStore();
  const { fetchOrders, clearOrders } = useOrderStore();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await requestLoginCode(normalizedEmail);
      setEmail(normalizedEmail);
      setCodeSent(true);
    } catch (error) {
      Alert.alert(
        'Unable to Send Code',
        error instanceof Error ? error.message : 'Please try again in a moment.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);

    try {
      const session = await verifyLoginCode(normalizedEmail, cleanCode);
      clearOrders();
      setUser(session.email, session.token);
      await fetchOrders(session.email);
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Unable to Sign In',
        error instanceof Error ? error.message : 'Please check the code and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.heading}>Sign In</Text>
        <Text style={styles.sub}>
          {codeSent
            ? 'Enter the confirmation code sent to your email.'
            : 'Enter your email address to receive a sign-in confirmation code.'}
        </Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
            editable={!codeSent}
          />
        </View>

        {codeSent && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CONFIRMATION CODE</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              autoFocus
            />
          </View>
        )}

        <LuxuryButton
          label={codeSent ? 'VERIFY CODE' : 'SEND CODE'}
          onPress={codeSent ? handleVerifyCode : handleRequestCode}
          loading={loading}
          style={{ marginTop: Spacing.sm }}
        />

        {codeSent && (
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={handleRequestCode}
            disabled={loading}
          >
            <Text style={styles.guestText}>Resend code</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.guestText}>Continue as guest</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          We use live email verification to retrieve order information. No account password is required.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    alignItems: 'flex-end',
  },
  close: {
    fontSize: Typography.lg,
    color: Colors.textMuted,
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  eyebrow: {
    fontSize: Typography.xs - 1,
    color: Colors.accent,
    letterSpacing: Typography.trackingWidest * 1.5,
    marginBottom: Spacing.sm,
  },
  heading: {
    fontSize: Typography['3xl'],
    fontFamily: Typography.fontSerif,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  sub: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: Typography.base * 1.6,
    marginBottom: Spacing.xl,
  },
  field: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWidest,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.md,
    color: Colors.textPrimary,
  },
  guestBtn: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  guestText: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    marginTop: Spacing.xl,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.xs * 1.6,
  },
});

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { COLORS } from '../styles/theme';
import { submitInquiry } from '../utils/api';

interface InquiryScreenProps {
  isDark: boolean;
  prefillParams: { product?: string; subject?: string } | null;
  onClearPrefill: () => void;
}

export default function InquiryScreen({ isDark, prefillParams, onClearPrefill }: InquiryScreenProps) {
  const theme = isDark ? COLORS.dark : COLORS.light;
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  // Prefill when redirected from products or other screens
  useEffect(() => {
    if (prefillParams) {
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: prefillParams.subject || '',
        message: prefillParams.product 
          ? `Hello, I'd like to check pricing and delivery availability for the ${prefillParams.product}. Please contact me.`
          : '',
      });
      // Clear parent prefill params after parsing to allow form resets
      onClearPrefill();
    }
  }, [prefillParams]);

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.message) {
      setStatus({
        type: 'error',
        message: 'Please fill out all required fields: Name, Phone, and Message.',
      });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await submitInquiry(form);
      if (response.success) {
        setStatus({
          type: 'success',
          message: 'Inquiry submitted successfully! Our representative will contact you shortly.',
        });
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setStatus({
          type: 'error',
          message: response.message || 'Something went wrong. Please try again.',
        });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: 'Could not connect. Please check your network connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status.type === 'success') {
    return (
      <View style={[styles.successContainer, { backgroundColor: theme.background }]}>
        <View style={styles.successIconCircle}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={[styles.successTitle, { color: theme.text }]}>Thank You!</Text>
        <Text style={[styles.successText, { color: theme.textMuted }]}>
          {status.message}
        </Text>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: COLORS.primary, marginTop: 20 }]}
          onPress={() => setStatus({ type: null, message: '' })}
        >
          <Text style={styles.btnText}>Send Another Inquiry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.formHeading, { color: theme.text }]}>Send Us An Inquiry</Text>
      <Text style={[styles.formSubtitle, { color: theme.textMuted }]}>
        Submit this form to enquire about corporate deals, wholesale water supplies, or custom queries.
      </Text>

      {status.type === 'error' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{status.message}</Text>
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            value={form.name}
            onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
            placeholder="Enter your name"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            value={form.phone}
            onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
            placeholder="e.g. +91 8888378411"
            placeholderTextColor={theme.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            value={form.email}
            onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
            placeholder="e.g. name@domain.com"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Subject / Product</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            value={form.subject}
            onChangeText={(text) => setForm((prev) => ({ ...prev, subject: text }))}
            placeholder="e.g. Bulk order delivery"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.text }]}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            value={form.message}
            onChangeText={(text) => setForm((prev) => ({ ...prev, message: text }))}
            placeholder="Enter details about your order size, frequency, delivery address..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: COLORS.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.btnText}>Submit Inquiry</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  formHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    lineHeight: 16,
  },
  form: {
    gap: 16,
  },
  group: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  textarea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  btn: {
    height: 48,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  /* Success View */
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successCheck: {
    color: COLORS.accent,
    fontSize: 40,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
});

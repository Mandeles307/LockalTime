import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { blockingPermissions } from '../services/blocking-permissions';
import { radius, sizing, spacing, typography } from '../theme/tokens';

// Permission-priming screen (Screen 2), DESIGN_GUIDELINES §9: one screen
// resolving the "why permissions" hesitation, one primary action per state
// (§1). Two states, a discriminated union: 'priming' (copy + Allow, which
// asks the blocking-permissions service to request) and 'denied' (the
// recovery fallback: explanatory copy, open-settings — Linking.openSettings
// is the sole OS touchpoint — and proceed-anyway, because denial must never
// hard-wall the app; the full reasoning is pinned in
// PermissionPrimingScreen.spec.tsx). An 'undetermined' request result leaves
// the priming state intact for a retry — neither completion nor fallback.
//
// Like OnboardingScreen, the screen is storage-agnostic: it only fires
// onHandled (granted result or proceed-anyway); the App gate owns persistence
// and what handling means. All copy flows through t() (placeholder, flagged
// in the locale bundles); styling is token-based, neutral grayscale only
// (palette deferred), and direction-neutral per .claude/skills/i18n/SKILL.md.

interface PermissionPrimingScreenProps {
  readonly onHandled: () => void;
}

type ScreenState = 'priming' | 'denied';

const PermissionPrimingScreen = ({
  onHandled,
}: PermissionPrimingScreenProps): React.JSX.Element => {
  const { t } = useTranslation();
  const [screenState, setScreenState] = useState<ScreenState>('priming');

  const handleAllowPress = (): void => {
    // Never rejects per the service contract, so no catch branch exists to
    // get wrong; the screen only maps the discriminated result.
    blockingPermissions.request().then((result) => {
      if (result.status === 'granted') {
        onHandled();
        return;
      }
      if (result.status === 'denied') {
        setScreenState('denied');
      }
      // 'undetermined': the OS flow ended without an answer — stay in the
      // priming state so Allow remains available for a retry.
    });
  };

  const handleOpenSettingsPress = (): void => {
    // Recovery, not completion: the user returns from settings to retry, so
    // this deliberately does NOT fire onHandled.
    Linking.openSettings();
  };

  return (
    <View style={styles.container} testID="permission-priming-screen">
      {screenState === 'priming' ? (
        <>
          <View style={styles.content}>
            <Text style={styles.title}>{t('permissionPriming.title')}</Text>
            <Text style={styles.body}>{t('permissionPriming.body')}</Text>
          </View>
          <TouchableOpacity
            onPress={handleAllowPress}
            style={styles.primaryCta}
            testID="permission-allow-cta"
          >
            <Text style={styles.primaryCtaLabel}>{t('permissionPriming.allow')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.content}>
            <Text style={styles.title}>{t('permissionPriming.denied.title')}</Text>
            <Text style={styles.body}>{t('permissionPriming.denied.body')}</Text>
          </View>
          <TouchableOpacity
            onPress={handleOpenSettingsPress}
            style={styles.primaryCta}
            testID="permission-open-settings-cta"
          >
            <Text style={styles.primaryCtaLabel}>{t('permissionPriming.denied.openSettings')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onHandled}
            style={styles.proceedAnyway}
            testID="permission-proceed-anyway"
          >
            <Text style={styles.proceedAnywayLabel}>
              {t('permissionPriming.denied.proceedAnyway')}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// Neutral grayscale only — the color palette is intentionally deferred.
const styles = StyleSheet.create({
  body: {
    ...typography.body,
    color: '#444444',
    marginTop: spacing.md,
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    paddingBottom: spacing.xl,
    paddingEnd: spacing.xl,
    paddingStart: spacing.xl,
    paddingTop: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  primaryCta: {
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: radius.md,
    height: sizing.buttonHeight,
    justifyContent: 'center',
  },
  primaryCtaLabel: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
  },
  proceedAnyway: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: sizing.minTouchTarget,
    minWidth: sizing.minTouchTarget,
  },
  proceedAnywayLabel: {
    ...typography.body,
    color: '#444444',
  },
  title: {
    ...typography.heading,
    color: '#222222',
  },
});

export default PermissionPrimingScreen;

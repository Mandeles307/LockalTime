import React, { useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { radius, sizing, spacing, typography } from '../theme/tokens';

// Onboarding carousel (Screen 1), DESIGN_GUIDELINES §9: exactly three pages,
// each resolving one hesitation, with pagination dots, skip on non-final
// pages, and one clear primary action per state (Next / Get Started). The
// screen is completion-agnostic: it only fires onComplete (skip or final
// CTA); the App gate owns what completion means. All copy flows through t()
// (placeholder, flagged in the locale bundles); styling is token-based,
// neutral grayscale only (palette deferred), and direction-neutral per
// skills/i18n.md — RN mirrors the row layouts and the horizontal list under
// RTL natively (on-device RTL paging is a manual QA item, docs/MANUAL_QA.md).

const PAGE_KEYS = ['valueProposition', 'howSessionsWork', 'whyPermissionsMatter'] as const;

type PageKey = (typeof PAGE_KEYS)[number];

interface OnboardingScreenProps {
  readonly onComplete: () => void;
}

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { width: pageWidth } = useWindowDimensions();
  const carouselRef = useRef<FlatList<PageKey>>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const isFinalPage = activePageIndex === PAGE_KEYS.length - 1;

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    if (layoutMeasurement.width <= 0) {
      return;
    }
    // Page off the event's own layout width, never a captured window
    // dimension (rotation-safe, and pinned by spec); abs() because iOS
    // reports negative offsets for horizontal lists under RTL.
    const settledIndex = Math.round(Math.abs(contentOffset.x) / layoutMeasurement.width);
    setActivePageIndex(Math.min(Math.max(settledIndex, 0), PAGE_KEYS.length - 1));
  };

  const handlePrimaryPress = (): void => {
    if (isFinalPage) {
      onComplete();
      return;
    }
    const nextIndex = activePageIndex + 1;
    setActivePageIndex(nextIndex);
    carouselRef.current?.scrollToIndex({ animated: true, index: nextIndex });
  };

  return (
    <View style={styles.container} testID="onboarding-screen">
      {isFinalPage ? (
        // The skip slot keeps its height on the final page so the carousel
        // does not jump when skip disappears.
        <View style={styles.skipSlot} />
      ) : (
        <TouchableOpacity
          onPress={onComplete}
          style={[styles.skipSlot, styles.skip]}
          testID="onboarding-skip"
        >
          <Text style={styles.skipLabel}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={PAGE_KEYS}
        getItemLayout={(_, index) => ({
          index,
          length: pageWidth,
          offset: pageWidth * index,
        })}
        horizontal
        keyExtractor={(pageKey) => pageKey}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        pagingEnabled
        ref={carouselRef}
        renderItem={({ item: pageKey }) => (
          <View style={[styles.page, { width: pageWidth }]}>
            <Text style={styles.pageTitle}>{t(`onboarding.pages.${pageKey}.title`)}</Text>
            <Text style={styles.pageBody}>{t(`onboarding.pages.${pageKey}.body`)}</Text>
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        testID="onboarding-carousel"
      />
      <View style={styles.dotsRow}>
        {PAGE_KEYS.map((pageKey, pageIndex) => (
          <View
            accessibilityState={{ selected: pageIndex === activePageIndex }}
            key={pageKey}
            style={[styles.dot, pageIndex === activePageIndex && styles.dotActive]}
            testID={`onboarding-page-dot-${pageIndex}`}
          />
        ))}
      </View>
      <TouchableOpacity
        onPress={handlePrimaryPress}
        style={styles.primaryCta}
        testID="onboarding-primary-cta"
      >
        <Text style={styles.primaryCtaLabel}>
          {isFinalPage ? t('onboarding.getStarted') : t('onboarding.next')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Neutral grayscale only — the color palette is intentionally deferred.
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  dot: {
    backgroundColor: '#CCCCCC',
    borderRadius: radius.full,
    height: spacing.sm,
    marginEnd: spacing.xs,
    marginStart: spacing.xs,
    width: spacing.sm,
  },
  dotActive: {
    backgroundColor: '#444444',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  page: {
    justifyContent: 'center',
    paddingEnd: spacing.xl,
    paddingStart: spacing.xl,
  },
  pageBody: {
    ...typography.body,
    color: '#444444',
    marginTop: spacing.md,
  },
  pageTitle: {
    ...typography.heading,
    color: '#222222',
  },
  primaryCta: {
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: radius.md,
    height: sizing.buttonHeight,
    justifyContent: 'center',
    marginEnd: spacing.md,
    marginStart: spacing.md,
  },
  primaryCtaLabel: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
  },
  skip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: {
    ...typography.body,
    color: '#444444',
  },
  skipSlot: {
    alignSelf: 'flex-end',
    marginEnd: spacing.md,
    minHeight: sizing.minTouchTarget,
    minWidth: sizing.minTouchTarget,
  },
});

export default OnboardingScreen;

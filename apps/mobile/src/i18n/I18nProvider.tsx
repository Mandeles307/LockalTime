import React from 'react';

import type { i18n as I18nInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';

// Thin wrapper over react-i18next's provider so screens and specs depend on
// the project's i18n surface, not on the library directly — the library can
// be swapped or upgraded behind this one file.
interface I18nProviderProps {
  readonly children: React.ReactNode;
  readonly i18n: I18nInstance;
}

export const I18nProvider = ({ children, i18n }: I18nProviderProps): React.JSX.Element => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

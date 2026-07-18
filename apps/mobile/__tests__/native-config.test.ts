import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Contract tests for the native project config produced by `react-native init`
// (bare workflow). The app identifier com.lockaltime.app is a locked decision
// (CLAUDE.md); with no Mac available, this on-disk check is the only iOS
// verification possible on this machine — compiling/running iOS stays
// "manual QA pending (Mac required)".
const MOBILE_ROOT = join(__dirname, '..');

const readNativeFile = (relativePath: string): string => {
  return readFileSync(join(MOBILE_ROOT, relativePath), 'utf8');
};

const findIosPbxprojPath = (): string => {
  const iosDir = join(MOBILE_ROOT, 'ios');
  const xcodeprojDir = readdirSync(iosDir).find((entry) => entry.endsWith('.xcodeproj'));
  if (xcodeprojDir === undefined) {
    throw new Error(`no .xcodeproj directory found under ${iosDir}`);
  }
  return join('ios', xcodeprojDir, 'project.pbxproj');
};

describe('native project configuration', () => {
  it('sets the Android applicationId to com.lockaltime.app', () => {
    const buildGradle = readNativeFile(join('android', 'app', 'build.gradle'));

    expect(buildGradle).toMatch(/applicationId ["']com\.lockaltime\.app["']/);
  });

  it('sets the iOS bundle identifier to com.lockaltime.app', () => {
    const pbxproj = readNativeFile(findIosPbxprojPath());

    expect(pbxproj).toMatch(/PRODUCT_BUNDLE_IDENTIFIER = "?com\.lockaltime\.app"?;/);
  });
});

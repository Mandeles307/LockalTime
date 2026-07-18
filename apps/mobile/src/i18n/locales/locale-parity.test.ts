import { en } from './en';
import { he } from './he';

// The test that permanently enforces "both languages from day one"
// (CLAUDE.md locked decision): a key added to one locale without the other
// fails here, forever. Stage B additionally types he against typeof en so
// parity is compile-time checked; this runtime walk is the belt-and-braces
// guard that survives any future loosening of that typing and also catches
// blank placeholder values that a type check cannot see.

type TranslationTree = { readonly [key: string]: string | TranslationTree };

const collectLeaves = (tree: TranslationTree, prefix = ''): [string, string][] =>
  Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string') {
      const leaf: [string, string] = [path, value];
      return [leaf];
    }
    return collectLeaves(value, path);
  });

const collectLeafKeyPaths = (tree: TranslationTree): string[] =>
  collectLeaves(tree).map(([path]) => path);

describe('locale key parity (en <-> he)', () => {
  it('has at least one translation key, so the parity checks below cannot pass vacuously', () => {
    expect(collectLeafKeyPaths(en).length).toBeGreaterThan(0);
  });

  it('defines every en key in he', () => {
    const heKeyPaths = new Set(collectLeafKeyPaths(he));
    const missingInHe = collectLeafKeyPaths(en).filter((path) => !heKeyPaths.has(path));

    expect(missingInHe).toEqual([]);
  });

  it('defines every he key in en', () => {
    const enKeyPaths = new Set(collectLeafKeyPaths(en));
    const missingInEn = collectLeafKeyPaths(he).filter((path) => !enKeyPaths.has(path));

    expect(missingInEn).toEqual([]);
  });

  it('has no empty or whitespace-only translation values in either locale', () => {
    const blankLeafPaths = (locale: string, tree: TranslationTree): string[] =>
      collectLeaves(tree)
        .filter(([, value]) => value.trim() === '')
        .map(([path]) => `${locale}:${path}`);

    expect([...blankLeafPaths('en', en), ...blankLeafPaths('he', he)]).toEqual([]);
  });
});

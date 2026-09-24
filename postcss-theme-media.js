/**
 * postcss-theme-media
 *
 * Makes every `@media (prefers-color-scheme: dark|light)` block in the app
 * respect the user's explicit Light / Dark / System choice (ThemeContext sets
 * `data-theme` on <html>; "System" removes it).
 *
 * Component CSS was written against the OS setting only, so picking "Light"
 * on a dark-mode OS still applied ~170 dark-only rules (and vice versa).
 * Rather than hand-editing ~35 files, this rewrites each such block so that:
 *
 *   @media (prefers-color-scheme: dark) { .x { … } }
 *
 * becomes
 *
 *   @media (prefers-color-scheme: dark) { :where(:root:not([data-theme="light"])) .x { … } }
 *   :where(:root[data-theme="dark"]) .x { … }
 *
 * i.e. "OS is dark and the user didn't force light" OR "user forced dark".
 * `:where()` adds zero specificity, so the cascade between rules is unchanged.
 * Selectors already guarded by hand (`:root:not([data-theme="light"]) .x`)
 * keep their guard and only gain the forced-theme clone. The theme token
 * files already handle both cases themselves and are skipped.
 */

const MEDIA_RE = /^\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)$/;
const EXISTING_GUARD_RE = /^:root:not\(\[data-theme=["']?(?:light|dark)["']?\]\)/;
const SKIP_FILES = /theme-(light|dark)\.css$/;

function guardsFor(scheme) {
  const opposite = scheme === 'dark' ? 'light' : 'dark';
  return {
    inMedia: `:root:not([data-theme="${opposite}"])`,
    forced: `:root[data-theme="${scheme}"]`,
  };
}

/** Prefix one selector with a guard that matches the <html> element. */
function guardSelector(selector, guard) {
  const trimmed = selector.trim();
  if (trimmed === ':root' || trimmed === 'html') return guard;
  if (trimmed.startsWith(':root')) return guard + trimmed.slice(':root'.length);
  if (/^html(?![\w-])/.test(trimmed)) return guard + trimmed.slice('html'.length);
  return `:where(${guard}) ${trimmed}`;
}

function isInsideKeyframes(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'atrule' && /keyframes$/i.test(p.name)) return true;
  }
  return false;
}

/** @type {import('postcss').PluginCreator} */
const themeMedia = () => ({
  postcssPlugin: 'postcss-theme-media',
  Once(root) {
    if (SKIP_FILES.test(root.source?.input?.file || '')) return;

    root.walkAtRules('media', (media) => {
      const match = media.params.trim().match(MEDIA_RE);
      if (!match) return;
      const { inMedia, forced } = guardsFor(match[1]);

      // Forced-theme copy, placed outside the media query right after it.
      const forcedCopy = media.clone();
      forcedCopy.walkRules((rule) => {
        if (isInsideKeyframes(rule)) return;
        // Selectors that already reference data-theme some other way (e.g. the
        // Tailwind `dark:` variant in globals.css) handle the forced case
        // themselves — copying them outside the media query would apply them
        // unconditionally, so drop them from the copy.
        const selectors = rule.selectors
          .map((sel) => sel.trim())
          .filter((sel) => EXISTING_GUARD_RE.test(sel) || !sel.includes('[data-theme'))
          .map((sel) =>
            EXISTING_GUARD_RE.test(sel) ? sel.replace(EXISTING_GUARD_RE, forced) : guardSelector(sel, forced)
          );
        if (selectors.length === 0) rule.remove();
        else rule.selectors = selectors;
      });

      // Original block: only apply when the user hasn't forced the other theme.
      media.walkRules((rule) => {
        if (isInsideKeyframes(rule)) return;
        rule.selectors = rule.selectors.map((sel) => {
          const trimmed = sel.trim();
          if (trimmed.includes('[data-theme')) return trimmed;
          return guardSelector(trimmed, inMedia);
        });
      });

      media.after(forcedCopy.nodes);
    });
  },
});
themeMedia.postcss = true;

export default themeMedia;

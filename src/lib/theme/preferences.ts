export type ThemePreference = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'theme';
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';
export const THEME_COLORS = { dark: '#050506', light: '#f4f3f1' } as const;
export const THEME_COLOR_META_ID = 'application-theme-color';

export function parseThemePreference(value: unknown): ThemePreference {
  return value === 'dark' || value === 'light' ? value : 'system';
}

export function resolveTheme(theme: ThemePreference, prefersDark: boolean): ResolvedTheme {
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
}

export function readThemePreference(target: Window): ThemePreference {
  try {
    return parseThemePreference(target.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

export function applyTheme(document: Document, resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.theme = resolvedTheme;
  // MapLibre's existing theme observer consumes these compatibility classes.
  root.classList.remove('dark', 'light');
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
  // React uses hoisted meta content to match nodes during hydration. Leave its
  // media-qualified fallback tags intact; own a first, unconditional override.
  let chrome = document.getElementById(THEME_COLOR_META_ID);
  if (!chrome) {
    chrome = document.createElement('meta');
    chrome.id = THEME_COLOR_META_ID;
    chrome.setAttribute('name', 'theme-color');
    document.head.prepend(chrome);
  }
  chrome.setAttribute('content', THEME_COLORS[resolvedTheme]);
}

// Static, trusted source only: runs synchronously in <head>, before body paint.
// Keep its small resolver in parity with the functions above (covered by tests).
export const THEME_BOOTSTRAP_SCRIPT = `(function(){
var t='system';try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(s==='dark'||s==='light')t=s;}catch(e){}
var r=t==='system'?(matchMedia(${JSON.stringify(THEME_MEDIA_QUERY)}).matches?'dark':'light'):t;
var h=document.documentElement;h.dataset.theme=r;h.classList.remove('dark','light');h.classList.add(r);h.style.colorScheme=r;
var m=document.getElementById('${THEME_COLOR_META_ID}');if(!m){m=document.createElement('meta');m.id='${THEME_COLOR_META_ID}';m.setAttribute('name','theme-color');document.head.prepend(m);}m.setAttribute('content',r==='dark'?'${THEME_COLORS.dark}':'${THEME_COLORS.light}');
})();`;

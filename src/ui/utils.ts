export function getFaviconUrl(url: string): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return chrome.runtime.getURL(
      `/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`
    );
  } catch {
    return '';
  }
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Omnibox bookmark search
// Type "lp" in address bar, press Tab/Space, then type your search

chrome.omnibox.setDefaultSuggestion({
  description: 'Search bookmarks for: %s'
});

chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  if (!text || text.length < 1) {
    suggest([]);
    return;
  }

  try {
    const results = await chrome.bookmarks.search(text);

    const suggestions = results
      .filter(b => b.url) // Only bookmarks with URLs
      .slice(0, 6)
      .map(b => ({
        content: b.url,
        description: b.title ?
          `${b.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')} - ${b.url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}` :
          b.url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }));

    suggest(suggestions);
  } catch (e) {
    console.error('Omnibox search error:', e);
    suggest([]);
  }
});

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  let url = text;

  // If not a URL, it's the raw search text - open new tab with search
  if (!text.startsWith('http://') && !text.startsWith('https://')) {
    url = 'chrome://newtab/';
  }

  switch (disposition) {
    case 'currentTab':
      chrome.tabs.update({ url });
      break;
    case 'newForegroundTab':
      chrome.tabs.create({ url });
      break;
    case 'newBackgroundTab':
      chrome.tabs.create({ url, active: false });
      break;
  }
});

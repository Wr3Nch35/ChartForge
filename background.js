(function () {
  "use strict";

  const trackedTabsKey = "chartForgeTabIds";

  async function getTrackedTabs() {
    const result = await chrome.storage.session.get(trackedTabsKey);
    return Array.isArray(result[trackedTabsKey]) ? result[trackedTabsKey] : [];
  }

  async function trackTab(tabId) {
    if (!Number.isInteger(tabId)) return;
    const tabIds = await getTrackedTabs();
    if (!tabIds.includes(tabId)) tabIds.push(tabId);
    await chrome.storage.session.set({ [trackedTabsKey]: tabIds });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "track-chartforge-tab") return false;
    trackTab(message.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  });

  chrome.tabs.onRemoved.addListener(async (tabId) => {
    const tabIds = await getTrackedTabs();
    if (!tabIds.includes(tabId)) return;
    const remainingTabIds = tabIds.filter((id) => id !== tabId);
    if (remainingTabIds.length) {
      await chrome.storage.session.set({ [trackedTabsKey]: remainingTabIds });
      return;
    }
    await chrome.storage.session.remove([trackedTabsKey, "spreadsheetImport"]);
  });
})();

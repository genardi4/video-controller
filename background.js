chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == "tabId") sendResponse({
    tabId : sender.tab.id
  });
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  chrome.storage.local.get(["clients", "" + tabId], function(items) {

    if (items.clients != undefined && items.clients.indexOf("" + tabId) > -1)
      delete items.clients[items.clients.indexOf("" + tabId)];

    if (items[tabId] != undefined) delete items[tabId];

    chrome.storage.local.set(items);
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
  if (changeInfo.url != undefined && (changeInfo.status == undefined || changeInfo.status == "loading"))
    chrome.storage.local.get(["clients", "" + tabId], function(items) {

      if (items.clients != undefined && items.clients.indexOf("" + tabId) > -1)
        delete items.clients[items.clients.indexOf("" + tabId)];

      if (items[tabId] != undefined) delete items[tabId];

      chrome.storage.local.set(items);
    });
});

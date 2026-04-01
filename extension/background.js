chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.type === "COPILOT_APPLY") {
      const { jobUrl, inferredAnswers, coverLetter } = request.data;
      
      // Open the job URL in a new tab
      chrome.tabs.create({ url: jobUrl }, (tab) => {
        // Wait for the tab to load, then send the data to the content script
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            // Send the data to the content script
            chrome.tabs.sendMessage(tabId, {
              type: "INJECT_ANSWERS",
              data: { inferredAnswers, coverLetter }
            });
          }
        });
      });
      sendResponse({ status: "success", message: "Job opened and copilot engaged." });
    }
    return true;
  }
);

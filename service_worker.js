let storedActiveTabs;
chrome.runtime.onMessage.addListener(async (message) => {
  let capturedTabs = null,
    isActive = false;

  await chrome.tabCapture.getCapturedTabs().then((res) => {
    capturedTabs = res.find((tab) => tab.tabId === message.tabId);
    isActive = capturedTabs?.tabId === message.tabId;
  });
  await chrome.storage.local.get(["activeTabs"]).then((res) => {
    storedActiveTabs = res.activeTabs;
    console.log("restore-activeTabs", storedActiveTabs);

    chrome.runtime.sendMessage({
      type: "restore-activeTabs",
      storedActiveTabs: storedActiveTabs,
    });
  });
  if (message.type === "init-capture" && !isActive) {
    try {
      // await console.log("storedActiveTabs", storedActiveTabs);

      const existingContexts = await chrome.runtime.getContexts({});
      // console.log("existing context : ", existingContexts);

      const offscreenDocument = existingContexts.find(
        (c) => c.contextType === "OFFSCREEN_DOCUMENT"
      );

      // If an offscreen document is not already open, create one.
      if (!offscreenDocument) {
        // Create an offscreen document.
        await chrome.offscreen.createDocument({
          url: "offscreen.html",
          reasons: ["USER_MEDIA"],
          justification: "Recording from chrome.tabCapture API",
        });
      }

      // console.log("create stream id called");
      // Get a MediaStream for the active tab.
      const streamId = await chrome.tabCapture.getMediaStreamId({
        targetTabId: message.tabId,
      });
      // console.log("streamId: ", streamId);

      // Send the stream ID to the offscreen document to start recording.
      chrome.runtime.sendMessage({
        type: "start-recording",
        target: "offscreen",
        data: streamId,
        tabId: message.tabId,
      });
    } catch (error) {
      console.log("error inside service worker: ", error);
    }
  }
  if (message.type === "set-storage") {
    console.log(message);
    chrome.storage.local.set({ activeTabs: message.activeTabs }).then(() => {
      // console.log("Value is set");
    });

    chrome.storage.local.get(["activeTabs"]).then((result) => {
      // console.log("Value is " + result.key);
    });
  }
});

//         document.querySelector('.video-stream').volume
// 0.75
//          document.querySelector('.video-stream').volume = 0.2
// 0.2
//          document.querySelector('.video-stream').volume = 1
// 1

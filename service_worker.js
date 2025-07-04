let storedActiveTabs = null;
let capturedTabs = null;
let isActive = false;
let offscreenDocument;

let getTabsAlreadyCaptured = async (message) => {
  // console.log("in get tabs");
  await chrome.tabCapture.getCapturedTabs().then((res) => {
    capturedTabs = res.find((tab) => tab.tabId === message.tabId);
    isActive = capturedTabs?.tabId === message.tabId;
    // console.log("captured tabs :", isActive);
  });
};

let createOffScreenDocument = async () => {
  try {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Recording from chrome.tabCapture API",
    });
    return 1;
  } catch (error) {
    console.log("error creating offscreen document : ", error);
    return 0;
  }
};

let makeDocumentOrNot = async (message) => {
  console.log("message: ", message);
  await getTabsAlreadyCaptured(message);

  let res = await chrome.storage.local.get(["activeTabs"]);
  console.log("stored in local storage : ", res);
  storedActiveTabs = res.activeTabs;
  console.log("tabs to restore: ", storedActiveTabs);

  // await newStreamIdforActiveTabs(storedActiveTabs, message);

  const existingContexts = await chrome.runtime.getContexts({});
  offscreenDocument = existingContexts.find(
    (c) => c.contextType === "OFFSCREEN_DOCUMENT"
  );
  console.log("offscreenDocumenet there: ", offscreenDocument);

  console.log("creating new offscreenDocument");

  let resCreateOffScreen = await createOffScreenDocument();
  console.log("is offsccreen doc completed ", resCreateOffScreen);
  // console.log();
  setTimeout(async () => {
    console.log("start recording sent to offscreen ");
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: message.tabId,
    });
    console.log("streamId ", streamId, message);
    chrome.runtime.sendMessage({
      type: "start-recording",
      target: "offscreen",
      data: streamId,
      tabId: message.tabId,
    });
  });
};

chrome.runtime.onMessage.addListener(async (message) => {
  console.log(message);

  if (message.type === "init-capture") {
    try {
      await makeDocumentOrNot(message);
    } catch (error) {
      console.log("error init-capture service worker: ", error);
    }
  }
  if (message.type === "set-storage") {
    console.log("active tabs : ", message.activeTabs);
    chrome.storage.local.set({ activeTabs: message.activeTabs }).then(() => {
      console.log("Value is set");
    });

    chrome.storage.local.get(["activeTabs"]).then((result) => {
      console.log("Value is " + result.key);
    });
  }
  if (message.type === "reload vol") {
  }
});

//         document.querySelector('.video-stream').volume
// 0.75
//          document.querySelector('.video-stream').volume = 0.2
// 0.2
//          document.querySelector('.video-stream').volume = 1
// 1

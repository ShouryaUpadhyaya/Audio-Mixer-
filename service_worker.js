let storedActiveTabs = null;
let capturedTabs = null;
let isActive = false;
let offscreenDocument;

let getTabsAlreadyCaptured = async (message) => {
  // console.log("in get tabs");
  await chrome.tabCapture.getCapturedTabs().then((res) => {
    capturedTabs = res.find((tab) => tab.tabId === message.tabId);
    isActive = capturedTabs?.tabId === message.tabId;
    console.log("captured tabs :", res);
  });
};

let newStreamIdforActiveTabs = async (storedActiveTabs, message) => {
  try {
    for (const key in storedActiveTabs) {
      console.log("key: ", key, "value: ", storedActiveTabs[key]);
      let streamIdk = await chrome.tabCapture.getMediaStreamId({
        targetTabId: Number(key),
      });
      console.log(
        "streamIdk : ",
        streamIdk,
        "streamId :",
        storedActiveTabs[key].streamId
      );
      storedActiveTabs[key].streamId = streamIdk;
      console.log("get streamId for active tab new");
    }
  } catch (error) {
    console.log("error in newStreamIdforActiveTabs : ", error);
  }
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

let restoreActiveTabs = () => {
  let isLocalStorageEmpty = Object.keys(storedActiveTabs).length === 0;
  console.log("is local storage : ", isLocalStorageEmpty);

  if (!isLocalStorageEmpty) {
    console.log("restore message sent", storedActiveTabs);

    chrome.runtime.sendMessage({
      type: "restore-activeTabs",
      target: "offscreen",
      storedActiveTabs: storedActiveTabs,
    });
    return true;
  } else {
    console.log("the storage is empty ");
    return false;
  }
};

let makeDocumentOrNot = async (message) => {
  console.log("message: ", message);
  await getTabsAlreadyCaptured(message);

  let res = await chrome.storage.local.get(["activeTabs"]);
  // console.log("res: ", res);
  storedActiveTabs = res.activeTabs;
  console.log("tabs to restore: ", storedActiveTabs);

  await newStreamIdforActiveTabs(storedActiveTabs, message);

  const existingContexts = await chrome.runtime.getContexts({});
  offscreenDocument = existingContexts.find(
    (c) => c.contextType === "OFFSCREEN_DOCUMENT"
  );
  console.log("offscreenDocumenet there: ", offscreenDocument);

  if (!offscreenDocument) {
    console.log("creating new offscreenDocument");

    let resCreateOffScreen = await createOffScreenDocument();
    let isRestored = restoreActiveTabs(storedActiveTabs);
    console.log("the tabs were restrored : ", isRestored);
    console.log();

    if (!isRestored || !storedActiveTabs[message.tabId]) {
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
    }
  }
};

chrome.runtime.onMessage.addListener(async (message) => {
  console.log(message);

  // makeDocumentOrNot(message);
  if (message.type === "init-capture") {
    try {
      await makeDocumentOrNot(message);
      // await console.log("storedActiveTabs", storedActiveTabs);

      // const existingContexts = await chrome.runtime.getContexts({});

      // offscreenDocument = existingContexts.find(
      //   (c) => c.contextType === "OFFSCREEN_DOCUMENT"
      // );

      // if (!offscreenDocument) {
      //   // Create an offscreen document.
      //   await chrome.offscreen.createDocument({
      //     url: "offscreen.html",
      //     reasons: ["USER_MEDIA"],
      //     justification: "Recording from chrome.tabCapture API",
      //   });
      // }

      // console.log("create stream id called");
      // Get a MediaStream for the active tab.
    } catch (error) {
      console.log("error inside service worker: ", error);
    }
  }
  // if(message.type === "get-streamId"){

  // }
  if (message.type === "set-storage") {
    console.log(message);
    chrome.storage.local.set({ activeTabs: message.activeTabs }).then(() => {
      console.log("Value is set");
    });

    chrome.storage.local.get(["activeTabs"]).then((result) => {
      console.log("Value is " + result.key);
    });
  }
});

//         document.querySelector('.video-stream').volume
// 0.75
//          document.querySelector('.video-stream').volume = 0.2
// 0.2
//          document.querySelector('.video-stream').volume = 1
// 1

let activeTabs = new Map();

let restoreActiveTabs = async (storedActiveTabs) => {
  try {
    for (const tabId in storedActiveTabs) {
      let streamId = storedActiveTabs[tabId].streamId;
      const media = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "tab",
            chromeMediaSourceId: streamId,
          },
        },
      });

      const output = new AudioContext();
      const source = output.createMediaStreamSource(media);
      const gainNode = new GainNode(output);
      source.connect(gainNode).connect(output.destination);
      gainNode.gain.maxValue = 6;
      gainNode.gain.value = storedActiveTabs[tabId].volume ?? 1;
      console.log("key: ", tabId, "value: ", storedActiveTabs[tabId]);
      activeTabs.set(tabId, storedActiveTabs[tabId]);
      console.log("active tabs: ", message.storedActiveTabs);
    }
  } catch (error) {
    console.log("error in restore active tabs :", error);
  }

  console.log("restrored active tab");
};

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target !== "offscreen") return;

  console.log(message);

  if (message.type === "restore-activeTabs") {
    let storedActiveTabs = message.storedActiveTabs;
    console.log("offscreen inside restore-activeTabs", storedActiveTabs);
    await restoreActiveTabs();
  }

  if (message.type === "start-recording") {
    console.log("inside start recordig offscreen");
    // console.log(message);

    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: message.data,
        },
      },
    });
    // console.log("media: ", media);

    const output = new AudioContext();
    const source = output.createMediaStreamSource(media);
    const gainNode = new GainNode(output);
    source.connect(gainNode).connect(output.destination);
    gainNode.gain.maxValue = 6;
    gainNode.gain.value = 1;
    console.log("source", source);
    console.log("streamId", typeof message.data, message.data);
    let streamId = message.data;
    const tabId = message.tabId;
    activeTabs.set(tabId, { source, gainNode, streamId });
    console.log("activeTabs: ", activeTabs);
  }
  if (message.type === "set-vol") {
    console.log("message set-vol: ", message);
    console.log("activeTabs set-vol: ", activeTabs);
    let tabId = message.tab.id;
    console.log("tabid : ", typeof tabId, tabId);

    // let tabCtr = activeTabs.get(tabId);
    let volume = message.volume / 100;
    // console.log("tabCtr: ", tabCtr);
    // tabCtr.gainNode.gain.value = volume;
    // console.log(chrome.storage);

    let toStore = {};
    activeTabs.forEach((value, key) => {
      console.log("value:", value);
      console.log("key:", key);
      toStore[key] = {
        volume: value.gainNode.gain.value,
        streamId: value.streamId,
      };
      console.log("toStore[key]", toStore[key]);
    });
    let str = toStore.toString();
    console.log(str);

    chrome.runtime.sendMessage({
      type: "set-storage",
      activeTabs: toStore,
    });
  }
});

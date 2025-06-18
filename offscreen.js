let activeTabs = new Map();
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target !== "offscreen") return;

  if (message.type === "restore-activeTabs") {
    let storedActiveTabs = message.storedActiveTabs;
    console.log("offscreen inside restore-activeTabs", storedActiveTabs);
    for (const key in storedActiveTabs) {
      console.log("key", key);
    }
  }
  if (message.type === "start-recording") {
    console.log("inside start recordig offscreen");
    console.log(message);

    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: message.data,
        },
      },
    });

    const output = new AudioContext();
    const source = output.createMediaStreamSource(media);
    const gainNode = new GainNode(output);
    source.connect(gainNode).connect(output.destination);
    gainNode.gain.maxValue = 6;
    gainNode.gain.value = 1;
    // console.log(source);
    // console.log(typeof message.data);
    let streamId = message.data;
    const tabId = message.tabId;
    activeTabs.set(tabId, { source, gainNode, streamId });
    console.log(activeTabs);
  }
  if (message.type === "set-vol") {
    console.log(message);
    console.log(activeTabs);
    let tabId = message.tab.id;
    console.log("tabid : ", typeof tabId, tabId);

    let tabCtr = activeTabs.get(tabId);
    let volume = message.volume / 100;
    console.log("tabCtr: ", tabCtr);
    tabCtr.gainNode.gain.value = volume;
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
    // console.log(str);

    chrome.runtime.sendMessage({
      type: "set-storage",
      activeTabs: toStore,
    });
  }
});

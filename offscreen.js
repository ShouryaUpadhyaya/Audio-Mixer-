let activeTabs = new Map();

let setVolume = async (volume = 1, gainNode) => {
  // console.log("volume", volume);
  // console.log("gainNode", gainNode);
  gainNode.gain.value = volume;
  // console.log("set the volume", gainNode);
};
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target !== "offscreen") return;

  if (message.type === "start-recording") {
    console.log("inside start recordig offscreen", message);
    let streamId = message.data;
    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
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
    // console.log("source", source);
    // console.log("streamId", typeof message.data, message.data);
    const tabId = message.tabId;
    // console.log("storedActiveTabs: ", activeTabs[tabId]);
    activeTabs.set(tabId, { source, gainNode, streamId });
    // console.log("active tabs: ", activeTabs.get(tabId));
    chrome.runtime.sendMessage({
      type: "refresh-ui",
    });
  }
  if (message.type === "set-vol") {
    // console.log("message set-vol: ", message);
    console.log("activeTabs set-vol: ", activeTabs);
    let tabId = message.tab.id;
    console.log("tabid : ", typeof tabId, tabId);
    let streamId;
    let toStore = {};
    activeTabs.forEach((value, keyTabId) => {
      console.log("value:", value);
      // console.log("key:", key);
      // console.log(Number(key) === tabId);

      if (Number(keyTabId) === tabId) {
        // console.log("volume is: ", volume);
        let volume = message.volume / 100;
        streamId = value.streamId;
        toStore[keyTabId] = {
          volume: volume,
          streamId: value.streamId,
          tabId: keyTabId,
        };
        setVolume(volume, value.gainNode);
      } else {
        volume = value.gainNode.gain.value;
        console.log(
          "volume not active tab: ",
          volume,
          "streamId: ",
          value.streamId,
          "volume: ",
          value
        );

        toStore[keyTabId] = {
          tabId: keyTabId,
          streamId: value.streamId,
          volume: volume,
        };
      }

      console.log("toStore[key]", toStore[keyTabId], "key: ", keyTabId);
    });
    // let str = toStore.toString();
    // toStore =
    console.log("toStore :", toStore);

    chrome.runtime.sendMessage({
      type: "set-storage",
      activeTabs: toStore,
    });
  }
});

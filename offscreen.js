let activeTabs = new Map();

let restoreActiveTabs = async (storedActiveTabs) => {
  try {
    console.log("in restoreActiveTabs", storedActiveTabs);

    for (const tabId in storedActiveTabs) {
      console.log("tabId: ", tabId, "storedActiveTabs: ", storedActiveTabs);

      let streamId = storedActiveTabs[tabId].streamId;
      let volume = storedActiveTabs[tabId].volume;
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
      gainNode.gain.value = volume ?? 1;
      console.log("key: ", tabId, "value: ", storedActiveTabs[tabId]);
      activeTabs.set(tabId, { ...storedActiveTabs[tabId], gainNode: gainNode });
      console.log("active tabs: ", activeTabs.get(tabId));
    }
  } catch (error) {
    console.log("error in restore active tabs :", error);
  }

  console.log("restrored active tab");
};

let setVolume = async (volume = 1, gainNode) => {
  console.log("volume", volume);
  console.log("gainNode", gainNode);
  gainNode.gain.value = volume;
  console.log("set the volume", gainNode);
};
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target !== "offscreen") return;

  if (message.type === "restore-activeTabs") {
    let storedActiveTabs = message.storedActiveTabs;
    console.log("offscreen inside restore-activeTabs", storedActiveTabs);
    await restoreActiveTabs(storedActiveTabs);
    console.log("restrored active tabs");
  }

  if (message.type === "start-recording") {
    console.log("inside start recordig offscreen");
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
    console.log("source", source);
    console.log("streamId", typeof message.data, message.data);
    const tabId = message.tabId;
    console.log("storedActiveTabs: ", storedActiveTabs[tabId]);

    activeTabs.set(tabId, storedActiveTabs[tabId]);
    console.log("active tabs: ", activeTabs.get(tabId));
  }
  if (message.type === "set-vol") {
    console.log("message set-vol: ", message);
    console.log("activeTabs set-vol: ", activeTabs);
    let tabId = message.tab.id;
    console.log("tabid : ", typeof tabId, tabId);
    let volume = message.volume / 100;
    let streamId;
    let toStore = {};
    activeTabs.forEach((value, key) => {
      console.log("value:", value);
      console.log("key:", key);
      console.log(Number(key) === tabId);

      if (Number(key) === tabId) {
        console.log("volume is: ", volume);

        streamId = value.streamId;
        toStore[key] = {
          volume: volume,
          streamId: value.streamId,
        };
      } else {
        toStore[key] = {
          volume: value.volume,
          streamId: value.streamId,
        };
      }

      setVolume(volume, value.gainNode);

      console.log("toStore[key]", toStore[key], "key: ", key);
    });
    let str = toStore.toString();
    console.log("toStore :", str);

    chrome.runtime.sendMessage({
      type: "set-storage",
      activeTabs: toStore,
    });
  }
});

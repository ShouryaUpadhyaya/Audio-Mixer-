let streamId;
let allStoredTab;

let makeVolumeSliderAndVolumeSpan = (audibleTab, volume) => {
  let VolumeSlider = document.createElement("div");
  let VolumeSpan = document.createElement("span");
  VolumeSlider.classList.add("VolumeSlider");

  let input = document.createElement("input");
  input.type = "range";
  input.name = "VolumeSlider";
  input.id = audibleTab.id;
  input.min = 0;
  input.max = 200;
  input.value = volume * 100;
  input.classList.add("slider");
  input.addEventListener("input", (e) => {
    volume = e.target.value;
    VolumeNumber = `${volume}%`;
    VolumeSpan.textContent = VolumeNumber;
    chrome.runtime.sendMessage({
      type: "set-vol",
      target: "offscreen",
      tab: audibleTab,
      volume: volume,
    });
  });

  let VolumeNumber = `${volume * 100}%`;
  VolumeSpan.textContent = VolumeNumber;
  VolumeSpan.classList.add("VolumeNumber");
  VolumeSlider.appendChild(input);
  return { VolumeSlider, VolumeSpan };
};
let makeTabTitleAndImgcomponents = (audibleTab) => {
  let TabTitle = document.createElement("span");
  let title = audibleTab.title;
  TabTitle.textContent = title;
  TabTitle.classList.add("TabTitle");
  let img = document.createElement("img");
  img.src = audibleTab.favIconUrl;
  return { img, TabTitle };
};
let addCapturedTabAudioSlider = async (audibleTab, mixer) => {
  let storedTab;
  try {
    console.log("in addCapturedTabAudioSlider audible tab: ", audibleTab);
    console.log("stored tab? : ", allStoredTab.activeTabs[audibleTab.id]);
    storedTab = allStoredTab.activeTabs[audibleTab.id];
  } catch (error) {
    storedTab = "";
  }
  let volume = storedTab ? storedTab.volume : 1;
  let TabContainer = document.createElement("div");
  let { VolumeSlider, VolumeSpan } = makeVolumeSliderAndVolumeSpan(
    audibleTab,
    volume
  );
  let { TabTitle, img } = makeTabTitleAndImgcomponents(audibleTab);
  TabContainer.classList.add("TabContainer");
  TabContainer.appendChild(VolumeSlider);
  TabContainer.appendChild(VolumeSpan);
  TabContainer.appendChild(img);
  TabContainer.appendChild(TabTitle);
  mixer[0].appendChild(TabContainer);
};
let makeErrorAndButtonComponents = (audibleTab) => {
  // console.log("tab not captured but audible :", audibleTab);
  let url = audibleTab.url;
  let errorSpan = document.createElement("span");
  let title =
    "This tab is audible but not currently captured. Go to the tab and click on the extension icon to capture audio.";
  errorSpan.textContent = title;
  errorSpan.classList.add("error");
  let button = document.createElement("button");
  button.textContent = "Go to Tab";

  button.addEventListener("click", () => {
    chrome.tabs.update(audibleTab.id, { active: true });
    chrome.windows.update(audibleTab.windowId, { focused: true });
  });
  return { errorSpan, button };
};
let addAudibleNotCapturedTab = async (audibleTab, mixer) => {
  let volume = 1;
  let TabContainer = document.createElement("div");
  let { errorSpan, button } = makeErrorAndButtonComponents(audibleTab);
  let { TabTitle, img } = makeTabTitleAndImgcomponents(audibleTab);
  TabContainer.classList.add("TabContainer", "AudibleNotCaptured");
  TabContainer.appendChild(img);
  TabContainer.appendChild(errorSpan);
  TabContainer.appendChild(TabTitle);
  TabContainer.appendChild(button);
  mixer[0].appendChild(TabContainer);
};

document.addEventListener("DOMContentLoaded", async function () {
  let audibleTabs = await chrome.tabs.query({ audible: true });
  let activeTab = await chrome.tabs.query({ active: true });
  let activeAndAudible = await chrome.tabs.query({
    audible: true,
    active: true,
  });
  let allTabs = await chrome.tabs.query({});
  let capturedTabs = await chrome.tabCapture.getCapturedTabs();
  // console.log(
  //   "audible tabs: ",
  //   audibleTabs,
  //   "captured tabs",
  //   capturedTabs,
  //   "activeTab: ",
  //   activeTab
  // );

  const mixer = document.getElementsByClassName("mixer_container");
  let isActiveTabCaptured = false;
  let AudibleAndCapturedTabs = [];
  let AudibleNotCapturedTabs = [];
  let StoredTabCantCapture = [];
  allStoredTab = await chrome.storage.local.get(["activeTabs"]);

  audibleTabs.forEach((tab) => {
    const isCaptured = capturedTabs.some(
      (capturedTab) => capturedTab.tabId === tab.id
    );

    if (isCaptured) {
      console.log("tab captured and audible", tab);
      if (tab.id === activeTab[0].id) {
        isActiveTabCaptured = true;
      }
      AudibleAndCapturedTabs.push(tab);
    } else {
      if (
        !AudibleNotCapturedTabs.some((t) => t.id === tab.id) &&
        !AudibleAndCapturedTabs.some((t) => t.id === tab.id)
      ) {
        console.log("audible but not captured", tab);
        AudibleNotCapturedTabs.push(tab);
      }
    }
  });
  console.log(!isActiveTabCaptured, activeAndAudible, activeAndAudible.length);
  // the active tab is not captured + the tab is active and audible
  if (!isActiveTabCaptured && activeAndAudible.length) {
    chrome.runtime.sendMessage({
      type: "init-capture",
      tabId: activeTab[0].id,
    });
    // setTimeout(() => {
    // location.reload();
    // }, 10);
  }
  // console.log("capturedAndAudibleTabs", AudibleAndCapturedTabs);

  AudibleAndCapturedTabs.forEach(async (audibleTab) => {
    await addCapturedTabAudioSlider(audibleTab, mixer);
  });

  console.log(
    "AudibleNotCapturedTabs: ",
    AudibleNotCapturedTabs,
    "AudibleAndCapturedTabs: ",
    AudibleAndCapturedTabs
  );

  AudibleNotCapturedTabs.forEach(async (audibleTabs) => {
    await addAudibleNotCapturedTab(audibleTabs, mixer);
  });
  // trialknob();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "refresh-ui") {
    console.log("in refresh ui");

    location.reload();
  }
});
//Knob Code ->
const trialknob = () => {
  const knob = document.getElementById("knob");
  const indicator = document.getElementById("indicator");
  const valueLabel = document.getElementById("valueLabel");

  const minAngle = 225;
  const maxAngle = 495;
  const angleRange = maxAngle - minAngle;

  let currentValue = 0;
  const sensitivity = 0.2;

  function updateKnob(value) {
    currentValue = Math.max(0, Math.min(100, value));
    const angle = minAngle + angleRange * (currentValue / 100);
    indicator.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    valueLabel.textContent = Math.round(currentValue);
  }

  knob.addEventListener("mousedown", (e) => {
    if (e.button === 0 && document.pointerLockElement !== knob) {
      knob.requestPointerLock();
    }
  });

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === knob) {
      document.addEventListener("mousemove", handleMouseMove);
      knob.classList.add("dragging");
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      knob.classList.remove("dragging");
    }
  });

  function handleMouseMove(e) {
    const delta = -e.movementY;
    const newValue = currentValue + delta * sensitivity;
    updateKnob(newValue);
  }

  document.addEventListener("mouseup", () => {
    if (document.pointerLockElement === knob) {
      document.exitPointerLock();
    }
  });

  updateKnob(0);
  console.log("Hello world");
  //Knob code ends <--
};

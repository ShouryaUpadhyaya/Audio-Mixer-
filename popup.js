let streamId;
document.addEventListener("DOMContentLoaded", async function () {
  let tabs = await chrome.tabs.query({ audible: true });
  const mixer = document.getElementsByClassName("mixer_container");

  tabs.forEach((tab) => {
    chrome.runtime.sendMessage({
      type: "init-capture",
      tabId: tab.id,
    });

    let volume = 100;
    let TabContainer = document.createElement("div");

    TabContainer.classList.add("TabContainer");

    let VolumeSlider = document.createElement("div");
    VolumeSlider.classList.add("VolumeSlider");

    let input = document.createElement("input");
    input.type = "range";
    input.name = "VolumeSlider";
    input.id = tab.id;
    input.min = 0;
    input.max = 200;
    input.value = 100;
    input.classList.add("slider");

    let img = document.createElement("img");
    img.src = tab.favIconUrl;

    let VolumeNumber = `${volume}%`;
    let VolumeSpan = document.createElement("span");
    VolumeSpan.textContent = VolumeNumber;
    VolumeSpan.classList.add("VolumeNumber");

    let TabTitle = document.createElement("span");
    let title = tab.title;
    TabTitle.textContent = title;
    TabTitle.classList.add("TabTitle");

    VolumeSlider.appendChild(input);
    TabContainer.appendChild(VolumeSlider);
    TabContainer.appendChild(img);
    TabContainer.appendChild(VolumeSpan);
    TabContainer.appendChild(TabTitle);
    mixer[0].appendChild(TabContainer);

    let sliders = document.querySelectorAll(".slider");
    sliders = Array.from(sliders);
    sliders.forEach((slider) => {
      slider.addEventListener("input", function () {
        const value = this.value;
        this.style.background = `linear-gradient(to right, #82CFD0 0%, #82CFD0 ${
          value / 4
        }%, #fff ${value / 2}%, white 100%)`;
      });
    });

    input.addEventListener("change", (e) => {
      volume = e.target.value;
      VolumeNumber = `${volume}%`;
      VolumeSpan.textContent = VolumeNumber;
      chrome.runtime.sendMessage({
        type: "set-vol",
        target: "offscreen",
        tab: tab,
        volume: volume,
      });
    });
  });
});

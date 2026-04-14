document.getElementById("export").onclick = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  chrome.runtime.sendMessage(
    { action: "EXPORT_CREDENTIALS", tabId: tab.id },
    (res) => {
      document.getElementById("status").textContent =
        res?.success ? "Exported" : "Failed";
    }
  );
};
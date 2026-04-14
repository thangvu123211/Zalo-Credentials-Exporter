chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "EXPORT_CREDENTIALS") return;

  (async () => {
    try {
      // 1️⃣ TAB chat.zalo.me
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) throw new Error("No active tab");

      // 2️⃣ IMEI (z_uuid / z_uuid_v2)
      const [{ result: imei }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () =>
          localStorage.getItem("z_uuid") ||
          localStorage.getItem("z_uuid_v2") ||
          crypto.randomUUID(),
      });

      if (!imei) throw new Error("Missing IMEI");

      // 3️⃣ USER AGENT (LẤY TỪ TAB – KHÔNG FIX CỨNG)
      const [{ result: userAgent }] =
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => navigator.userAgent,
        });

      if (!userAgent) throw new Error("Missing userAgent");

      // 4️⃣ COOKIE (FULL FIELD – CHUẨN CHROME)
      const allCookies = await chrome.cookies.getAll({
        url: "https://chat.zalo.me",
      });

      const neededNames = ["zpw_sek", "zpsid", "__zi", "__zi-legacy"];

      const cookies = allCookies
        .filter((c) => neededNames.includes(c.name))
        .map((c) => ({
          name: c.name,
          value: c.value,
          domain:
            c.name === "zpw_sek" ? ".chat.zalo.me" : ".zalo.me",
          path: c.path || "/",
          secure: c.secure,
          httpOnly: c.httpOnly,
          expirationDate: c.expirationDate,
          hostOnly: c.hostOnly,
          sameSite: c.sameSite,
          session: c.session,
          storeId: c.storeId,
        }));

      if (!cookies.find((c) => c.name === "zpw_sek")) {
        throw new Error("Missing zpw_sek");
      }

      // 5️⃣ CREDENTIALS
      const credentials = {
        imei,
        userAgent,
        cookie: {
          url: "https://chat.zalo.me",
          cookies,
        },
      };

      // 6️⃣ POST VỀ BACKEND
      await fetch("http://localhost:3000/zalo/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      sendResponse({ success: true });
    } catch (err) {
      console.error("❌ EXPORT FAIL:", err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true; // ⬅️ bắt buộc cho async
});
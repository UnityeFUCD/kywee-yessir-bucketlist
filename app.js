// ---------- Local keys ----------
  const KEY_ACTIVE = "bucketlist_2026_active";
  const KEY_SAVED = "bucketlist_2026_saved";
  const KEY_COMPLETED = "bucketlist_2026_completed";
  const KEY_MESSAGES = "bucketlist_2026_messages";
  const KEY_CUSTOM_TAGS = "bucketlist_2026_custom_tags";
  const KEY_THEME = "bucketlist_2026_theme";
  const KEY_SYSTEM_MESSAGE = "bucketlist_2026_system_message";

  // ✅ session user (per-tab). persists on refresh, new tab asks again.
  const SESSION_USER_KEY = "bucketlist_2026_session_user";

  // ✅ per-user "read" tracking (local only)
  function keyLastRead(user) {
    return `bucketlist_2026_lastread_${String(user || "").toLowerCase()}`;
  }

  // ✅ shared room code
  const ROOM_CODE = "yasir-kylee";

  // ✅ [SUPABASE STORAGE CONFIG]
  // NOTE: Use the LEGACY anon key (starts with eyJ...) from Settings > API > Legacy tab
  const SUPABASE_URL = "https://pkgrlhwnwqtffdmcyqbk.supabase.co";
  const SUPABASE_ANON_KEY = "PASTE_YOUR_LEGACY_ANON_KEY_HERE"; // Get from Settings > API > Legacy anon, service_role API keys
  const STORAGE_BUCKET = "attachments";

  const $ = (id) => document.getElementById(id);

  // ✅ [FEATURE D] Daily rotating emoticons (30 cute ones)
  const DAILY_EMOTICONS = [
    "(づ｡◕‿‿◕｡)づ ❤", "ʕ•ᴥ•ʔ ♡", "(◕ᴗ◕✿)", "( ˘▽˘)っ♨", "₍ᐢ.ˬ.ᐢ₎ ♡",
    "(｡♥‿♥｡)", "(◠‿◠)✌", "ヾ(≧▽≦*)o", "(✿◠‿◠)", "♡(ӦｖӦ｡)",
    "(っ◔◡◔)っ ♥", "ʕ￫ᴥ￩ʔ", "(◕‿◕)♡", "(´• ω •`)♡", "( ˶ˆᗜˆ˵ )",
    "(*≧ω≦)", "(ﾉ◕ヮ◕)ﾉ*:・ﾟ✧", "( ͡° ͜ʖ ͡°)♡", "(◍•ᴗ•◍)❤", "♪(´ε` )",
    "(✧ω✧)", "٩(◕‿◕｡)۶", "(◠ᴗ◠✿)", "ლ(╹◡╹ლ)", "✿◕ ‿ ◕✿",
    "(っ˘ω˘ς )", "ฅ^•ﻌ•^ฅ", "(=^・ω・^=)", "(*^ω^*)", "( ´ ▽ ` )ﾉ♡"
  ];

  // ✅ [BUG 2 FIX] Prevent double-trigger of letter animation
  let letterAnimationInProgress = false;

  const exampleActive = { title: "Test Mission (Example)", desc: "This is an example card", tag: "example", done: false, isExample: true };
  const exampleCompleted = { title: "Test Completed (Example)", desc: "This is a completed example", tag: "example", done: true, isExample: true };

  let selectedSavedMissions = [];
  let currentTheme = "system";

  // ✅ SMART POLLING state
  let lastRemoteUpdatedAt = null;
  let pollTimer = null;

  // ✅ Per-user dismissed notifications (local only - doesn't delete actual messages)
  function keyDismissed(user) {
    return `bucketlist_2026_dismissed_${String(user || "").toLowerCase()}`;
  }
  function loadDismissed() {
    const u = loadUser();
    if (!u) return [];
    try { return JSON.parse(localStorage.getItem(keyDismissed(u))) || []; } catch { return []; }
  }
  function saveDismissed(arr) {
    const u = loadUser();
    if (!u) return;
    localStorage.setItem(keyDismissed(u), JSON.stringify(arr));
  }
  function dismissNotification(msgKey) {
    const dismissed = loadDismissed();
    if (!dismissed.includes(msgKey)) {
      dismissed.push(msgKey);
      saveDismissed(dismissed);
    }
  }
  function getMsgKey(msg) {
    return `${msg.from}_${msg.timestamp}_${(msg.content || "").substring(0,20)}`;
  }

  // ---------- helpers ----------
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function normalizeNewlines(str) {
    return String(str ?? "").replace(/\r\n/g, "\n");
  }

  function formatDT(dt) {
    try {
      return dt.toLocaleString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }).replace(",", "");
    } catch {
      return String(dt);
    }
  }

  // ✅ [FEATURE D] Get daily emoticon based on date
  function getDailyEmoticon() {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) {
      hash = ((hash << 5) - hash) + dateKey.charCodeAt(i);
      hash |= 0;
    }
    return DAILY_EMOTICONS[Math.abs(hash) % DAILY_EMOTICONS.length];
  }

  // ---------- user (SESSION) ----------
  function loadUser() { return sessionStorage.getItem(SESSION_USER_KEY) || ""; }
  function hasUser() { return !!loadUser().trim(); }
  function saveUser(name) { sessionStorage.setItem(SESSION_USER_KEY, name); }
  function clearUser() { sessionStorage.removeItem(SESSION_USER_KEY); }

  function getDuoName(user) {
    const u = String(user || "").trim().toLowerCase();
    if (u === "yasir") return "Kylee";
    if (u === "kylee") return "Yasir";
    return "--";
  }

  function loadLastRead() {
    const u = loadUser();
    if (!u) return -1;
    const raw = localStorage.getItem(keyLastRead(u));
    const n = Number(raw);
    return Number.isFinite(n) ? n : -1;
  }

  function saveLastRead(n) {
    const u = loadUser();
    if (!u) return;
    localStorage.setItem(keyLastRead(u), String(n));
  }

  function clampLastReadToMessagesLen(len) {
    const u = loadUser();
    if (!u) return;
    const cur = loadLastRead();
    if (cur > len - 1) saveLastRead(len - 1);
  }

  // ---------- local storage state ----------
  function loadArray(key) {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return Array.isArray(saved) ? saved : [];
    } catch { return []; }
  }

  function saveArray(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
    schedulePush(); // push shared state
  }

  function loadActive() { return loadArray(KEY_ACTIVE); }
  function saveActive(items) { saveArray(KEY_ACTIVE, items); }

  function loadSaved() { return loadArray(KEY_SAVED); }
  function saveSaved(items) { saveArray(KEY_SAVED, items); }

  function loadCompleted() { return loadArray(KEY_COMPLETED); }
  function saveCompleted(items) { saveArray(KEY_COMPLETED, items); }

  function loadMessages() { return loadArray(KEY_MESSAGES); }
  function saveMessages(msgs) { saveArray(KEY_MESSAGES, msgs); }

  function loadCustomTags() { return loadArray(KEY_CUSTOM_TAGS); }
  function saveCustomTags(tags) { saveArray(KEY_CUSTOM_TAGS, tags); }

  function loadTheme() { return localStorage.getItem(KEY_THEME) || "system"; }
  function saveTheme(theme) { localStorage.setItem(KEY_THEME, theme); }

  function loadSystemMessage() { return localStorage.getItem(KEY_SYSTEM_MESSAGE) || "My Love"; }
  function saveSystemMessageLocalOnly(msg) {
    localStorage.setItem(KEY_SYSTEM_MESSAGE, msg);
  }

  function renderSystemMessage(msg) {
    const v = String(msg || "My Love");
    $("herName").textContent = v.toUpperCase();
    $("loveNote").textContent = `// SYSTEM MESSAGE: ${v.toUpperCase()}`;
  }

  // ✅ Fix blank letter permanently: sanitize messages (drop empty content / missing from)
  function sanitizeMessages(arr) {
    if (!Array.isArray(arr)) return [];
    const cleaned = [];
    for (const m of arr) {
      const from = String(m?.from || "").trim();
      const timestamp = String(m?.timestamp || "").trim();
      const content = normalizeNewlines(m?.content ?? "").trim();
      if (!from) continue;
      if (!content) continue; // 🔥 removes blank letters forever
      cleaned.push({ from, timestamp, content });
    }
    return cleaned;
  }

  // ---------- Sync indicator ----------
  function setDot(el, color, pulse=false) {
    el.classList.remove("green", "yellow", "red", "gray", "pulse");
    el.classList.add(color);
    if (pulse) el.classList.add("pulse");
  }

  function setSyncStatus(mode) {
    // mode: off | pulling | saving | on | error
    const dot = $("syncDot");
    const label = $("syncPill")?.querySelector("span:last-child"); // no HTML change needed

    if (mode === "pulling") {
      setDot(dot, "yellow", true);
      if (label) label.textContent = "PULL";
      $("syncPill").title = "Pulling updates…";
      return;
    }
    if (mode === "saving") {
      setDot(dot, "yellow", true);
      if (label) label.textContent = "SAVE";
      $("syncPill").title = "Saving updates…";
      return;
    }
    if (mode === "on") {
      setDot(dot, "green", false);
      if (label) label.textContent = "SYNC";
      $("syncPill").title = "Synced";
      return;
    }
    if (mode === "error") {
      setDot(dot, "red", false);
      if (label) label.textContent = "ERR";
      $("syncPill").title = "Sync error";
      return;
    }
    setDot(dot, "gray", false);
    if (label) label.textContent = "OFF";
    $("syncPill").title = "Sync off";
  }

  // ---------- Presence (duo online) ----------
  let presenceTimer = null;
  let lastPresence = null;

  function normalizePerson(name) {
    const n = String(name || "").trim().toLowerCase();
    if (n === "yasir") return "yasir";
    if (n === "kylee") return "kylee";
    return "";
  }

  function updateUserDuoPills() {
    const user = loadUser().trim();
    const duo = getDuoName(user);

    $("userText").textContent = user ? `USER: ${user.toUpperCase()}` : "USER: --";
    $("duoText").textContent = user ? `DUO: ${duo.toUpperCase()}` : "DUO: --";
    $("envelopeLabel").textContent = user ? `DUO: ${duo.toUpperCase()}` : "DUO";

    setDot($("userDot"), user ? "green" : "gray", false);

    if (!user || !lastPresence) {
      setDot($("duoDot"), "gray", false);
      return;
    }

    const duoKey = normalizePerson(duo);
    const ts = lastPresence?.[duoKey];
    if (!ts) {
      setDot($("duoDot"), "gray", false);
      return;
    }

    const t = new Date(ts).getTime();
    const age = Date.now() - t;
    if (Number.isFinite(age) && age <= 45000) setDot($("duoDot"), "green", false);
    else setDot($("duoDot"), "gray", false);
  }

  async function presencePing() {
    if (!hasUser()) return;
    try {
      const res = await remotePatchPresence(loadUser().trim());
      if (res?.presence) {
        lastPresence = res.presence;
        updateUserDuoPills();
      }
    } catch {
      // ignore
    }
  }

  function startPresence() {
    if (presenceTimer) return;
    presencePing();
    presenceTimer = setInterval(presencePing, 15000);
  }

  function stopPresence() {
    if (presenceTimer) {
      clearInterval(presenceTimer);
      presenceTimer = null;
    }
  }

  // ---------- Notifications (duo-only unread) ----------
  let prevUnreadCount = 0;

  function duoUnreadIndexes(messages) {
    const user = loadUser().trim().toLowerCase();
    if (!user) return [];

    const lastRead = loadLastRead();
    const dismissed = loadDismissed();
    const idxs = [];
    for (let i = 0; i < messages.length; i++) {
      const from = String(messages[i]?.from || "").trim().toLowerCase();
      const msgKey = getMsgKey(messages[i]);
      // Unread if: from duo, index > lastRead, and not dismissed
      if (from && from !== user && i > lastRead && !dismissed.includes(msgKey)) {
        idxs.push(i);
      }
    }
    return idxs;
  }

  function markReadUpTo(index) {
    const cur = loadLastRead();
    const next = Math.max(cur, index);
    saveLastRead(next);
  }

  function adjustLastReadAfterDelete(deletedIndex) {
    const cur = loadLastRead();
    if (cur < 0) return;
    if (deletedIndex <= cur) saveLastRead(cur - 1);
  }

  function updateNotifications(opts = {}) {
    const { silent = false } = opts;
    const messages = loadMessages();
    const badge = $("notificationBadge");
    const list = $("notificationList");

    const unreadIdxs = duoUnreadIndexes(messages);
    prevUnreadCount = unreadIdxs.length;

    if (unreadIdxs.length > 0) {
      badge.textContent = unreadIdxs.length;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }

    list.innerHTML = "";

    if (!hasUser()) {
      list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted); font-size: 11px;">Pick USER first</div>';
      return;
    }

    const userLower = loadUser().trim().toLowerCase();
    const duoMsgs = messages
      .map((m, i) => ({ m, i }))
      .filter(x => String(x.m?.from || "").trim().toLowerCase() !== userLower);

    if (duoMsgs.length === 0) {
      list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted); font-size: 11px;">No duo messages yet</div>';
      return;
    }

    const lastRead = loadLastRead();

    duoMsgs.slice().reverse().forEach(({ m, i }) => {
      const displayName = m.from || "Unknown";
      const isUnread = i > lastRead;

      const item = document.createElement("div");
      item.className = "notification-item" + (isUnread ? " unread" : "");
      item.innerHTML = `
        <div class="notification-from">FROM: ${escapeHtml(displayName)}</div>
        <div class="notification-preview">${escapeHtml(String(m.content || "").substring(0, 54))}${String(m.content || "").length > 54 ? "..." : ""}</div>
        <div class="notification-time">${escapeHtml(m.timestamp || "")}</div>

        <div class="notification-actions">
          <button class="notif-mini-btn" title="Mark read" data-action="read">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
            </svg>
          </button>
          <button class="notif-mini-btn" title="Delete" data-action="delete">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/>
            </svg>
          </button>
        </div>
      `;

      item.addEventListener("click", () => {
        openMessage(i);
        $("notificationDropdown").classList.remove("active");
      });

      item.querySelector('[data-action="read"]').addEventListener("click", (e) => {
        e.stopPropagation();
        markReadUpTo(i);
        updateNotifications();
        showToast("Marked read");
      });

      // ✅ FIX: Delete only dismisses notification locally, doesn't delete actual message
      item.querySelector('[data-action="delete"]').addEventListener("click", (e) => {
        e.stopPropagation();
        const msgKey = getMsgKey(m);
        dismissNotification(msgKey);
        updateNotifications();
        showToast("Dismissed");
      });

      list.appendChild(item);
    });
  }

  function openMessage(index) {
    // ✅ [BUG 2 FIX] Guard against double-trigger
    if (letterAnimationInProgress) return;

    const messages = loadMessages();
    const msg = messages[index];
    if (!msg) return;

    const safeContent = normalizeNewlines(msg.content ?? "").trim();
    if (!safeContent) {
      // ✅ never open blank letters again
      showToast("That letter is empty (cleaned)");
      return;
    }

    // ✅ [BUG 2 FIX] Lock animation
    letterAnimationInProgress = true;

    const displayName = msg.from || "Unknown";
    $("letterFrom").textContent = displayName.toUpperCase();
    $("letterTimestamp").textContent = msg.timestamp || "";
    $("letterContent").textContent = safeContent;

    // ✅ [FEATURE B] Show attachment in letter if present
    const attachmentContainer = $("letterAttachment");
    if (attachmentContainer) {
      if (msg.attachment) {
        const isVideo = msg.attachmentType === 'video';
        if (isVideo) {
          attachmentContainer.innerHTML = `
            <div class="letter-attachment-label">📎 Video Attachment</div>
            <video controls playsinline class="letter-attachment-media" src="${escapeHtml(msg.attachment)}"></video>
          `;
        } else {
          attachmentContainer.innerHTML = `
            <div class="letter-attachment-label">📎 Image Attachment</div>
            <img class="letter-attachment-media" src="${escapeHtml(msg.attachment)}" alt="Attachment" onclick="openAttachmentModal('${escapeHtml(msg.attachment)}', 'image')">
          `;
        }
        attachmentContainer.classList.remove("hidden");
      } else {
        attachmentContainer.innerHTML = "";
        attachmentContainer.classList.add("hidden");
      }
    }

    const userLower = loadUser().trim().toLowerCase();
    const fromLower = String(msg.from || "").trim().toLowerCase();
    if (userLower && fromLower && fromLower !== userLower) {
      markReadUpTo(index);
      // ✅ Also dismiss this specific notification so it stays read
      dismissNotification(getMsgKey(msg));
      updateNotifications();
    }

    // ✅ [BUG 1 FIX] Reset animations BEFORE showing modal
    const env = document.querySelector(".letter-envelope");
    const paper = document.querySelector(".letter-paper");
    
    $("letterModal").classList.remove("active");
    if (env) env.style.animation = "none";
    if (paper) paper.style.animation = "none";
    void (env?.offsetHeight);
    void (paper?.offsetHeight);
    
    requestAnimationFrame(() => {
      $("letterModal").classList.add("active");
      if (env) env.style.animation = "envelopeOpen 0.5s ease forwards";
      if (paper) paper.style.animation = "letterUnfold 0.5s ease 0.3s forwards";
    });

    // ✅ [BUG 2 FIX] Unlock after animation completes
    setTimeout(() => { letterAnimationInProgress = false; }, 900);
  }

  // ✅ [FEATURE B] Open attachment in fullscreen modal
  window.openAttachmentModal = function(url, type) {
    const modal = $("attachmentModal");
    const content = $("attachmentModalContent");
    if (!modal || !content) return;
    if (type === 'video') {
      content.innerHTML = `<video controls autoplay playsinline class="attachment-fullscreen" src="${escapeHtml(url)}"></video>`;
    } else {
      content.innerHTML = `<img class="attachment-fullscreen" src="${escapeHtml(url)}" alt="Attachment">`;
    }
    modal.classList.add("active");
  };

  function clearAllNotifications() {
    const messages = loadMessages();
    const userLower = loadUser().trim().toLowerCase();
    if (!userLower) return;

    let lastDuo = -1;
    for (let i = 0; i < messages.length; i++) {
      const from = String(messages[i]?.from || "").trim().toLowerCase();
      if (from && from !== userLower) lastDuo = i;
    }
    if (lastDuo >= 0) saveLastRead(lastDuo);
    updateNotifications();
    showToast("All read");
  }

  // ---------- UI render ----------
  function renderActive() {
    const items = loadActive();
    const container = $("itemsActive");
    container.innerHTML = "";

    const withExample = [exampleActive, ...items];

    withExample.forEach((it, idx) => {
      const el = document.createElement("div");
      el.className = "item" + (it.isExample ? " example" : "");
      el.innerHTML = `
        <input type="checkbox" ${it.done ? "checked" : ""} ${it.isExample ? "disabled" : ""} aria-label="Mark done">
        <div class="itext">
          <div class="ititle">
            <span>${escapeHtml(it.title)}</span>
            <span class="itag">${escapeHtml(it.tag || "idea")}</span>
          </div>
          <p class="idesc">${escapeHtml(it.desc || "")}</p>
        </div>
        ${!it.isExample ? '<button class="btn" style="padding:8px 12px;" title="Remove">[X]</button>' : ""}
      `;

      if (!it.isExample) {
        const cb = el.querySelector("input");
        cb.addEventListener("change", () => {
          const itemsNow = loadActive();
          const actualIdx = idx - 1;
          const mission = itemsNow[actualIdx];
          itemsNow.splice(actualIdx, 1);
          saveActive(itemsNow);

          const completed = loadCompleted();
          completed.push({ ...mission, done: true });
          saveCompleted(completed);

          renderActive();
          renderCompleted();
        });

        const rm = el.querySelector("button");
        rm.addEventListener("click", () => {
          const itemsNow = loadActive();
          const actualIdx = idx - 1;
          itemsNow.splice(actualIdx, 1);
          saveActive(itemsNow);
          renderActive();
        });
      }

      container.appendChild(el);
    });
  }

  function renderCompleted() {
    const items = loadCompleted();
    const container = $("itemsCompleted");
    container.innerHTML = "";

    const withExample = [exampleCompleted, ...items];

    withExample.forEach((it, idx) => {
      const el = document.createElement("div");
      el.className = "item" + (it.isExample ? " example" : "");
      el.innerHTML = `
        <div class="itext">
          <div class="ititle">
            <span>${escapeHtml(it.title)}</span>
            <span class="itag">${escapeHtml(it.tag || "idea")}</span>
          </div>
          <p class="idesc">${escapeHtml(it.desc || "")}</p>
        </div>
        ${!it.isExample ? '<button class="btn" style="padding:8px 12px;" title="Undo">UNDO</button>' : ""}
      `;

      if (!it.isExample) {
        const undo = el.querySelector("button");
        undo.addEventListener("click", () => {
          const completedNow = loadCompleted();
          const actualIdx = idx - 1;
          const mission = completedNow[actualIdx];
          completedNow.splice(actualIdx, 1);
          saveCompleted(completedNow);

          const active = loadActive();
          active.push({ ...mission, done: false });
          saveActive(active);

          renderActive();
          renderCompleted();
        });
      }

      container.appendChild(el);
    });
  }

  let lastMsgCount = 0;

  function renderMessages(opts = {}) {
    const { autoScroll = false } = opts;
    const messages = loadMessages();
    const container = $("messageLog");
    container.innerHTML = "";

    // ✅ [FEATURE A] Render newest-first (reverse order)
    const reversed = [...messages].reverse();

    reversed.forEach((msg) => {
      const displayName = msg.from || "Unknown";
      const hasAttachment = !!(msg.attachment);
      const el = document.createElement("div");
      el.className = "message-log-item";
      el.innerHTML = `
        <div class="message-log-header">
          <span>FROM: ${escapeHtml(displayName)} ${hasAttachment ? '<span class="attachment-badge" title="Has attachment">📎</span>' : ''}</span>
          <span>${escapeHtml(msg.timestamp || "")}</span>
        </div>
        <div class="message-log-content">${escapeHtml(msg.content || "")}</div>
        ${hasAttachment ? `<div class="message-attachment-preview" onclick="openAttachmentModal('${escapeHtml(msg.attachment)}', '${escapeHtml(msg.attachmentType || 'image')}')">View Attachment</div>` : ''}
      `;
      container.appendChild(el);
    });

    if (messages.length > 3) container.classList.add("scroll");
    else container.classList.remove("scroll");

    // ✅ [FEATURE A] With newest-first, scroll to TOP for latest
    if (autoScroll || messages.length > lastMsgCount) {
      if (container.classList.contains("scroll")) container.scrollTop = 0;
    }
    lastMsgCount = messages.length;
  }

  function ensureCustomTagsInSelect() {
    const tags = loadCustomTags();
    const select = $("newTag");
    const existing = new Set(Array.from(select.options).map(o => o.value));

    tags.forEach(tag => {
      if (!existing.has(tag)) {
        const opt = document.createElement("option");
        opt.value = tag;
        opt.textContent = tag;
        select.insertBefore(opt, select.lastElementChild);
      }
    });
  }

  // ---------- cover/main toggle ----------
  function openGift() {
    $("cover").classList.add("hidden");
    $("main").classList.remove("hidden");
    $("btnHome").classList.remove("hidden");
    renderActive();
    renderCompleted();
    renderMessages();
    updateNotifications();
  }

  function goHome() {
    $("cover").classList.remove("hidden");
    $("main").classList.add("hidden");
    $("btnHome").classList.add("hidden");
  }

  // ---------- Theme + Snow (christmas only) ----------
  let snowTimer = null;

  function startSnow() {
    if (snowTimer) return;
    snowTimer = setInterval(() => {
      const s = document.createElement("div");
      s.className = "snowflake";
      s.textContent = Math.random() < 0.5 ? "❄" : "✦";
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDuration = (5 + Math.random() * 6) + "s";
      s.style.fontSize = (12 + Math.random() * 14) + "px";
      s.style.opacity = (0.35 + Math.random() * 0.6);
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 12000);
    }, 220);
  }

  function stopSnow() {
    if (snowTimer) {
      clearInterval(snowTimer);
      snowTimer = null;
    }
    document.querySelectorAll(".snowflake").forEach(s => s.remove());
  }

  function applyTheme(theme) {
    currentTheme = theme;

    if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else if (theme === "christmas") document.documentElement.setAttribute("data-theme", "christmas");
    else document.documentElement.removeAttribute("data-theme");

    document.querySelectorAll(".theme-option").forEach(opt => {
      opt.classList.toggle("active", opt.dataset.theme === theme);
    });

    if (theme === "christmas") startSnow();
    else stopSnow();
  }

  // ---------- 2026 tracker ----------
  function updateTracker() {
    const now = new Date();
    $("trackerNow").textContent = formatDT(now);

    const start2026 = new Date("2026-01-01T00:00:00");
    const end2026 = new Date("2027-01-01T00:00:00");

    if (now < start2026) {
      const diff = start2026.getTime() - now.getTime();
      const days = Math.floor(diff / (24*60*60*1000));
      $("trackerRemaining").textContent = `${days}d UNTIL 2026`;
      $("trackerElapsed").textContent = "NOT STARTED";
      $("trackerFill").style.width = "0%";
      return;
    }

    const elapsedMs = now.getTime() - start2026.getTime();
    const totalMs = end2026.getTime() - start2026.getTime();
    const pct = Math.max(0, Math.min(1, elapsedMs / totalMs));
    const daysElapsed = Math.floor(elapsedMs / (24*60*60*1000));
    const daysLeft = Math.max(0, Math.floor((end2026.getTime() - now.getTime()) / (24*60*60*1000)));

    $("trackerRemaining").textContent = `${daysLeft}d LEFT`;
    $("trackerElapsed").textContent = `${daysElapsed}d`;
    $("trackerFill").style.width = `${Math.round(pct * 1000) / 10}%`;
  }

  // ---------- Shared sync ----------
  let suppressSync = false;
  let syncDebounce = null;

  function getLocalState() {
    // ✅ always sanitize before pushing (prevents blank letters from ever syncing)
    const cleanedMessages = sanitizeMessages(loadMessages());
    if (cleanedMessages.length !== loadMessages().length) {
      localStorage.setItem(KEY_MESSAGES, JSON.stringify(cleanedMessages));
      clampLastReadToMessagesLen(cleanedMessages.length);
    }

    return {
      active: loadActive(),
      saved: loadSaved(),
      completed: loadCompleted(),
      messages: cleanedMessages,
      customTags: loadCustomTags(),
      systemMessage: loadSystemMessage(),
    };
  }

  function applyStateToLocal(state) {
    if (!state || typeof state !== "object") return { cleaned: false };

    let cleaned = false;

    suppressSync = true;

    if (Array.isArray(state.active)) localStorage.setItem(KEY_ACTIVE, JSON.stringify(state.active));
    if (Array.isArray(state.saved)) localStorage.setItem(KEY_SAVED, JSON.stringify(state.saved));
    if (Array.isArray(state.completed)) localStorage.setItem(KEY_COMPLETED, JSON.stringify(state.completed));
    if (Array.isArray(state.customTags)) localStorage.setItem(KEY_CUSTOM_TAGS, JSON.stringify(state.customTags));
    if (typeof state.systemMessage === "string") localStorage.setItem(KEY_SYSTEM_MESSAGE, state.systemMessage);

    // ✅ sanitize messages from remote too
    if (Array.isArray(state.messages)) {
      const clean = sanitizeMessages(state.messages);
      if (clean.length !== state.messages.length) cleaned = true;
      localStorage.setItem(KEY_MESSAGES, JSON.stringify(clean));
      clampLastReadToMessagesLen(clean.length);
    }

    suppressSync = false;

    return { cleaned };
  }

  async function remoteGetState() {
    const res = await fetch(`/.netlify/functions/room?room=${encodeURIComponent(ROOM_CODE)}`);
    if (!res.ok) throw new Error("Remote get failed");
    const data = await res.json();

    lastPresence = data?.presence || lastPresence;

    return {
      payload: data.payload || null,
      updated_at: data.updated_at || null
    };
  }

  async function remoteSetState(payload) {
    const res = await fetch(`/.netlify/functions/room`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: ROOM_CODE, payload })
    });
    if (!res.ok) throw new Error("Remote set failed");
    const data = await res.json();
    lastPresence = data?.presence || lastPresence;
    return data; // { ok, payload, presence, updated_at }
  }

  async function remotePatchPresence(userName) {
    const res = await fetch(`/.netlify/functions/room`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: ROOM_CODE, presence: { user: userName } })
    });
    if (!res.ok) throw new Error("Presence patch failed");
    const data = await res.json();
    return data;
  }

  async function pullRemoteState(opts = {}) {
    const silent = !!opts.silent;

    try {
      const remote = await remoteGetState();
      if (!remote || !remote.payload) {
        if (!silent) setSyncStatus("on");
        return;
      }

      // 🔒 Skip if nothing changed (no UI spam)
      if (remote.updated_at && remote.updated_at === lastRemoteUpdatedAt) {
        if (!silent) setSyncStatus("on");
        return;
      }

      // only show "pull" if something ACTUALLY changed (seamless)
      setSyncStatus("pulling");

      lastRemoteUpdatedAt = remote.updated_at;

      const { cleaned } = applyStateToLocal(remote.payload);

      ensureCustomTagsInSelect();
      renderSystemMessage(loadSystemMessage());
      renderActive();
      renderCompleted();
      renderMessages(); // do NOT autoscroll on remote updates
      // ✅ [FEATURE C] Pass silent flag to avoid sound on background pulls
      updateNotifications({ silent });
      updateUserDuoPills();

      setSyncStatus("on");

      // ✅ if we cleaned blank letters, push once to make the room clean forever
      if (cleaned) {
        schedulePush();
      }
    } catch {
      setSyncStatus("error");
    }
  }

  async function pushRemoteState() {
    if (suppressSync) return;
    try {
      setSyncStatus("saving");
      const data = await remoteSetState(getLocalState());

      // ✅ update local poll version so we don't re-apply our own push
      if (data?.updated_at) lastRemoteUpdatedAt = data.updated_at;

      setSyncStatus("on");
      updateUserDuoPills();
    } catch {
      setSyncStatus("error");
    }
  }

  function schedulePush() {
    if (suppressSync) return;
    clearTimeout(syncDebounce);
    syncDebounce = setTimeout(pushRemoteState, 350); // faster + still stable
  }

  // ✅ SMART polling loop
  function startSmartPolling() {
    if (pollTimer) return;

    pollTimer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      pullRemoteState({ silent: true });
    }, 2500); // 2.5s = fast + battery-friendly
  }

  // ---------- Who modal ----------
  function openWhoModal() {
    $("whoModal").classList.add("active");
    $("whoModal").setAttribute("aria-hidden", "false");
    $("btnLogOff").classList.toggle("hidden", !hasUser());
  }

  function closeWhoModal() {
    $("whoModal").classList.remove("active");
    $("whoModal").setAttribute("aria-hidden", "true");
  }

  async function setUserAndStart(name) {
    saveUser(name);

    $("closeWhoModal").classList.remove("hidden");
    closeWhoModal();

    updateUserDuoPills();

    setSyncStatus("pulling");
    await pullRemoteState({ silent: false });

    startPresence();
    showToast(`USER SET: ${String(name).toUpperCase()}`);
  }

  function logOffUser() {
    clearUser();
    stopPresence();
    updateUserDuoPills();
    openWhoModal();
    $("closeWhoModal").classList.add("hidden");
    showToast("LOGGED OFF");
  }

  // ✅ [FEATURE B] Upload file to Supabase Storage
  async function uploadToSupabase(file) {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const url = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type,
        'x-upsert': 'true'
      },
      body: file
    });
    
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upload failed: ${err}`);
    }
    
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
  }

  // ✅ [FEATURE B] Current attachment state
  let pendingAttachment = null;
  let pendingAttachmentType = null;

  // ---------- Wire up events ----------
  $("btnOpen").addEventListener("click", openGift);
  $("btnHome").addEventListener("click", goHome);

  // ✅ [BUG 1 FIX] iOS Safari keyboard bug - removed setTimeout, focus must be synchronous to preserve gesture context
function openSystemMessageModal() {
  const modal = $("systemMessageModal");
  const input = $("systemMessageInput");
  input.value = loadSystemMessage() || "";
  // ✅ [FEATURE E] Update character counter
  updateCharCounter(input.value.length);
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  // Focus immediately to preserve user gesture context on iOS
  input.focus();
}

// ✅ [FEATURE E] Update character counter - shows "X / 30"
function updateCharCounter(len) {
  const counter = $("charCounter");
  if (!counter) return;
  counter.textContent = `${len} / 30`;
  counter.style.color = len >= 25 ? "var(--accent)" : "var(--muted)";
}

function closeSystemMessageModal() {
  const modal = $("systemMessageModal");
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

async function saveSystemMessageFromModal() {
  const input = $("systemMessageInput");
  const msg = (input.value || "").trim();
  if (!msg) return showToast("Type a message first.");
  showToast("Updating system message...");
  saveSystemMessageLocalOnly(msg);
  renderSystemMessage(msg);
  closeSystemMessageModal();
  await pushRemoteState();
  showToast("System message updated.");
}

$("btnEditSystemMessage").addEventListener("click", openSystemMessageModal);
$("closeSystemMessageModal").addEventListener("click", closeSystemMessageModal);
$("btnSystemMessageCancel").addEventListener("click", closeSystemMessageModal);
$("btnSystemMessageSave").addEventListener("click", saveSystemMessageFromModal);

$("systemMessageModal").addEventListener("click", (e) => {
  if (e.target && e.target.id === "systemMessageModal") closeSystemMessageModal();
});

$("systemMessageInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    saveSystemMessageFromModal();
  } else if (e.key === "Escape") {
    closeSystemMessageModal();
  }
});

// ✅ [FEATURE E] Live character counter update
$("systemMessageInput").addEventListener("input", (e) => {
  const len = (e.target.value || "").length;
  updateCharCounter(len);
  if (len > 30) {
    e.target.value = e.target.value.substring(0, 30);
    updateCharCounter(30);
  }
});

$("userPill").addEventListener("click", () => openWhoModal());

  $("btnWhoYasir").addEventListener("click", () => setUserAndStart("Yasir"));
  $("btnWhoKylee").addEventListener("click", () => setUserAndStart("Kylee"));
  $("closeWhoModal").addEventListener("click", () => closeWhoModal());
  $("btnLogOff").addEventListener("click", () => logOffUser());

  $("btnAdd").addEventListener("click", () => {
    if (!hasUser()) { showToast("Pick USER first"); return; }

    const title = $("newTitle").value.trim();
    const desc = $("newDesc").value.trim();
    const tagSelect = $("newTag");
    let tag = tagSelect.value;

    if (tag === "custom") {
      tag = $("customTagInput").value.trim() || "custom";
      const customTags = loadCustomTags();
      if (!customTags.includes(tag)) {
        customTags.push(tag);
        saveCustomTags(customTags);
        const opt = document.createElement("option");
        opt.value = tag;
        opt.textContent = tag;
        tagSelect.insertBefore(opt, tagSelect.lastElementChild);
      }
    }

    if (!title) return alert("Add a title first");

    const mission = { title, desc, tag, done: false };

    const active = loadActive();
    active.push(mission);
    saveActive(active);

    const saved = loadSaved();
    const isDuplicate = saved.some(s => s.title === mission.title && s.desc === mission.desc && s.tag === mission.tag);
    if (!isDuplicate) {
      saved.push(mission);
      saveSaved(saved);
    }

    $("newTitle").value = "";
    $("newDesc").value = "";
    $("newTag").value = "date";
    $("customTagInput").value = "";
    $("customTagField").classList.add("hidden");

    renderActive();
  });

  $("btnClearFields").addEventListener("click", () => {
    $("newTitle").value = "";
    $("newDesc").value = "";
    $("newTag").value = "date";
    $("customTagInput").value = "";
    $("customTagField").classList.add("hidden");
  });

  $("newTag").addEventListener("change", (e) => {
    if (e.target.value === "custom") $("customTagField").classList.remove("hidden");
    else $("customTagField").classList.add("hidden");
  });

  document.querySelectorAll(".mission-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".mission-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      if (tab.dataset.tab === "active") {
        $("activeTab").classList.remove("hidden");
        $("completedTab").classList.add("hidden");
      } else {
        $("activeTab").classList.add("hidden");
        $("completedTab").classList.remove("hidden");
      }
    });
  });

  $("btnAddSaved").addEventListener("click", () => {
    const saved = loadSaved();
    const container = $("savedMissionsList");
    container.innerHTML = "";
    selectedSavedMissions = [];

    if (saved.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center;">No saved missions yet. Add one first!</p>';
    } else {
      saved.forEach((mission, idx) => {
        const card = document.createElement("div");
        card.className = "saved-mission-card";
        card.dataset.idx = idx;
        card.innerHTML = `
          <div class="saved-mission-header">
            <div class="itext">
              <div class="ititle">
                <span>${escapeHtml(mission.title)}</span>
                <span class="itag">${escapeHtml(mission.tag)}</span>
              </div>
              <p class="idesc">${escapeHtml(mission.desc || "")}</p>
            </div>
            <div class="saved-mission-actions">
              <button class="btn" data-action="select">SELECT</button>
              <button class="btn" data-action="edit">EDIT & ADD</button>
            </div>
          </div>
        `;

        card.querySelector('[data-action="select"]').addEventListener("click", () => {
          if (selectedSavedMissions.includes(idx)) {
            selectedSavedMissions = selectedSavedMissions.filter(i => i !== idx);
            card.classList.remove("selected");
          } else {
            selectedSavedMissions.push(idx);
            card.classList.add("selected");
          }
        });

        card.querySelector('[data-action="edit"]').addEventListener("click", () => {
          $("newTitle").value = mission.title;
          $("newDesc").value = mission.desc;

          const tagSelect = $("newTag");
          const hasTag = Array.from(tagSelect.options).some(opt => opt.value === mission.tag);
          if (hasTag) {
            tagSelect.value = mission.tag;
          } else {
            tagSelect.value = "custom";
            $("customTagField").classList.remove("hidden");
            $("customTagInput").value = mission.tag;
          }

          $("savedMissionsModal").classList.remove("active");
          alert("Mission loaded for editing. Click 'Add Mission' to add the edited version to Active list.");
        });

        container.appendChild(card);
      });
    }

    $("savedMissionsModal").classList.add("active");
  });

  $("btnAddSelectedMissions").addEventListener("click", () => {
    if (selectedSavedMissions.length === 0) return alert("Please select at least one mission");

    const saved = loadSaved();
    const active = loadActive();

    selectedSavedMissions.forEach(idx => {
      const mission = saved[idx];
      active.push({ ...mission, done: false });
    });

    saveActive(active);
    renderActive();
    $("savedMissionsModal").classList.remove("active");
    selectedSavedMissions = [];
  });

  $("closeSavedModal").addEventListener("click", () => {
    $("savedMissionsModal").classList.remove("active");
  });

  // ✅ [FEATURE B] Handle attachment file selection with Supabase Storage
  const attachInput = $("attachmentInput");
  if (attachInput) {
    attachInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      const preview = $("attachmentPreview");
      
      if (!file) {
        pendingAttachment = null;
        pendingAttachmentType = null;
        if (preview) preview.classList.add("hidden");
        return;
      }
      
      // ✅ Only one attachment allowed - clear any existing
      if (pendingAttachment) {
        showToast("Replacing previous attachment");
      }
      
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      
      if (!isVideo && !isImage) {
        showToast("Only images and videos allowed");
        e.target.value = "";
        return;
      }
      
      // Size check with clear message
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast(isVideo ? "Video too large (max 50MB)" : "Image too large (max 10MB)");
        e.target.value = "";
        return;
      }
      
      if (preview) {
        preview.innerHTML = `<span>📎 Uploading ${escapeHtml(file.name)}...</span>`;
        preview.classList.remove("hidden");
      }
      
      try {
        const publicUrl = await uploadToSupabase(file);
        pendingAttachment = publicUrl;
        pendingAttachmentType = isVideo ? "video" : "image";
        
        if (preview) {
          preview.innerHTML = `<span>📎 ${escapeHtml(file.name)}</span><button type="button" class="btn" id="clearAttachment">✕</button>`;
          $("clearAttachment").addEventListener("click", () => {
            pendingAttachment = null;
            pendingAttachmentType = null;
            attachInput.value = "";
            preview.classList.add("hidden");
          });
        }
        showToast("Attachment ready");
      } catch (err) {
        console.error("Upload error:", err);
        showToast("Upload failed: " + (err.message || "Unknown error"));
        pendingAttachment = null;
        pendingAttachmentType = null;
        e.target.value = "";
        if (preview) preview.classList.add("hidden");
      }
    });
  }

  $("btnSaveNote").addEventListener("click", () => {
    if (!hasUser()) { showToast("Pick USER first"); return; }

    const content = normalizeNewlines($("customNote").value).trim();
    if (!content) {
      showToast("Can't send a blank letter");
      return;
    }

    const from = loadUser().trim();
    if (!from) { showToast("Pick USER first"); return; }

    const timestamp = formatDT(new Date());
    const messages = loadMessages();
    
    // ✅ [FEATURE B] Include attachment URL if present
    const newMsg = { from, timestamp, content };
    if (pendingAttachment) {
      newMsg.attachment = pendingAttachment;
      newMsg.attachmentType = pendingAttachmentType;
    }
    messages.push(newMsg);

    // ✅ sanitize immediately (prevents any empty record)
    const cleaned = sanitizeMessages(messages);
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(cleaned));

    $("customNote").value = "";
    
    // ✅ [FEATURE B] Clear attachment after send
    pendingAttachment = null;
    pendingAttachmentType = null;
    const attachInputEl = $("attachmentInput");
    if (attachInputEl) attachInputEl.value = "";
    const preview = $("attachmentPreview");
    if (preview) preview.classList.add("hidden");
    
    renderMessages({ autoScroll: true });
    updateNotifications();
    showToast("Letter sent");
    schedulePush();
  });

  $("envelopeBtn").addEventListener("click", () => {
    if (!hasUser()) { showToast("Pick USER first"); return; }

    const messages = loadMessages();
    const userLower = loadUser().trim().toLowerCase();

    let idx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      const fromLower = String(messages[i]?.from || "").trim().toLowerCase();
      const c = normalizeNewlines(messages[i]?.content ?? "").trim();
      if (fromLower && fromLower !== userLower && c) { idx = i; break; }
    }

    if (idx >= 0) openMessage(idx);
    else showToast("No duo letters yet");
  });

  $("notificationBell").addEventListener("click", () => {
    $("notificationDropdown").classList.toggle("active");
  });

  $("btnNotifClearAll").addEventListener("click", (e) => {
    e.stopPropagation();
    clearAllNotifications();
  });

  $("closeLetterModal").addEventListener("click", () => {
    $("letterModal").classList.remove("active");
    // ✅ [BUG 2 FIX] Reset animation lock when closing
    letterAnimationInProgress = false;
  });

  // ✅ [FEATURE B] Close attachment modal
  const closeAttachmentModal = $("closeAttachmentModal");
  if (closeAttachmentModal) {
    closeAttachmentModal.addEventListener("click", () => {
      $("attachmentModal").classList.remove("active");
    });
  }
  
  const attachmentModal = $("attachmentModal");
  if (attachmentModal) {
    attachmentModal.addEventListener("click", (e) => {
      if (e.target === attachmentModal) {
        attachmentModal.classList.remove("active");
      }
    });
  }

  $("btnDownloadText").addEventListener("click", () => {
    const active = loadActive();
    const completed = loadCompleted().filter(c => !c.isExample);

    const text = `kywee + yessir bucket list - 2026
====================

SYSTEM MESSAGE:
${loadSystemMessage()}

ACTIVE MISSIONS:
${active.map(i => `[ ] ${i.title} — ${i.desc} (#${i.tag})`).join("\n")}

COMPLETED MISSIONS:
${completed.map(i => `[X] ${i.title} — ${i.desc} (#${i.tag})`).join("\n")}
`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kywee-yessir-bucket-list-2026.txt";
    a.click();
    URL.revokeObjectURL(url);
  });

  $("themeBtn").addEventListener("click", () => {
    $("themeDropdown").classList.toggle("active");
  });

  document.querySelectorAll(".theme-option").forEach(option => {
    option.addEventListener("click", () => {
      const theme = option.dataset.theme;
      saveTheme(theme);
      applyTheme(theme);
      $("themeDropdown").classList.remove("active");
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".theme-switcher")) $("themeDropdown").classList.remove("active");
    if (!e.target.closest("#notificationBell") && !e.target.closest("#notificationDropdown")) {
      $("notificationDropdown").classList.remove("active");
    }
  });

  // Pull on focus (fast)
  window.addEventListener("focus", () => {
    pullRemoteState({ silent: false });
  });

  // when coming back visible, do a quick pull
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") pullRemoteState({ silent: false });
  });

  // ---------- Init ----------
  (function init() {
    ensureCustomTagsInSelect();

    const theme = loadTheme();
    applyTheme(theme);

    renderSystemMessage(loadSystemMessage());
    
    // ✅ [FEATURE D] Set daily emoticon
    const emoticonEl = $("dailyEmoticon");
    if (emoticonEl) {
      emoticonEl.textContent = getDailyEmoticon();
    }

    setSyncStatus("off");
    updateUserDuoPills();
    updateNotifications();
    updateTracker();
    setInterval(updateTracker, 1000);

    // start polling always (cover + main stay synced)
    startSmartPolling();

    // pull once on load
    pullRemoteState({ silent: false });

    // ✅ IMPORTANT: remember user on refresh (no re-asking)
    // - if sessionStorage has user: don't show modal
    // - if fresh tab/device: modal opens
    if (!hasUser()) {
      stopPresence();
      openWhoModal();
      $("closeWhoModal").classList.add("hidden");
    } else {
      $("closeWhoModal").classList.remove("hidden");
      startPresence();
      updateUserDuoPills();
    }
  })();
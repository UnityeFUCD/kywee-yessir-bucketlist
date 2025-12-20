// ---------- Local keys ----------
  const KEY_ACTIVE = "bucketlist_2026_active";
  const KEY_SAVED = "bucketlist_2026_saved";
  const KEY_COMPLETED = "bucketlist_2026_completed";
  const KEY_MESSAGES = "bucketlist_2026_messages";
  const KEY_CUSTOM_TAGS = "bucketlist_2026_custom_tags";
  const KEY_THEME = "bucketlist_2026_theme";
  const KEY_SYSTEM_MESSAGE = "bucketlist_2026_system_message";
  const KEY_LAST_VERSION_SEEN = "bucketlist_2026_last_version";
  const KEY_PHOTOS = "bucketlist_2026_photos";
  const KEY_READ_SYSTEM_NOTIFS = "bucketlist_2026_read_system_notifs"; // [FIX] Track read system notifications

  // [OK] VERSION HISTORY for system update notifications
  const VERSION_HISTORY = [
    { version: "1.0.0", date: "2024-12-15", note: "Initial release with missions, messages, and sync" },
    { version: "1.1.0", date: "2024-12-16", note: "Added attachments, daily emoticons, and character limits" },
    { version: "1.2.0", date: "2024-12-17", note: "New: Mini calendar, date picker, user colors, and stacking toasts" },
    { version: "1.3.0", date: "2024-12-19", note: "Fixed: Instant device conflict detection (~3s auto-resolve)" }
  ];
  const CURRENT_VERSION = "1.3.0";

  // [OK] UPCOMING EVENTS (add your special dates here!)
  // type: "holiday" for special holidays (distinct styling), "event" for other events
  const UPCOMING_EVENTS = [
    { date: "2025-01-01", title: "New Year's Day", type: "holiday", icon: "🎆" },
    { date: "2025-02-14", title: "Valentine's Day", type: "holiday", icon: "💕" },
    { date: "2025-12-25", title: "Christmas", type: "holiday", icon: "🎄" }
  ];

  // [FIX] Device-based user (like YouTube) - persists across all tabs on same device
  const KEY_CURRENT_USER = "bucketlist_2026_current_user";

  // [OK] per-user "read" tracking (local only)
  function keyLastRead(user) {
    return `bucketlist_2026_lastread_${String(user || "").toLowerCase()}`;
  }

  // [OK] per-user dismissed notifications (local only - doesn't delete messages)
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
  function dismissNotification(msgId) {
    const dismissed = loadDismissed();
    if (!dismissed.includes(msgId)) {
      dismissed.push(msgId);
      saveDismissed(dismissed);
    }
  }
  function getMsgId(msg, idx) {
    // Unique ID based on content + timestamp + index
    return `${msg.timestamp}_${idx}_${(msg.content || "").substring(0,20)}`;
  }

  // [FIX] System notification read tracking (for bell badge)
  function getSystemNotifId(notif) {
    // Stable ID for system notifications (date-based for events)
    return `${notif.type}_${notif.title}_${notif.date || ''}`;
  }
  function loadReadSystemNotifs() {
    const u = loadUser();
    if (!u) return [];
    try { return JSON.parse(localStorage.getItem(`${KEY_READ_SYSTEM_NOTIFS}_${u.toLowerCase()}`)) || []; } catch { return []; }
  }
  function saveReadSystemNotifs(arr) {
    const u = loadUser();
    if (!u) return;
    localStorage.setItem(`${KEY_READ_SYSTEM_NOTIFS}_${u.toLowerCase()}`, JSON.stringify(arr));
  }
  function markSystemNotifRead(notifId) {
    const read = loadReadSystemNotifs();
    if (!read.includes(notifId)) {
      read.push(notifId);
      saveReadSystemNotifs(read);
    }
  }
  function isSystemNotifRead(notifId) {
    return loadReadSystemNotifs().includes(notifId);
  }
  function markAllSystemNotifsRead(notifs) {
    const read = loadReadSystemNotifs();
    notifs.forEach(n => {
      const id = getSystemNotifId(n);
      if (!read.includes(id)) read.push(id);
    });
    saveReadSystemNotifs(read);
  }

  // [OK] shared room code
  const ROOM_CODE = "yasir-kylee";

  // [OK] [SUPABASE STORAGE CONFIG]
  const SUPABASE_URL = "https://pkgrlhwnwqtffdmcyqbk.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZ3JsaHdud3F0ZmZkbWN5cWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MDU2MjMsImV4cCI6MjA4MTI4MTYyM30.aZ8E_BLQW-90-AAJeneXmKnsfZ8LmPkdQ5ERAZ9JHNE";
  const STORAGE_BUCKET = "attachments";
  const PHOTOS_BUCKET = "photos";

  // [OK] Initialize Supabase client for Realtime Presence (WebSocket)
  // Avoid clashing with CDN's global `supabase` identifier
  const sbClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  const $ = (id) => document.getElementById(id);

  // [OK] Daily rotating ASCII art emoticons (larger braille art)
const DAILY_EMOTICONS = [
`⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⣀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⣄⠀⠀⠀⠀
⠀⠀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀
⠀⣼⣿⣿⣿⣿⣿⣿⠟⠁⠀⠀⠈⠻⣿⣿⣿⣿⣿⣿⣿⣧⠀
⢰⣿⣿⣿⣿⣿⣿⠃⠀⣠⣤⣤⣄⠀⠘⣿⣿⣿⣿⣿⣿⣿⡆
⣿⣿⣿⣿⣿⣿⡏⠀⠀⠿⠀⠀⠿⠀⠀⢹⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿
⠸⣿⣿⣿⣿⣿⣿⣆⠀⠀⢀⣀⡀⠀⣰⣿⣿⣿⣿⣿⣿⣿⠇
⠀⠻⣿⣿⣿⣿⣿⣿⣿⣶⣤⣤⣴⣾⣿⣿⣿⣿⣿⣿⣿⠟⠀
⠀⠀⠈⠛⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠛⠁⠀⠀
⠀⠀⠀⠀⠀⠀⠉⠙⠛⠿⠿⠿⠿⠛⠛⠉⠁⠀⠀⠀⠀⠀⠀
         💕 LOVE 💕`,
`⠀⠀⠀⠀⠀⠀⣀⣤⣴⣶⣶⣶⣦⣤⣀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀
⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀
⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀⠀
⠀⠀⣿⣿⣿⡏⠉⠀⠀⠉⠉⠉⠀⠀⠉⢹⣿⣿⣿⠀⠀
⠀⠀⣿⣿⣿⡇⠀⣷⠀⠀⠀⠀⠀⣾⠀⢸⣿⣿⣿⠀⠀
⠀⠀⣿⣿⣿⣇⠀⠀⠀⣀⣀⣀⠀⠀⠀⣸⣿⣿⣿⠀⠀
⠀⠀⢿⣿⣿⣿⣆⠀⠀⠛⠛⠀⠀⠀⣰⣿⣿⣿⡿⠀⠀
⠀⠀⠘⣿⣿⣿⣿⣷⣤⣀⣀⣀⣤⣾⣿⣿⣿⣿⠃⠀⠀
⠀⠀⠀⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠉⠛⠻⠿⠿⠿⠟⠛⠉⠀⠀⠀⠀⠀⠀
         🥰 CUTE 🥰`,
`⠀⠀⣀⣤⣴⣶⣶⣶⣶⣶⣶⣦⣤⣀⠀⠀
⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄
⣿⣿⣿⡿⠛⠉⠉⠉⠉⠉⠉⠛⢿⣿⣿⣿
⣿⣿⠏⠀⣠⣶⣦⠀⣠⣶⣦⠀⠀⢻⣿⣿
⣿⣿⠀⠀⠹⣿⡿⠀⠹⣿⡿⠀⠀⠀⣿⣿
⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿
⠻⣿⣿⣿⣶⣤⣤⣤⣤⣤⣤⣶⣿⣿⣿⠟
⠀⠈⠛⠿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠁⠀
         ✨ HAPPY ✨`,
`⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⠿⠛⠛⠛⠛⠛⠛⠿⣿⣿⣿⣿
⣿⣿⠟⠁⠀⣀⣀⠀⠀⣀⣀⠀⠈⠻⣿⣿
⣿⡏⠀⠀⠀⣿⣿⠀⠀⣿⣿⠀⠀⠀⢹⣿
⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿
⣿⣿⡄⠀⠀⠀⢀⣀⣀⡀⠀⠀⠀⢠⣿⣿
⣿⣿⣿⣶⣤⣤⣤⣤⣤⣤⣤⣤⣶⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
         🌟 SMILE 🌟`,
`⠀⠀⠀⣠⣴⣶⣶⣶⣶⣦⣄⠀⠀⠀
⠀⢀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀
⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀
⢠⣿⣿⠋⠀⠀❤️⠀⠀❤️⢹⣿⡄
⢸⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇
⠘⣿⣿⣧⡀⠀⠀⠀⠀⠀⢀⣼⣿⠃
⠀⠻⣿⣿⣿⣶⣤⣤⣴⣶⣿⣿⠟⠀
⠀⠀⠈⠛⠿⣿⣿⣿⣿⠿⠛⠁⠀⠀
       💖 KISSES 💖`,
`⠀⠀⠀⠀⢀⣀⣀⣀⣀⣀⡀⠀⠀⠀⠀
⠀⠀⢀⣴⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀
⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀
⣼⣿⣿⣿⡟⠁⠀⠀⠈⢻⣿⣿⣿⣿⣧
⣿⣿⣿⣿⠀⠀⣶⣶⠀⠀⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣷⣄⠀⠀⣠⣾⣿⣿⣿⣿⣿
⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟
⠀⠙⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠋⠀
       💝 SWEET 💝`,
`⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⡿⠛⠛⠛⠛⠛⠛⠛⠛⠛⢿⣿⣿⣿
⣿⣿⠀⠀⣴⣶⠀⠀⣴⣶⠀⠀⠀⣿⣿⣿
⣿⣿⠀⠀⠛⠋⠀⠀⠛⠋⠀⠀⠀⣿⣿⣿
⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿
⣿⣿⣇⠀⠀⠲⠶⠶⠖⠀⠀⠀⣸⣿⣿⣿
⣿⣿⣿⣷⣤⣀⣀⣀⣀⣤⣤⣾⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
        🎀 PRETTY 🎀`
];

  // [OK] Prevent double-trigger of letter animation
  let letterAnimationInProgress = false;

  const exampleActive = { title: "Test Mission (Example)", desc: "This is an example card", tag: "example", dueDate: "2025-01-15", done: false, isExample: true };
  const exampleCompleted = { title: "Test Completed (Example)", desc: "This is a completed example", tag: "example", done: true, isExample: true };

  let selectedSavedMissions = [];
  let currentTheme = "system";

  // [OK] SMART POLLING state
  let lastRemoteUpdatedAt = null;
  let lastPresenceVersion = 0;
  let pollTimer = null;

  // ---------- helpers ----------
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // [OK] Toast container for stacking notifications
  function ensureToastContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type = "default") {
    const container = ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    // Auto remove after 3s
    setTimeout(() => {
      toast.classList.add("toast-exit");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // [OK] Check for system updates (new version)
  function checkSystemUpdates() {
    const lastSeen = localStorage.getItem(KEY_LAST_VERSION_SEEN);
    if (lastSeen !== CURRENT_VERSION) {
      const latest = VERSION_HISTORY[VERSION_HISTORY.length - 1];
      showToast(`[!] Update v${latest.version}: ${latest.note}`, "info");
      localStorage.setItem(KEY_LAST_VERSION_SEEN, CURRENT_VERSION);
    }
  }

  // [OK] Check for upcoming events (3 days & 24 hours out)
  function checkUpcomingEvents() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    UPCOMING_EVENTS.forEach(event => {
      const eventDate = new Date(event.date + "T00:00:00");
      const diffMs = eventDate - today;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 3) {
        showToast(`[CAL] 3 days until ${event.title}!`, "event");
      } else if (diffDays === 1) {
        showToast(`[!] Tomorrow: ${event.title}!`, "event");
      } else if (diffDays === 0) {
        showToast(` Today is ${event.title}!`, "event");
      }
    });
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

  // [OK] [FEATURE D] Get daily emoticon based on date
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
  // [FIX] User login persists across all tabs (like YouTube)
  function loadUser() { return localStorage.getItem(KEY_CURRENT_USER) || ""; }
  function hasUser() { return !!loadUser().trim(); }
  function saveUser(name) { localStorage.setItem(KEY_CURRENT_USER, name); }
  function clearUser() { localStorage.removeItem(KEY_CURRENT_USER); }

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
    // [OK] Sync to server so other devices get updated read state
    schedulePush();
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

  // [OK] Photo Gallery functions
  function loadPhotos() { return loadArray(KEY_PHOTOS); }
  function savePhotos(photos) { saveArray(KEY_PHOTOS, photos); }

  async function uploadPhotoToSupabase(file) {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const url = `${SUPABASE_URL}/storage/v1/object/${PHOTOS_BUCKET}/${filename}`;
    
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
    
    return `${SUPABASE_URL}/storage/v1/object/public/${PHOTOS_BUCKET}/${filename}`;
  }

  function renderPhotoGallery() {
    const container = $("photoGallery");
    if (!container) return;
    
    const photos = loadPhotos();
    
    // [OK] Save expanded state before re-render
    const expandedBundles = {};
    container.querySelectorAll('.gallery-mission-bundle').forEach(bundle => {
      const missionKey = bundle.dataset.mission;
      const photosDiv = bundle.querySelector('.bundle-photos');
      if (missionKey && photosDiv && !photosDiv.classList.contains('collapsed')) {
        expandedBundles[missionKey] = true;
      }
    });
    
    // Keep the example bundle
    const exampleBundle = container.querySelector('.example-bundle');
    const emptyNote = container.querySelector('.gallery-empty-note');
    container.innerHTML = "";
    if (exampleBundle) container.appendChild(exampleBundle);
    
    if (photos.length === 0) {
      if (emptyNote) container.appendChild(emptyNote);
      else {
        const note = document.createElement("div");
        note.className = "gallery-empty-note";
        note.textContent = "-> Click to expand. Your memories will appear below.";
        container.appendChild(note);
      }
      return;
    }
    
    // Group photos by mission (or "Unlinked" if no mission)
    const grouped = {};
    photos.forEach(p => {
      const key = p.mission || "_unlinked_";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });
    
    // Render each mission bundle
    Object.keys(grouped).forEach(missionKey => {
      const missionPhotos = grouped[missionKey];
      const isUnlinked = missionKey === "_unlinked_";
      const displayName = isUnlinked ? "Unlinked Photos" : missionKey;
      const photoCount = missionPhotos.length;
      // [OK] Allow adding to unlinked photos too (no limit for unlinked)
      const canAddMore = isUnlinked || photoCount < 5;
      
      // [OK] Check if this bundle was expanded before re-render
      const wasExpanded = expandedBundles[missionKey] === true;
      
      const bundle = document.createElement("div");
      bundle.className = "gallery-mission-bundle";
      bundle.dataset.mission = missionKey;
      bundle.innerHTML = `
        <div class="bundle-header">
          <div class="bundle-header-left" onclick="toggleBundle(this.parentElement)">
            <span class="bundle-mission"><i class="fa-solid fa-${isUnlinked ? 'images' : 'link'}"></i> ${escapeHtml(displayName)}</span>
            <span class="bundle-count">${isUnlinked ? photoCount : photoCount + '/5'} photos</span>
          </div>
          <div class="bundle-actions">
            ${canAddMore ? `<button class="bundle-add-btn" title="Add more photos${isUnlinked ? '' : ' to this mission'}"><i class="fas fa-plus"></i></button>` : ''}
            ${isUnlinked ? `<button class="bundle-link-btn" title="Link these to a mission"><i class="fas fa-link"></i></button>` : ''}
            <button class="bundle-delete-btn" title="Delete all photos"><i class="fas fa-trash"></i></button>
            <span class="bundle-expand" onclick="toggleBundle(this.closest('.bundle-header'))"><i class="fas fa-chevron-${wasExpanded ? 'up' : 'down'}"></i></span>
          </div>
        </div>
        <div class="bundle-photos ${wasExpanded ? '' : 'collapsed'}">
          <div class="gallery-grid"></div>
        </div>
      `;
      
      // Add more photos to this mission or unlinked
      const addBtn = bundle.querySelector(".bundle-add-btn");
      if (addBtn) {
        addBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const select = $("photoMission");
          if (select) {
            if (isUnlinked) {
              // For unlinked photos, clear the mission select
              select.value = "";
            } else {
              // Set the mission in the form
              select.value = missionKey;
            }
            updateMissionCapacity();
          }
          
          // [OK] Open the file picker immediately
          const input = $("photoInput");
          if (input) input.click();
          
          showToast(isUnlinked ? "Select photos to add" : `Select photos to add to "${displayName}"`);
        });
      }
      
      // Link unlinked photos to a mission
      const linkBtn = bundle.querySelector(".bundle-link-btn");
      if (linkBtn) {
        linkBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          showLinkMissionModal(missionPhotos);
        });
      }
      
      // Delete bundle handler
      const deleteBtn = bundle.querySelector(".bundle-delete-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          showDeleteConfirm(missionKey, displayName);
        });
      }
      
      const grid = bundle.querySelector(".gallery-grid");
      missionPhotos.forEach((photo, idx) => {
        const item = document.createElement("div");
        item.className = "gallery-item";
        item.innerHTML = `
          <img src="${escapeHtml(photo.url)}" alt="Memory" loading="lazy">
          <button class="gallery-item-delete" title="Delete this photo"><i class="fas fa-times"></i></button>
        `;
        
        // Click to open lightbox
        item.querySelector("img").addEventListener("click", () => {
          const absIdx = photos.findIndex(p => p.url === photo.url);
          openPhotoLightbox(photo.url, absIdx >= 0 ? absIdx : 0);
        });
        
        // Delete single photo
        item.querySelector(".gallery-item-delete").addEventListener("click", (e) => {
          e.stopPropagation();
          showDeleteConfirm("_single_", photo.url, photo);
        });
        
        grid.appendChild(item);
      });
      
      container.appendChild(bundle);
    });
  }

  // [OK] Link unlinked photos to a mission
  function showLinkMissionModal(photosToLink) {
    const existing = document.querySelector(".link-mission-modal");
    if (existing) existing.remove();
    
    const completed = loadCompleted().filter(c => !c.isExample);
    
    const modal = document.createElement("div");
    modal.className = "link-mission-modal";
    
    let optionsHtml = '<option value="">Select a mission...</option>';
    completed.forEach(m => {
      const existingCount = loadPhotos().filter(p => p.mission === m.title).length;
      const remaining = 5 - existingCount;
      if (remaining > 0) {
        optionsHtml += `<option value="${escapeHtml(m.title)}">${escapeHtml(m.title)} (${existingCount}/5)</option>`;
      }
    });
    
    modal.innerHTML = `
      <div class="link-mission-content">
        <h4><i class="fas fa-link"></i> Link Photos to Mission</h4>
        <p>Link ${photosToLink.length} photo(s) to a completed mission:</p>
        <select id="linkMissionSelect" class="link-mission-select">
          ${optionsHtml}
        </select>
        <div class="link-mission-actions">
          <button class="btn" id="cancelLinkBtn">Cancel</button>
          <button class="btn primary" id="confirmLinkBtn"><i class="fas fa-check"></i> Link</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector("#cancelLinkBtn").addEventListener("click", () => modal.remove());
    modal.querySelector("#confirmLinkBtn").addEventListener("click", () => {
      const selectedMission = modal.querySelector("#linkMissionSelect").value;
      if (!selectedMission) {
        showToast("Please select a mission");
        return;
      }
      
      // Check capacity
      const existingCount = loadPhotos().filter(p => p.mission === selectedMission).length;
      const remaining = 5 - existingCount;
      if (photosToLink.length > remaining) {
        showToast(`Only ${remaining} slots available. Delete some photos first.`);
        return;
      }
      
      // Update photos
      let photos = loadPhotos();
      photosToLink.forEach(photoToLink => {
        const idx = photos.findIndex(p => p.url === photoToLink.url);
        if (idx >= 0) {
          photos[idx].mission = selectedMission;
        }
      });
      
      savePhotos(photos);
      renderPhotoGallery();
      showToast(`Linked ${photosToLink.length} photo(s) to "${selectedMission}"`);
      modal.remove();
    });
    
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // [OK] Delete confirmation modal
  function showDeleteConfirm(type, identifier, photoObj = null) {
    const existing = document.querySelector(".delete-confirm-modal");
    if (existing) existing.remove();
    
    const modal = document.createElement("div");
    modal.className = "delete-confirm-modal";
    
    let message = "";
    if (type === "_single_") {
      message = "Delete this photo? This is permanent.";
    } else if (type === "_unlinked_") {
      message = "Delete ALL unlinked photos? This is permanent.";
    } else {
      message = `Delete ALL photos from "${identifier}"? This is permanent.`;
    }
    
    modal.innerHTML = `
      <div class="delete-confirm-content">
        <p>${escapeHtml(message)}</p>
        <div class="delete-confirm-actions">
          <button class="btn" id="cancelDeleteBtn">Cancel</button>
          <button class="btn btn-danger" id="confirmDeleteBtn"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector("#cancelDeleteBtn").addEventListener("click", () => modal.remove());
    modal.querySelector("#confirmDeleteBtn").addEventListener("click", () => {
      let photos = loadPhotos();
      
      if (type === "_single_" && photoObj) {
        // Delete single photo by URL
        photos = photos.filter(p => p.url !== identifier);
      } else if (type === "_unlinked_") {
        // Delete all unlinked photos
        photos = photos.filter(p => p.mission && p.mission !== "");
      } else {
        // Delete all photos in this mission
        photos = photos.filter(p => p.mission !== type);
      }
      
      savePhotos(photos);
      renderPhotoGallery();
      showToast("Deleted!");
      modal.remove();
    });
    
    // Close on backdrop click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // [OK] Toggle bundle expand/collapse
  window.toggleBundle = function(header) {
    const bundle = header.closest('.gallery-mission-bundle');
    const photos = bundle.querySelector('.bundle-photos');
    const icon = bundle.querySelector('.bundle-expand i');
    
    photos.classList.toggle('collapsed');
    icon.classList.toggle('fa-chevron-down');
    icon.classList.toggle('fa-chevron-up');
  };

  let lightboxIndex = 0;
  let allPhotos = [];

  function openPhotoLightbox(url, index) {
    const modal = $("photoLightbox");
    const img = $("lightboxImage");
    if (!modal || !img) return;
    
    allPhotos = loadPhotos();
    lightboxIndex = index;
    
    img.src = url;
    modal.classList.add("active");
    updateLightboxCounter();
  }

  function updateLightboxCounter() {
    const counter = $("lightboxCounter");
    if (counter) {
      counter.textContent = `${lightboxIndex + 1} / ${allPhotos.length}`;
    }
  }

  function closeLightbox() {
    const modal = $("photoLightbox");
    if (modal) modal.classList.remove("active");
  }

  function lightboxPrev() {
    if (lightboxIndex > 0) {
      lightboxIndex--;
      $("lightboxImage").src = allPhotos[lightboxIndex].url;
      updateLightboxCounter();
    }
  }

  function lightboxNext() {
    if (lightboxIndex < allPhotos.length - 1) {
      lightboxIndex++;
      $("lightboxImage").src = allPhotos[lightboxIndex].url;
      updateLightboxCounter();
    }
  }

  // [OK] Medal API functions
  let medalClips = [];

  async function fetchMedalClips() {
    try {
      // Use our Netlify function proxy to avoid CORS issues
      const res = await fetch(`/.netlify/functions/medal?limit=12`);
      
      if (!res.ok) {
        console.error("Medal API error:", res.status);
        const container = $("medalClips");
        if (container) {
          container.innerHTML = '<div class="medal-empty">Could not load clips. Try refreshing!</div>';
        }
        return;
      }
      
      const data = await res.json();
      medalClips = data.contentObjects || [];
      console.log("Medal clips loaded:", medalClips.length);
      renderMedalClips();
    } catch (err) {
      console.error("Medal fetch error:", err);
      const container = $("medalClips");
      if (container) {
        container.innerHTML = '<div class="medal-empty">Could not load clips. Check console for errors.</div>';
      }
    }
  }

  function renderMedalClips() {
    const container = $("medalClips");
    if (!container) return;
    
    if (medalClips.length === 0) {
      container.innerHTML = '<div class="medal-empty">No clips found. Record some gameplay!</div>';
      return;
    }
    
    container.innerHTML = "";
    
    medalClips.forEach(clip => {
      const item = document.createElement("div");
      item.className = "medal-clip";
      
      const thumbnail = clip.thumbnail || clip.contentThumbnail || "";
      const title = clip.contentTitle || "Untitled Clip";
      const game = clip.categoryName || clip.gameName || "";
      
      // [OK] Use the correct URL from API - contentUrl is the shareable link
      // Fallback chain: contentUrl -> directClipUrl -> constructed URL
      const clipUrl = clip.contentUrl || clip.directClipUrl || `https://medal.tv/clips/${clip.contentId}`;
      
      // Debug logging to console
      console.log("Medal clip:", { 
        title, 
        contentUrl: clip.contentUrl, 
        directClipUrl: clip.directClipUrl,
        contentId: clip.contentId,
        usingUrl: clipUrl
      });
      
      item.innerHTML = `
        <div class="medal-thumbnail" style="background-image: url('${escapeHtml(thumbnail)}')">
          <div class="medal-play"><i class="fas fa-play"></i></div>
        </div>
        <div class="medal-info">
          <div class="medal-title">${escapeHtml(title)}</div>
          ${game ? `<div class="medal-game">${escapeHtml(game)}</div>` : ''}
        </div>
      `;
      
      // Click to open in new tab
      item.addEventListener("click", () => {
        console.log("Opening Medal clip:", clipUrl);
        window.open(clipUrl, '_blank');
      });
      
      container.appendChild(item);
    });
  }

  function openMedalClip(clip) {
    // Use the correct URL from API
    const clipUrl = clip.contentUrl || clip.directClipUrl || `https://medal.tv/clips/${clip.contentId}`;
    console.log("Opening Medal clip:", clipUrl);
    window.open(clipUrl, '_blank');
  }

  function closeMedalModal() {
    const modal = $("medalModal");
    const content = $("medalModalContent");
    if (modal) modal.classList.remove("active");
    if (content) content.innerHTML = "";
  }

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

  // [OK] Fix blank letter permanently: sanitize messages (drop empty content / missing from)
  function sanitizeMessages(arr) {
    if (!Array.isArray(arr)) return [];
    const cleaned = [];
    for (const m of arr) {
      const from = String(m?.from || "").trim();
      const timestamp = String(m?.timestamp || "").trim();
      const content = normalizeNewlines(m?.content ?? "").trim();
      if (!from) continue;
      if (!content) continue; //  removes blank letters forever
      
      const cleanMsg = { from, timestamp, content };
      // [OK] PRESERVE attachment fields!
      if (m.attachment) {
        cleanMsg.attachment = m.attachment;
        cleanMsg.attachmentType = m.attachmentType || 'image';
      }
      cleaned.push(cleanMsg);
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
      $("syncPill").title = "Pulling updates...";
      return;
    }
    if (mode === "saving") {
      setDot(dot, "yellow", true);
      if (label) label.textContent = "SAVE";
      $("syncPill").title = "Saving updates...";
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
  const LOCK_TTL_MS = 3000; // [OK] REDUCED from 20000 for faster auto-resolve
  let presenceTimer = null;
  let lastPresence = null;
  let takeoverGraceUntil = 0;
  let loginGraceUntil = 0; // [OK] Grace period after login
  let loginInProgress = false; // [FIX] Prevent spam clicking login
  let takeoverInProgress = false; // [FIX] Prevent spam clicking takeover

  function normalizePerson(name) {
    const n = String(name || "").trim().toLowerCase();
    if (n === "yasir") return "yasir";
    if (n === "kylee") return "kylee";
    return "";
  }

  function isOnlineLive(nameLower) {
    try {
      if (!nameLower) return false;
      
      // [FIX] Presence is keyed by username now, so check directly
      if (typeof presenceChannel !== 'undefined' && presenceChannel) {
        const st = presenceChannel.presenceState?.() || {};
        // Check if user has any presence entries
        const userPresences = st[nameLower] || [];
        if (userPresences.length > 0) {
          // Check if any presence is recent (within 60 seconds)
          const now = Date.now();
          for (const p of userPresences) {
            const age = p.onlineAt ? (now - Date.parse(p.onlineAt)) : 0;
            if (age < 60000) return true;
          }
        }
      }
      
      // Fallback to lastPresence timestamp (<=60s old = online)
      const ts = lastPresence?.[nameLower];
      if (!ts) return false;
      const age = Date.now() - new Date(ts).getTime();
      return Number.isFinite(age) && age <= 60000;
    } catch { return false; }
  }

  function updateUserDuoPills() {
    const user = loadUser().trim();
    const duo = getDuoName(user);

    $("userText").textContent = user ? `USER: ${user.toUpperCase()}` : "USER: --";
    $("duoText").textContent = user ? `DUO: ${duo.toUpperCase()}` : "DUO: --";
    $("envelopeLabel").textContent = user ? `DUO: ${duo.toUpperCase()}` : "DUO";

    // Icon styles
    const userIcon = $("userIcon");
    const duoIcon = $("duoIcon");
    const userClass = getUserColorClass(user);
    const duoClass = getUserColorClass(duo);

    if (userIcon) {
      userIcon.classList.remove('fa-regular', 'fa-solid', 'user-yasir', 'user-kylee');
      if (userClass) userIcon.classList.add(userClass);
      // If logged in, show solid; otherwise outline
      userIcon.classList.add(user ? 'fa-solid' : 'fa-regular');
    }
    if (duoIcon) {
      duoIcon.classList.remove('fa-regular', 'fa-solid', 'user-yasir', 'user-kylee');
      if (duoClass) duoIcon.classList.add(duoClass);
      const duoOnline = isOnlineLive(duo?.toLowerCase());
      duoIcon.classList.add(duoOnline ? 'fa-solid' : 'fa-regular');
    }

    // Dots reflect sync status if desired; keep visible but color by online
    const userDot = $("userDot");
    const duoDot = $("duoDot");
    if (userDot) { userDot.className = 'dot ' + (user ? 'green' : 'gray'); }
    if (duoDot) {
      const duoOnline = isOnlineLive(duo?.toLowerCase());
      duoDot.className = 'dot ' + (duoOnline ? 'green' : 'gray');
    }
  }

  async function presencePing() {
    if (!hasUser()) return;
    try {
      const res = await remotePatchPresence(loadUser().trim());
      if (res?.presence) {
        lastPresence = res.presence;
        updateUserDuoPills();
      }
      // [OK] Track presenceVersion from server
      if (res?.presenceVersion !== undefined) {
        lastPresenceVersion = res.presenceVersion;
      }
      // [OK] Check for device conflicts in presence response (instant detection)
      if (res?.activeDevices) {
        checkDeviceConflict(res.activeDevices);
      }
    } catch {
      // ignore
    }
  }

  // [OK] WebSocket-based presence using Supabase Realtime (fixes ghost session bug)
  let presenceChannel = null;
  let livePresenceState = {};

  function initLivePresence() {
    if (!sbClient) {
      console.log("Supabase client not available, using polling only");
      return;
    }

    const user = loadUser()?.toLowerCase();
    if (!user) return;

    // Clean up existing channel if any
    if (presenceChannel) {
      try { sbClient.removeChannel(presenceChannel); } catch(e) {}
    }

    try {
      // [FIX] Key presence by USERNAME so all devices can see who's online
      // DeviceId is stored IN the payload to detect conflicts
      presenceChannel = sbClient.channel(`presence:${ROOM_CODE}`, {
        config: { presence: { key: user } }  // Key by username, NOT deviceId!
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          livePresenceState = presenceChannel.presenceState();
          handleLivePresenceSync(livePresenceState);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log("[PRESENCE] [JOIN-LEAVE] Join:", key, newPresences?.length || 0);
          livePresenceState = presenceChannel.presenceState();
          handleLivePresenceSync(livePresenceState);
          updateUserDuoPills();
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          // [OK] ALWAYS check for auto-resolve when someone leaves
          console.log("[PRESENCE] [JOIN-LEAVE] Leave:", key, leftPresences?.length || 0);
          livePresenceState = presenceChannel.presenceState();
          handleLivePresenceSync(livePresenceState);
          updateUserDuoPills();
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              deviceId: getDeviceId(),
              onlineAt: new Date().toISOString(),
              user: user
            });
            console.log("[PRESENCE] WebSocket active for:", user);
          }
        });
    } catch (err) {
      console.error("WebSocket presence error:", err);
    }
  }

  function handleLivePresenceSync(state) {
    const currentUser = loadUser()?.toLowerCase();
    const myDeviceId = getDeviceId();
    if (!currentUser) return;

    const now = Date.now();
    
    // [FIX] Now that presence is keyed by USERNAME, get our user's presences directly
    const userPresences = state[currentUser] || [];
    
    // Find conflicting devices (same user, different device)
    let conflictingDevices = [];
    let myOnlineAt = now; // Default to now if not found
    
    for (const p of userPresences) {
      if (p.deviceId === myDeviceId) {
        myOnlineAt = p.onlineAt ? Date.parse(p.onlineAt) : now;
      } else if (p.deviceId) {
        // Different device, same user
        const age = p.onlineAt ? (now - Date.parse(p.onlineAt)) : 0;
        if (age < 60000) { // Only count recent presences
          conflictingDevices.push({ ...p, parsedOnlineAt: p.onlineAt ? Date.parse(p.onlineAt) : 0 });
        }
      }
    }

    // [OK] Calculate grace period status ONCE
    const inLoginGrace = now < loginGraceUntil;
    const inTakeoverGrace = now < takeoverGraceUntil;
    const inAnyGrace = inLoginGrace || inTakeoverGrace;

    console.log("[PRESENCE] Sync:", {
      user: currentUser,
      myDevice: myDeviceId.slice(-6),
      conflicts: conflictingDevices.length,
      deviceLocked,
      inGrace: inAnyGrace
    });

    // [FIX] CONFLICT DETECTION - only show on NEWER device (not the first one)
    if (conflictingDevices.length > 0) {
      // Find the oldest conflicting device
      const oldestConflictTime = Math.min(...conflictingDevices.map(c => c.parsedOnlineAt || 0));
      const weAreNewer = myOnlineAt > oldestConflictTime;
      
      if (inAnyGrace) {
        console.log("[PRESENCE] In grace period - ignoring conflict");
      } else if (weAreNewer && !deviceLocked) {
        // WE logged in AFTER someone else - show conflict to US
        console.log("[PRESENCE] CONFLICT - we are newer device, showing overlay");
        deviceLocked = true;
        showDeviceConflict(currentUser);
      } else if (!weAreNewer) {
        // We were first - the other device should see the conflict, not us
        console.log("[PRESENCE] Other device joined after us - they should see conflict");
      }
    } else {
      // No conflicts - auto-resolve
      if (deviceLocked) {
        console.log("[PRESENCE] AUTO-RESOLVED - no conflicts");
        deviceLocked = false;
        hideDeviceConflict();
      }
    }
    
    updateUserDuoPills();
  }

  async function stopLivePresence() {
    if (presenceChannel && sbClient) {
      console.log("[PRESENCE] [STOP] Stopping presence...");
      try {
        await presenceChannel.untrack();
        console.log("[PRESENCE] [STOP] Untracked successfully");
      } catch (e) {
        console.log("[PRESENCE] [STOP] Untrack error:", e);
      }
      try {
        await sbClient.removeChannel(presenceChannel);
      } catch (e) {}
      presenceChannel = null;
    }
  }

  function startPresence() {
    if (presenceTimer) return;
    presencePing();
    presenceTimer = setInterval(presencePing, 2000); // [OK] FASTER: 2s instead of 15s
    // Also start WebSocket presence
    initLivePresence();
  }

  function stopPresence() {
    if (presenceTimer) {
      clearInterval(presenceTimer);
      presenceTimer = null;
    }
    // Also stop WebSocket presence
    stopLivePresence();
  }

  // [OK] Presence is now simplified - no online/offline dots
  // Conflict detection still works via checkDeviceConflict() in pullRemoteState/presencePing

  // ---------- Notifications ----------
  let prevUnreadCount = 0;

  // Get unread message indexes (excluding dismissed)
  function duoUnreadIndexes(messages) {
    const user = loadUser().trim().toLowerCase();
    if (!user) return [];

    const lastRead = loadLastRead();
    const dismissed = loadDismissed();
    const idxs = [];
    for (let i = 0; i < messages.length; i++) {
      const from = String(messages[i]?.from || "").trim().toLowerCase();
      const msgId = getMsgId(messages[i], i);
      // Unread if: from duo, index > lastRead, and not dismissed
      if (from && from !== user && i > lastRead && !dismissed.includes(msgId)) {
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

  // [OK] Update DUO pill with unread count (messages)
  function updateDuoUnreadBadge() {
    const messages = loadMessages();
    const unreadIdxs = duoUnreadIndexes(messages);
    const duoPill = $("duoPill");
    const duoText = $("duoText");
    
    if (!duoPill || !duoText) return;
    
    const user = loadUser().trim().toLowerCase();
    const duoName = user === "yasir" ? "KYLEE" : user === "kylee" ? "YASIR" : "DUO";
    
    if (unreadIdxs.length > 0) {
      duoText.textContent = `DUO: ${duoName} (${unreadIdxs.length})`;
      duoPill.classList.add("has-unread");
    } else {
      duoText.textContent = `DUO: ${duoName}`;
      duoPill.classList.remove("has-unread");
    }
  }

  // [FIX] Bell notifications - system updates only with READ tracking
  function updateNotifications(opts = {}) {
    const { silent = false, markAsRead = false } = opts;
    const badge = $("notificationBadge");
    const list = $("notificationList");

    // [OK] Update DUO pill for messages
    updateDuoUnreadBadge();

    // [OK] Bell only shows system notifications (updates, events)
    const systemNotifs = [];
    
    // Check for upcoming events
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    UPCOMING_EVENTS.forEach(event => {
      const eventDate = new Date(event.date + "T00:00:00");
      const diffMs = eventDate - today;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 14) { // Show 2 weeks out for holidays
        const notifId = getSystemNotifId({ type: 'event', title: event.title, date: event.date });
        const isRead = isSystemNotifRead(notifId);
        systemNotifs.push({
          type: "event",
          eventType: event.type || "event",
          title: event.title,
          date: event.date,
          subtitle: diffDays === 0 ? "TODAY!" : diffDays === 1 ? "Tomorrow!" : `In ${diffDays} days`,
          icon: event.icon || "📅",
          id: notifId,
          isRead: isRead
        });
      }
    });

    // [FIX] Only count UNREAD notifications for badge
    const unreadCount = systemNotifs.filter(n => !n.isRead).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }

    list.innerHTML = "";

    if (systemNotifs.length === 0) {
      list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted); font-size: 11px;">No notifications</div>';
      return;
    }

    // [FIX] If markAsRead, mark all as read now
    if (markAsRead) {
      markAllSystemNotifsRead(systemNotifs);
    }

    systemNotifs.forEach(notif => {
      const item = document.createElement("div");
      const isChristmas = notif.title.toLowerCase().includes('christmas');
      const isNewYear = notif.title.toLowerCase().includes('new year');
      const isValentine = notif.title.toLowerCase().includes('valentine');
      
      // [FIX] Better notification card styling for holidays
      let extraClass = notif.isRead ? '' : ' unread';
      if (isChristmas) extraClass += ' holiday-christmas';
      else if (isNewYear) extraClass += ' holiday-newyear';
      else if (isValentine) extraClass += ' holiday-valentine';
      else if (notif.eventType === 'holiday') extraClass += ' holiday-generic';
      
      item.className = `notification-item system-notif${extraClass}`;
      item.dataset.notifId = notif.id;
      
      // [FIX] Prettier holiday notification cards
      if (notif.eventType === 'holiday') {
        const dateFormatted = new Date(notif.date + "T00:00:00").toLocaleDateString('en-US', { 
          weekday: 'short', month: 'short', day: 'numeric' 
        });
        item.innerHTML = `
          <div class="holiday-notif-card">
            <div class="holiday-notif-icon">${notif.icon}</div>
            <div class="holiday-notif-content">
              <div class="holiday-notif-title">${escapeHtml(notif.title)}</div>
              <div class="holiday-notif-date">${dateFormatted}</div>
              <div class="holiday-notif-countdown">${escapeHtml(notif.subtitle)}</div>
            </div>
          </div>
        `;
      } else {
        item.innerHTML = `
          <div class="notification-from">${notif.icon} ${escapeHtml(notif.title)}</div>
          <div class="notification-preview">${escapeHtml(notif.subtitle)}</div>
        `;
      }
      
      // Click to mark as read
      item.addEventListener('click', () => {
        markSystemNotifRead(notif.id);
        item.classList.remove('unread');
        updateNotifications(); // Refresh badge
      });
      
      list.appendChild(item);
    });
  }

  // [OK] Letter Viewer State (for TikTok-style swipe)
  let letterViewerIndex = 0;
  let duoLetters = [];

  function openLetterViewer() {
    const messages = loadMessages();
    const userLower = loadUser().trim().toLowerCase();
    
    // Get all duo messages (from partner)
    duoLetters = messages
      .map((m, i) => ({ msg: m, idx: i }))
      .filter(x => String(x.msg?.from || "").trim().toLowerCase() !== userLower && normalizeNewlines(x.msg?.content ?? "").trim())
      .reverse(); // newest first
    
    if (duoLetters.length === 0) {
      showToast("No letters from your duo yet");
      return;
    }
    
    letterViewerIndex = 0;
    showLetterAt(letterViewerIndex, true); // true = first open, show animation
  }

  function showLetterAt(viewerIdx, animate = false) {
    if (viewerIdx < 0 || viewerIdx >= duoLetters.length) return;
    
    const { msg, idx } = duoLetters[viewerIdx];
    letterViewerIndex = viewerIdx;
    
    const displayName = msg.from || "Unknown";
    $("letterFrom").textContent = displayName.toUpperCase();
    $("letterTimestamp").textContent = msg.timestamp || "";
    $("letterContent").textContent = normalizeNewlines(msg.content ?? "").trim();
    
    // Update counter
    const counter = $("letterCounter");
    if (counter) {
      counter.textContent = `${viewerIdx + 1} / ${duoLetters.length}`;
    }

    // Show attachment if present
    const attachmentContainer = $("letterAttachment");
    if (attachmentContainer) {
      if (msg.attachment) {
        const isVideo = msg.attachmentType === 'video';
        if (isVideo) {
          attachmentContainer.innerHTML = `
            <div class="letter-attachment-label">[ATTACH] Video Attachment</div>
            <video controls playsinline class="letter-attachment-media" src="${escapeHtml(msg.attachment)}"></video>
          `;
        } else {
          attachmentContainer.innerHTML = `
            <div class="letter-attachment-label">[ATTACH] Image Attachment</div>
            <img class="letter-attachment-media" src="${escapeHtml(msg.attachment)}" alt="Attachment" onclick="openAttachmentModal('${escapeHtml(msg.attachment)}', 'image')">
          `;
        }
        attachmentContainer.classList.remove("hidden");
      } else {
        attachmentContainer.innerHTML = "";
        attachmentContainer.classList.add("hidden");
      }
    }

    // Mark as read
    const userLower = loadUser().trim().toLowerCase();
    const fromLower = String(msg.from || "").trim().toLowerCase();
    if (userLower && fromLower && fromLower !== userLower) {
      markReadUpTo(idx);
      updateNotifications();
    }

    const modal = $("letterModal");
    const env = document.querySelector(".letter-envelope");
    const paper = document.querySelector(".letter-paper");

    if (animate) {
      // First open - show animation
      letterAnimationInProgress = true;
      modal.classList.remove("active");
      if (env) env.classList.remove("open");
      if (paper) paper.classList.remove("open");
      void modal.offsetHeight;
      
      // [OK] Lock body scroll when modal opens
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      requestAnimationFrame(() => {
        modal.classList.add("active");
        if (env) env.classList.add("open");
        setTimeout(() => {
          if (paper) paper.classList.add("open");
        }, 300);
      });
      
      setTimeout(() => { letterAnimationInProgress = false; }, 900);
    } else {
      // Seamless transition - no animation, just update content
      modal.classList.add("active");
      if (env) env.classList.add("open");
      if (paper) paper.classList.add("open");
      // [OK] Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
  }

  function nextLetter() {
    if (letterViewerIndex < duoLetters.length - 1) {
      showLetterAt(letterViewerIndex + 1, false);
    } else {
      showToast("No more letters");
    }
  }

  function prevLetter() {
    if (letterViewerIndex > 0) {
      showLetterAt(letterViewerIndex - 1, false);
    } else {
      showToast("This is the newest letter");
    }
  }

  function openMessage(index) {
    // [OK] Guard against double-trigger
    if (letterAnimationInProgress) return;

    const messages = loadMessages();
    const msg = messages[index];
    if (!msg) return;

    const safeContent = normalizeNewlines(msg.content ?? "").trim();
    if (!safeContent) {
      showToast("That letter is empty");
      return;
    }

    letterAnimationInProgress = true;

    const displayName = msg.from || "Unknown";
    $("letterFrom").textContent = displayName.toUpperCase();
    $("letterTimestamp").textContent = msg.timestamp || "";
    $("letterContent").textContent = safeContent;

    // [OK] Show attachment in letter if present
    const attachmentContainer = $("letterAttachment");
    if (attachmentContainer) {
      if (msg.attachment) {
        const isVideo = msg.attachmentType === 'video';
        if (isVideo) {
          attachmentContainer.innerHTML = `
            <div class="letter-attachment-label">[ATTACH] Video Attachment</div>
            <video controls playsinline class="letter-attachment-media" src="${escapeHtml(msg.attachment)}"></video>
          `;
        } else {
          attachmentContainer.innerHTML = `
            <div class="letter-attachment-label">[ATTACH] Image Attachment</div>
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
      updateNotifications();
    }

    // [OK] CLEAN ANIMATION: Remove all classes, force reflow, then add .open
    const modal = $("letterModal");
    const env = document.querySelector(".letter-envelope");
    const paper = document.querySelector(".letter-paper");
    
    // Reset state
    modal.classList.remove("active");
    if (env) env.classList.remove("open");
    if (paper) paper.classList.remove("open");
    
    // Force reflow
    void modal.offsetHeight;
    
    // Trigger animation via classes
    requestAnimationFrame(() => {
      modal.classList.add("active");
      if (env) env.classList.add("open");
      // Delay paper animation slightly
      setTimeout(() => {
        if (paper) paper.classList.add("open");
      }, 300);
    });

    // Unlock after animation completes
    setTimeout(() => { letterAnimationInProgress = false; }, 900);
  }

  // [OK] [FEATURE B] Open attachment in fullscreen modal
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
      
      // [OK] Format date and calculate urgency
      let dateDisplay = '';
      let urgencyIndicator = '';
      
      if (it.dueDate) {
        const days = daysUntil(it.dueDate);
        const urgency = getUrgencyLevel(days);
        
        dateDisplay = `<span class="item-date"><i class="fas fa-calendar"></i> ${formatMissionDate(it.dueDate)}</span>`;
        
        // Add urgency indicator for missions due soon
        if (urgency === "red") {
          urgencyIndicator = `<span class="urgency-badge urgency-red" title="Due today or tomorrow!">!</span>`;
        } else if (urgency === "yellow") {
          urgencyIndicator = `<span class="urgency-badge urgency-yellow" title="Due in 2-3 days">*</span>`;
        }
      }
      
      el.innerHTML = `
        <input type="checkbox" ${it.done ? "checked" : ""} ${it.isExample ? "disabled" : ""} aria-label="Mark done">
        <div class="itext">
          <div class="ititle">
            <span>${escapeHtml(it.title)}</span>
            <span class="itag">${escapeHtml(it.tag || "idea")}</span>
            ${dateDisplay}
            ${urgencyIndicator}
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

  // [OK] Format mission date nicely
  function formatMissionDate(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
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
    
    // [OK] Update photo mission select when completed missions change
    if (typeof populatePhotoMissionSelect === 'function') {
      populatePhotoMissionSelect();
    }
  }

  let lastMsgCount = 0;

  function renderMessages(opts = {}) {
    const { autoScroll = false } = opts;
    const messages = loadMessages();
    const container = $("messageLog");
    container.innerHTML = "";

    // [OK] [FEATURE A] Render newest-first (reverse order)
    const reversed = [...messages].reverse();

    reversed.forEach((msg) => {
      const displayName = msg.from || "Unknown";
      const hasAttachment = !!(msg.attachment);
      
      // [OK] User-specific colors
      const userClass = getUserColorClass(msg.from);
      
      const el = document.createElement("div");
      el.className = `message-log-item ${userClass}`;
      el.innerHTML = `
        <div class="message-log-header">
          <span class="message-from-name">FROM: ${escapeHtml(displayName)} ${hasAttachment ? '<span class="attachment-badge" title="Has attachment">[ATTACH]</span>' : ''}</span>
          <span>${escapeHtml(msg.timestamp || "")}</span>
        </div>
        <div class="message-log-content">${escapeHtml(msg.content || "")}</div>
        ${hasAttachment ? `<div class="message-attachment-preview" onclick="openAttachmentModal('${escapeHtml(msg.attachment)}', '${escapeHtml(msg.attachmentType || 'image')}')">View Attachment</div>` : ''}
      `;
      container.appendChild(el);
    });

    if (messages.length > 3) container.classList.add("scroll");
    else container.classList.remove("scroll");

    // [OK] [FEATURE A] With newest-first, scroll to TOP for latest
    if (autoScroll || messages.length > lastMsgCount) {
      if (container.classList.contains("scroll")) container.scrollTop = 0;
    }
    lastMsgCount = messages.length;
    // Keep big calendar in sync with new messages
    renderBigCalendar();
  }

  // [OK] Get user-specific color class
  function getUserColorClass(userName) {
    const name = String(userName || "").trim().toLowerCase();
    if (name === "yasir") return "user-yasir";
    if (name === "kylee") return "user-kylee";
    return "";
  }

  // [OK] Calculate days until a date (0 = today, negative = past)
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    try {
      const target = new Date(dateStr + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = target.getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }

  // [OK] Get urgency level based on days until due
  // Returns: "red" (0-1 days), "yellow" (2-3 days), "green" (4+ days), null (no date/past)
  function getUrgencyLevel(daysLeft) {
    if (daysLeft === null || daysLeft < 0) return null;
    if (daysLeft <= 1) return "red";
    if (daysLeft <= 3) return "yellow";
    return "green";
  }

  // [FIX] Get all dates with events (missions + upcoming events) - NOW distinguishes holidays
  function getEventDates() {
    const eventMap = {}; // { "YYYY-MM-DD": { urgency, titles[], isHoliday, icon } }
    
    // Add mission due dates (NOT holidays)
    const missions = loadActive();
    missions.forEach(m => {
      if (m.dueDate) {
        const days = daysUntil(m.dueDate);
        const urgency = getUrgencyLevel(days);
        if (urgency) {
          if (!eventMap[m.dueDate]) {
            eventMap[m.dueDate] = { urgency, titles: [], isHoliday: false, icon: null };
          } else {
            // Take the most urgent level (only for missions)
            if (!eventMap[m.dueDate].isHoliday) {
              const levels = ["red", "yellow", "green"];
              if (levels.indexOf(urgency) < levels.indexOf(eventMap[m.dueDate].urgency)) {
                eventMap[m.dueDate].urgency = urgency;
              }
            }
          }
          eventMap[m.dueDate].titles.push(m.title);
        }
      }
    });
    
    // [FIX] Add upcoming events with HOLIDAY distinction
    UPCOMING_EVENTS.forEach(event => {
      const days = daysUntil(event.date);
      if (days !== null && days >= 0) {
        const isHoliday = event.type === 'holiday';
        if (!eventMap[event.date]) {
          eventMap[event.date] = { 
            urgency: isHoliday ? 'holiday' : getUrgencyLevel(days), 
            titles: [], 
            isHoliday: isHoliday,
            icon: event.icon || null
          };
        } else if (isHoliday) {
          // Holiday takes priority for styling
          eventMap[event.date].isHoliday = true;
          eventMap[event.date].urgency = 'holiday';
          eventMap[event.date].icon = event.icon || eventMap[event.date].icon;
        }
        eventMap[event.date].titles.push(event.title);
      }
    });
    
    return eventMap;
  }

  // [FIX] Mini calendar for message log - now with holiday styling
  function renderMiniCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get event dates for this month
    const eventDates = getEventDates();
    
    let html = `<div class="mini-calendar">
      <div class="mini-cal-header">${monthNames[month]} ${year}</div>
      <div class="mini-cal-days">`;
    
    dayNames.forEach(d => { html += `<span class="mini-cal-dayname">${d}</span>`; });
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += `<span class="mini-cal-day empty"></span>`;
    }
    
    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const event = eventDates[dateStr];
      
      let classes = "mini-cal-day";
      if (isToday) classes += " today";
      if (event) {
        classes += ` has-event`;
        // [FIX] Holidays get special class, missions get urgency class
        if (event.isHoliday) {
          classes += ` event-holiday`;
        } else {
          classes += ` event-${event.urgency}`;
        }
      }
      
      const tooltip = event ? `title="${event.titles.join(', ')}"` : '';
      
      // [FIX] Holidays show their icon, missions show dot
      let eventIndicator = '';
      if (event) {
        if (event.isHoliday && event.icon) {
          eventIndicator = `<span class="cal-holiday-icon">${event.icon}</span>`;
        } else {
          eventIndicator = '<span class="cal-event-dot"></span>';
        }
      }
      
      html += `<span class="${classes}" ${tooltip}>${d}${eventIndicator}</span>`;
    }
    
    html += `</div></div>`;
    return html;
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
    if (!hasUser()) {
      showToast("Pick USER first");
      openWhoModal();
      return;
    }
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
      s.textContent = Math.random() < 0.5 ? "*" : "+";
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

  // [FIX] Deluxe Christmas theme with Three.js visualization
  function createDeluxeChristmasContainer() {
    let container = $("deluxeChristmasContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "deluxeChristmasContainer";
      document.body.insertBefore(container, document.body.firstChild);
    }
    return container;
  }

  function startDeluxeChristmas() {
    const container = createDeluxeChristmasContainer();
    // Create an iframe with the Three.js visualizer
    container.innerHTML = `
      <iframe src="data:text/html;charset=utf-8,${encodeURIComponent(getDeluxeChristmasHTML())}" 
              frameborder="0" 
              allow="autoplay"
              style="width:100%;height:100%;pointer-events:auto;">
      </iframe>
    `;
    document.body.classList.add("theme-deluxe");
  }

  function stopDeluxeChristmas() {
    const container = $("deluxeChristmasContainer");
    if (container) container.innerHTML = "";
    document.body.classList.remove("theme-deluxe");
  }

  function getDeluxeChristmasHTML() {
    return `<!DOCTYPE html>
<html><head>
<style>
*{box-sizing:border-box}
body{margin:0;height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#161616;color:#c5a880;font-family:sans-serif}
#overlay{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100;text-align:center}
.btn{background:#161616;border-radius:10px;color:#c5a880;border:1px solid #c5a880;padding:12px 20px;margin:8px;cursor:pointer;font-size:12px}
.btn:hover{background:#222;border-color:#fff}
.title{color:#a07676;font-weight:bold;font-size:14px;margin-bottom:16px}
.text-loading{font-size:16px}
</style>
</head><body>
<div id="overlay">
  <div class="title">Deluxe Christmas Mode</div>
  <button class="btn" onclick="loadAudio(0)">Snowflakes Falling Down</button>
  <button class="btn" onclick="loadAudio(1)">This Christmas</button>
  <button class="btn" onclick="loadAudio(2)">No Room at the Inn</button>
  <button class="btn" onclick="loadAudio(3)">Jingle Bell Swing</button>
</div>
<script src="https://cdn.jsdelivr.net/npm/three@0.115.0/build/three.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/three@0.115.0/examples/js/postprocessing/EffectComposer.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/three@0.115.0/examples/js/postprocessing/RenderPass.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/three@0.115.0/examples/js/postprocessing/ShaderPass.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/three@0.115.0/examples/js/shaders/CopyShader.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/three@0.115.0/examples/js/shaders/LuminosityHighPassShader.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/three@0.115.0/examples/js/postprocessing/UnrealBloomPass.js"><\/script>
<script>
const{PI,sin,cos}=Math,TAU=2*PI;
const map=(v,sMin,sMax,dMin,dMax)=>dMin+((v-sMin)/(sMax-sMin))*(dMax-dMin);
const range=(n,m=0)=>Array(n).fill(m).map((i,j)=>i+j);
const rand=(max,min=0)=>min+Math.random()*(max-min);
const randInt=(max,min=0)=>Math.floor(min+Math.random()*(max-min));
const randChoise=arr=>arr[randInt(arr.length)];
const polar=(ang,r=1)=>[r*cos(ang),r*sin(ang)];
let scene,camera,renderer,analyser,step=0,composer;
const uniforms={time:{type:"f",value:0},step:{type:"f",value:0}};
const params={exposure:1,bloomStrength:0.9,bloomThreshold:0,bloomRadius:0.5};
const fftSize=2048,totalPoints=4000;
const listener=new THREE.AudioListener();
const audio=new THREE.Audio(listener);
function init(){
  document.getElementById("overlay").remove();
  scene=new THREE.Scene();
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth,window.innerHeight);
  document.body.appendChild(renderer.domElement);
  camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,1,1000);
  camera.position.set(-0.09,-2.56,24.42);
  camera.rotation.set(0.10,-0.004,0.0004);
  const format=renderer.capabilities.isWebGL2?THREE.RedFormat:THREE.LuminanceFormat;
  uniforms.tAudioData={value:new THREE.DataTexture(analyser.data,fftSize/2,1,format)};
  addPlane(scene,uniforms,3000);
  addSnow(scene,uniforms);
  range(10).map(i=>{addTree(scene,uniforms,totalPoints,[20,0,-20*i]);addTree(scene,uniforms,totalPoints,[-20,0,-20*i]);});
  const renderScene=new THREE.RenderPass(scene,camera);
  const bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth,window.innerHeight),1.5,0.4,0.85);
  bloomPass.threshold=params.bloomThreshold;bloomPass.strength=params.bloomStrength;bloomPass.radius=params.bloomRadius;
  composer=new THREE.EffectComposer(renderer);composer.addPass(renderScene);composer.addPass(bloomPass);
  window.addEventListener("resize",()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);composer.setSize(window.innerWidth,window.innerHeight);},false);
  animate();
}
function animate(time){analyser.getFrequencyData();uniforms.tAudioData.value.needsUpdate=true;step=(step+1)%1000;uniforms.time.value=time;uniforms.step.value=step;composer.render();requestAnimationFrame(animate);}
function loadAudio(i){
  document.getElementById("overlay").innerHTML='<div class="text-loading">Loading...</div>';
  const files=["https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Simon_Panrucker/Happy_Christmas_You_Guys/Simon_Panrucker_-_01_-_Snowflakes_Falling_Down.mp3","https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Dott/This_Christmas/Dott_-_01_-_This_Christmas.mp3","https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/TRG_Banks/TRG_Banks_Christmas_Album/TRG_Banks_-_12_-_No_room_at_the_inn.mp3","https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Mark_Smeby/En_attendant_Nol/Mark_Smeby_-_07_-_Jingle_Bell_Swing.mp3"];
  new THREE.AudioLoader().load(files[i],buffer=>{audio.setBuffer(buffer);audio.play();analyser=new THREE.AudioAnalyser(audio,fftSize);init();});
}
function addTree(scene,uniforms,totalPoints,treePosition){
  const vertexShader=\`attribute float mIndex;varying vec3 vColor;varying float opacity;uniform sampler2D tAudioData;float norm(float v,float min,float max){return(v-min)/(max-min);}float lerp(float n,float min,float max){return(max-min)*n+min;}float map(float v,float sMin,float sMax,float dMin,float dMax){return lerp(norm(v,sMin,sMax),dMin,dMax);}void main(){vColor=color;vec3 p=position;vec4 mvPosition=modelViewMatrix*vec4(p,1.0);float amplitude=texture2D(tAudioData,vec2(mIndex,0.1)).r;float amplitudeClamped=clamp(amplitude-0.4,0.0,0.6);float sizeMapped=map(amplitudeClamped,0.0,0.6,1.0,20.0);opacity=map(mvPosition.z,-200.0,15.0,0.0,1.0);gl_PointSize=sizeMapped*(100.0/-mvPosition.z);gl_Position=projectionMatrix*mvPosition;}\`;
  const fragmentShader=\`varying vec3 vColor;varying float opacity;uniform sampler2D pointTexture;void main(){gl_FragColor=vec4(vColor,opacity);gl_FragColor=gl_FragColor*texture2D(pointTexture,gl_PointCoord);}\`;
  const shaderMaterial=new THREE.ShaderMaterial({uniforms:{...uniforms,pointTexture:{value:new THREE.TextureLoader().load("https://assets.codepen.io/3685267/spark1.png")}},vertexShader,fragmentShader,blending:THREE.AdditiveBlending,depthTest:false,transparent:true,vertexColors:true});
  const geometry=new THREE.BufferGeometry();const positions=[],colors=[],sizes=[],phases=[],mIndexs=[];const color=new THREE.Color();
  for(let i=0;i<totalPoints;i++){const t=Math.random();const y=map(t,0,1,-8,10);const ang=map(t,0,1,0,6*TAU)+(TAU/2)*(i%2);const[z,x]=polar(ang,map(t,0,1,5,0));const modifier=map(t,0,1,1,0);positions.push(x+rand(-0.3*modifier,0.3*modifier),y+rand(-0.3*modifier,0.3*modifier),z+rand(-0.3*modifier,0.3*modifier));color.setHSL(map(i,0,totalPoints,1.0,0.0),1.0,0.5);colors.push(color.r,color.g,color.b);phases.push(rand(1000));sizes.push(1);mIndexs.push(map(i,0,totalPoints,1.0,0.0));}
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute("size",new THREE.Float32BufferAttribute(sizes,1));geometry.setAttribute("phase",new THREE.Float32BufferAttribute(phases,1));geometry.setAttribute("mIndex",new THREE.Float32BufferAttribute(mIndexs,1));
  const tree=new THREE.Points(geometry,shaderMaterial);const[px,py,pz]=treePosition;tree.position.set(px,py,pz);scene.add(tree);
}
function addSnow(scene,uniforms){
  const vertexShader=\`attribute float size;attribute float phase;attribute float phaseSecondary;varying vec3 vColor;varying float opacity;uniform float time;uniform float step;float norm(float v,float min,float max){return(v-min)/(max-min);}float lerp(float n,float min,float max){return(max-min)*n+min;}float map(float v,float sMin,float sMax,float dMin,float dMax){return lerp(norm(v,sMin,sMax),dMin,dMax);}void main(){float t=time*0.0006;vColor=color;vec3 p=position;p.y=map(mod(phase+step,1000.0),0.0,1000.0,25.0,-8.0);p.x+=sin(t+phase);p.z+=sin(t+phaseSecondary);opacity=map(p.z,-150.0,15.0,0.0,1.0);vec4 mvPosition=modelViewMatrix*vec4(p,1.0);gl_PointSize=size*(100.0/-mvPosition.z);gl_Position=projectionMatrix*mvPosition;}\`;
  const fragmentShader=\`uniform sampler2D pointTexture;varying vec3 vColor;varying float opacity;void main(){gl_FragColor=vec4(vColor,opacity);gl_FragColor=gl_FragColor*texture2D(pointTexture,gl_PointCoord);}\`;
  const sprites=["https://assets.codepen.io/3685267/snowflake1.png","https://assets.codepen.io/3685267/snowflake2.png","https://assets.codepen.io/3685267/snowflake3.png","https://assets.codepen.io/3685267/snowflake4.png","https://assets.codepen.io/3685267/snowflake5.png"];
  sprites.forEach(sprite=>{
    const shaderMaterial=new THREE.ShaderMaterial({uniforms:{...uniforms,pointTexture:{value:new THREE.TextureLoader().load(sprite)}},vertexShader,fragmentShader,blending:THREE.AdditiveBlending,depthTest:false,transparent:true,vertexColors:true});
    const geometry=new THREE.BufferGeometry();const positions=[],colors=[],sizes=[],phases=[],phaseSecondaries=[];const color=new THREE.Color();
    for(let i=0;i<300;i++){positions.push(rand(25,-25),0,rand(15,-150));color.set(randChoise(["#f1d4d4","#f1f6f9","#eeeeee","#f1f1e8"]));colors.push(color.r,color.g,color.b);phases.push(rand(1000));phaseSecondaries.push(rand(1000));sizes.push(rand(4,2));}
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute("size",new THREE.Float32BufferAttribute(sizes,1));geometry.setAttribute("phase",new THREE.Float32BufferAttribute(phases,1));geometry.setAttribute("phaseSecondary",new THREE.Float32BufferAttribute(phaseSecondaries,1));
    scene.add(new THREE.Points(geometry,shaderMaterial));
  });
}
function addPlane(scene,uniforms,totalPoints){
  const vertexShader=\`attribute float size;attribute vec3 customColor;varying vec3 vColor;void main(){vColor=customColor;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*(300.0/-mvPosition.z);gl_Position=projectionMatrix*mvPosition;}\`;
  const fragmentShader=\`uniform vec3 color;uniform sampler2D pointTexture;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.0);gl_FragColor=gl_FragColor*texture2D(pointTexture,gl_PointCoord);}\`;
  const shaderMaterial=new THREE.ShaderMaterial({uniforms:{...uniforms,pointTexture:{value:new THREE.TextureLoader().load("https://assets.codepen.io/3685267/spark1.png")}},vertexShader,fragmentShader,blending:THREE.AdditiveBlending,depthTest:false,transparent:true,vertexColors:true});
  const geometry=new THREE.BufferGeometry();const positions=[],colors=[],sizes=[];const color=new THREE.Color();
  for(let i=0;i<totalPoints;i++){positions.push(rand(-25,25),0,rand(-150,15));color.set(randChoise(["#93abd3","#f2f4c0","#9ddfd3"]));colors.push(color.r,color.g,color.b);sizes.push(1);}
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute("customColor",new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute("size",new THREE.Float32BufferAttribute(sizes,1));
  const plane=new THREE.Points(geometry,shaderMaterial);plane.position.y=-8;scene.add(plane);
}
<\/script></body></html>`;
  }

  function applyTheme(theme) {
    currentTheme = theme;

    // [FIX] Stop deluxe mode when switching away
    if (theme !== "deluxe") {
      stopDeluxeChristmas();
    }

    if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else if (theme === "christmas") document.documentElement.setAttribute("data-theme", "christmas");
    else if (theme === "deluxe") document.documentElement.setAttribute("data-theme", "christmas"); // Use christmas colors
    else document.documentElement.removeAttribute("data-theme");

    document.querySelectorAll(".theme-option").forEach(opt => {
      opt.classList.toggle("active", opt.dataset.theme === theme);
    });

    if (theme === "christmas") {
      startSnow();
    } else if (theme === "deluxe") {
      stopSnow();
      startDeluxeChristmas();
    } else {
      stopSnow();
    }
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

  // [FIX] Device ID persists across all tabs (same device = same ID)
  const KEY_DEVICE_ID = "bucketlist_2026_device_id";
  function getDeviceId() {
    let id = localStorage.getItem(KEY_DEVICE_ID);
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(KEY_DEVICE_ID, id);
    }
    return id;
  }

  // Track active devices per user
  let activeDevices = {};
  let deviceLocked = false;

  // [OK] Dedicated function to check device conflicts (can be called independently)
  // [OK] Check BOTH WebSocket AND database for conflicts
  function checkDeviceConflict(serverActiveDevices) {
    if (!serverActiveDevices || typeof serverActiveDevices !== "object") {
      return false;
    }
    
    const user = loadUser()?.toLowerCase();
    const myDeviceId = getDeviceId();
    const now = Date.now();
    
    const inAnyGrace = now < loginGraceUntil || now < takeoverGraceUntil;
    
    if (!user) return false;
    
    // [OK] Check WebSocket presence FIRST (instant)
    let hasWebSocketConflict = false;
    if (livePresenceState && Object.keys(livePresenceState).length > 0) {
      for (const [key, presences] of Object.entries(livePresenceState)) {
        for (const p of presences) {
          if (p.user === user && p.deviceId && p.deviceId !== myDeviceId) {
            hasWebSocketConflict = true;
            break;
          }
        }
        if (hasWebSocketConflict) break;
      }
    }
    
    // [OK] Check database as backup
    let hasDatabaseConflict = false;
    if (serverActiveDevices[user]) {
      const serverDevice = serverActiveDevices[user];
      if (serverDevice.deviceId && serverDevice.deviceId !== myDeviceId) {
        hasDatabaseConflict = true;
      }
    }
    
    const hasConflict = hasWebSocketConflict || hasDatabaseConflict;
    
    if (hasConflict && !inAnyGrace) {
      if (!deviceLocked) {
        deviceLocked = true;
        showDeviceConflict(user);
      }
      return true;
    } else if (!hasConflict) {
      if (deviceLocked) {
        deviceLocked = false;
        hideDeviceConflict();
      }
    }
    
    return false;
  }

  function getLocalState() {
    // [OK] always sanitize before pushing (prevents blank letters from ever syncing)
    const cleanedMessages = sanitizeMessages(loadMessages());
    if (cleanedMessages.length !== loadMessages().length) {
      localStorage.setItem(KEY_MESSAGES, JSON.stringify(cleanedMessages));
      clampLastReadToMessagesLen(cleanedMessages.length);
    }

    // [OK] Build readState from both users' localStorage
    const readState = {};
    ["yasir", "kylee"].forEach(u => {
      const raw = localStorage.getItem(keyLastRead(u));
      const n = Number(raw);
      if (Number.isFinite(n)) readState[u] = n;
    });

    // [OK] Build photos array
    const photos = loadPhotos();

    // [OK] Track active device per user
    const user = loadUser()?.toLowerCase();
    if (user && !deviceLocked) {
      activeDevices[user] = {
        deviceId: getDeviceId(),
        lastActive: Date.now()
      };
    }

    return {
      active: loadActive(),
      saved: loadSaved(),
      completed: loadCompleted(),
      messages: cleanedMessages,
      customTags: loadCustomTags(),
      systemMessage: loadSystemMessage(),
      readState,
      photos,
      activeDevices,
    };
  }

  function applyStateToLocal(state) {
    if (!state || typeof state !== "object") return { cleaned: false };

    let cleaned = false;

    suppressSync = true;

    // Prefer realtime presence; only use payload-based conflict if no live channel
    if (!presenceChannel && state.activeDevices && typeof state.activeDevices === "object") {
      checkDeviceConflict(state.activeDevices);
      activeDevices = state.activeDevices;
    }

    if (Array.isArray(state.active)) localStorage.setItem(KEY_ACTIVE, JSON.stringify(state.active));
    if (Array.isArray(state.saved)) localStorage.setItem(KEY_SAVED, JSON.stringify(state.saved));
    if (Array.isArray(state.completed)) localStorage.setItem(KEY_COMPLETED, JSON.stringify(state.completed));
    if (Array.isArray(state.customTags)) localStorage.setItem(KEY_CUSTOM_TAGS, JSON.stringify(state.customTags));
    if (typeof state.systemMessage === "string") localStorage.setItem(KEY_SYSTEM_MESSAGE, state.systemMessage);

    // [OK] Apply readState from server (syncs across devices!)
    if (state.readState && typeof state.readState === "object") {
      const user = loadUser()?.toLowerCase();
      if (user && typeof state.readState[user] === "number") {
        const serverRead = state.readState[user];
        const localRead = loadLastRead();
        // Take the higher of server vs local (never go backwards)
        if (serverRead > localRead) {
          localStorage.setItem(keyLastRead(user), String(serverRead));
        }
      }
    }

    // [OK] Apply photos from server
    if (Array.isArray(state.photos)) {
      localStorage.setItem(KEY_PHOTOS, JSON.stringify(state.photos));
    }

    // [OK] sanitize messages from remote too
    if (Array.isArray(state.messages)) {
      const clean = sanitizeMessages(state.messages);
      if (clean.length !== state.messages.length) cleaned = true;
      localStorage.setItem(KEY_MESSAGES, JSON.stringify(clean));
      clampLastReadToMessagesLen(clean.length);
    }

    suppressSync = false;

    return { cleaned };
  }

  // [OK] Device conflict UI - with Switch User option
  function showDeviceConflict(currentUser) {
    let overlay = $("deviceConflictOverlay");
    const otherUser = currentUser === "yasir" ? "Kylee" : "Yasir";
    
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "deviceConflictOverlay";
      overlay.className = "device-conflict-overlay";
      document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
      <div class="device-conflict-content">
        <i class="fas fa-mobile-alt conflict-icon"></i>
        <h3>Account Active Elsewhere</h3>
        <p>Your "${currentUser.toUpperCase()}" session is active on another device.</p>
        <p style="font-size: 11px; color: var(--muted); margin-top: 8px;">
          <i class="fas fa-info-circle"></i> Auto-resolves in ~3 seconds when other session closes.
        </p>
        <div class="device-conflict-buttons">
          <button class="btn primary" onclick="forceDeviceTakeover()">
            <i class="fas fa-sign-in-alt"></i> Use Here Instead
          </button>
          <button class="btn" onclick="switchToOtherUser('${otherUser}')">
            <i class="fas fa-exchange-alt"></i> Switch to ${otherUser}
          </button>
        </div>
      </div>
    `;
    overlay.classList.add("active");
  }

  function hideDeviceConflict() {
    const overlay = $("deviceConflictOverlay");
    if (overlay) overlay.classList.remove("active");
  }

  // [OK] NEW: Explicit device removal for clean handoff
  async function removeMyDevice() {
    const user = loadUser()?.toLowerCase();
    const deviceId = getDeviceId();
    
    if (!user) return;
    
    try {
await fetch("/.netlify/functions/room", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          room: ROOM_CODE, 
          removeDevice: { user, deviceId }
        })
      });
      console.log("[PRESENCE] 🗑️ Removed device from server");
    } catch (e) {
      console.error("[PRESENCE] Failed to remove device:", e);
    }
  }

  window.forceDeviceTakeover = async function() {
    // [FIX] Prevent spam clicking
    if (takeoverInProgress) {
      console.log("[PRESENCE] Takeover already in progress, ignoring");
      return;
    }
    
    takeoverInProgress = true;
    console.log("[PRESENCE] TAKEOVER starting");
    
    try {
      // [OK] Set grace period FIRST
      takeoverGraceUntil = Date.now() + 6000;
      deviceLocked = false;
      hideDeviceConflict();
      
      // Re-track WebSocket presence with fresh timestamp
      try { await stopLivePresence(); } catch(e) {}
      initLivePresence();
      
      // Push to database - this updates our timestamp to be newest
      await pushRemoteState();
      
      // [FIX] Complete the login flow since we were blocked before
      $("closeWhoModal").classList.remove("hidden");
      closeWhoModal();
      updateUserDuoPills();
      
      // Sync state to get latest data
      await pullRemoteState({ silent: false });
      
      console.log("[PRESENCE] TAKEOVER complete");
      showToast("You are now the active device");
    } finally {
      takeoverInProgress = false;
    }
  };

  window.switchToOtherUser = async function(otherUser) {
    console.log("[PRESENCE] SWITCH starting to:", otherUser);
    
    // [OK] Set grace period
    loginGraceUntil = Date.now() + 5000;
    deviceLocked = false;
    hideDeviceConflict();
    
    // [OK] PROPERLY stop current presence and WAIT
    try {
      if (presenceChannel) {
        await presenceChannel.untrack();
        await new Promise(r => setTimeout(r, 150)); // Wait for leave event
        await sbClient.removeChannel(presenceChannel);
        presenceChannel = null;
      }
    } catch (e) {}
    
    // [OK] Remove old device from server
    await removeMyDevice();
    
    // Switch to the other user
    saveUser(otherUser);
    
    // [FIX] Complete the login flow
    $("closeWhoModal").classList.remove("hidden");
    closeWhoModal();
    updateUserDuoPills();
    
    // Start WebSocket presence for new user
    initLivePresence();
    
    // Sync state
    await pushRemoteState();
    await pullRemoteState({ silent: false });
    
    console.log("[PRESENCE] SWITCH complete to:", otherUser);
    showToast(`Switched to ${otherUser}`);

  };

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
        // [OK] Still update presence dots (time-based decay)
        updateUserDuoPills();
        return;
      }

      // [OK] Update lastPresence from response (for dot calculations)
      if (remote.presence) {
        lastPresence = remote.presence;
      }

      // [OK] Check presenceVersion - if changed, presence/activeDevices updated
      const serverPresenceVersion = remote.presenceVersion || remote.payload?.presenceVersion || 0;
      const presenceChanged = serverPresenceVersion !== lastPresenceVersion;
      if (presenceChanged) {
        lastPresenceVersion = serverPresenceVersion;
      }

      // Prefer realtime presence for conflicts; only fallback to payload if no live channel
      if (!presenceChannel && (remote.payload.activeDevices || remote.activeDevices)) {
        const devices = remote.activeDevices || remote.payload.activeDevices;
        const hasConflict = checkDeviceConflict(devices);
        if (hasConflict) {
          activeDevices = devices;
        }
      }

      // [OK] ALWAYS update presence dots (they're time-based, need constant refresh)
      updateUserDuoPills();

      //  Skip full state apply if nothing changed (no UI spam)
      // But still process presence changes above!
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
      renderPhotoGallery(); // [OK] Sync photos across devices
      // [OK] Pass silent flag to avoid sound on background pulls
      updateNotifications({ silent });
      // updateUserDuoPills already called above

      setSyncStatus("on");

      // [OK] if we cleaned blank letters, push once to make the room clean forever
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

      // [OK] update local poll version so we don't re-apply our own push
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

  // [OK] SMART polling loop - faster for better notification sync
  function startSmartPolling() {
    if (pollTimer) return;

    // Poll every 1 second for fast notification updates
    pollTimer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (deviceLocked) return; // Don't poll if device is locked
      pullRemoteState({ silent: true });
    }, 1000); // 1s = instant notifications
  }

  // Track last sync time for stale detection
  let lastSyncTime = Date.now();

  // [OK] Show syncing indicator
  function showSyncingIndicator() {
    let indicator = $("syncingIndicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "syncingIndicator";
      indicator.className = "syncing-indicator";
      indicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> Syncing...';
      document.body.appendChild(indicator);
    }
    indicator.classList.add("active");
  }

  function hideSyncingIndicator() {
    const indicator = $("syncingIndicator");
    if (indicator) indicator.classList.remove("active");
  }

  // [OK] Immediate sync + conflict check on resume
  async function onAppResume() {
    if (deviceLocked) return;
    
    const timeSinceSync = Date.now() - lastSyncTime;
    
    // Show indicator if stale
    if (timeSinceSync > 3000) {
      showSyncingIndicator();
    }
    
    try {
      // First, send our presence to mark us as active
      if (hasUser()) {
        await presencePing();
      }
      
      // Then pull state to check for conflicts
      await pullRemoteState({ silent: false });
      lastSyncTime = Date.now();
    } finally {
      hideSyncingIndicator();
    }
  }

  // [OK] Force refresh when tab becomes visible
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      onAppResume();
    } else {
      try { if (presenceChannel) presenceChannel.untrack(); } catch {}
    }
  });
  window.addEventListener("focus", () => {
    onAppResume();
  });

  // [OK] iOS BFCache support - pageshow fires when returning from home screen
  window.addEventListener("pageshow", (event) => {
    if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
      console.log("Page restored from BFCache, forcing sync...");
      onAppResume();
    }
  });

  // [OK] Also check on touchstart for iOS (backup)
  let lastTouchSync = 0;
  document.addEventListener("touchstart", () => {
    const now = Date.now();
    if (now - lastTouchSync > 10000 && now - lastSyncTime > 10000) {
      // Haven't synced in 10 seconds, do a silent sync
      lastTouchSync = now;
      pullRemoteState({ silent: true }).finally(() => {
        lastSyncTime = Date.now();
      });
    }
  }, { passive: true });

  // ---------- Who modal ----------
  function openWhoModal() {
    const modal = $("whoModal");
    if (modal) {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
    }
    const logoffBtn = $("btnLogOff");
    if (logoffBtn) {
      logoffBtn.classList.toggle("hidden", !hasUser());
    }
  }

  // [OK] Big calendar above message log
  function renderBigCalendar() {
    const cal = $("bigCalendar");
    if (!cal) return;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    // Load messages to mark days with messages
    const msgs = loadMessages();
    const msgDates = new Set(
      msgs.map(m => {
        const d = new Date(m.timestamp || Date.now());
        if (isNaN(d)) return null;
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }).filter(Boolean)
    );
    const eventDates = getEventDates();

    // State from selects if already rendered
    const selMonthEl = document.getElementById('calMonthSelect');
    const selYearEl = document.getElementById('calYearSelect');
    let selMonth = selMonthEl ? Number(selMonthEl.value) : currentMonth;
    let selYear = selYearEl ? Number(selYearEl.value) : currentYear;

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const years = [currentYear - 1, currentYear, currentYear + 1];
    cal.innerHTML = `
      <div class="calendar__opts">
        <select id="calMonthSelect" name="calendar__month">
          ${months.map((m,i)=>`<option value="${i}" ${i===selMonth?'selected':''}>${m}</option>`).join('')}
        </select>
        <select id="calYearSelect" name="calendar__year">
          ${years.map(y=>`<option value="${y}" ${y===selYear?'selected':''}>${y}</option>`).join('')}
        </select>
      </div>
      <div class="calendar__body">
        <div class="calendar__days">
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>
        <div class="calendar__dates" id="calDates"></div>
      </div>
    `;

    const firstDay = new Date(selYear, selMonth, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
    const prevMonthDays = new Date(selYear, selMonth, 0).getDate();

    const datesEl = document.getElementById('calDates');
    const cells = [];
    for (let i = 0; i < startDow; i++) {
      const d = prevMonthDays - startDow + 1 + i;
      cells.push({ text: d, grey: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = (selYear===currentYear && selMonth===currentMonth && d===currentDate);
      const dateKey = `${selYear}-${String(selMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const evt = eventDates[dateKey];
      const hasEvent = !!evt;
      cells.push({ text: d, today: isToday, hasEvent });
    }
    while (cells.length % 7 !== 0) cells.push({ text: '', grey: true });

    datesEl.innerHTML = cells.map(c => {
      const cls = ["calendar__date"]; if (c.grey) cls.push("calendar__date--grey"); if (c.today) cls.push("calendar__date--today");
      const eventDot = c.hasEvent ? '<span class="cal-event-dot"></span>' : '';
      return `<div class="${cls.join(' ')}"><span>${c.text}</span>${eventDot}</div>`;
    }).join('');

    document.getElementById('calMonthSelect').addEventListener('change', renderBigCalendar);
    document.getElementById('calYearSelect').addEventListener('change', renderBigCalendar);
  }

  function closeWhoModal() {
    const modal = $("whoModal");
    if (!modal) return;
    // Avoid aria-hidden focus warning
    if (modal.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }

  // [FIX] Check for existing sessions BEFORE allowing login
  async function checkForExistingSession(name) {
    const nameLower = name.toLowerCase();
    try {
      // Check WebSocket presence first (fastest)
      if (presenceChannel) {
        const state = presenceChannel.presenceState?.() || {};
        const userPresences = state[nameLower] || [];
        const myDeviceId = getDeviceId();
        const now = Date.now();
        
        for (const p of userPresences) {
          if (p.deviceId !== myDeviceId) {
            const age = p.onlineAt ? (now - Date.parse(p.onlineAt)) : 0;
            if (age < 60000) {
              return true; // Active session on another device
            }
          }
        }
      }
      
      // Also check database (backup)
      const resp = await fetch(`/.netlify/functions/room?room=${ROOM_CODE}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.presence?.[nameLower]) {
          const ts = Date.parse(data.presence[nameLower]);
          if (Date.now() - ts < 30000) { // Within 30 seconds
            const serverDeviceId = data.devices?.[nameLower];
            if (serverDeviceId && serverDeviceId !== getDeviceId()) {
              return true;
            }
          }
        }
      }
    } catch (e) {
      console.log("[PRESENCE] Pre-check error (continuing):", e);
    }
    return false;
  }

  async function setUserAndStart(name) {
    // [FIX] Prevent spam clicking
    if (loginInProgress) {
      console.log("[PRESENCE] Login already in progress, ignoring");
      return;
    }
    
    loginInProgress = true;
    console.log("[PRESENCE] [KEY] LOGIN starting for:", name);
    
    try {
      // [FIX] Check for existing session BEFORE proceeding
      const hasExistingSession = await checkForExistingSession(name);
      if (hasExistingSession) {
        console.log("[PRESENCE] Existing session detected - showing conflict");
        // Don't proceed with login - show conflict immediately
        saveUser(name); // Temporarily save so conflict UI can work
        loginGraceUntil = 0; // No grace - we KNOW there's a conflict
        deviceLocked = true;
        showDeviceConflict(name);
        loginInProgress = false;
        return; // DO NOT proceed with login
      }
      
      // [OK] Set login grace period (6 seconds to handle slow networks)
      loginGraceUntil = Date.now() + 6000;
      
      // Ensure prior presence channel is cleanly removed before switching keys
      try { await stopLivePresence(); } catch {}
      saveUser(name);

      $("closeWhoModal").classList.remove("hidden");
      closeWhoModal();

      updateUserDuoPills();

      setSyncStatus("pulling");
      
      // Sync state
      showSyncingIndicator();
      await pullRemoteState({ silent: false });
      await pushRemoteState();
      hideSyncingIndicator();

      // [OK] Start presence (grace period protects against false conflicts)
      startPresence();
      
      console.log("[PRESENCE] [KEY] LOGIN complete for:", name);
      showToast(`USER SET: ${String(name).toUpperCase()}`);
    } finally {
      loginInProgress = false;
    }
  }

  async function logOffUser() {
    // [OK] Send explicit offline signal BEFORE clearing user
    // This lets other devices know immediately (not waiting for 45s timeout)
    const currentUser = loadUser();
    if (currentUser) {
      // Stop presence ASAP (await untrack to avoid ghost session)
      await stopLivePresence();
      try {
        // Clear our device from activeDevices
        const user = currentUser.toLowerCase();
        if (activeDevices[user]) {
          delete activeDevices[user];
        }
        // [OK] Mark presence as very old (instant offline detection)
        // Set to epoch so age calculation shows offline immediately
        const offlinePayload = getLocalState();
        offlinePayload.presence = offlinePayload.presence || {};
        offlinePayload.presence[user] = "1970-01-01T00:00:00.000Z"; // Epoch = instantly offline
        
        // Push the offline signal immediately
        await remoteSetState(offlinePayload);
      } catch {
        // Ignore errors on logout
      }
    }
    
    clearUser();
    // Ensure timers are stopped too
    stopPresence();
    updateUserDuoPills();
    openWhoModal();
    $("closeWhoModal").classList.add("hidden");
    showToast("LOGGED OFF");
  }

  // [OK] Send offline signal on tab close / navigation away
  // Uses sendBeacon for reliability (fires even during unload)
  // [OK] Send offline signal on tab close/navigation
  function sendOfflineBeacon() {
    console.log("[PRESENCE] [SEND] Sending offline beacon...");
    
    // [OK] CRITICAL: Untrack from WebSocket FIRST
    if (presenceChannel) {
      try {
        presenceChannel.untrack();
        console.log("[PRESENCE] [SEND] Untracked on page close");
      } catch(e) {}
    }
    
    const currentUser = loadUser();
    if (!currentUser) return;
    
    const user = currentUser.toLowerCase();
    
    // Build offline payload for database
    const offlineData = {
      room: ROOM_CODE,
      payload: {
        activeDevices: { ...activeDevices },
        presence: { ...lastPresence, [user]: "1970-01-01T00:00:00.000Z" }
      }
    };
    
    // Remove this device from activeDevices
    if (offlineData.payload.activeDevices[user]) {
      delete offlineData.payload.activeDevices[user];
    }
    
    // sendBeacon is reliable during unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `/.netlify/functions/room`,
        JSON.stringify(offlineData)
      );
    }
  }

  // [OK] Try to send offline on page unload
  window.addEventListener("beforeunload", sendOfflineBeacon);
  window.addEventListener("pagehide", sendOfflineBeacon);

  // [OK] Browser online/offline detection for local UI feedback
  window.addEventListener("offline", () => {
    setSyncStatus("error");
    showToast("You are offline");
  });

  window.addEventListener("online", () => {
    setSyncStatus("on");
    showToast("Back online");
    // Immediately sync when back online
    if (hasUser()) {
      presencePing();
      pullRemoteState({ silent: false });
    }
  });

  // [OK] [FEATURE B] Upload file to Supabase Storage
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

  // [OK] Current attachment state
  let pendingAttachment = null;
  let pendingAttachmentType = null;
  let isUploading = false; // Guard against sending before upload completes

  // ---------- Wire up events ----------
  $("btnOpen").addEventListener("click", openGift);
  $("btnHome").addEventListener("click", goHome);

  // [OK] [BUG 1 FIX] iOS Safari keyboard bug - removed setTimeout, focus must be synchronous to preserve gesture context
function openSystemMessageModal() {
  const modal = $("systemMessageModal");
  const input = $("systemMessageInput");
  input.value = loadSystemMessage() || "";
  // [OK] [FEATURE E] Update character counter
  updateCharCounter(input.value.length);
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  // Focus immediately to preserve user gesture context on iOS
  input.focus();
}

// [OK] [FEATURE E] Update character counter - shows "X / 30"
function updateCharCounter(len) {
  const counter = $("charCounter");
  if (!counter) return;
  counter.textContent = `${len} / 30`;
  counter.style.color = len >= 25 ? "var(--accent)" : "var(--muted)";
}

function closeSystemMessageModal() {
  const modal = $("systemMessageModal");
  if (!modal) return;
  if (modal.contains(document.activeElement)) {
    document.activeElement.blur();
  }
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

// [OK] [FEATURE E] Live character counter update
$("systemMessageInput").addEventListener("input", (e) => {
  const len = (e.target.value || "").length;
  updateCharCounter(len);
  if (len > 30) {
    e.target.value = e.target.value.substring(0, 30);
    updateCharCounter(30);
  }
});

  const userPillEl = $("userPill");
  if (userPillEl) userPillEl.addEventListener("click", openWhoModal);

  const whoYasirBtn = $("btnWhoYasir");
  if (whoYasirBtn) whoYasirBtn.addEventListener("click", () => setUserAndStart("Yasir"));
  const whoKyleeBtn = $("btnWhoKylee");
  if (whoKyleeBtn) whoKyleeBtn.addEventListener("click", () => setUserAndStart("Kylee"));
  const closeWhoBtn = $("closeWhoModal");
  if (closeWhoBtn) closeWhoBtn.addEventListener("click", closeWhoModal);
  const logoffBtn = $("btnLogOff");
  if (logoffBtn) logoffBtn.addEventListener("click", logOffUser);

  $("btnAdd").addEventListener("click", () => {
    if (!hasUser()) { showToast("Pick USER first"); return; }

    const title = $("newTitle").value.trim();
    const desc = $("newDesc").value.trim();
    const tagSelect = $("newTag");
    let tag = tagSelect.value;
    
    // [OK] Get due date if set
    const dueDateInput = $("newDueDate");
    const dueDate = dueDateInput ? dueDateInput.value : null;
    // Past-date prompt: do not add silently
    if (dueDate) {
      const today = new Date(); today.setHours(0,0,0,0);
      const d = new Date(dueDate + 'T00:00:00');
      if (d < today) {
        const proceed = window.confirm('That due date is in the past. Do you want to keep it anyway?');
        if (!proceed) return; // Let user change date first
      }
    }

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
    if (dueDate) mission.dueDate = dueDate;

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
    if (dueDateInput) dueDateInput.value = "";

    renderActive();
  });

  $("btnClearFields").addEventListener("click", () => {
    $("newTitle").value = "";
    $("newDesc").value = "";
    $("newTag").value = "date";
    $("customTagInput").value = "";
    $("customTagField").classList.add("hidden");
    const dueDateInput = $("newDueDate");
    if (dueDateInput) dueDateInput.value = "";
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

  // [OK] [FEATURE B] Handle attachment file selection with Supabase Storage
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
      
      // [OK] Only one attachment allowed - clear any existing
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
        preview.innerHTML = `<span>[ATTACH] Uploading ${escapeHtml(file.name)}...</span>`;
        preview.classList.remove("hidden");
      }
      
      // [OK] Set uploading flag
      isUploading = true;
      
      try {
        console.log("Starting upload for:", file.name, file.type, file.size);
        const publicUrl = await uploadToSupabase(file);
        console.log("Upload success! URL:", publicUrl);
        
        pendingAttachment = publicUrl;
        pendingAttachmentType = isVideo ? "video" : "image";
        
        if (preview) {
          preview.innerHTML = `<span>[ATTACH] ${escapeHtml(file.name)}</span><button type="button" class="btn" id="clearAttachment">X</button>`;
          $("clearAttachment").addEventListener("click", () => {
            pendingAttachment = null;
            pendingAttachmentType = null;
            attachInput.value = "";
            preview.classList.add("hidden");
          });
        }
        showToast("Attachment ready!");
      } catch (err) {
        console.error("Upload error:", err);
        showToast("Upload failed: " + (err.message || "Unknown error"));
        pendingAttachment = null;
        pendingAttachmentType = null;
        e.target.value = "";
        if (preview) preview.classList.add("hidden");
      } finally {
        isUploading = false;
      }
    });
  }

  $("btnSaveNote").addEventListener("click", () => {
    if (!hasUser()) { showToast("Pick USER first"); return; }
    
    // [OK] Prevent sending while upload is in progress
    if (isUploading) {
      showToast("Wait for attachment to finish uploading...");
      return;
    }

    const content = normalizeNewlines($("customNote").value).trim();
    if (!content) {
      showToast("Can't send a blank letter");
      return;
    }

    const from = loadUser().trim();
    if (!from) { showToast("Pick USER first"); return; }

    const timestamp = formatDT(new Date());
    const messages = loadMessages();
    
    // [OK] Capture attachment BEFORE clearing (important!)
    const attachmentUrl = pendingAttachment;
    const attachmentType = pendingAttachmentType;
    
    const newMsg = { from, timestamp, content };
    if (attachmentUrl) {
      newMsg.attachment = attachmentUrl;
      newMsg.attachmentType = attachmentType;
      console.log("Sending message with attachment:", attachmentUrl);
    }
    messages.push(newMsg);

    // [OK] sanitize immediately (preserves attachment fields)
    const cleaned = sanitizeMessages(messages);
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(cleaned));

    $("customNote").value = "";
    
    // [OK] Clear attachment AFTER capturing
    pendingAttachment = null;
    pendingAttachmentType = null;
    const attachInputEl = $("attachmentInput");
    if (attachInputEl) attachInputEl.value = "";
    const preview = $("attachmentPreview");
    if (preview) preview.classList.add("hidden");
    
    renderMessages({ autoScroll: true });
    updateNotifications();
    showToast("Letter sent" + (attachmentUrl ? " with attachment" : ""));
    schedulePush();
  });

  // [OK] Envelope button opens letter viewer
  $("envelopeBtn").addEventListener("click", () => {
    if (!hasUser()) { showToast("Pick USER first"); return; }
    openLetterViewer();
  });

  // [OK] DUO pill click opens letter viewer
  $("duoPill").addEventListener("click", () => {
    if (!hasUser()) { showToast("Pick USER first"); return; }
    openLetterViewer();
  });

  $("notificationBell").addEventListener("click", () => {
    const dropdown = $("notificationDropdown");
    const isOpening = !dropdown.classList.contains("active");
    dropdown.classList.toggle("active");
    
    // [FIX] Mark notifications as read when opening dropdown
    if (isOpening) {
      setTimeout(() => {
        updateNotifications({ markAsRead: true });
      }, 500); // Short delay so user sees the unread state briefly
    }
  });

  $("btnNotifClearAll").addEventListener("click", (e) => {
    e.stopPropagation();
    clearAllNotifications();
  });

  $("closeLetterModal").addEventListener("click", () => {
    const modal = $("letterModal");
    const env = document.querySelector(".letter-envelope");
    const paper = document.querySelector(".letter-paper");
    
    modal.classList.remove("active");
    if (env) env.classList.remove("open");
    if (paper) paper.classList.remove("open");
    
    // [OK] Restore body scroll when modal closes
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    
    letterAnimationInProgress = false;
  });

  // [OK] Letter navigation buttons
  const prevBtn = $("letterPrev");
  const nextBtn = $("letterNext");
  if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); prevLetter(); });
  if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); nextLetter(); });

  // [OK] Swipe support for letter viewer with better touch handling
  let touchStartY = 0;
  let touchStartX = 0;
  const letterModal = $("letterModal");
  if (letterModal) {
    letterModal.addEventListener("touchstart", (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    letterModal.addEventListener("touchmove", (e) => {
      // Prevent background scroll on letter modal
      const paper = document.querySelector(".letter-paper");
      if (paper && !paper.contains(e.target)) {
        e.preventDefault();
      }
    }, { passive: false });
    
    letterModal.addEventListener("touchend", (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const diffY = touchStartY - touchEndY;
      const diffX = touchStartX - touchEndX;
      
      // Only trigger if vertical swipe is dominant
      if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX)) {
        if (diffY > 0) {
          // Swipe up = next (older) letter
          nextLetter();
        } else {
          // Swipe down = previous (newer) letter
          prevLetter();
        }
      }
    }, { passive: true });
    
    // Close modal when clicking backdrop
    letterModal.addEventListener("click", (e) => {
      if (e.target === letterModal) {
        $("closeLetterModal").click();
      }
    });
  }

  // [OK] [FEATURE B] Close attachment modal
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

  // [OK] Photo Gallery handlers with staging area
  const photoSelectBtn = $("photoSelectBtn");
  const photoInput = $("photoInput");
  const photoDateInput = $("photoDate");
  const photoMissionSelect = $("photoMission");
  const photoStagingArea = $("photoStagingArea");
  const stagingPreview = $("stagingPreview");
  const clearStagingBtn = $("clearStagingBtn");
  const photoSubmitBtn = $("photoSubmitBtn");
  const photoCountHint = $("photoCountHint");
  const stagedCountEl = $("stagedCount");
  const missionCapacityEl = $("missionCapacity");
  const stagingCapacityEl = $("stagingCapacity");
  
  // Staged files waiting to be uploaded
  let stagedFiles = [];
  
  // [OK] Update staging header to show capacity for selected mission
  function updateStagingCapacity() {
    if (!stagingCapacityEl || !photoMissionSelect) return;
    
    const mission = photoMissionSelect.value;
    if (!mission) {
      stagingCapacityEl.textContent = "* Allowed: Unlimited";
      stagingCapacityEl.className = "staging-capacity unlimited";
    } else {
      const existingCount = loadPhotos().filter(p => p.mission === mission).length;
      const remaining = Math.max(0, 5 - existingCount);
      stagingCapacityEl.textContent = `* Allowed for "${mission}": ${remaining}`;
      stagingCapacityEl.className = remaining <= 0 ? "staging-capacity full" : "staging-capacity";
    }
  }
  
  function updateStagedCount() {
    if (stagedCountEl) stagedCountEl.textContent = stagedFiles.length;
    
    // Update button text
    if (photoSelectBtn) {
      if (stagedFiles.length > 0) {
        photoSelectBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add More Photos';
      } else {
        photoSelectBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Select Photos';
      }
    }
    
    // [OK] Also update staging capacity display
    updateStagingCapacity();
  }
  
  function updateMissionCapacity() {
    if (!missionCapacityEl || !photoMissionSelect) return;
    
    const mission = photoMissionSelect.value;
    
    // [OK] Show "unlimited" for unlinked photos
    if (!mission) {
      missionCapacityEl.textContent = " Unlinked = unlimited uploads";
      missionCapacityEl.className = "mission-capacity unlimited";
      return;
    }
    
    const existingCount = loadPhotos().filter(p => p.mission === mission).length;
    const remaining = 5 - existingCount;
    
    // [OK] Clearer labeling: "On this mission: X/5 saved"
    if (remaining <= 0) {
      missionCapacityEl.textContent = "[!] Mission full: 5/5 saved";
      missionCapacityEl.className = "mission-capacity full";
    } else {
      missionCapacityEl.textContent = `On this mission: ${existingCount}/5 saved (${remaining} slots left)`;
      missionCapacityEl.className = "mission-capacity";
    }
  }
  
  function renderStagingPreview() {
    if (!stagingPreview) return;
    stagingPreview.innerHTML = "";
    
    stagedFiles.forEach((file, idx) => {
      const item = document.createElement("div");
      item.className = "staging-item";
      
      // Create thumbnail
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video/");
      
      item.innerHTML = `
        ${isVideo 
          ? `<video src="${url}" class="staging-thumb"></video>`
          : `<img src="${url}" class="staging-thumb" alt="Preview">`
        }
        <span class="staging-name">${escapeHtml(file.name.substring(0, 15))}${file.name.length > 15 ? '...' : ''}</span>
        <button class="staging-remove" data-idx="${idx}" title="Remove"><i class="fas fa-times"></i></button>
      `;
      
      // Remove button handler
      item.querySelector(".staging-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        const removeIdx = parseInt(e.currentTarget.dataset.idx);
        stagedFiles.splice(removeIdx, 1);
        renderStagingPreview();
        updateStagedCount();
        if (stagedFiles.length === 0) {
          photoStagingArea.classList.add("hidden");
        }
      });
      
      stagingPreview.appendChild(item);
    });
    
    updateStagedCount();
  }
  
  if (photoSelectBtn && photoInput) {
    photoSelectBtn.addEventListener("click", () => photoInput.click());
    
    photoInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      
      // Add to staged files (not replace)
      files.forEach(file => {
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          stagedFiles.push(file);
        }
      });
      
      if (stagedFiles.length > 0) {
        photoStagingArea.classList.remove("hidden");
        renderStagingPreview();
        
        // Set default date to today if not set
        if (!photoDateInput.value) {
          photoDateInput.value = new Date().toISOString().split('T')[0];
        }
      }
      
      // Reset input so same file can be selected again
      photoInput.value = "";
    });
  }
  
  // Update capacity when mission changes
  if (photoMissionSelect) {
    photoMissionSelect.addEventListener("change", () => {
      updateMissionCapacity();
      updateStagingCapacity();
    });
  }
  
  // Clear all staged files
  if (clearStagingBtn) {
    clearStagingBtn.addEventListener("click", () => {
      stagedFiles = [];
      stagingPreview.innerHTML = "";
      photoStagingArea.classList.add("hidden");
      photoDateInput.value = "";
      photoMissionSelect.value = "";
      updateStagedCount();
      updateMissionCapacity();
    });
  }
  
  // Submit staged photos
  if (photoSubmitBtn) {
    photoSubmitBtn.addEventListener("click", async () => {
      if (stagedFiles.length === 0) {
        showToast("No photos to upload!");
        return;
      }
      
      const date = photoDateInput?.value;
      if (!date) {
        showToast("Please select a date!");
        return;
      }
      
      const mission = photoMissionSelect?.value || "";
      
      // Check max 5 photos per mission
      if (mission) {
        const existingPhotos = loadPhotos().filter(p => p.mission === mission);
        const remaining = 5 - existingPhotos.length;
        if (remaining <= 0) {
          showToast(`Mission full (5/5). Select "No mission linked" for unlimited.`);
          return;
        }
        if (stagedFiles.length > remaining) {
          showToast(`Only ${remaining} slot(s) left. Remove ${stagedFiles.length - remaining} or select "No mission linked".`);
          return;
        }
      }
      
      photoSubmitBtn.disabled = true;
      photoSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
      
      let successCount = 0;
      const photos = loadPhotos();
      
      for (const file of stagedFiles) {
        try {
          const url = await uploadPhotoToSupabase(file);
          photos.push({
            url,
            date,
            mission,
            uploadedBy: loadUser(),
            uploadedAt: new Date().toISOString(),
            type: file.type.startsWith("video/") ? "video" : "image"
          });
          successCount++;
        } catch (err) {
          console.error("Photo upload error:", err);
          showToast(`Failed: ${file.name}`);
        }
      }
      
      if (successCount > 0) {
        savePhotos(photos);
        showToast(`${successCount} photo(s) uploaded!`);
        renderPhotoGallery();
      }
      
      // Clear staging
      stagedFiles = [];
      stagingPreview.innerHTML = "";
      photoStagingArea.classList.add("hidden");
      photoDateInput.value = "";
      photoMissionSelect.value = "";
      updateStagedCount();
      updateMissionCapacity();
      
      photoSubmitBtn.disabled = false;
      photoSubmitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Submit Photos';
    });
  }
  
  // Populate mission select for photo linking - ONLY COMPLETED missions (not example)
  function populatePhotoMissionSelect() {
    const select = $("photoMission");
    if (!select) return;
    const completed = loadCompleted().filter(c => !c.isExample); // Only real completed missions
    
    select.innerHTML = '<option value="">No mission linked</option>';
    completed.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.title;
      opt.textContent = m.title;
      select.appendChild(opt);
    });
  }
  populatePhotoMissionSelect();

  // [OK] Photo Lightbox handlers
  const lightboxClose = $("lightboxClose");
  const lightboxPrevBtn = $("lightboxPrev");
  const lightboxNextBtn = $("lightboxNext");
  const photoLightbox = $("photoLightbox");
  
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener("click", lightboxPrev);
  if (lightboxNextBtn) lightboxNextBtn.addEventListener("click", lightboxNext);
  if (photoLightbox) {
    photoLightbox.addEventListener("click", (e) => {
      if (e.target === photoLightbox) closeLightbox();
    });
    
    // Swipe support for lightbox
    let lbTouchStartX = 0;
    photoLightbox.addEventListener("touchstart", (e) => {
      lbTouchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    photoLightbox.addEventListener("touchend", (e) => {
      const diff = lbTouchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) lightboxNext();
        else lightboxPrev();
      }
    }, { passive: true });
  }

  // [OK] Medal Modal handlers
  const medalModalClose = $("medalModalClose");
  const medalModal = $("medalModal");
  
  if (medalModalClose) medalModalClose.addEventListener("click", closeMedalModal);
  if (medalModal) {
    medalModal.addEventListener("click", (e) => {
      if (e.target === medalModal) closeMedalModal();
    });
  }

  // [OK] Refresh Medal clips button
  const refreshMedalBtn = $("refreshMedal");
  if (refreshMedalBtn) {
    refreshMedalBtn.addEventListener("click", () => {
      showToast("Refreshing clips...");
      fetchMedalClips();
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
${active.map(i => `[ ] ${i.title} - ${i.desc} (#${i.tag})`).join("\n")}

COMPLETED MISSIONS:
${completed.map(i => `[X] ${i.title} - ${i.desc} (#${i.tag})`).join("\n")}
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

  // ---------- Init ----------
  (async function init() {
    ensureCustomTagsInSelect();

    const theme = loadTheme();
    applyTheme(theme);

    renderSystemMessage(loadSystemMessage());
    
    // [OK] Set daily emoticon
    const emoticonEl = $("dailyEmoticon");
    if (emoticonEl) {
      emoticonEl.textContent = getDailyEmoticon();
    }

    setSyncStatus("off");
    updateUserDuoPills();
    updateNotifications();
    updateTracker();
    setInterval(updateTracker, 1000);

    // [OK] Show sync overlay on initial load
    const overlay = document.createElement("div");
    overlay.id = "syncOverlay";
    overlay.innerHTML = `<div class="sync-overlay-content"><div class="sync-spinner"></div><div>SYNCING...</div></div>`;
    document.body.appendChild(overlay);

    // pull once on load (with overlay) - always remove overlay
    try {
      await pullRemoteState({ silent: false });
    } catch (e) {
      console.warn("Initial sync failed", e);
      setSyncStatus("error");
    } finally {
      overlay.remove();
    }

    // start polling always (cover + main stay synced)
    startSmartPolling();

    // [OK] Check for system updates and upcoming events
    setTimeout(() => {
      checkSystemUpdates();
      checkUpcomingEvents();
    }, 1000);

    // [OK] Render photo gallery
    renderPhotoGallery();

    // [OK] Fetch Medal clips (if configured)
    fetchMedalClips();

    // [OK] Render big calendar initially
    renderBigCalendar();

    // [OK] IMPORTANT: remember user on refresh (no re-asking)
    if (!hasUser()) {
      stopPresence();
      openWhoModal();
      $("closeWhoModal").classList.add("hidden");
    } else {
      $("closeWhoModal").classList.remove("hidden");
      // [FIX] Set grace period on page load to prevent false conflicts
      loginGraceUntil = Date.now() + 3000;
      // Immediately claim device on page load for existing users
      await pushRemoteState();
      startPresence();
      updateUserDuoPills();
      console.log("[PRESENCE] Auto-logged in as:", loadUser());
    }
  })();
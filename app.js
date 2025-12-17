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

  // ✅ VERSION HISTORY for system update notifications
  const VERSION_HISTORY = [
    { version: "1.0.0", date: "2024-12-15", note: "Initial release with missions, messages, and sync" },
    { version: "1.1.0", date: "2024-12-16", note: "Added attachments, daily emoticons, and character limits" },
    { version: "1.2.0", date: "2024-12-17", note: "New: Mini calendar, date picker, user colors, and stacking toasts" }
  ];
  const CURRENT_VERSION = "1.2.0";

  // ✅ UPCOMING EVENTS (add your special dates here!)
  const UPCOMING_EVENTS = [
    { date: "2025-01-01", title: "New Year's Day 🎉" },
    { date: "2025-02-14", title: "Valentine's Day 💕" },
    { date: "2025-12-25", title: "Christmas 🎄" }
  ];

  // ✅ session user (per-tab). persists on refresh, new tab asks again.
  const SESSION_USER_KEY = "bucketlist_2026_session_user";

  // ✅ per-user "read" tracking (local only)
  function keyLastRead(user) {
    return `bucketlist_2026_lastread_${String(user || "").toLowerCase()}`;
  }

  // ✅ per-user dismissed notifications (local only - doesn't delete messages)
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

  // ✅ shared room code
  const ROOM_CODE = "yasir-kylee";

  // ✅ [SUPABASE STORAGE CONFIG]
  const SUPABASE_URL = "https://pkgrlhwnwqtffdmcyqbk.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZ3JsaHdud3F0ZmZkbWN5cWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MDU2MjMsImV4cCI6MjA4MTI4MTYyM30.aZ8E_BLQW-90-AAJeneXmKnsfZ8LmPkdQ5ERAZ9JHNE";
  const STORAGE_BUCKET = "attachments";
  const PHOTOS_BUCKET = "photos";

  const $ = (id) => document.getElementById(id);

  // ✅ Daily rotating ASCII art emoticons (larger braille art)
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

  // ✅ Prevent double-trigger of letter animation
  let letterAnimationInProgress = false;

  const exampleActive = { title: "Test Mission (Example)", desc: "This is an example card", tag: "example", dueDate: "2025-01-15", done: false, isExample: true };
  const exampleCompleted = { title: "Test Completed (Example)", desc: "This is a completed example", tag: "example", done: true, isExample: true };

  let selectedSavedMissions = [];
  let currentTheme = "system";

  // ✅ SMART POLLING state
  let lastRemoteUpdatedAt = null;
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

  // ✅ Toast container for stacking notifications
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

  // ✅ Check for system updates (new version)
  function checkSystemUpdates() {
    const lastSeen = localStorage.getItem(KEY_LAST_VERSION_SEEN);
    if (lastSeen !== CURRENT_VERSION) {
      const latest = VERSION_HISTORY[VERSION_HISTORY.length - 1];
      showToast(`🆕 Update v${latest.version}: ${latest.note}`, "info");
      localStorage.setItem(KEY_LAST_VERSION_SEEN, CURRENT_VERSION);
    }
  }

  // ✅ Check for upcoming events (3 days & 24 hours out)
  function checkUpcomingEvents() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    UPCOMING_EVENTS.forEach(event => {
      const eventDate = new Date(event.date + "T00:00:00");
      const diffMs = eventDate - today;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 3) {
        showToast(`📅 3 days until ${event.title}!`, "event");
      } else if (diffDays === 1) {
        showToast(`⏰ Tomorrow: ${event.title}!`, "event");
      } else if (diffDays === 0) {
        showToast(`🎉 Today is ${event.title}!`, "event");
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
    // ✅ Sync to server so other devices get updated read state
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

  // ✅ Photo Gallery functions
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
        note.textContent = "↑ Click to expand. Your memories will appear below.";
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
      
      const bundle = document.createElement("div");
      bundle.className = "gallery-mission-bundle";
      bundle.innerHTML = `
        <div class="bundle-header" onclick="toggleBundle(this)">
          <span class="bundle-mission"><i class="fa-solid fa-${isUnlinked ? 'images' : 'link'}"></i> ${escapeHtml(displayName)}</span>
          <span class="bundle-count">${missionPhotos.length} photo${missionPhotos.length !== 1 ? 's' : ''}</span>
          <span class="bundle-expand"><i class="fas fa-chevron-down"></i></span>
        </div>
        <div class="bundle-photos collapsed">
          <div class="gallery-grid"></div>
        </div>
      `;
      
      const grid = bundle.querySelector(".gallery-grid");
      missionPhotos.forEach((photo, idx) => {
        const item = document.createElement("div");
        item.className = "gallery-item";
        item.innerHTML = `<img src="${escapeHtml(photo.url)}" alt="Memory" loading="lazy">`;
        item.addEventListener("click", () => {
          // Find absolute index in photos array
          const absIdx = photos.findIndex(p => p.url === photo.url);
          openPhotoLightbox(photo.url, absIdx >= 0 ? absIdx : 0);
        });
        grid.appendChild(item);
      });
      
      container.appendChild(bundle);
    });
  }

  // ✅ Toggle bundle expand/collapse
  window.toggleBundle = function(header) {
    const bundle = header.closest('.gallery-mission-bundle');
    const photos = bundle.querySelector('.bundle-photos');
    const icon = header.querySelector('.bundle-expand i');
    
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

  // ✅ Medal API functions
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
      container.innerHTML = '<div class="medal-empty">No clips found. Check your Medal API settings!</div>';
      return;
    }
    
    container.innerHTML = "";
    
    medalClips.forEach(clip => {
      const item = document.createElement("div");
      item.className = "medal-clip";
      
      const thumbnail = clip.thumbnail || clip.contentThumbnail || "";
      const title = clip.contentTitle || "Untitled Clip";
      const game = clip.categoryName || clip.gameName || "";
      const url = clip.directClipUrl || clip.contentUrl || `https://medal.tv/clips/${clip.contentId}`;
      
      item.innerHTML = `
        <div class="medal-thumbnail" style="background-image: url('${escapeHtml(thumbnail)}')">
          <div class="medal-play">▶</div>
        </div>
        <div class="medal-info">
          <div class="medal-title">${escapeHtml(title)}</div>
          ${game ? `<div class="medal-game">${escapeHtml(game)}</div>` : ''}
        </div>
      `;
      
      item.addEventListener("click", () => {
        openMedalClip(clip);
      });
      
      container.appendChild(item);
    });
  }

  function openMedalClip(clip) {
    const modal = $("medalModal");
    const content = $("medalModalContent");
    if (!modal || !content) return;
    
    // Use embed URL if available
    const embedUrl = clip.embedIframeUrl || `https://medal.tv/clip/${clip.contentId}/embed`;
    
    content.innerHTML = `
      <iframe 
        src="${escapeHtml(embedUrl)}" 
        width="100%" 
        height="400" 
        frameborder="0" 
        allowfullscreen
        allow="autoplay"
      ></iframe>
      <div class="medal-modal-info">
        <h4>${escapeHtml(clip.contentTitle || "Clip")}</h4>
        <a href="https://medal.tv/clips/${clip.contentId}" target="_blank" class="btn">View on Medal</a>
      </div>
    `;
    
    modal.classList.add("active");
  }

  function closeMedalModal() {
    const modal = $("medalModal");
    const content = $("medalModalContent");
    if (modal) modal.classList.remove("active");
    if (content) content.innerHTML = ""; // Stop video
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
      
      const cleanMsg = { from, timestamp, content };
      // ✅ PRESERVE attachment fields!
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

  // ✅ Update DUO pill with unread count (messages)
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

  // ✅ Bell notifications - system updates only (not messages)
  function updateNotifications(opts = {}) {
    const { silent = false } = opts;
    const badge = $("notificationBadge");
    const list = $("notificationList");

    // ✅ Update DUO pill for messages
    updateDuoUnreadBadge();

    // ✅ Bell only shows system notifications (updates, events)
    const systemNotifs = [];
    
    // Check for upcoming events
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    UPCOMING_EVENTS.forEach(event => {
      const eventDate = new Date(event.date + "T00:00:00");
      const diffMs = eventDate - today;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 7) {
        systemNotifs.push({
          type: "event",
          title: event.title,
          subtitle: diffDays === 0 ? "Today!" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`,
          icon: "📅"
        });
      }
    });

    // Show badge if system notifications exist
    if (systemNotifs.length > 0) {
      badge.textContent = systemNotifs.length;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }

    list.innerHTML = "";

    if (systemNotifs.length === 0) {
      list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted); font-size: 11px;">No notifications</div>';
      return;
    }

    systemNotifs.forEach(notif => {
      const item = document.createElement("div");
      item.className = "notification-item system-notif";
      item.innerHTML = `
        <div class="notification-from">${notif.icon} ${escapeHtml(notif.title)}</div>
        <div class="notification-preview">${escapeHtml(notif.subtitle)}</div>
      `;
      list.appendChild(item);
    });
  }

  // ✅ Letter Viewer State (for TikTok-style swipe)
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
    // ✅ Guard against double-trigger
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

    // ✅ Show attachment in letter if present
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
      updateNotifications();
    }

    // ✅ CLEAN ANIMATION: Remove all classes, force reflow, then add .open
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
      
      // ✅ Format date if present
      const dateDisplay = it.dueDate ? `<span class="item-date">📅 ${formatMissionDate(it.dueDate)}</span>` : '';
      
      el.innerHTML = `
        <input type="checkbox" ${it.done ? "checked" : ""} ${it.isExample ? "disabled" : ""} aria-label="Mark done">
        <div class="itext">
          <div class="ititle">
            <span>${escapeHtml(it.title)}</span>
            <span class="itag">${escapeHtml(it.tag || "idea")}</span>
            ${dateDisplay}
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

  // ✅ Format mission date nicely
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
    
    // ✅ Update photo mission select when completed missions change
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

    // ✅ Mini calendar header
    const calendarHtml = renderMiniCalendar();
    const calendarDiv = document.createElement("div");
    calendarDiv.className = "mini-calendar-wrapper";
    calendarDiv.innerHTML = calendarHtml;
    container.appendChild(calendarDiv);

    // ✅ [FEATURE A] Render newest-first (reverse order)
    const reversed = [...messages].reverse();

    reversed.forEach((msg) => {
      const displayName = msg.from || "Unknown";
      const hasAttachment = !!(msg.attachment);
      
      // ✅ User-specific colors
      const userClass = getUserColorClass(msg.from);
      
      const el = document.createElement("div");
      el.className = `message-log-item ${userClass}`;
      el.innerHTML = `
        <div class="message-log-header">
          <span class="message-from-name">FROM: ${escapeHtml(displayName)} ${hasAttachment ? '<span class="attachment-badge" title="Has attachment">📎</span>' : ''}</span>
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

  // ✅ Get user-specific color class
  function getUserColorClass(userName) {
    const name = String(userName || "").trim().toLowerCase();
    if (name === "yasir") return "user-yasir";
    if (name === "kylee") return "user-kylee";
    return "";
  }

  // ✅ Mini calendar for message log
  function renderMiniCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
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
      html += `<span class="mini-cal-day${isToday ? ' today' : ''}">${d}</span>`;
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

    // ✅ Build readState from both users' localStorage
    const readState = {};
    ["yasir", "kylee"].forEach(u => {
      const raw = localStorage.getItem(keyLastRead(u));
      const n = Number(raw);
      if (Number.isFinite(n)) readState[u] = n;
    });

    // ✅ Build photos array
    const photos = loadPhotos();

    return {
      active: loadActive(),
      saved: loadSaved(),
      completed: loadCompleted(),
      messages: cleanedMessages,
      customTags: loadCustomTags(),
      systemMessage: loadSystemMessage(),
      readState,
      photos,
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

    // ✅ Apply readState from server (syncs across devices!)
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

    // ✅ Apply photos from server
    if (Array.isArray(state.photos)) {
      localStorage.setItem(KEY_PHOTOS, JSON.stringify(state.photos));
    }

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
      renderPhotoGallery(); // ✅ Sync photos across devices
      // ✅ Pass silent flag to avoid sound on background pulls
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
    }, 1500); // 1.5s = near-instant notifications
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

  // ✅ Current attachment state
  let pendingAttachment = null;
  let pendingAttachmentType = null;
  let isUploading = false; // Guard against sending before upload completes

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
    
    // ✅ Get due date if set
    const dueDateInput = $("newDueDate");
    const dueDate = dueDateInput ? dueDateInput.value : null;

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
      
      // ✅ Set uploading flag
      isUploading = true;
      
      try {
        console.log("Starting upload for:", file.name, file.type, file.size);
        const publicUrl = await uploadToSupabase(file);
        console.log("Upload success! URL:", publicUrl);
        
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
    
    // ✅ Prevent sending while upload is in progress
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
    
    // ✅ Capture attachment BEFORE clearing (important!)
    const attachmentUrl = pendingAttachment;
    const attachmentType = pendingAttachmentType;
    
    const newMsg = { from, timestamp, content };
    if (attachmentUrl) {
      newMsg.attachment = attachmentUrl;
      newMsg.attachmentType = attachmentType;
      console.log("Sending message with attachment:", attachmentUrl);
    }
    messages.push(newMsg);

    // ✅ sanitize immediately (preserves attachment fields)
    const cleaned = sanitizeMessages(messages);
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(cleaned));

    $("customNote").value = "";
    
    // ✅ Clear attachment AFTER capturing
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

  // ✅ Envelope button opens letter viewer
  $("envelopeBtn").addEventListener("click", () => {
    if (!hasUser()) { showToast("Pick USER first"); return; }
    openLetterViewer();
  });

  // ✅ DUO pill click opens letter viewer
  $("duoPill").addEventListener("click", () => {
    if (!hasUser()) { showToast("Pick USER first"); return; }
    openLetterViewer();
  });

  $("notificationBell").addEventListener("click", () => {
    $("notificationDropdown").classList.toggle("active");
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
    
    letterAnimationInProgress = false;
  });

  // ✅ Letter navigation buttons
  const prevBtn = $("letterPrev");
  const nextBtn = $("letterNext");
  if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); prevLetter(); });
  if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); nextLetter(); });

  // ✅ Swipe support for letter viewer
  let touchStartY = 0;
  const letterModal = $("letterModal");
  if (letterModal) {
    letterModal.addEventListener("touchstart", (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    letterModal.addEventListener("touchend", (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      
      if (Math.abs(diff) > 50) { // minimum swipe distance
        if (diff > 0) {
          // Swipe up = next (older) letter
          nextLetter();
        } else {
          // Swipe down = previous (newer) letter
          prevLetter();
        }
      }
    }, { passive: true });
  }

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

  // ✅ Photo Gallery handlers
  const photoUploadBtn = $("photoUploadBtn");
  const photoInput = $("photoInput");
  const photoDateInput = $("photoDate");
  const photoMissionSelect = $("photoMission");
  
  if (photoUploadBtn && photoInput) {
    photoUploadBtn.addEventListener("click", () => photoInput.click());
    
    photoInput.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      
      const date = photoDateInput?.value || new Date().toISOString().split('T')[0];
      const mission = photoMissionSelect?.value || "";
      
      // ✅ Check max 5 photos per mission
      if (mission) {
        const existingPhotos = loadPhotos().filter(p => p.mission === mission);
        const remaining = 5 - existingPhotos.length;
        if (remaining <= 0) {
          showToast(`Max 5 photos per mission! "${mission}" is full.`);
          photoInput.value = "";
          return;
        }
        if (files.length > remaining) {
          showToast(`Can only add ${remaining} more photo(s) to "${mission}"`);
        }
      }
      
      photoUploadBtn.disabled = true;
      photoUploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Uploading...';
      
      let successCount = 0;
      const photos = loadPhotos();
      
      for (const file of files) {
        // Check limit again inside loop
        if (mission) {
          const currentCount = photos.filter(p => p.mission === mission).length;
          if (currentCount >= 5) {
            showToast(`Max 5 reached for "${mission}"`);
            break;
          }
        }
        
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          showToast(`Skipped ${file.name} - not an image/video`);
          continue;
        }
        
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
      
      photoInput.value = "";
      photoUploadBtn.disabled = false;
      photoUploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload Photos';
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

  // ✅ Photo Lightbox handlers
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

  // ✅ Medal Modal handlers
  const medalModalClose = $("medalModalClose");
  const medalModal = $("medalModal");
  
  if (medalModalClose) medalModalClose.addEventListener("click", closeMedalModal);
  if (medalModal) {
    medalModal.addEventListener("click", (e) => {
      if (e.target === medalModal) closeMedalModal();
    });
  }

  // ✅ Refresh Medal clips button
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
  (async function init() {
    ensureCustomTagsInSelect();

    const theme = loadTheme();
    applyTheme(theme);

    renderSystemMessage(loadSystemMessage());
    
    // ✅ Set daily emoticon
    const emoticonEl = $("dailyEmoticon");
    if (emoticonEl) {
      emoticonEl.textContent = getDailyEmoticon();
    }

    setSyncStatus("off");
    updateUserDuoPills();
    updateNotifications();
    updateTracker();
    setInterval(updateTracker, 1000);

    // ✅ Show sync overlay on initial load
    const overlay = document.createElement("div");
    overlay.id = "syncOverlay";
    overlay.innerHTML = `<div class="sync-overlay-content"><div class="sync-spinner"></div><div>SYNCING...</div></div>`;
    document.body.appendChild(overlay);

    // pull once on load (with overlay)
    await pullRemoteState({ silent: false });
    
    // ✅ Remove overlay after sync
    overlay.remove();

    // start polling always (cover + main stay synced)
    startSmartPolling();

    // ✅ Check for system updates and upcoming events
    setTimeout(() => {
      checkSystemUpdates();
      checkUpcomingEvents();
    }, 1000);

    // ✅ Render photo gallery
    renderPhotoGallery();

    // ✅ Fetch Medal clips (if configured)
    fetchMedalClips();

    // ✅ IMPORTANT: remember user on refresh (no re-asking)
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
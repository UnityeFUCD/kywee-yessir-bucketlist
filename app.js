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
  const KEY_SNOW_LEVEL = "bucketlist_2026_snow_level";

  // [NEW] Guest mode flag - read-only access
  let isGuestMode = false;

  // [OK] VERSION HISTORY for system update notifications
  const VERSION_HISTORY = [
    { version: "1.0.0", date: "2024-12-15", note: "Initial release with missions, messages, and sync" },
    { version: "1.1.0", date: "2024-12-16", note: "Added attachments, daily emoticons, and character limits" },
    { version: "1.2.0", date: "2024-12-17", note: "New: Mini calendar, date picker, user colors, and stacking toasts" },
    { version: "1.3.0", date: "2024-12-19", note: "Fixed: Instant device conflict detection (~3s auto-resolve)" },
    { version: "1.4.0", date: "2024-12-20", note: "New: Confetti on completion, delete saved missions" },
    { version: "1.4.1", date: "2024-12-20", note: "Fixed: User switching, undo confirmations, calendar dropdowns, game clips upload" },
    { version: "1.4.2", date: "2024-12-20", note: "Fixed: Gallery dropdowns, preventive login, global notifications, clip hover preview" },
    { version: "1.4.4", date: "2024-12-21", note: "Fixed: Session gate - conflict overlay shows on attempting device only" },
    { version: "1.5.0", date: "2024-12-25", note: "New: Guest login, snow controls, UI improvements" }
  ];
  const CURRENT_VERSION = "1.5.0";

  // ============================================
  // MARATHON SOUND SYSTEM (v1.6.0)
  // Subtle audio feedback for interactive elements
  // ============================================
  
  // Sound enabled state (respects user preference)
  let marathonSoundEnabled = localStorage.getItem('marathon_sound_enabled') !== 'false';
  
  // Web Audio API context (created on first interaction)
  let audioCtx = null;
  
  function initAudioContext() {
    if (audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    } catch (e) {
      console.warn('[Sound] Web Audio API not supported');
    }
  }
  
  // Sound generator functions using Web Audio API
  function playMarathonSound(type) {
    // Only play sounds in marathon theme
    if (document.documentElement.getAttribute('data-theme') !== 'marathon') return;
    if (!marathonSoundEnabled) return;
    
    initAudioContext();
    if (!audioCtx) return;
    
    // Resume audio context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    
    try {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      const now = audioCtx.currentTime;
      
      switch(type) {
        case 'hover':
          // Soft high-pitched blip
          oscillator.frequency.setValueAtTime(1200, now);
          oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.05);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.08, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          oscillator.start(now);
          oscillator.stop(now + 0.05);
          break;
          
        case 'click':
          // Sharp click sound
          oscillator.frequency.setValueAtTime(600, now);
          oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.08);
          oscillator.type = 'square';
          gainNode.gain.setValueAtTime(0.12, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          oscillator.start(now);
          oscillator.stop(now + 0.08);
          break;
          
        case 'success':
          // Rising tone for success
          oscillator.frequency.setValueAtTime(400, now);
          oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.15);
          oscillator.type = 'triangle';
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          oscillator.start(now);
          oscillator.stop(now + 0.15);
          break;
          
        case 'error':
          // Descending tone for error
          oscillator.frequency.setValueAtTime(400, now);
          oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.2);
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
      }
    } catch (e) {
      // Silently fail - sound is non-critical
    }
  }
  
  // Attach sound effects to interactive elements
  function initMarathonSounds() {
    // Initialize audio context on first user interaction
    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('touchstart', initAudioContext, { once: true });
    
    // Use event delegation for efficiency
    document.addEventListener('mouseenter', (e) => {
      const target = e.target;
      if (target && target.matches && target.matches('button, .btn, .pill.clickable, .item, .theme-option, .notification-item, .who-btn, .envelope-container')) {
        playMarathonSound('hover');
      }
    }, true);
    
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.matches && target.matches('button, .btn, .pill.clickable')) {
        playMarathonSound('click');
      }
    }, true);
    
    // Sound toggle checkbox listener
    document.addEventListener('DOMContentLoaded', () => {
      const soundToggle = document.getElementById('soundToggleCheckbox');
      if (soundToggle) {
        // Load saved preference
        const savedPref = localStorage.getItem('marathon_sound_enabled');
        if (savedPref !== null) {
          marathonSoundEnabled = savedPref === 'true';
          soundToggle.checked = marathonSoundEnabled;
        }
        
        // Update on change
        soundToggle.addEventListener('change', () => {
          marathonSoundEnabled = soundToggle.checked;
          localStorage.setItem('marathon_sound_enabled', marathonSoundEnabled);
          // Play a click sound as feedback if enabled
          if (marathonSoundEnabled) {
            playMarathonSound('click');
          }
        });
      }
      
      // Make date input wrapper fully clickable
      const dateWrapper = document.getElementById('dateInputWrapper');
      if (dateWrapper) {
        dateWrapper.addEventListener('click', (e) => {
          // If clicked on wrapper (not the input itself), trigger the date input
          const dateInput = dateWrapper.querySelector('input[type="date"]');
          if (dateInput && e.target !== dateInput) {
            dateInput.showPicker ? dateInput.showPicker() : dateInput.focus();
          }
        });
      }
    });
  }
  
  // Call on page load
  initMarathonSounds();
  
  // [NEW] ASCII Ripple Effect for Dark Theme
  const ASCII_CHARS = '.,·-─~+:;=*π""┐┌┘┴┬╗╔╝╚╬╠╣╩╦║░▒▓█▄▀▌▐■!?&#$@0123456789*';
  
  function createASCIIRipple(element) {
    if (!element || element._asciiRipple) return;
    element._asciiRipple = true;
    
    const originalText = element.textContent;
    let isAnimating = false;
    let animationFrame = null;
    
    element.addEventListener('mouseenter', (e) => {
      // Only run for marathon/dark theme
      const theme = document.documentElement.getAttribute('data-theme');
      if (theme !== 'marathon') return;
      
      if (isAnimating) return;
      isAnimating = true;
      
      const chars = originalText.split('');
      const startTime = Date.now();
      const duration = 400;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Wave spreads from cursor position
        const rect = element.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const centerPos = Math.round((mouseX / rect.width) * chars.length);
        
        let newText = chars.map((char, i) => {
          if (char === ' ') return ' ';
          
          const dist = Math.abs(i - centerPos);
          const waveRadius = progress * chars.length * 1.5;
          
          if (dist < waveRadius && progress < 0.9) {
            const intensity = Math.max(0, waveRadius - dist);
            if (intensity < 3 && intensity > 0) {
              return ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
            }
          }
          return char;
        }).join('');
        
        element.textContent = newText;
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          element.textContent = originalText;
          isAnimating = false;
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
    });
    
    element.addEventListener('mouseleave', () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      element.textContent = originalText;
      isAnimating = false;
    });
  }
  
  // Initialize ASCII ripple on appropriate elements
  function initASCIIRipple() {
    // Apply to menu items and specific links in dark theme
    const targets = document.querySelectorAll('.brand span, .cardHeader h2, .theme-option');
    targets.forEach(createASCIIRipple);
  }
  
  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', initASCIIRipple);

  // [OK] UPCOMING EVENTS with type for distinct styling
  const UPCOMING_EVENTS = [
    { date: "2025-01-01", title: "New Year's Day", type: "holiday", icon: "fa-champagne-glasses" },
    { date: "2025-02-14", title: "Valentine's Day", type: "holiday", icon: "fa-heart" },
    { date: "2025-11-27", title: "Thanksgiving", type: "holiday", icon: "fa-leaf" },
    { date: "2025-12-25", title: "Christmas", type: "holiday", icon: "fa-tree" },
    { date: "2026-01-01", title: "New Year's Day", type: "holiday", icon: "fa-champagne-glasses" },
    { date: "2026-02-14", title: "Valentine's Day", type: "holiday", icon: "fa-heart" },
    { date: "2026-11-26", title: "Thanksgiving", type: "holiday", icon: "fa-leaf" },
    { date: "2026-12-25", title: "Christmas", type: "holiday", icon: "fa-tree" }
  ];

  // [FIX] Device-based user storage (like YouTube - persists across tabs on same device)
  const KEY_CURRENT_USER = "bucketlist_2026_current_user";
  const KEY_DEVICE_ID = "bucketlist_2026_device_id";
  const KEY_READ_SYSTEM_NOTIFS = "bucketlist_2026_read_system_notifs";

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
    return `${notif.type}_${notif.title}_${notif.date || ''}`;
  }
  function loadReadSystemNotifs() {
    const u = loadUser();
    if (!u) return [];
    try { return JSON.parse(localStorage.getItem(`${KEY_READ_SYSTEM_NOTIFS}_${u.toLowerCase()}`)) || []; } catch { return []; }
  }
  function saveReadSystemNotifs(arr, skipSync = false) {
    const u = loadUser();
    if (!u) return;
    localStorage.setItem(`${KEY_READ_SYSTEM_NOTIFS}_${u.toLowerCase()}`, JSON.stringify(arr));
    // [FIX] Sync notification read state globally
    if (!skipSync) schedulePush();
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

  // [FIX] Device ID - persistent per device (localStorage)
  function getDeviceId() {
    let id = localStorage.getItem(KEY_DEVICE_ID);
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(KEY_DEVICE_ID, id);
    }
    return id;
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
`
⠀⠀⠀⠀⠀⠀⢀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀⢀⣴⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀
⠀⠀⢀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀
⠀⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠀⠀
⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀
⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀
⠀⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⠀
⠀⠀⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⠀⠀
⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀
⠀⠀⠀⠀⠀⠙⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠋⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⠿⣿⣿⣿⣿⣿⣿⠿⠿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀
          LOVE 💕`,
`
⠀⠀⠀⠀⠀⠀⣠⣴⣶⣿⣿⣶⣦⣄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀
⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀⠀
⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀
⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀
⠀⣿⣿⡏⠉⠉⠉⠉⣿⣿⣿⣿⠉⠉⠉⠉⢹⣿⣿⠀
⠀⣿⣿⡇⠀⠀⠀⠀⣿⣿⣿⣿⠀⠀⠀⠀⢸⣿⣿⠀
⠀⣿⣿⡇⠀⢀⣀⠀⣿⣿⣿⣿⠀⣀⡀⠀⢸⣿⣿⠀
⠀⣿⣿⣧⣀⠀⠀⣠⣿⣿⣿⣿⣄⠀⠀⣀⣼⣿⣿⠀
⠀⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⠀
⠀⠀⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠀⠀
          🥰 CUTE 🥰`,
`
⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣴⣾⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⠀⠀
⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀⠀
⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀
⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀
⠀⣿⣿⣿⡟⠁⣿⣿⣿⣿⣿⣿⣿⣿⠈⠻⣿⣿⣿⣿⠀
⠀⣿⣿⣿⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⣿⣿⣿⣿⠀
⠀⣿⣿⣿⣦⣤⣾⣿⣿⣿⣿⣿⣿⣷⣤⣴⣿⣿⣿⣿⠀
          HAPPY 😊`,
`
⠀⠀⠀⠀⠀⠀⢀⣀⣀⣀⣀⣀⣀⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⠀
⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀
⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠀
⢸⣿⣿⣿⠉⠉⣿⣿⣿⣿⣿⣿⣿⣿⠉⠉⣿⣿⣿⡇
⣿⣿⣿⣿⣶⣶⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇
          SMILE 😄`,
`
⠀⠀⠀⠀⠀⢀⣴⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀
⠀⠀⠀⢀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀
⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀
⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷
⢸⣿⣿⣿⠛⠛⣿⣿⣿⣿⣿⣿⣿⣿⠛⠛⣿⣿⣿⣿
⣿⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿⣿⣿⣿⣷⣾⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⠟⠉⠉⠉⠉⠻⣿⣿⣿⣿⣿⣿⣿
⠸⣿⣿⣿⣿⣿⣿⣷⣶⣶⣶⣶⣾⣿⣿⣿⣿⣿⣿⠇
        KISSES 😘`,
`
⠀⠀⠀⠀⣀⣤⣶⣿⣿⣿⣿⣶⣤⣀⠀⠀⠀⠀
⠀⠀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀
⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀
⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⣿⣿⣿⣿⡿⠋⣿⣿⣿⣿⣿⣿⠙⢿⣿⣿⣿⣿
⣿⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿⣿⣷⣾⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠃
        SWEET 🍬`,
`
⠀⠀⠀⠀⣀⣤⣶⣿⣿⣿⣿⣶⣤⣀⠀⠀⠀⠀
⠀⠀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀
⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀
⢸⣿⣿⣿⠟⠉⠉⣿⣿⣿⣿⠉⠉⠻⣿⣿⣿⡇
⣿⣿⣿⣿⠀⠀⠀⣿⣿⣿⣿⠀⠀⠀⣿⣿⣿⣿
⣿⣿⣿⣿⣤⣤⣴⣿⣿⣿⣿⣦⣤⣤⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⠘⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠃
         PRETTY ✨`
];

  // [OK] Prevent double-trigger of letter animation
  let letterAnimationInProgress = false;

  const exampleActive = { title: "Test Mission (Example)", desc: "This is an example card - shows all indicator types", tag: "example", done: false, isExample: true };
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
    
    // Use innerHTML to support icon HTML in message
    toast.innerHTML = message;
    container.appendChild(toast);
    
    // Event toasts stay longer (6s), others 3.5s
    const duration = type === "event" ? 6000 : 3500;
    
    setTimeout(() => {
      toast.classList.add("toast-exit");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // [NEW] Confetti animation on mission completion
  function triggerConfetti() {
    const container = document.createElement("div");
    container.className = "confetti-container";
    document.body.appendChild(container);
    
    const colors = ['#ff6b9d', '#ff3b3b', '#3bff6b', '#3b7bff', '#ffe93b', '#ff9f43', '#d4ff00'];
    const shapes = ['square', 'circle'];
    
    // Create 60 confetti pieces
    for (let i = 0; i < 60; i++) {
      const confetti = document.createElement("div");
      confetti.className = `confetti ${shapes[Math.floor(Math.random() * shapes.length)]}`;
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      confetti.style.width = `${6 + Math.random() * 8}px`;
      confetti.style.height = `${6 + Math.random() * 8}px`;
      container.appendChild(confetti);
    }
    
    // Clean up after animation
    setTimeout(() => container.remove(), 4500);
  }

  // [NEW] Confirmation modal for actions
  function showConfirmModal(message, onConfirm, onCancel = null) {
    // Remove any existing confirm modal
    const existing = document.querySelector(".confirm-modal-overlay");
    if (existing) existing.remove();
    
    const overlay = document.createElement("div");
    overlay.className = "confirm-modal-overlay";
    overlay.innerHTML = `
      <div class="confirm-modal">
        <div class="confirm-modal-message">${escapeHtml(message)}</div>
        <div class="confirm-modal-buttons">
          <button class="btn confirm-modal-cancel">Cancel</button>
          <button class="btn primary confirm-modal-confirm">Confirm</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add event listeners
    overlay.querySelector(".confirm-modal-cancel").addEventListener("click", () => {
      overlay.remove();
      if (onCancel) onCancel();
    });
    
    overlay.querySelector(".confirm-modal-confirm").addEventListener("click", () => {
      overlay.remove();
      onConfirm();
    });
    
    // Close on backdrop click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (onCancel) onCancel();
      }
    });
  }

  // [NEW] Alert modal for simple messages (replaces native alert())
  function showAlertModal(message, onClose = null) {
    // Remove any existing alert modal
    const existing = document.querySelector(".alert-modal-overlay");
    if (existing) existing.remove();
    
    const overlay = document.createElement("div");
    overlay.className = "confirm-modal-overlay alert-modal-overlay";
    overlay.innerHTML = `
      <div class="confirm-modal alert-modal">
        <div class="confirm-modal-message">${escapeHtml(message)}</div>
        <div class="confirm-modal-buttons">
          <button class="btn primary alert-modal-ok">OK</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add event listeners
    overlay.querySelector(".alert-modal-ok").addEventListener("click", () => {
      overlay.remove();
      if (onClose) onClose();
    });
    
    // Close on backdrop click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (onClose) onClose();
      }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handleEscape);
        if (onClose) onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // [NEW] Prominent file too large notification (center screen)
  function showFileTooLargeNotification(fileName, maxSize) {
    // Remove any existing notification
    const existing = document.querySelector(".file-too-large-notification");
    if (existing) existing.remove();
    
    const notification = document.createElement("div");
    notification.className = "confirm-modal-overlay file-too-large-notification";
    notification.innerHTML = `
      <div class="file-too-large-modal">
        <div class="file-too-large-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>FILE TOO LARGE</h3>
        <p class="file-too-large-name">${escapeHtml(fileName)}</p>
        <p class="file-too-large-limit">Maximum allowed size: <strong>${maxSize}</strong></p>
        <p class="file-too-large-tip">Try compressing the file or using a shorter clip.</p>
        <button class="btn primary file-too-large-ok">OK</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Close handlers
    notification.querySelector(".file-too-large-ok").addEventListener("click", () => {
      notification.remove();
    });
    
    notification.addEventListener("click", (e) => {
      if (e.target === notification) notification.remove();
    });
    
    // Auto-close after 8 seconds
    setTimeout(() => {
      if (notification.parentNode) notification.remove();
    }, 8000);
  }

  // [OK] Check for system updates (new version)
  function checkSystemUpdates() {
    const lastSeen = localStorage.getItem(KEY_LAST_VERSION_SEEN);
    if (lastSeen !== CURRENT_VERSION) {
      const latest = VERSION_HISTORY[VERSION_HISTORY.length - 1];
      showToast(`Update v${latest.version}: ${latest.note}`, "info");
      localStorage.setItem(KEY_LAST_VERSION_SEEN, CURRENT_VERSION);
    }
  }

  // [FIX] Check for upcoming events - now 7 days out with daily countdown
  function checkUpcomingEvents() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    UPCOMING_EVENTS.forEach(event => {
      const eventDate = new Date(event.date + "T00:00:00");
      const diffMs = eventDate - today;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      
      // Helper to render icon (handles both emoji and FA class)
      const renderIcon = (iconStr) => {
        if (!iconStr) return '<i class="fas fa-calendar"></i>';
        if (iconStr.startsWith('fa-')) return `<i class="fas ${iconStr}"></i>`;
        return iconStr; // Fallback for any remaining emojis
      };
      
      // Show notification for events within 7 days (but not past)
      if (diffDays > 0 && diffDays <= 7) {
        const iconHtml = renderIcon(event.icon);
        if (diffDays === 1) {
          showToast(`${iconHtml} Tomorrow: ${event.title}!`, "event");
        } else {
          showToast(`${iconHtml} ${event.title} in ${diffDays} days!`, "event");
        }
      } else if (diffDays === 0) {
        const iconHtml = renderIcon(event.icon);
        showToast(`${iconHtml} Today is ${event.title}!`, "event");
      }
      // Events in the past are automatically not shown (diffDays < 0)
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
  // [FIX] User storage - localStorage for device-wide persistence (like YouTube)
  function loadUser() { return localStorage.getItem(KEY_CURRENT_USER) || ""; }
  function hasUser() { return !!loadUser().trim() || isGuestMode; }
  function saveUser(name) { localStorage.setItem(KEY_CURRENT_USER, name); }
  function clearUser() { localStorage.removeItem(KEY_CURRENT_USER); }

  // [NEW] Guest mode functions - read-only access
  function setGuestMode(enabled) {
    isGuestMode = enabled;
    if (enabled) {
      clearUser(); // Clear any existing user
      applyGuestRestrictions();
      updateUserDuoPills(); // Update UI to show guest status
    } else {
      removeGuestRestrictions();
    }
  }

  function applyGuestRestrictions() {
    document.body.classList.add('guest-mode');
    
    // List of elements to disable for guests
    const writeElements = [
      'btnAdd', 'btnSaveNote', 'photoSelectBtn', 'photoSubmitBtn',
      'btnEditSystemMessage', 'attachmentInput', 'customNote',
      'newTitle', 'newDesc', 'newTag', 'newDueDate',
      'pbAddSimple', 'pbAddDetailed', 'pbQuickInput',
      'refreshMedal' // This changes to upload button
    ];
    
    writeElements.forEach(id => {
      const el = $(id);
      if (el) {
        el.disabled = true;
        el.classList.add('guest-disabled');
        el.title = 'Login as a user to use this feature';
      }
    });
    
    // Hide upload sections
    const uploadSections = document.querySelectorAll('.photo-upload-section, .game-clip-upload-modal');
    uploadSections.forEach(section => section.classList.add('guest-hidden'));
    
    // Disable all delete and edit buttons
    setTimeout(() => {
      document.querySelectorAll('.item button, .medal-delete, .gallery-delete').forEach(btn => {
        btn.disabled = true;
        btn.classList.add('guest-disabled');
      });
    }, 500);
  }

  function removeGuestRestrictions() {
    document.body.classList.remove('guest-mode');
    document.querySelectorAll('.guest-disabled').forEach(el => {
      el.disabled = false;
      el.classList.remove('guest-disabled');
      el.title = '';
    });
    document.querySelectorAll('.guest-hidden').forEach(el => {
      el.classList.remove('guest-hidden');
    });
  }

  // Check if action is allowed (not in guest mode)
  function isActionAllowed(showMessage = true) {
    if (isGuestMode) {
      if (showMessage) showToast("Login as a user to use this feature");
      return false;
    }
    return true;
  }

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
          <div class="bundle-header-left">
            <span class="bundle-mission"><i class="fa-solid fa-${isUnlinked ? 'images' : 'link'}"></i> ${escapeHtml(displayName)}</span>
            <span class="bundle-count">${isUnlinked ? photoCount : photoCount + '/5'} photos</span>
          </div>
          <div class="bundle-actions">
            ${canAddMore ? `<button class="bundle-add-btn" title="Add more photos${isUnlinked ? '' : ' to this mission'}"><i class="fas fa-plus"></i></button>` : ''}
            ${isUnlinked ? `<button class="bundle-link-btn" title="Link these to a mission"><i class="fas fa-link"></i></button>` : ''}
            <button class="bundle-delete-btn" title="Delete all photos"><i class="fas fa-trash"></i></button>
            <span class="bundle-expand"><i class="fas fa-chevron-${wasExpanded ? 'up' : 'down'}"></i></span>
          </div>
        </div>
        <div class="bundle-photos ${wasExpanded ? '' : 'collapsed'}">
          <div class="gallery-grid"></div>
        </div>
      `;
      
      // [FIX] Use event listener for bundle toggle instead of inline onclick
      const headerLeft = bundle.querySelector(".bundle-header-left");
      const expandBtn = bundle.querySelector(".bundle-expand");
      
      if (headerLeft) {
        headerLeft.style.cursor = "pointer";
        headerLeft.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleBundle(bundle);
        });
      }
      
      if (expandBtn) {
        expandBtn.style.cursor = "pointer";
        expandBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleBundle(bundle);
        });
      }
      
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
      modal.remove();
      showToast(`Linked ${photosToLink.length} photo(s) to "${selectedMission}"`);
    });
  }

  // [OK] Delete photo confirmation modal
  function showDeleteConfirm(type, identifier, photoObj = null) {
    const existing = document.querySelector(".delete-confirm-modal");
    if (existing) existing.remove();
    
    const isSingle = type === "_single_";
    const displayName = isSingle ? "this photo" : `all photos in "${identifier}"`;
    
    const modal = document.createElement("div");
    modal.className = "delete-confirm-modal";
    modal.innerHTML = `
      <div class="delete-confirm-content">
        <h4><i class="fas fa-exclamation-triangle"></i> Delete ${displayName}?</h4>
        <p>This action cannot be undone.</p>
        <div class="delete-confirm-actions">
          <button class="btn" id="cancelDeleteBtn">Cancel</button>
          <button class="btn primary" id="confirmDeleteBtn" style="background:#ff3b3b;border-color:#ff3b3b;"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector("#cancelDeleteBtn").addEventListener("click", () => modal.remove());
    modal.querySelector("#confirmDeleteBtn").addEventListener("click", () => {
      let photos = loadPhotos();
      
      if (isSingle && photoObj) {
        // Delete single photo
        photos = photos.filter(p => p.url !== photoObj.url);
      } else if (type === "_unlinked_") {
        // Delete all unlinked photos
        photos = photos.filter(p => p.mission && p.mission !== "");
      } else {
        // Delete all photos linked to this mission
        photos = photos.filter(p => p.mission !== type);
      }
      
      savePhotos(photos);
      renderPhotoGallery();
      modal.remove();
      showToast(isSingle ? "Photo deleted" : "Photos deleted");
    });
  }

  // [OK] Toggle bundle expand/collapse - FIXED event handling
  window.toggleBundle = function(headerOrBundleEl, e) {
    // Prevent event bubbling issues
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const bundle = headerOrBundleEl.closest('.gallery-mission-bundle') || headerOrBundleEl;
    if (!bundle) return;
    
    const photosDiv = bundle.querySelector('.bundle-photos');
    const icon = bundle.querySelector('.bundle-expand i');
    
    if (!photosDiv) return;
    
    if (photosDiv.classList.contains('collapsed')) {
      photosDiv.classList.remove('collapsed');
      if (icon) icon.className = 'fas fa-chevron-up';
    } else {
      photosDiv.classList.add('collapsed');
      if (icon) icon.className = 'fas fa-chevron-down';
    }
  };

  // [OK] Mission capacity indicator
  function updateMissionCapacity() {
    const select = $("photoMission");
    const capacityEl = $("missionCapacity");
    if (!select || !capacityEl) return;
    
    const mission = select.value;
    if (!mission) {
      capacityEl.textContent = "No limit for unlinked photos";
      capacityEl.style.color = "var(--muted)";
      return;
    }
    
    const existingCount = loadPhotos().filter(p => p.mission === mission).length;
    const remaining = 5 - existingCount;
    
    if (remaining <= 0) {
      capacityEl.textContent = `Full (${existingCount}/5)`;
      capacityEl.style.color = "#ff3b3b";
    } else {
      capacityEl.textContent = `${remaining} slot(s) remaining`;
      capacityEl.style.color = remaining <= 2 ? "#ffe93b" : "var(--muted)";
    }
  }

  // [OK] Photo lightbox state
  let lightboxCurrentIndex = 0;

  function openPhotoLightbox(url, index) {
    const lightbox = $("photoLightbox");
    const img = $("lightboxImage");
    const counter = $("lightboxCounter");
    
    if (!lightbox || !img) return;
    
    const photos = loadPhotos();
    lightboxCurrentIndex = index;
    
    img.src = url;
    if (counter) counter.textContent = `${index + 1} / ${photos.length}`;
    
    lightbox.classList.add("active");
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const lightbox = $("photoLightbox");
    if (lightbox) {
      lightbox.classList.remove("active");
      document.body.style.overflow = '';
    }
  }

  function lightboxPrev() {
    const photos = loadPhotos();
    if (photos.length === 0) return;
    lightboxCurrentIndex = (lightboxCurrentIndex - 1 + photos.length) % photos.length;
    const photo = photos[lightboxCurrentIndex];
    $("lightboxImage").src = photo.url;
    $("lightboxCounter").textContent = `${lightboxCurrentIndex + 1} / ${photos.length}`;
  }

  function lightboxNext() {
    const photos = loadPhotos();
    if (photos.length === 0) return;
    lightboxCurrentIndex = (lightboxCurrentIndex + 1) % photos.length;
    const photo = photos[lightboxCurrentIndex];
    $("lightboxImage").src = photo.url;
    $("lightboxCounter").textContent = `${lightboxCurrentIndex + 1} / ${photos.length}`;
  }

  // [FIX] Game Clips - supports both Medal API clips and user uploads
  // Revert to hover preview + click opens new tab for Medal clips
  const KEY_GAME_CLIPS = "bucketlist_2026_game_clips";
  
  function loadGameClips() {
    try {
      return JSON.parse(localStorage.getItem(KEY_GAME_CLIPS)) || [];
    } catch { return []; }
  }
  
  function saveGameClips(clips) {
    localStorage.setItem(KEY_GAME_CLIPS, JSON.stringify(clips));
    schedulePush();
  }
  
  // [FIX] Fetch Medal clips from API (reverted behavior)
  async function fetchMedalClips() {
    try {
      const res = await fetch("/.netlify/functions/medal?limit=12");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.contentObjects || [];
    } catch (err) {
      console.log("Medal API unavailable:", err.message);
      return [];
    }
  }
  
  async function renderGameClips() {
    const container = $("medalClips");
    if (!container) return;
    
    container.innerHTML = '<div class="medal-empty">Loading clips...</div>';
    
    // Load both Medal clips and user uploads
    const [medalClips, userClips] = await Promise.all([
      fetchMedalClips(),
      Promise.resolve(loadGameClips())
    ]);
    
    const allClips = [];
    
    // Add Medal clips with source tag
    medalClips.forEach(clip => {
      allClips.push({
        ...clip,
        source: 'medal',
        title: clip.contentTitle || 'Medal Clip',
        thumbnail: clip.thumbnail,
        url: clip.contentUrl || clip.rawFileUrl
      });
    });
    
    // Add user uploads with source tag
    userClips.forEach((clip, idx) => {
      allClips.push({
        ...clip,
        source: 'upload',
        title: clip.title || 'Uploaded Clip',
        uploadIdx: idx
      });
    });
    
    if (allClips.length === 0) {
      container.innerHTML = '<div class="medal-empty">No clips yet. Upload your first game clip!</div>';
      return;
    }
    
    container.innerHTML = "";
    
    allClips.forEach((clip, idx) => {
      const card = document.createElement("div");
      card.className = "medal-card";
      const isMedal = clip.source === 'medal';
      const isUpload = clip.source === 'upload';
      
      // [NEW] Determine media type label for uploads
      const isImage = clip.mediaType === 'image';
      let sourceLabel = 'Medal';
      if (isUpload) {
        sourceLabel = isImage ? 'IMAGE' : 'VIDEO';
      }
      
      // Thumbnail: use Medal thumbnail, or for uploads use the URL itself as thumbnail
      let thumbStyle;
      if (clip.thumbnail) {
        thumbStyle = `background-image: url('${escapeHtml(clip.thumbnail)}'); background-size: cover; background-position: center;`;
      } else if (isUpload && clip.url) {
        // For uploaded images, use the image URL as background
        // For videos, show a gradient placeholder (video poster would need extra work)
        if (isImage) {
          thumbStyle = `background-image: url('${escapeHtml(clip.url)}'); background-size: cover; background-position: center;`;
        } else {
          thumbStyle = `background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`;
        }
      } else {
        thumbStyle = `background: linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)`;
      }
      
      card.innerHTML = `
        <div class="medal-thumb" style="${thumbStyle}">
          <div class="medal-play"><i class="fas ${isImage ? 'fa-image' : 'fa-play'}"></i></div>
          <span class="clip-source-tag ${isMedal ? 'medal-tag' : (isImage ? 'image-tag' : 'upload-tag')}">${sourceLabel}</span>
          ${isUpload ? `<button class="medal-delete guest-disabled" data-idx="${clip.uploadIdx}" title="Delete clip"><i class="fas fa-times"></i></button>` : ''}
        </div>
        <div class="medal-info">
          <div class="medal-title">${escapeHtml(clip.title)}</div>
          <div class="medal-game">${escapeHtml(clip.categoryName || clip.date || '')}</div>
        </div>
      `;
      
      // [FIX] Hover preview popup
      const thumb = card.querySelector(".medal-thumb");
      
      // [FIX] Click opens new tab for Medal, modal for uploads
      thumb.addEventListener("click", () => {
        if (isMedal && clip.url) {
          // Medal clips open in new tab
          window.open(clip.url, '_blank');
        } else if (isUpload && clip.url) {
          // User uploads open in modal
          openGameClipModal(clip);
        }
      });
      
      // Delete button for uploads only
      if (isUpload) {
        const deleteBtn = card.querySelector(".medal-delete");
        if (deleteBtn) {
          deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showConfirmModal("Delete this game clip?", () => {
              const clipsNow = loadGameClips();
              clipsNow.splice(clip.uploadIdx, 1);
              saveGameClips(clipsNow);
              renderGameClips();
              showToast("Clip deleted");
            });
          });
        }
      }
      
      container.appendChild(card);
    });
  }
  function openGameClipModal(clip) {
    const modal = $("medalModal");
    const content = $("medalModalContent");
    if (!modal || !content) return;
    
    // [NEW] Check if it's an image or video
    const isImage = clip.mediaType === 'image';
    
    if (isImage) {
      // Display image
      content.innerHTML = `
        <div class="medal-modal-info">
          <h4>${escapeHtml(clip.title || 'Game Image')}</h4>
          ${clip.date ? `<span style="color: var(--muted); font-size: 11px;">${escapeHtml(clip.date)}</span>` : ''}
        </div>
        <img src="${escapeHtml(clip.url)}" alt="${escapeHtml(clip.title || 'Image')}" style="width:100%;max-height:70vh;object-fit:contain;">
        <div class="medal-modal-actions" style="margin-top:15px;text-align:center;">
          <a href="${escapeHtml(clip.url)}" download class="btn"><i class="fas fa-download"></i> Download</a>
        </div>
      `;
    } else {
      // Display video
      content.innerHTML = `
        <div class="medal-modal-info">
          <h4>${escapeHtml(clip.title || 'Game Clip')}</h4>
          ${clip.date ? `<span style="color: var(--muted); font-size: 11px;">${escapeHtml(clip.date)}</span>` : ''}
        </div>
        <video controls autoplay playsinline style="width:100%;max-height:70vh;">
          <source src="${escapeHtml(clip.url)}" type="video/mp4">
          Your browser doesn't support video playback.
        </video>
      `;
    }
    
    modal.classList.add("active");
    document.body.style.overflow = 'hidden';
  }

  function closeMedalModal() {
    const modal = $("medalModal");
    const content = $("medalModalContent");
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = '';
    }
    if (content) {
      content.innerHTML = ""; // Stop video
    }
  }
  
  // Game clip upload handler
  async function uploadGameClip(file, title, date) {
    try {
      showToast("Uploading clip...");
      const url = await uploadPhotoToSupabase(file); // Reuse photo upload function
      
      // [NEW] Detect media type (image or video)
      const isImage = file.type.startsWith('image/');
      const mediaType = isImage ? 'image' : 'video';
      
      const clips = loadGameClips();
      clips.push({
        url,
        title: title || "Untitled Clip",
        date: date || new Date().toISOString().split('T')[0],
        uploadedAt: new Date().toISOString(),
        uploadedBy: loadUser(),
        mediaType: mediaType // [NEW] Store media type
      });
      
      saveGameClips(clips);
      renderGameClips();
      showToast(isImage ? "Image uploaded!" : "Clip uploaded!");
      return true;
    } catch (err) {
      console.error("Game clip upload error:", err);
      showToast("Upload failed: " + err.message);
      return false;
    }
  }

  // ---------- System message ----------
  function loadSystemMessage() {
    return localStorage.getItem(KEY_SYSTEM_MESSAGE) || "MY LOVE";
  }

  function saveSystemMessage(msg) {
    localStorage.setItem(KEY_SYSTEM_MESSAGE, msg);
    schedulePush();
  }

  // [FIX] Track if system message has been animated to prevent spam
  let systemMessageAnimated = false;
  let lastSystemMessageText = "";
  let systemMessageAnimating = false;

  function renderSystemMessage(msg, forceAnimate = false) {
    const herName = $("herName");
    const text = msg || "MY LOVE";
    
    if (herName) {
      // Only animate if: forced, first time, or text changed
      const shouldAnimate = forceAnimate || !systemMessageAnimated || lastSystemMessageText !== text;
      const needsCorrection = systemMessageAnimated && lastSystemMessageText !== text && herName.textContent.length > 0;
      
      if (shouldAnimate && !systemMessageAnimating) {
        systemMessageAnimating = true;
        
        if (needsCorrection && herName.textContent.length > 0) {
          // BACKSPACE effect first, then rewrite
          const currentText = herName.textContent;
          let deleteIndex = currentText.length;
          
          const deleteInterval = setInterval(() => {
            if (deleteIndex > 0) {
              deleteIndex--;
              herName.textContent = currentText.substring(0, deleteIndex);
            } else {
              clearInterval(deleteInterval);
              // Now type the new text
              typeNewMessage(herName, text);
            }
          }, 25); // Fast backspace
        } else {
          // Just type fresh
          herName.textContent = "";
          typeNewMessage(herName, text);
        }
      }
      // If not animating but text differs, just set it
      else if (!systemMessageAnimating && herName.textContent !== text) {
        herName.textContent = text;
      }
    }
    
    const loveNote = $("loveNote");
    if (loveNote) {
      loveNote.textContent = `// SYSTEM MESSAGE: ${text}`;
    }
  }
  
  function typeNewMessage(element, text) {
    systemMessageAnimated = true;
    lastSystemMessageText = text;
    let i = 0;
    
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text[i];
        i++;
      } else {
        clearInterval(typeInterval);
        systemMessageAnimating = false;
      }
    }, 60); // Slightly faster typing
  }
  
  // [FIX] Re-animate system message on visibility change (tab back in)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // Re-render to ensure text isn't broken
      const msg = loadSystemMessage();
      const herName = $("herName");
      if (herName && herName.textContent !== msg) {
        renderSystemMessage(msg, true);
      }
    }
  });

  function loadTheme() { return localStorage.getItem(KEY_THEME) || "system"; }
  function saveTheme(t) { localStorage.setItem(KEY_THEME, t); }

  // ---------- Presence and sync ----------
  let presenceTimer = null;
  let lastPresence = {};
  
  // [FIX] Device conflict state
  let deviceLocked = false;
  let loginInProgress = false;
  let takeoverInProgress = false;
  let loginGraceUntil = 0;
  let takeoverGraceUntil = 0;
  let kickCheckTimer = null;
  
  // [FIX] Device active timeout (3 seconds for fast detection)
  const DEVICE_ACTIVE_TIMEOUT = 3000;

  // [OK] Presence visibility based on WebSocket
  function isOnlineLive(user) {
    if (!user) return false;
    const u = user.toLowerCase();
    
    // Check WebSocket presence first (most reliable)
    if (livePresenceState && Object.keys(livePresenceState).length > 0) {
      for (const [key, presences] of Object.entries(livePresenceState)) {
        for (const p of presences) {
          if (p.user === u) return true;
        }
      }
    }
    
    // Fallback to activeDevices from database
    if (activeDevices[u]) {
      const age = Date.now() - (activeDevices[u].lastActive || 0);
      return age < DEVICE_ACTIVE_TIMEOUT;
    }
    
    return false;
  }

  function getUserColorClass(user) {
    const u = String(user || "").trim().toLowerCase();
    if (u === "yasir") return "user-yasir";
    if (u === "kylee") return "user-kylee";
    return "";
  }

  function updateUserDuoPills() {
    // [NEW] Handle guest mode display
    if (isGuestMode) {
      const userTextEl = $("userText");
      const duoTextEl = $("duoText");
      const userIcon = $("userIcon");
      const duoIcon = $("duoIcon");
      const userDot = $("userDot");
      const duoDot = $("duoDot");
      
      if (userTextEl) userTextEl.textContent = "USER: GUEST";
      if (duoTextEl) duoTextEl.textContent = "DUO: --";
      if (userIcon) {
        userIcon.classList.remove('fa-regular', 'fa-solid', 'user-yasir', 'user-kylee');
        userIcon.classList.add('fa-regular');
      }
      if (duoIcon) {
        duoIcon.classList.remove('fa-regular', 'fa-solid', 'user-yasir', 'user-kylee');
        duoIcon.classList.add('fa-regular');
      }
      if (userDot) userDot.className = 'dot gray';
      if (duoDot) duoDot.className = 'dot gray';
      return;
    }
    
    const user = loadUser().trim().toLowerCase();
    const duo = getDuoName(user)?.toLowerCase();

    const userIcon = $("userIcon");
    const duoIcon = $("duoIcon");

    // [FIX v1.4.4] Add null checks to prevent crash during init
    const userTextEl = $("userText");
    const duoTextEl = $("duoText");
    if (userTextEl) userTextEl.textContent = user ? `USER: ${user.toUpperCase()}` : "USER: --";
    if (duoTextEl) duoTextEl.textContent = duo ? `DUO: ${duo.toUpperCase()}` : "DUO: --";

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
      // [FIX] Use deviceId as presence key (unique per device!)
      const myDeviceId = getDeviceId();
      presenceChannel = sbClient.channel(`presence:${ROOM_CODE}`, {
        config: { presence: { key: myDeviceId } }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          livePresenceState = presenceChannel.presenceState();
          handleLivePresenceSync(livePresenceState);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log("[PRESENCE] Join:", key, newPresences?.length || 0);
          livePresenceState = presenceChannel.presenceState();
          handleLivePresenceSync(livePresenceState);
          updateUserDuoPills();
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          // [FIX] ALWAYS check for auto-resolve when someone leaves
          console.log("[PRESENCE] Leave:", key, leftPresences?.length || 0);
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
            console.log("[OK] WebSocket presence active for:", user);
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
    
    // [FIX v1.4.4] Find ALL presences for our user across ALL keys
    let conflictingDevices = [];
    
    for (const [key, presences] of Object.entries(state)) {
      for (const p of presences) {
        // Same user, different device = another device owns my user
        if (p.user === currentUser && p.deviceId && p.deviceId !== myDeviceId) {
          conflictingDevices.push({ key, ...p });
        }
      }
    }

    // [FIX] Calculate grace period status ONCE
    const inLoginGrace = now < loginGraceUntil;
    const inTakeoverGrace = now < takeoverGraceUntil;
    const inAnyGrace = inLoginGrace || inTakeoverGrace;

    console.log("[PRESENCE] Sync:", {
      user: currentUser,
      myDevice: myDeviceId.slice(-6),
      conflicts: conflictingDevices.length,
      deviceLocked,
      inLoginGrace,
      inTakeoverGrace
    });

    // [FIX v1.4.4] If another device owns my user, I've been KICKED
    // Don't show conflict choice - just kick to login screen
    if (conflictingDevices.length > 0) {
      if (inAnyGrace) {
        console.log("[PRESENCE] In grace period - ignoring conflict");
        // Don't kick during grace period
      } else {
        console.log("[PRESENCE] Another device owns my user - KICKING to login");
        handleKicked();
      }
    } else {
      // [FIX] AUTO-RESOLVE: No conflicts
      if (deviceLocked) {
        console.log("[PRESENCE] AUTO-RESOLVED - no conflicts");
        deviceLocked = false;
        hideDeviceConflict();
      }
    }
    
    // [FIX] Always update who modal buttons when presence changes
    updateWhoModalButtons();
    updateUserDuoPills();
  }

  async function stopLivePresence() {
    if (presenceChannel && sbClient) {
      console.log("[PRESENCE] Stopping presence...");
      try {
        await presenceChannel.untrack();
        console.log("[PRESENCE] Untracked successfully");
      } catch (e) {
        console.log("[PRESENCE] Untrack error:", e);
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
    presenceTimer = setInterval(presencePing, 2000); // [FIX] FASTER: 2s instead of 15s
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

  // [FIX] Bell notifications with READ tracking
  function updateNotifications(opts = {}) {
    const { silent = false, markAsRead = false } = opts;
    const badge = $("notificationBadge");
    const list = $("notificationList");

    // Update DUO pill for messages
    updateDuoUnreadBadge();

    // Bell only shows system notifications (updates, events)
    const systemNotifs = [];
    
    // Check for upcoming events
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    UPCOMING_EVENTS.forEach(event => {
      const eventDate = new Date(event.date + "T00:00:00");
      const diffMs = eventDate - today;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 14) { // Show 2 weeks out
        const notifId = getSystemNotifId({ type: 'event', title: event.title, date: event.date });
        const isRead = isSystemNotifRead(notifId);
        systemNotifs.push({
          type: "event",
          eventType: event.type || "event",
          title: event.title,
          date: event.date,
          subtitle: diffDays === 0 ? "TODAY!" : diffDays === 1 ? "Tomorrow!" : `In ${diffDays} days`,
          icon: event.icon || "fa-calendar",
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
      list.innerHTML = '<div class="notif-empty">No notifications</div>';
      return;
    }

    // If markAsRead, mark all as read now
    if (markAsRead) {
      markAllSystemNotifsRead(systemNotifs);
    }

    systemNotifs.forEach(notif => {
      const item = document.createElement("div");
      const isChristmas = notif.title.toLowerCase().includes('christmas');
      const isNewYear = notif.title.toLowerCase().includes('new year');
      const isValentine = notif.title.toLowerCase().includes('valentine');
      
      let extraClass = notif.isRead ? '' : ' unread';
      if (isChristmas) extraClass += ' holiday-christmas';
      else if (isNewYear) extraClass += ' holiday-newyear';
      else if (isValentine) extraClass += ' holiday-valentine';
      else if (notif.eventType === 'holiday') extraClass += ' holiday-generic';
      
      item.className = `notification-item system-notif${extraClass}`;
      item.dataset.notifId = notif.id;
      
      // Prettier holiday notification cards
      if (notif.eventType === 'holiday') {
        const dateFormatted = new Date(notif.date + "T00:00:00").toLocaleDateString('en-US', { 
          weekday: 'short', month: 'short', day: 'numeric' 
        });
        // Render icon as Font Awesome if it starts with fa-
        const iconHtml = notif.icon && notif.icon.startsWith('fa-') 
          ? `<i class="fas ${notif.icon}"></i>` 
          : (notif.icon || '<i class="fas fa-calendar"></i>');
        item.innerHTML = `
          <div class="holiday-notif-card">
            <div class="holiday-notif-icon">${iconHtml}</div>
            <div class="holiday-notif-content">
              <div class="holiday-notif-title">${escapeHtml(notif.title)}</div>
              <div class="holiday-notif-date">${dateFormatted}</div>
              <div class="holiday-notif-countdown">${escapeHtml(notif.subtitle)}</div>
            </div>
          </div>
        `;
      } else {
        const iconHtml = notif.icon && notif.icon.startsWith('fa-') 
          ? `<i class="fas ${notif.icon}"></i>` 
          : (notif.icon || '');
        item.innerHTML = `
          <div class="notification-from">${iconHtml} ${escapeHtml(notif.title)}</div>
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

  // [FIX] Clear all notifications
  function clearAllNotifications() {
    const systemNotifs = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    UPCOMING_EVENTS.forEach(event => {
      const eventDate = new Date(event.date + "T00:00:00");
      const diffMs = eventDate - today;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 14) {
        systemNotifs.push({ type: 'event', title: event.title, date: event.date });
      }
    });
    markAllSystemNotifsRead(systemNotifs);
    updateNotifications();
    showToast("Notifications cleared");
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
            <div class="letter-attachment-label">Attachment</div>
            <video class="letter-attachment-media" controls playsinline>
              <source src="${escapeHtml(msg.attachment)}" type="video/mp4">
            </video>
          `;
        } else {
          attachmentContainer.innerHTML = `
            <div class="letter-attachment-label">Attachment</div>
            <img class="letter-attachment-media" src="${escapeHtml(msg.attachment)}" alt="Attachment" onclick="openAttachmentModal('${escapeHtml(msg.attachment)}', 'image')">
          `;
        }
        attachmentContainer.classList.remove("hidden");
      } else {
        attachmentContainer.classList.add("hidden");
        attachmentContainer.innerHTML = "";
      }
    }

    // Mark as read
    markReadUpTo(idx);
    updateNotifications({ silent: true });

    // Show modal with animation
    const modal = $("letterModal");
    const env = document.querySelector(".letter-envelope");
    const paper = document.querySelector(".letter-paper");

    if (animate && !letterAnimationInProgress) {
      letterAnimationInProgress = true;
      modal.classList.add("active");
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => {
        if (env) env.classList.add("open");
      }, 100);
      
      setTimeout(() => {
        if (paper) paper.classList.add("open");
        letterAnimationInProgress = false;
      }, 600);
    } else if (!animate) {
      modal.classList.add("active");
      if (env) env.classList.add("open");
      if (paper) paper.classList.add("open");
    }
  }

  function prevLetter() {
    if (letterViewerIndex > 0) {
      showLetterAt(letterViewerIndex - 1, false);
    }
  }

  function nextLetter() {
    if (letterViewerIndex < duoLetters.length - 1) {
      showLetterAt(letterViewerIndex + 1, false);
    }
  }

  // [OK] Open attachment in fullscreen modal
  window.openAttachmentModal = function(url, type) {
    const modal = $("attachmentModal");
    const content = $("attachmentModalContent");
    
    if (!modal || !content) return;
    
    if (type === 'video') {
      content.innerHTML = `<video class="attachment-fullscreen" controls autoplay playsinline><source src="${escapeHtml(url)}" type="video/mp4"></video>`;
    } else {
      content.innerHTML = `<img class="attachment-fullscreen" src="${escapeHtml(url)}" alt="Attachment">`;
    }
    
    modal.classList.add("active");
  };

  // [OK] Sanitize messages (remove blank letters)
  function sanitizeMessages(msgs) {
    if (!Array.isArray(msgs)) return [];
    return msgs.filter(m => {
      const content = normalizeNewlines(m?.content ?? "").trim();
      return content.length > 0;
    });
  }

  // ---------- Sync status indicator ----------
  function setSyncStatus(status) {
    const dot = $("syncDot");
    if (!dot) return;
    
    dot.classList.remove("green", "yellow", "red", "gray", "pulse");
    
    if (status === "on") {
      dot.classList.add("green");
    } else if (status === "saving" || status === "pulling") {
      dot.classList.add("yellow", "pulse");
    } else if (status === "error") {
      dot.classList.add("red");
    } else {
      dot.classList.add("gray");
    }
  }

  function showSyncingIndicator() {
    // Could add a syncing indicator
  }

  function hideSyncingIndicator() {
    // Remove syncing indicator
  }

  function openWhoModal() {
    const modal = $("whoModal");
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    
    // [FIX] Check which users are active and update button states
    updateWhoModalButtons();
  }
  
  // [FIX] Check which users are currently active on other devices
  function getActiveUsersFromPresence() {
    const activeUsers = new Set();
    const myDeviceId = getDeviceId();
    
    // Check live presence state
    if (livePresenceState && typeof livePresenceState === 'object') {
      for (const [key, presences] of Object.entries(livePresenceState)) {
        for (const p of presences) {
          // Only count users on OTHER devices as "active"
          if (p.user && p.deviceId && p.deviceId !== myDeviceId) {
            activeUsers.add(p.user.toLowerCase());
          }
        }
      }
    }
    
    return activeUsers;
  }
  
  // [FIX v1.4.4] SESSION GATE - Check if user can be assumed BEFORE switching
  // Returns true if safe to switch, false if user is active elsewhere
  async function canAssumeUser(targetUser) {
    const targetLower = targetUser.toLowerCase();
    const myDeviceId = getDeviceId();
    
    // Check 1: WebSocket presence (instant check)
    const activeFromWS = getActiveUsersFromPresence();
    if (activeFromWS.has(targetLower)) {
      console.log("[SESSION-GATE] Blocked by WebSocket presence:", targetUser);
      return false;
    }
    
    // Check 2: Server state (more reliable, handles WebSocket not connected yet)
    try {
      const res = await fetch(`/.netlify/functions/room?room=${encodeURIComponent(ROOM_CODE)}`);
      if (res.ok) {
        const data = await res.json();
        const serverActiveDevices = data.activeDevices || data.payload?.activeDevices || {};
        
        // Check if target user has an active device that isn't ours
        const targetDevice = serverActiveDevices[targetLower];
        if (targetDevice && targetDevice.deviceId && targetDevice.deviceId !== myDeviceId) {
          // Check if it's stale (> 10 seconds old to match server TTL)
          const lastActive = targetDevice.lastActive || 0;
          const age = Date.now() - lastActive;
          if (age < 10000) {
            console.log("[SESSION-GATE] Blocked by server state:", targetUser, "age:", age);
            return false;
          }
        }
      }
    } catch (e) {
      console.log("[SESSION-GATE] Server check failed, using WebSocket only:", e);
    }
    
    console.log("[SESSION-GATE] Clear to assume:", targetUser);
    return true;
  }
  
  // [FIX v1.4.4] Show conflict overlay when ATTEMPTING to switch to active user
  // This appears on the ATTEMPTING device, not the already-active device
  let pendingSwitchTarget = null;
  
  function showSwitchConflict(targetUser) {
    const currentUser = loadUser() || "Guest";
    pendingSwitchTarget = targetUser;
    
    let overlay = $("switchConflictOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "switchConflictOverlay";
      overlay.className = "device-conflict-overlay";
      overlay.setAttribute("data-testid", "device-conflict-overlay");
      document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
      <div class="device-conflict-content">
        <i class="fas fa-user-lock conflict-icon"></i>
        <h3>User Active Elsewhere</h3>
        <p><strong>${targetUser.toUpperCase()}</strong> is currently active on another device.</p>
        <p style="font-size: 11px; color: var(--muted); margin-top: 8px;">
          <i class="fas fa-info-circle"></i> You can take over the session or stay as ${currentUser}.
        </p>
        <div class="device-conflict-buttons">
          <button class="btn primary" data-testid="takeover-device" onclick="forceSwitchTakeover()">
            <i class="fas fa-sign-in-alt"></i> Use Here Instead
          </button>
          <button class="btn" data-testid="switch-user" onclick="cancelSwitchConflict()">
            <i class="fas fa-times"></i> Stay as ${currentUser}
          </button>
        </div>
      </div>
    `;
    overlay.classList.add("active");
  }
  
  function hideSwitchConflict() {
    const overlay = $("switchConflictOverlay");
    if (overlay) overlay.classList.remove("active");
    pendingSwitchTarget = null;
  }
  
  // Force takeover when user explicitly wants to take the session
  window.forceSwitchTakeover = async function() {
    const targetUser = pendingSwitchTarget;
    if (!targetUser) return;
    
    console.log("[SESSION-GATE] Force takeover to:", targetUser);
    hideSwitchConflict();
    
    // Set grace period to ignore conflicts during switch
    takeoverGraceUntil = Date.now() + 6000;
    loginGraceUntil = Date.now() + 6000;
    
    // Now do the actual switch (bypassing the gate)
    await doUserSwitch(targetUser);
  };
  
  // Cancel switch - stay as current user
  window.cancelSwitchConflict = function() {
    console.log("[SESSION-GATE] Switch cancelled, staying as:", loadUser());
    hideSwitchConflict();
    closeWhoModal();
  };
  
  // [FIX v1.4.4] Update who modal buttons - show ACTIVE badge but DON'T disable
  // The session gate in setUserAndStart() will handle the conflict overlay
  function updateWhoModalButtons() {
    const activeUsers = getActiveUsersFromPresence();
    const currentUser = loadUser()?.toLowerCase();
    
    const btnYasir = $("btnWhoYasir");
    const btnKylee = $("btnWhoKylee");
    
    // [FIX] Reset both buttons - keep them ENABLED so clicks work
    [btnYasir, btnKylee].forEach(btn => {
      if (btn) {
        btn.disabled = false;  // Always enabled - session gate handles conflicts
        btn.classList.remove("user-active-elsewhere");
        btn.title = "";
      }
    });
    
    // [FIX] Show visual indicator but DON'T disable - allow click to trigger session gate
    if (btnYasir && activeUsers.has("yasir") && currentUser !== "yasir") {
      // btn.disabled = false; // Keep enabled!
      btnYasir.classList.add("user-active-elsewhere");
      btnYasir.title = "Yasir is active on another device - click to take over";
    }
    
    if (btnKylee && activeUsers.has("kylee") && currentUser !== "kylee") {
      // btn.disabled = false; // Keep enabled!
      btnKylee.classList.add("user-active-elsewhere");
      btnKylee.title = "Kylee is active on another device - click to take over";
    }
    
    // Add active indicators (visual only)
    if (btnYasir && activeUsers.has("yasir") && currentUser !== "yasir") {
      if (!btnYasir.querySelector(".active-badge")) {
        btnYasir.innerHTML = btnYasir.innerHTML + '<span class="active-badge">ACTIVE</span>';
      }
    } else if (btnYasir) {
      const badge = btnYasir.querySelector(".active-badge");
      if (badge) badge.remove();
    }
    
    if (btnKylee && activeUsers.has("kylee") && currentUser !== "kylee") {
      if (!btnKylee.querySelector(".active-badge")) {
        btnKylee.innerHTML = btnKylee.innerHTML + '<span class="active-badge">ACTIVE</span>';
      }
    } else if (btnKylee) {
      const badge = btnKylee.querySelector(".active-badge");
      if (badge) badge.remove();
    }
  }

  // [OK] Date utilities for mission urgency
  function daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    const target = new Date(dateStr + "T00:00:00");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  }

  function getUrgencyLevel(daysLeft) {
    if (daysLeft <= 0) return "red";
    if (daysLeft <= 3) return "red";
    if (daysLeft <= 7) return "yellow";
    if (daysLeft <= 14) return "green";
    return null;
  }

  // [OK] Get event dates for calendar (including missions and holidays)
  function getEventDates() {
    const eventMap = {};
    const missions = loadActive();
    
    missions.forEach(m => {
      if (m.dueDate) {
        const days = daysUntil(m.dueDate);
        const urgency = getUrgencyLevel(days);
        if (urgency) {
          if (!eventMap[m.dueDate]) {
            eventMap[m.dueDate] = { urgency, titles: [], isHoliday: false };
          } else {
            // Take the most urgent level
            const levels = ["red", "yellow", "green"];
            if (levels.indexOf(urgency) < levels.indexOf(eventMap[m.dueDate].urgency)) {
              eventMap[m.dueDate].urgency = urgency;
            }
          }
          eventMap[m.dueDate].titles.push(m.title);
        }
      }
    });
    
    // Add upcoming events (holidays get special treatment)
    UPCOMING_EVENTS.forEach(event => {
      const isHoliday = event.type === 'holiday';
      if (!eventMap[event.date]) {
        eventMap[event.date] = { 
          urgency: isHoliday ? 'holiday' : 'green', 
          titles: [], 
          isHoliday: isHoliday,
          icon: event.icon 
        };
      }
      eventMap[event.date].titles.push(event.title);
      if (isHoliday) {
        eventMap[event.date].isHoliday = true;
        eventMap[event.date].icon = event.icon;
      }
    });
    
    return eventMap;
  }

  // [OK] Mini calendar for message log (with event indicators)
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
      if (event) classes += ` has-event event-${event.urgency}`;
      
      const tooltip = event ? `title="${event.titles.join(', ')}"` : '';
      
      html += `<span class="${classes}" ${tooltip}>${d}${event ? '<span class="cal-event-dot"></span>' : ''}</span>`;
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
  let foregroundSnowTimer = null;
  let activeSnowflakes = 0;
  let activeForegroundFlakes = 0;
  const snowflakeChars = ['❄', '❅', '❆', '*'];
  let currentSnowLevel = localStorage.getItem(KEY_SNOW_LEVEL) || 'medium';
  
  // Snow level configuration
  const SNOW_LEVELS = {
    off: { maxFlakes: 0, interval: 0, foregroundFlakes: 0, foregroundInterval: 0 },
    light: { maxFlakes: 30, interval: 400, foregroundFlakes: 5, foregroundInterval: 1500 },
    medium: { maxFlakes: 80, interval: 200, foregroundFlakes: 10, foregroundInterval: 1000 },
    heavy: { maxFlakes: 150, interval: 100, foregroundFlakes: 20, foregroundInterval: 600 },
    blizzard: { maxFlakes: 300, interval: 40, foregroundFlakes: 40, foregroundInterval: 300 }
  };

  function getSnowConfig() {
    return SNOW_LEVELS[currentSnowLevel] || SNOW_LEVELS.medium;
  }

  function createSnowflake() {
    const config = getSnowConfig();
    if (activeSnowflakes >= config.maxFlakes) return;
    
    const s = document.createElement('div');
    s.className = 'snowflake';
    
    // Random snowflake character
    s.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];
    
    // Random size (8-24px) - bigger for blizzard
    const sizeMultiplier = currentSnowLevel === 'blizzard' ? 1.3 : 1;
    const size = (8 + Math.random() * 16) * sizeMultiplier;
    s.style.fontSize = size + 'px';
    
    // Random starting position
    const startX = Math.random() * window.innerWidth;
    s.style.left = startX + 'px';
    
    // Opacity based on size (smaller = further = more transparent)
    const opacity = 0.3 + (size / 24) * 0.5;
    s.style.opacity = opacity;
    
    document.body.appendChild(s);
    activeSnowflakes++;
    
    // Animation parameters - faster for blizzard
    const speedMultiplier = currentSnowLevel === 'blizzard' ? 0.6 : 1;
    const duration = (4 + Math.random() * 4) * 1000 * speedMultiplier;
    const swayDistance = (Math.random() - 0.5) * (currentSnowLevel === 'blizzard' ? 250 : 150);
    const rotationAmount = Math.random() * 360;
    
    // Keyframe animation using Web Animations API
    const keyframes = [
      { transform: 'translate(0, 0) rotate(0deg)', opacity: 0 },
      { transform: `translate(${swayDistance * 0.3}px, ${window.innerHeight * 0.3}px) rotate(${rotationAmount * 0.3}deg)`, opacity: opacity, offset: 0.1 },
      { transform: `translate(${swayDistance * 0.6}px, ${window.innerHeight * 0.6}px) rotate(${rotationAmount * 0.6}deg)`, opacity: opacity, offset: 0.6 },
      { transform: `translate(${swayDistance}px, ${window.innerHeight + 20}px) rotate(${rotationAmount}deg)`, opacity: 0 }
    ];
    
    const animation = s.animate(keyframes, {
      duration: duration,
      easing: 'linear',
      fill: 'forwards'
    });
    
    animation.onfinish = () => {
      s.remove();
      activeSnowflakes--;
    };
  }
  
  // Foreground snow - larger, closer, fewer
  function createForegroundSnowflake() {
    const config = getSnowConfig();
    if (activeForegroundFlakes >= config.foregroundFlakes) return;
    
    const s = document.createElement('div');
    s.className = 'snowflake snowflake-foreground';
    
    // Only use larger snowflake characters for foreground
    s.textContent = snowflakeChars[Math.floor(Math.random() * 2)]; // ❄ or ❅
    
    // Larger size for foreground (28-48px)
    const sizeMultiplier = currentSnowLevel === 'blizzard' ? 1.4 : 1;
    const size = (28 + Math.random() * 20) * sizeMultiplier;
    s.style.fontSize = size + 'px';
    
    // Random starting position
    const startX = Math.random() * window.innerWidth;
    s.style.left = startX + 'px';
    
    // Higher opacity for foreground, but still slightly transparent
    const opacity = 0.4 + Math.random() * 0.3;
    s.style.opacity = opacity;
    
    document.body.appendChild(s);
    activeForegroundFlakes++;
    
    // Faster animation for foreground (closer = faster perceived speed)
    const speedMultiplier = currentSnowLevel === 'blizzard' ? 0.5 : 0.7;
    const duration = (2.5 + Math.random() * 2) * 1000 * speedMultiplier;
    const swayDistance = (Math.random() - 0.5) * (currentSnowLevel === 'blizzard' ? 350 : 200);
    const rotationAmount = Math.random() * 180;
    
    const keyframes = [
      { transform: 'translate(0, -50px) rotate(0deg)', opacity: 0 },
      { transform: `translate(${swayDistance * 0.3}px, ${window.innerHeight * 0.3}px) rotate(${rotationAmount * 0.3}deg)`, opacity: opacity, offset: 0.1 },
      { transform: `translate(${swayDistance * 0.7}px, ${window.innerHeight * 0.7}px) rotate(${rotationAmount * 0.7}deg)`, opacity: opacity * 0.8, offset: 0.7 },
      { transform: `translate(${swayDistance}px, ${window.innerHeight + 50}px) rotate(${rotationAmount}deg)`, opacity: 0 }
    ];
    
    const animation = s.animate(keyframes, {
      duration: duration,
      easing: 'ease-in',
      fill: 'forwards'
    });
    
    animation.onfinish = () => {
      s.remove();
      activeForegroundFlakes--;
    };
  }

  function startSnow() {
    const config = getSnowConfig();
    if (config.maxFlakes === 0) {
      stopSnow();
      return;
    }
    if (snowTimer) return;
    
    // Start background snow
    snowTimer = setInterval(createSnowflake, config.interval);
    
    // Start foreground snow
    if (config.foregroundFlakes > 0 && !foregroundSnowTimer) {
      foregroundSnowTimer = setInterval(createForegroundSnowflake, config.foregroundInterval);
    }
  }

  function stopSnow() {
    if (snowTimer) {
      clearInterval(snowTimer);
      snowTimer = null;
    }
    if (foregroundSnowTimer) {
      clearInterval(foregroundSnowTimer);
      foregroundSnowTimer = null;
    }
    // Let existing snowflakes finish their animation naturally
    document.querySelectorAll(".snowflake").forEach(s => {
      s.style.opacity = '0';
      setTimeout(() => s.remove(), 500);
    });
    activeSnowflakes = 0;
    activeForegroundFlakes = 0;
  }
  
  function setSnowLevel(level) {
    currentSnowLevel = level;
    localStorage.setItem(KEY_SNOW_LEVEL, level);
    
    // Restart snow with new settings
    stopSnow();
    if (currentTheme === 'christmas' && level !== 'off') {
      setTimeout(startSnow, 100);
    }
  }

  function applyTheme(theme) {
    const previousTheme = currentTheme;
    currentTheme = theme;

    // Dark theme now uses Marathon styling
    if (theme === "dark") document.documentElement.setAttribute("data-theme", "marathon");
    else if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else if (theme === "christmas") document.documentElement.setAttribute("data-theme", "christmas");
    else if (theme === "marathon") document.documentElement.setAttribute("data-theme", "marathon");
    else document.documentElement.removeAttribute("data-theme");

    document.querySelectorAll(".theme-option").forEach(opt => {
      opt.classList.toggle("active", opt.dataset.theme === theme);
    });

    // Handle snow based on theme and level
    if (theme === "christmas" && currentSnowLevel !== 'off') {
      startSnow();
    } else {
      stopSnow();
    }
    
    // Show/hide sound settings based on theme (only for dark/marathon)
    const soundSection = document.getElementById("soundSettingsSection");
    if (soundSection) {
      const isMarathonTheme = (theme === "dark" || theme === "marathon");
      soundSection.style.display = isMarathonTheme ? "block" : "none";
    }
    
    // Show/hide snow settings based on theme (only for christmas)
    const snowSection = document.getElementById("snowSettingsSection");
    if (snowSection) {
      snowSection.style.display = (theme === "christmas") ? "block" : "none";
    }
    
    // [NEW] Terminal Scramble Transition for Dark/Marathon theme
    const isMarathonTheme = (theme === "dark" || theme === "marathon");
    const wasMarathonTheme = (previousTheme === "dark" || previousTheme === "marathon");
    
    const bootScreen = $("bootScreen");
    if (bootScreen && isMarathonTheme) {
      if (!previousTheme) {
        // Initial page load - run boot animation then hide
        runBootAnimation();
      } else if (!wasMarathonTheme) {
        // Switching TO marathon from another theme - hide immediately
        bootScreen.classList.add("hidden");
        // Trigger screen glitch transition
        triggerTerminalTransition();
      }
    }
  }
  
  // [NEW] Boot animation sequence for initial load
  function runBootAnimation() {
    const bootScreen = $("bootScreen");
    const bootItems = document.querySelectorAll('.boot-item');
    
    if (!bootScreen || bootItems.length === 0) return;
    
    // Animate each boot item with delay
    bootItems.forEach((item, index) => {
      const delay = parseInt(item.dataset.delay) || (index * 400);
      setTimeout(() => {
        item.classList.add('visible');
      }, delay);
    });
    
    // Hide boot screen after animation completes
    const totalDelay = 2400; // After all items visible + small pause
    setTimeout(() => {
      bootScreen.classList.add('hidden');
    }, totalDelay);
  }
  
  // [NEW] Screen Glitch Transition Effect - quick glitch into marathon theme
  function triggerTerminalTransition() {
    // Add glitch class to body for CSS-based glitch effect
    document.body.classList.add('screen-glitch');
    
    // Quick flicker effect
    const wrap = document.querySelector('.wrap');
    if (wrap) {
      wrap.style.animation = 'screenGlitch 0.3s ease-out';
    }
    
    // Remove glitch class after animation
    setTimeout(() => {
      document.body.classList.remove('screen-glitch');
      if (wrap) {
        wrap.style.animation = '';
      }
    }, 300);
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

  // [FIX] Device ID is now defined earlier using localStorage
  // Track active devices per user (from server)
  let activeDevices = {};

  // ============================================
  // [FIX] NEW: Check for active session BEFORE login (database-only)
  // ============================================
  async function checkForActiveSession(userName) {
    const user = userName.toLowerCase();
    const myDeviceId = getDeviceId();
    try {
      const resp = await fetch(`/.netlify/functions/room?room=${ROOM_CODE}`);
      if (!resp.ok) return false;
      
      const data = await resp.json();
      const activeDevice = data.activeDevices?.[user];
      
      if (!activeDevice) return false; // No one active
      if (activeDevice.deviceId === myDeviceId) return false; // It's us
      
      // Check if still active (within 5 seconds)
      const serverTime = data.serverTime || Date.now();
      const age = serverTime - (activeDevice.lastActive || 0);
      if (age < DEVICE_ACTIVE_TIMEOUT) {
        console.log("[DEVICE] Conflict detected - another device active for", user, "age:", age + "ms");
        return true; // Someone else is active!
      }
      
      return false; // Session expired
    } catch (e) {
      console.error("[DEVICE] Check failed:", e);
      return false; // Fail open
    }
  }

  // [FIX] Check if we've been kicked (database-only) - called during polling
  async function checkIfKicked() {
    const user = loadUser()?.toLowerCase();
    if (!user || deviceLocked) return false;
    
    try {
      const resp = await fetch(`/.netlify/functions/room?room=${ROOM_CODE}`);
      if (!resp.ok) return false;
      
      const data = await resp.json();
      const activeDevice = data.activeDevices?.[user];
      
      if (activeDevice && activeDevice.deviceId && activeDevice.deviceId !== getDeviceId()) {
        // Another device has taken over!
        console.log("[DEVICE] KICKED - another device took over");
        handleKicked();
        return true;
      }
    } catch (e) {
      // Ignore errors
    }
    return false;
  }

  // [FIX v1.4.4] Handle being kicked - with guard to prevent multiple calls
  let kickHandled = false;
  
  function handleKicked() {
    // Prevent multiple kicks
    if (kickHandled) {
      console.log("[DEVICE] Kick already handled, ignoring");
      return;
    }
    kickHandled = true;
    
    console.log("[DEVICE] Showing login screen after kick");
    stopDeviceMonitoring();
    clearUser();
    stopPresence();
    deviceLocked = false;
    
    // Hide any conflict overlays
    hideDeviceConflict();
    hideSwitchConflict();
    
    // Show login modal
    openWhoModal();
    const closeBtn = $("closeWhoModal");
    if (closeBtn) closeBtn.classList.add("hidden");
    
    showToast("Session taken over by another device");
    
    // Reset kick guard after a delay
    setTimeout(() => { kickHandled = false; }, 3000);
  }

  // [FIX] Claim device for user (during login or takeover)
  async function claimDevice(userName) {
    const user = userName.toLowerCase();
    const deviceId = getDeviceId();
    
    try {
      const resp = await fetch(`/.netlify/functions/room?room=${ROOM_CODE}`);
      const data = await resp.json();
      
      const payload = data.payload || {};
      payload.activeDevices = payload.activeDevices || {};
      payload.activeDevices[user] = {
        deviceId: deviceId,
        lastActive: Date.now()
      };
      
      await fetch(`/.netlify/functions/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: ROOM_CODE, payload })
      });
      
      console.log("[DEVICE] Claimed device for", user);
      return true;
    } catch (e) {
      console.error("[DEVICE] Claim failed:", e);
      return false;
    }
  }

  // [FIX] Start heartbeat and kick monitoring
  function startDeviceMonitoring() {
    stopDeviceMonitoring(); // Clear any existing
    
    // Regular kick check (every 2 seconds)
    kickCheckTimer = setInterval(checkIfKicked, 2000);
    console.log("[DEVICE] Monitoring started");
  }

  // [FIX] Stop monitoring
  function stopDeviceMonitoring() {
    if (kickCheckTimer) {
      clearInterval(kickCheckTimer);
      kickCheckTimer = null;
    }
  }

  // [FIX] Release device on logout
  async function releaseDevice() {
    const user = loadUser()?.toLowerCase();
    if (!user) return;
    
    try {
      await fetch(`/.netlify/functions/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          room: ROOM_CODE, 
          removeDevice: { user, deviceId: getDeviceId() }
        })
      });
      console.log("[DEVICE] Released device");
    } catch (e) {
      // Ignore
    }
  }

  // [OK] Dedicated function to check device conflicts (can be called independently)
  // Check BOTH WebSocket AND database for conflicts
  function checkDeviceConflict(serverActiveDevices) {
    if (!serverActiveDevices || typeof serverActiveDevices !== "object") {
      return false;
    }
    
    const user = loadUser()?.toLowerCase();
    const myDeviceId = getDeviceId();
    const now = Date.now();
    
    const inAnyGrace = now < loginGraceUntil || now < takeoverGraceUntil;
    
    if (!user) return false;
    
    // [FIX v1.4.4] Check if another device has claimed MY user
    // This means I've been kicked (takeover happened)
    let anotherDeviceOwnsMe = false;
    if (serverActiveDevices[user]) {
      const serverDevice = serverActiveDevices[user];
      if (serverDevice.deviceId && serverDevice.deviceId !== myDeviceId) {
        anotherDeviceOwnsMe = true;
      }
    }
    
    // Also check WebSocket presence
    if (!anotherDeviceOwnsMe && livePresenceState && Object.keys(livePresenceState).length > 0) {
      for (const [key, presences] of Object.entries(livePresenceState)) {
        for (const p of presences) {
          if (p.user === user && p.deviceId && p.deviceId !== myDeviceId) {
            anotherDeviceOwnsMe = true;
            break;
          }
        }
        if (anotherDeviceOwnsMe) break;
      }
    }
    
    // [FIX v1.4.4] If another device owns my user, I've been KICKED (not a conflict choice)
    if (anotherDeviceOwnsMe && !inAnyGrace) {
      console.log("[DEVICE] Another device owns my user - I've been kicked");
      handleKicked();
      return true;
    } else if (!anotherDeviceOwnsMe) {
      // No conflict - hide any overlay
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
    
    // [FIX] Build game clips array
    const gameClips = loadGameClips();
    
    // [FIX] Build read system notifications per user (for global sync)
    const readSystemNotifs = {};
    ["yasir", "kylee"].forEach(u => {
      const key = `${KEY_READ_SYSTEM_NOTIFS}_${u}`;
      try { 
        const data = JSON.parse(localStorage.getItem(key)) || [];
        if (data.length > 0) readSystemNotifs[u] = data;
      } catch {}
    });

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
      readSystemNotifs,
      photos,
      gameClips,
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
    
    // [FIX] Apply game clips from server
    if (Array.isArray(state.gameClips)) {
      localStorage.setItem(KEY_GAME_CLIPS, JSON.stringify(state.gameClips));
    }
    
    // [FIX] Apply read system notifications from server (global sync)
    if (state.readSystemNotifs && typeof state.readSystemNotifs === "object") {
      const currentUser = loadUser()?.toLowerCase();
      if (currentUser && Array.isArray(state.readSystemNotifs[currentUser])) {
        const serverRead = state.readSystemNotifs[currentUser];
        const localRead = loadReadSystemNotifs();
        // Merge: keep all unique IDs from both server and local
        const merged = [...new Set([...localRead, ...serverRead])];
        if (merged.length > localRead.length) {
          saveReadSystemNotifs(merged, true); // skipSync to avoid loop
        }
      }
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
      overlay.setAttribute("data-testid", "device-conflict-overlay");
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
          <button class="btn primary" data-testid="takeover-device" onclick="forceDeviceTakeover()">
            <i class="fas fa-sign-in-alt"></i> Use Here Instead
          </button>
          <button class="btn" data-testid="switch-user" onclick="switchToOtherUser('${otherUser}')">
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

  // [FIX] NEW: Explicit device removal for clean handoff
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
      console.log("[PRESENCE] Removed device from server");
    } catch (e) {
      console.error("[PRESENCE] Failed to remove device:", e);
    }
  }

  // [FIX] Force takeover - claim device and kick other
  window.forceDeviceTakeover = async function() {
    if (takeoverInProgress) {
      console.log("[DEVICE] Takeover already in progress");
      return;
    }
    takeoverInProgress = true;
    console.log("[DEVICE] TAKEOVER starting");
    
    // Set grace period FIRST
    takeoverGraceUntil = Date.now() + 6000;
    deviceLocked = false;
    hideDeviceConflict();
    
    try {
      const user = loadUser();
      if (!user) {
        takeoverInProgress = false;
        return;
      }
      
      // Re-init WebSocket presence
      try { await stopLivePresence(); } catch(e) {}
      initLivePresence();
      
      // Claim device in database
      await claimDevice(user);
      
      // Push to database
      await pushRemoteState();
      
      // Complete login flow
      $("closeWhoModal").classList.remove("hidden");
      closeWhoModal();
      updateUserDuoPills();
      
      console.log("[DEVICE] TAKEOVER complete");
      showToast("You are now the active device");
    } finally {
      takeoverInProgress = false;
    }
  };

  // [FIX] Switch to other user
  window.switchToOtherUser = async function(otherUser) {
    console.log("[DEVICE] SWITCH starting to:", otherUser);
    
    // Set grace period
    loginGraceUntil = Date.now() + 5000;
    deviceLocked = false;
    hideDeviceConflict();
    
    // Stop current presence
    try {
      if (presenceChannel) {
        await presenceChannel.untrack();
        await new Promise(r => setTimeout(r, 150));
        await sbClient.removeChannel(presenceChannel);
        presenceChannel = null;
      }
    } catch (e) {}
    
    // Release old device
    await releaseDevice();
    
    // Switch to the other user
    saveUser(otherUser);
    
    // Claim new user
    await claimDevice(otherUser);
    
    // Start WebSocket for new user
    initLivePresence();
    
    // Complete login flow
    $("closeWhoModal").classList.remove("hidden");
    closeWhoModal();
    updateUserDuoPills();
    
    // Sync state
    await pushRemoteState();
    await pullRemoteState({ silent: false });
    
    console.log("[DEVICE] SWITCH complete to:", otherUser);
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
    // [FIX v1.4.4] Also update activeDevices to keep session alive
    const user = userName.toLowerCase();
    const deviceId = getDeviceId();
    
    const res = await fetch(`/.netlify/functions/room`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        room: ROOM_CODE, 
        presence: { user: userName },
        // [FIX] Include activeDevices update to prevent TTL expiry
        payload: {
          activeDevices: {
            [user]: {
              deviceId: deviceId,
              lastActive: Date.now()
            }
          }
        }
      })
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

      // [FIX] Skip full state apply if nothing changed (no UI spam)
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
    if (syncDebounce) clearTimeout(syncDebounce);
    syncDebounce = setTimeout(() => pushRemoteState(), 500);
  }

  // [OK] Smart polling: only pull if server says something changed
  function startSmartPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(async () => {
      await pullRemoteState({ silent: true });
    }, 3000); // Poll every 3s for fast sync
  }

  function stopSmartPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  // ---------- Render functions ----------
  function renderActive() {
    const items = loadActive();
    const container = $("itemsActive");
    container.innerHTML = "";

    // Add example item first
    const withExample = [exampleActive, ...items];

    withExample.forEach((it, idx) => {
      const el = document.createElement("div");
      el.className = "item" + (it.isExample ? " example" : "");
      
      // [OK] Calculate urgency for due dates
      const daysLeft = it.dueDate ? daysUntil(it.dueDate) : Infinity;
      const urgency = getUrgencyLevel(daysLeft);
      
      // Format due date
      let dateDisplay = "";
      if (it.dueDate) {
        const formatted = formatMissionDate(it.dueDate);
        dateDisplay = `<span class="item-date"><i class="fas fa-calendar-alt"></i> ${formatted}</span>`;
      }
      
      // Urgency indicator
      let urgencyIndicator = "";
      if (urgency === "red") {
        urgencyIndicator = `<span class="urgency-badge urgency-red" title="${daysLeft <= 0 ? 'Overdue!' : daysLeft + ' days left'}">!</span>`;
      } else if (urgency === "yellow") {
        urgencyIndicator = `<span class="urgency-badge urgency-yellow" title="${daysLeft} days left">!</span>`;
      }
      
      el.innerHTML = `
        <input type="checkbox" ${it.done ? "checked" : ""} class="guest-disabled">
        <div class="itext active-clickable" title="Click to expand">
          <div class="ititle">
            <span>${escapeHtml(it.title)}</span>
            <span class="itag">${escapeHtml(it.tag || "idea")}</span>
            ${dateDisplay}
            ${urgencyIndicator}
            <i class="fas fa-chevron-down expand-icon"></i>
          </div>
          <p class="idesc">${escapeHtml(it.desc || "")}</p>
          <div class="expanded-details hidden">
            ${it.dueDate ? `<div class="expanded-detail"><i class="fas fa-calendar"></i> Due: ${formatMissionDate(it.dueDate)}</div>` : ''}
            ${it.dueDate && daysLeft !== Infinity ? `<div class="expanded-detail"><i class="fas fa-clock"></i> ${daysLeft <= 0 ? 'Overdue!' : daysLeft + ' days left'}</div>` : ''}
            <div class="expanded-detail"><i class="fas fa-tag"></i> Tag: ${escapeHtml(it.tag || "idea")}</div>
          </div>
        </div>
        ${!it.isExample ? '<button class="btn guest-disabled" style="padding:8px 12px;" title="Remove">[X]</button>' : ""}
      `;
      
      // [NEW] Add click to expand functionality for active missions
      const clickable = el.querySelector('.active-clickable');
      if (clickable) {
        clickable.addEventListener('click', (e) => {
          // Don't toggle if clicking on checkbox or button
          if (e.target.closest('input') || e.target.closest('button')) return;
          
          const details = el.querySelector('.expanded-details');
          const icon = el.querySelector('.expand-icon');
          if (details && icon) {
            details.classList.toggle('hidden');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
            el.classList.toggle('expanded');
          }
        });
      }

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

          // [NEW] Trigger confetti on mission completion!
          triggerConfetti();
          playMarathonSound('success'); // Marathon sound effect
          showToast("Mission completed!");

          renderActive();
          renderCompleted();
        });

        const rm = el.querySelector("button");
        rm.addEventListener("click", () => {
          // [FIX] Show confirmation before removing
          showConfirmModal("Are you sure you want to remove this mission?", () => {
            const itemsNow = loadActive();
            const actualIdx = idx - 1;
            itemsNow.splice(actualIdx, 1);
            saveActive(itemsNow);
            renderActive();
            showToast("Mission removed");
          });
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
      el.className = "item completed-item" + (it.isExample ? " example" : "");
      
      // Build expanded details section
      const dueInfo = it.dueDate ? `<div class="expanded-detail"><i class="fas fa-calendar"></i> Due: ${formatMissionDate(it.dueDate)}</div>` : '';
      const completedInfo = it.completedAt ? `<div class="expanded-detail"><i class="fas fa-check-circle"></i> Completed: ${it.completedAt}</div>` : '';
      
      el.innerHTML = `
        <div class="itext completed-clickable" title="Click to expand">
          <div class="ititle">
            <span>${escapeHtml(it.title)}</span>
            <span class="itag">${escapeHtml(it.tag || "idea")}</span>
            <i class="fas fa-chevron-down expand-icon"></i>
          </div>
          <p class="idesc">${escapeHtml(it.desc || "")}</p>
          <div class="expanded-details hidden">
            ${dueInfo}
            ${completedInfo}
            <div class="expanded-detail"><i class="fas fa-tag"></i> Tag: ${escapeHtml(it.tag || "idea")}</div>
          </div>
        </div>
        ${!it.isExample ? '<button class="btn" style="padding:8px 12px;" title="Undo">UNDO</button>' : ""}
      `;
      
      // Add click to expand functionality
      const clickable = el.querySelector('.completed-clickable');
      if (clickable) {
        clickable.addEventListener('click', (e) => {
          // Don't toggle if clicking on button
          if (e.target.closest('button')) return;
          
          const details = el.querySelector('.expanded-details');
          const icon = el.querySelector('.expand-icon');
          if (details && icon) {
            details.classList.toggle('hidden');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
            el.classList.toggle('expanded');
          }
        });
      }

      if (!it.isExample) {
        const undo = el.querySelector("button");
        undo.addEventListener("click", (e) => {
          e.stopPropagation();
          // [FIX] Show confirmation before undoing
          showConfirmModal("Are you sure you want to undo this mission?", () => {
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
            showToast("Mission moved back to active");
          });
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
          <span class="message-from-name">FROM: ${escapeHtml(displayName)} ${hasAttachment ? '<span class="attachment-badge" title="Has attachment"><i class="fas fa-paperclip"></i></span>' : ''}</span>
          <span>${escapeHtml(msg.timestamp || "")}</span>
        </div>
        <div class="message-log-content">${escapeHtml(msg.content || "")}</div>
        ${hasAttachment ? `<div class="message-attachment-preview" onclick="openAttachmentModal('${escapeHtml(msg.attachment)}', '${escapeHtml(msg.attachmentType || 'image')}')"><i class="fas fa-paperclip"></i> View Attachment</div>` : ''}
      `;
      container.appendChild(el);
    });

    lastMsgCount = messages.length;

    if (autoScroll) {
      container.scrollTop = 0; // Since newest first, scroll to top
    }
  }

  // [OK] Big Calendar with arrow navigation AND dropdown selectors
  let calendarYear = new Date().getFullYear();
  let calendarMonth = new Date().getMonth();
  let selectedCalDate = null; // Track selected date

  function renderBigCalendar() {
    const calContainer = $("bigCalendar");
    if (!calContainer) return;
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentDate = new Date().getDate();
    
    const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Generate year options (current year -1 to +5)
    const yearOptions = [];
    for (let y = currentYear - 1; y <= currentYear + 5; y++) {
      yearOptions.push(`<option value="${y}" ${y === calendarYear ? 'selected' : ''}>${y}</option>`);
    }
    
    // Generate month options
    const monthOptions = monthShort.map((m, i) => 
      `<option value="${i}" ${i === calendarMonth ? 'selected' : ''}>${m}</option>`
    ).join('');
    
    const eventDates = getEventDates();
    
    // Get latest system message for display
    const messages = JSON.parse(localStorage.getItem(KEY_MESSAGES) || "[]");
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const systemMsgText = lastMsg ? lastMsg.text.substring(0, 30) + (lastMsg.text.length > 30 ? '...' : '') : 'Select a date to view events';
    
    calContainer.innerHTML = `
      <div class="calendar__header">
        <div class="calendar__header-left">
          <span>[-]</span>
          <span>MESSAGE_LOG</span>
        </div>
      </div>
      <div class="calendar__system-msg">
        <span>// PROTOCOL STATUS: ${systemMsgText}</span>
      </div>
      <div class="calendar__body">
        <div class="calendar__controls">
          <button class="calendar__nav" id="calPrevMonth"><i class="fas fa-chevron-left"></i></button>
          <div class="calendar__selectors">
            <select class="calendar__select" id="calMonthSelect">${monthOptions}</select>
            <select class="calendar__select" id="calYearSelect">${yearOptions.join('')}</select>
          </div>
          <button class="calendar__nav" id="calNextMonth"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="calendar__days">
          <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
        </div>
        <div class="calendar__dates" id="calDates"></div>
      </div>
      <div class="calendar__footer">
        <div class="calendar__footer-text">
          <span class="marker">[*]</span>
          <span>SYSTEM.LOG: Calendar interface operational. Date selection enabled for mission planning. <span class="highlight">UESC</span> protocol active.</span>
        </div>
        <div class="calendar__legend-wrap" style="position: relative;">
          <button class="calendar__legend-btn" id="calLegendBtn" title="Show legend">
            <i class="fas fa-info-circle"></i>
          </button>
          <div class="calendar__legend-tooltip" id="calLegendTooltip">
            <div class="calendar__legend-item"><i class="fas fa-tree"></i> Christmas</div>
            <div class="calendar__legend-item"><i class="fas fa-heart"></i> Valentine's Day</div>
            <div class="calendar__legend-item"><i class="fas fa-champagne-glasses"></i> New Year's Day</div>
            <div class="calendar__legend-item"><i class="fas fa-leaf"></i> Thanksgiving</div>
            <div class="calendar__legend-item"><i class="fas fa-bell" style="color: #f1c40f;"></i> Your Events</div>
          </div>
        </div>
      </div>
    `;

    const firstDay = new Date(calendarYear, calendarMonth, 1);
    // Adjust for Monday start (0=Mon, 6=Sun)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();

    const datesEl = document.getElementById('calDates');
    const cells = [];
    
    // Previous month days (greyed out)
    for (let i = 0; i < startDow; i++) {
      const d = prevMonthDays - startDow + 1 + i;
      cells.push({ text: d, grey: true });
    }
    
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = (calendarYear===currentYear && calendarMonth===currentMonth && d===currentDate);
      const dateKey = `${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const evt = eventDates[dateKey];
      const hasEvent = !!evt;
      const isHoliday = evt?.isHoliday;
      const isSelected = (selectedCalDate && selectedCalDate.year === calendarYear && 
                         selectedCalDate.month === calendarMonth && selectedCalDate.day === d);
      cells.push({ text: d, today: isToday, hasEvent, isHoliday, icon: evt?.icon, isSelected, day: d });
    }
    
    // Next month days to fill grid (always fill to 42 cells for 6 rows)
    const totalCells = cells.length <= 35 ? 35 : 42;
    let nextDay = 1;
    while (cells.length < totalCells) {
      cells.push({ text: nextDay++, grey: true });
    }

    datesEl.innerHTML = cells.map(c => {
      const cls = ["calendar__date"];
      if (c.grey) cls.push("calendar__date--grey");
      if (c.today && !c.isSelected) cls.push("calendar__date--today");
      if (c.isSelected) cls.push("calendar__date--selected");
      if (c.isHoliday) cls.push("calendar__date--holiday");
      
      let indicator = '';
      if (c.hasEvent && !c.isHoliday) {
        indicator = '<span class="cal-event-dot">*</span>';
      } else if (c.isHoliday && c.icon) {
        // Use Font Awesome icon if it starts with fa-
        const iconHtml = c.icon.startsWith('fa-') 
          ? `<i class="fas ${c.icon}"></i>` 
          : c.icon;
        indicator = `<span class="cal-holiday-icon">${iconHtml}</span>`;
      }
      
      const dataDay = c.grey ? '' : `data-day="${c.day}"`;
      return `<div class="${cls.join(' ')}" ${dataDay}><span>${c.text}</span>${indicator}</div>`;
    }).join('');

    // Add click handlers for date selection
    datesEl.querySelectorAll('.calendar__date:not(.calendar__date--grey)').forEach(el => {
      el.addEventListener('click', () => {
        const day = parseInt(el.dataset.day);
        selectedCalDate = { year: calendarYear, month: calendarMonth, day };
        renderBigCalendar();
        
        // Show popup with missions for this day
        showCalendarDayPopup(calendarYear, calendarMonth, day);
      });
    });

    // Add navigation listeners
    document.getElementById('calPrevMonth').addEventListener('click', () => {
      calendarMonth--;
      if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
      renderBigCalendar();
    });
    document.getElementById('calNextMonth').addEventListener('click', () => {
      calendarMonth++;
      if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
      renderBigCalendar();
    });
    
    // Add dropdown change listeners
    document.getElementById('calMonthSelect').addEventListener('change', (e) => {
      calendarMonth = parseInt(e.target.value);
      renderBigCalendar();
    });
    document.getElementById('calYearSelect').addEventListener('change', (e) => {
      calendarYear = parseInt(e.target.value);
      renderBigCalendar();
    });
    
    // Legend toggle
    const legendBtn = document.getElementById('calLegendBtn');
    const legendTooltip = document.getElementById('calLegendTooltip');
    if (legendBtn && legendTooltip) {
      legendBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        legendTooltip.classList.toggle('active');
      });
      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!legendBtn.contains(e.target) && !legendTooltip.contains(e.target)) {
          legendTooltip.classList.remove('active');
        }
      });
    }
  }
  
  // [NEW] Show popup with missions for a specific calendar day
  function showCalendarDayPopup(year, month, day) {
    // Format the date
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const displayDate = new Date(year, month, day).toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
    });
    
    // Find missions for this day
    const active = loadActive();
    const completed = loadCompleted();
    const allMissions = [...active.map(m => ({...m, status: 'active'})), ...completed.map(m => ({...m, status: 'completed'}))];
    
    const missionsForDay = allMissions.filter(m => m.dueDate === dateStr);
    
    // Remove existing popup
    const existingBackdrop = document.querySelector('.calendar-day-popup-backdrop');
    const existingPopup = document.querySelector('.calendar-day-popup');
    if (existingBackdrop) existingBackdrop.remove();
    if (existingPopup) existingPopup.remove();
    
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'calendar-day-popup-backdrop';
    document.body.appendChild(backdrop);
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'calendar-day-popup';
    
    let missionsHtml = '';
    if (missionsForDay.length === 0) {
      missionsHtml = '<div class="calendar-day-popup-empty">No missions scheduled for this day.</div>';
    } else {
      missionsHtml = missionsForDay.map((m, idx) => `
        <div class="calendar-day-mission" data-idx="${idx}" data-status="${m.status}">
          <div class="calendar-day-mission-title">${escapeHtml(m.title)}</div>
          <span class="calendar-day-mission-tag">${escapeHtml(m.tag || 'idea')}</span>
          ${m.status === 'completed' ? '<span style="margin-left:8px;color:#3bff6b;font-size:10px;">✓ DONE</span>' : ''}
        </div>
      `).join('');
    }
    
    popup.innerHTML = `
      <div class="calendar-day-popup-header">
        <div class="calendar-day-popup-title">${displayDate}</div>
        <button class="calendar-day-popup-close">&times;</button>
      </div>
      <div class="calendar-day-popup-content">
        ${missionsHtml}
      </div>
    `;
    
    document.body.appendChild(popup);
    
    // Close handlers
    const closePopup = () => {
      backdrop.remove();
      popup.remove();
    };
    
    backdrop.addEventListener('click', closePopup);
    popup.querySelector('.calendar-day-popup-close').addEventListener('click', closePopup);
    
    // Mission click - expand details
    popup.querySelectorAll('.calendar-day-mission').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx);
        const mission = missionsForDay[idx];
        if (mission) {
          closePopup();
          // Show expanded mission detail modal
          showMissionDetailModal(mission);
        }
      });
    });
  }
  
  // [NEW] Show mission detail modal (similar to Planning Board expansion)
  function showMissionDetailModal(mission) {
    // Remove existing
    const existing = document.querySelector('.mission-detail-modal-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay mission-detail-modal-overlay';
    
    const dueText = mission.dueDate ? new Date(mission.dueDate + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) : 'No due date';
    
    const completedText = mission.completedAt ? new Date(mission.completedAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) : '';
    
    overlay.innerHTML = `
      <div class="confirm-modal" style="max-width: 450px;">
        <div style="margin-bottom: 16px;">
          <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">${escapeHtml(mission.title)}</div>
          <span class="calendar-day-mission-tag">${escapeHtml(mission.tag || 'idea')}</span>
          ${mission.status === 'completed' ? '<span style="margin-left:8px;color:#3bff6b;font-size:11px;font-weight:600;">✓ COMPLETED</span>' : ''}
        </div>
        ${mission.desc ? `<div style="color: var(--muted); margin-bottom: 12px; font-size: 13px;">${escapeHtml(mission.desc)}</div>` : ''}
        <div style="font-size: 11px; color: var(--muted); border-top: 1px solid var(--border); padding-top: 12px; margin-top: 12px;">
          <div><strong>Due:</strong> ${dueText}</div>
          ${completedText ? `<div style="margin-top: 4px;"><strong>Completed:</strong> ${completedText}</div>` : ''}
        </div>
        <div class="confirm-modal-buttons" style="margin-top: 16px;">
          <button class="btn primary mission-detail-close">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.querySelector('.mission-detail-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
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

  // [FIX] Login with spam protection and grace period
  // [FIX v1.4.4] Separated actual user switch logic (called after gate passes)
  async function doUserSwitch(name) {
    loginInProgress = true;
    console.log("[DEVICE] LOGIN starting for:", name);
    
    // Set grace period FIRST (6 seconds for slow networks)
    loginGraceUntil = Date.now() + 6000;
    
    try {
      // Ensure prior presence channel is cleanly removed before switching
      try { await stopLivePresence(); } catch {}
      saveUser(name);
      
      // Claim device in database
      await claimDevice(name);
      
      // Proceed with normal login
      const closeBtn = $("closeWhoModal");
      if (closeBtn) closeBtn.classList.remove("hidden");
      closeWhoModal();
      updateUserDuoPills();
      
      // Sync state
      setSyncStatus("pulling");
      showSyncingIndicator();
      await pullRemoteState({ silent: false });
      await pushRemoteState();
      hideSyncingIndicator();
      
      // Start presence (WebSocket + polling)
      startPresence();
      
      console.log("[DEVICE] LOGIN complete for:", name);
      showToast(`USER SET: ${String(name).toUpperCase()}`);
      
    } finally {
      loginInProgress = false;
    }
  }

  // [FIX v1.4.4] Session-gated user switch with proper conflict handling
  async function setUserAndStart(name) {
    // Prevent spam clicking
    if (loginInProgress) {
      console.log("[DEVICE] Login already in progress");
      return;
    }
    
    // [FIX v1.4.4] SESSION GATE - Check BEFORE switching
    const canSwitch = await canAssumeUser(name);
    if (!canSwitch) {
      // Show conflict overlay on THIS device (the attempting device)
      showSwitchConflict(name);
      console.log("[DEVICE] Login blocked - showing conflict overlay for:", name);
      return;
    }
    
    // Gate passed - do the actual switch
    await doUserSwitch(name);
  }

  // [FIX] NEW: Logout with proper cleanup
  async function logOffUser() {
    console.log("[DEVICE] LOGOUT starting");
    
    // Stop monitoring first
    stopDeviceMonitoring();
    stopPresence();
    
    // Release device from server
    await releaseDevice();
    
    // Also try to send offline signal for presence dots
    const currentUser = loadUser();
    if (currentUser) {
      try {
        const offlinePayload = getLocalState();
        offlinePayload.presence = offlinePayload.presence || {};
        offlinePayload.presence[currentUser.toLowerCase()] = "1970-01-01T00:00:00.000Z";
        await remoteSetState(offlinePayload);
      } catch {
        // Ignore
      }
    }
    
    clearUser();
    updateUserDuoPills();
    openWhoModal();
    $("closeWhoModal").classList.add("hidden");
    showToast("LOGGED OFF");
  }

  // [OK] Send offline signal on tab close / navigation away
  // Uses sendBeacon for reliability (fires even during unload)
  // [FIX] Send offline signal on tab close/navigation
  function sendOfflineBeacon() {
    console.log("[PRESENCE] Sending offline beacon...");
    
    // [FIX] CRITICAL: Untrack from WebSocket FIRST
    if (presenceChannel) {
      try {
        presenceChannel.untrack();
        console.log("[PRESENCE] Untracked on page close");
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

  // ---------- Wire up events (ALL WITH NULL CHECKS) ----------
  const btnOpenEl = $("btnOpen");
  const btnHomeEl = $("btnHome");
  
  if (btnOpenEl) btnOpenEl.addEventListener("click", openGift);
  if (btnHomeEl) btnHomeEl.addEventListener("click", goHome);

  // [FIX] User pill click handler for switching users
  const userPillEl = $("userPill");
  if (userPillEl) {
    userPillEl.addEventListener("click", () => {
      openWhoModal();
    });
  }

  const btnWhoYasirEl = $("btnWhoYasir");
  if (btnWhoYasirEl) {
    btnWhoYasirEl.addEventListener("click", async () => {
      await setUserAndStart("Yasir");
    });
  }

  const btnWhoKyleeEl = $("btnWhoKylee");
  if (btnWhoKyleeEl) {
    btnWhoKyleeEl.addEventListener("click", async () => {
      await setUserAndStart("Kylee");
    });
  }

  // [NEW] Guest login button handler
  const btnWhoGuestEl = $("btnWhoGuest");
  if (btnWhoGuestEl) {
    btnWhoGuestEl.addEventListener("click", () => {
      setGuestMode(true);
      closeWhoModal();
      showToast("Logged in as GUEST (view only)");
    });
  }

  const btnLogOffEl = $("btnLogOff");
  if (btnLogOffEl) {
    btnLogOffEl.addEventListener("click", async () => {
      await logOffUser();
    });
  }

  // [OK] System message modal - with null checks
  const btnEditSysMsgEl = $("btnEditSystemMessage");
  if (btnEditSysMsgEl) {
    btnEditSysMsgEl.addEventListener("click", () => {
      const modal = $("systemMessageModal");
      const input = $("systemMessageInput");
      if (input) input.value = loadSystemMessage();
      if (modal) {
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        updateCharCounter();
      }
    });
  }

  const closeSysMsgEl = $("closeSystemMessageModal");
  if (closeSysMsgEl) {
    closeSysMsgEl.addEventListener("click", () => {
      const modal = $("systemMessageModal");
      if (modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  // [FIX v1.4.4] Add click handler for Who modal close button
  const closeWhoModalEl = $("closeWhoModal");
  if (closeWhoModalEl) {
    closeWhoModalEl.addEventListener("click", () => {
      closeWhoModal();
    });
  }

  const btnSysMsgCancelEl = $("btnSystemMessageCancel");
  if (btnSysMsgCancelEl) {
    btnSysMsgCancelEl.addEventListener("click", () => {
      const modal = $("systemMessageModal");
      if (modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  const btnSysMsgSaveEl = $("btnSystemMessageSave");
  if (btnSysMsgSaveEl) {
    btnSysMsgSaveEl.addEventListener("click", () => {
      const input = $("systemMessageInput");
      const value = (input?.value || "").trim();
      if (value) {
        saveSystemMessage(value);
        renderSystemMessage(value);
        showToast("System message updated!");
      }
      const modal = $("systemMessageModal");
      if (modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  // Character counter for system message
  function updateCharCounter() {
    const input = $("systemMessageInput");
    const counter = $("charCounter");
    if (input && counter) {
      counter.textContent = `${input.value.length} / 30`;
    }
  }

  const sysInput = $("systemMessageInput");
  if (sysInput) {
    sysInput.addEventListener("input", updateCharCounter);
  }

  // [OK] Add mission form - with null checks (btnAdd, not btnAddMission)
  const btnAddEl = $("btnAdd");
  if (btnAddEl) {
    btnAddEl.addEventListener("click", () => {
      // [NEW] Guest mode check
      if (!isActionAllowed()) return;
      
      const titleEl = $("newTitle");
      const descEl = $("newDesc");
      const tagEl = $("newTag");
      const customTagEl = $("customTagInput");
      const customFieldEl = $("customTagField");
      const dueDateEl = $("newDueDate");
      
      const title = titleEl?.value?.trim() || "";
      if (!title) return showAlertModal("Please enter a title for your mission");

      let tag = tagEl?.value || "idea";
      if (tag === "custom") {
        tag = customTagEl?.value?.trim() || "idea";
        const tags = loadCustomTags();
        if (!tags.includes(tag)) {
          tags.push(tag);
          saveCustomTags(tags);
          ensureCustomTagsInSelect();
        }
      }

      const dueDate = dueDateEl?.value || "";

      const active = loadActive();
      active.push({
        title,
        desc: descEl?.value?.trim() || "",
        tag,
        dueDate,
        done: false
      });
      saveActive(active);
      renderActive();

      if (titleEl) titleEl.value = "";
      if (descEl) descEl.value = "";
      if (tagEl) tagEl.value = "date";
      if (customTagEl) customTagEl.value = "";
      if (customFieldEl) customFieldEl.classList.add("hidden");
      if (dueDateEl) dueDateEl.value = "";
    });
  }

  const newTagEl = $("newTag");
  if (newTagEl) {
    newTagEl.addEventListener("change", (e) => {
      const customField = $("customTagField");
      if (e.target.value === "custom" && customField) customField.classList.remove("hidden");
      else if (customField) customField.classList.add("hidden");
    });
  }
  
  // [FIX] Clear Fields button - reset all form fields including tag
  const btnClearFieldsEl = $("btnClearFields");
  if (btnClearFieldsEl) {
    btnClearFieldsEl.addEventListener("click", () => {
      const titleEl = $("newTitle");
      const descEl = $("newDesc");
      const tagEl = $("newTag");
      const customTagEl = $("customTagInput");
      const customFieldEl = $("customTagField");
      const dueDateEl = $("newDueDate");
      
      // Clear all fields
      if (titleEl) titleEl.value = "";
      if (descEl) descEl.value = "";
      if (dueDateEl) dueDateEl.value = "";
      if (customTagEl) customTagEl.value = "";
      
      // Reset tag to empty/unselected state
      if (tagEl) tagEl.value = "";
      
      // Hide custom tag field
      if (customFieldEl) customFieldEl.classList.add("hidden");
      
      showToast("Fields cleared");
    });
  }

  document.querySelectorAll(".mission-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".mission-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const activeTabEl = $("activeTab");
      const completedTabEl = $("completedTab");
      
      if (tab.dataset.tab === "active") {
        if (activeTabEl) activeTabEl.classList.remove("hidden");
        if (completedTabEl) completedTabEl.classList.add("hidden");
      } else {
        if (activeTabEl) activeTabEl.classList.add("hidden");
        if (completedTabEl) completedTabEl.classList.remove("hidden");
      }
    });
  });

  // [FIX] Saved missions modal with DELETE functionality - with null check
  const btnAddSavedEl = $("btnAddSaved");
  if (btnAddSavedEl) btnAddSavedEl.addEventListener("click", () => {
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
              <button class="btn saved-mission-delete" data-action="delete" title="Delete this mission"><i class="fas fa-trash"></i></button>
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
          // Close the saved missions modal
          $("savedMissionsModal").classList.remove("active");
          
          // Open Planning Board first
          const planningBoardOverlay = $("planningBoardOverlay");
          if (planningBoardOverlay) {
            planningBoardOverlay.classList.add("active");
            
            // Wait a moment for Planning Board to render, then open the add modal
            setTimeout(() => {
              // Open the add idea modal
              const pbAddModal = $('pbAddModal');
              if (pbAddModal) {
                pbAddModal.classList.remove('hidden');
                pbAddModal.classList.add('active');
                
                // Pre-fill the form with mission data
                const titleInput = $('pbFormTitle');
                const descInput = $('pbFormDesc');
                const tagSelect = $('pbFormTag');
                const customTagField = $('pbCustomTagField');
                const customTagInput = $('pbCustomTagInput');
                
                if (titleInput) titleInput.value = mission.title || '';
                if (descInput) descInput.value = mission.desc || '';
                
                if (tagSelect) {
                  const hasTag = Array.from(tagSelect.options).some(opt => opt.value === mission.tag);
                  if (hasTag) {
                    tagSelect.value = mission.tag;
                    if (customTagField) customTagField.classList.add('hidden');
                  } else if (mission.tag) {
                    tagSelect.value = 'custom';
                    if (customTagField) customTagField.classList.remove('hidden');
                    if (customTagInput) customTagInput.value = mission.tag;
                  }
                }
                
                showToast("Edit your mission and save as a new idea!");
              }
            }, 300);
          } else {
            // Fallback: fill in the simple form
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
            showToast("Mission loaded for editing");
          }
        });

        // [NEW] Delete saved mission
        card.querySelector('[data-action="delete"]').addEventListener("click", (e) => {
          e.stopPropagation();
          showConfirmModal(`Delete "${mission.title}" from saved missions?`, () => {
            const savedNow = loadSaved();
            savedNow.splice(idx, 1);
            saveSaved(savedNow);
            showToast("Mission deleted from saved");
            // Re-render the modal
            $("btnAddSaved").click();
          });
        });

        container.appendChild(card);
      });
    }

    const savedModalEl = $("savedMissionsModal");
    if (savedModalEl) savedModalEl.classList.add("active");
  });

  const btnAddSelectedEl = $("btnAddSelectedMissions");
  if (btnAddSelectedEl) {
    btnAddSelectedEl.addEventListener("click", () => {
      if (selectedSavedMissions.length === 0) return showAlertModal("Please select at least one mission");

      const saved = loadSaved();
      const active = loadActive();

      selectedSavedMissions.forEach(idx => {
        const mission = saved[idx];
        active.push({ ...mission, done: false });
      });

      saveActive(active);
      renderActive();
      const savedModalEl2 = $("savedMissionsModal");
      if (savedModalEl2) savedModalEl2.classList.remove("active");
      selectedSavedMissions = [];
    });
  }

  const closeSavedModalEl = $("closeSavedModal");
  if (closeSavedModalEl) {
    closeSavedModalEl.addEventListener("click", () => {
      const savedModalEl3 = $("savedMissionsModal");
      if (savedModalEl3) savedModalEl3.classList.remove("active");
    });
  }

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
        preview.innerHTML = `<span>⏳ Uploading ${escapeHtml(file.name)}...</span>`;
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
          preview.innerHTML = `<span><i class="fas fa-paperclip"></i> ${escapeHtml(file.name)}</span><button type="button" class="btn" id="clearAttachment"><i class="fas fa-times"></i></button>`;
          const clearAttachEl = $("clearAttachment");
          if (clearAttachEl) {
            clearAttachEl.addEventListener("click", () => {
              pendingAttachment = null;
              pendingAttachmentType = null;
              attachInput.value = "";
              preview.classList.add("hidden");
            });
          }
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

  const btnSaveNoteEl = $("btnSaveNote");
  if (btnSaveNoteEl) {
    btnSaveNoteEl.addEventListener("click", () => {
      // [NEW] Guest mode check
      if (!isActionAllowed()) return;
      
      if (!hasUser()) { showToast("Pick USER first"); return; }
      
      // [OK] Prevent sending while upload is in progress
      if (isUploading) {
        showToast("Wait for attachment to finish uploading...");
        return;
      }

      const customNoteEl = $("customNote");
      const content = normalizeNewlines(customNoteEl?.value || "").trim();
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

      if (customNoteEl) customNoteEl.value = "";
      
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
  }

  // [OK] Envelope button opens letter viewer - with null check
  const envelopeBtnEl = $("envelopeBtn");
  if (envelopeBtnEl) {
    envelopeBtnEl.addEventListener("click", () => {
      if (!hasUser()) { showToast("Pick USER first"); return; }
      openLetterViewer();
    });
  }

  // [OK] DUO pill click opens letter viewer - with null check
  const duoPillEl = $("duoPill");
  if (duoPillEl) {
    duoPillEl.addEventListener("click", () => {
      if (!hasUser()) { showToast("Pick USER first"); return; }
      openLetterViewer();
    });
  }

  const notifBellEl = $("notificationBell");
  if (notifBellEl) {
    notifBellEl.addEventListener("click", () => {
      const dropdown = $("notificationDropdown");
      if (!dropdown) return;
      const isOpening = !dropdown.classList.contains("active");
      dropdown.classList.toggle("active");
      
      // [FIX] Mark notifications as read when opening dropdown
      if (isOpening) {
        setTimeout(() => {
          updateNotifications({ markAsRead: true });
        }, 500);
      }
    });
  }

  const btnNotifClearEl = $("btnNotifClearAll");
  if (btnNotifClearEl) btnNotifClearEl.addEventListener("click", (e) => {
    e.stopPropagation();
    clearAllNotifications();
  });

  const closeLetterModalEl = $("closeLetterModal");
  if (closeLetterModalEl) {
    closeLetterModalEl.addEventListener("click", () => {
      const modal = $("letterModal");
      const env = document.querySelector(".letter-envelope");
      const paper = document.querySelector(".letter-paper");
      
      if (modal) modal.classList.remove("active");
      if (env) env.classList.remove("open");
      if (paper) paper.classList.remove("open");
      
      // [OK] Restore body scroll when modal closes
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      
      letterAnimationInProgress = false;
    });
  }

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

    letterModal.addEventListener("touchend", (e) => {
      const diffY = touchStartY - e.changedTouches[0].clientY;
      const diffX = touchStartX - e.changedTouches[0].clientX;
      
      // Prefer vertical swipe for letters
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
        if (diffY > 0) nextLetter();
        else prevLetter();
      }
    }, { passive: true });
  }

  // [OK] Close attachment modal - with null check
  const closeAttachModalEl = $("closeAttachmentModal");
  if (closeAttachModalEl) {
    closeAttachModalEl.addEventListener("click", () => {
      const modal = $("attachmentModal");
      const content = $("attachmentModalContent");
      if (modal) modal.classList.remove("active");
      if (content) content.innerHTML = "";
    });
  }

  // [OK] Photo upload handling
  const photoInput = $("photoInput");
  const photoSelectBtn = $("photoSelectBtn");
  const photoStagingArea = $("photoStagingArea");
  const stagingPreview = $("stagingPreview");
  const photoDateInput = $("photoDate");
  const photoMissionSelect = $("photoMission");
  const clearStagingBtn = $("clearStagingBtn");
  const photoSubmitBtn = $("photoSubmitBtn");
  
  let stagedFiles = [];
  
  function updateStagedCount() {
    const count = $("stagedCount");
    if (count) count.textContent = stagedFiles.length;
  }
  
  if (photoSelectBtn && photoInput) {
    photoSelectBtn.addEventListener("click", () => photoInput.click());
  }
  
  if (photoInput) {
    photoInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      
      // Add to staged files
      files.forEach(file => {
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          stagedFiles.push(file);
          
          // Create preview
          const previewItem = document.createElement("div");
          previewItem.className = "staging-item";
          
          if (file.type.startsWith("video/")) {
            previewItem.innerHTML = `
              <div class="staging-thumb staging-video-icon"><i class="fas fa-video"></i></div>
              <span class="staging-name">${escapeHtml(file.name.substring(0, 15))}...</span>
              <button class="staging-remove" data-idx="${stagedFiles.length - 1}"><i class="fas fa-times"></i></button>
            `;
          } else {
            const reader = new FileReader();
            reader.onload = (ev) => {
              previewItem.innerHTML = `
                <img class="staging-thumb" src="${ev.target.result}" alt="Preview">
                <span class="staging-name">${escapeHtml(file.name.substring(0, 15))}...</span>
                <button class="staging-remove" data-idx="${stagedFiles.length - 1}"><i class="fas fa-times"></i></button>
              `;
            };
            reader.readAsDataURL(file);
          }
          
          stagingPreview.appendChild(previewItem);
        }
      });
      
      photoStagingArea.classList.remove("hidden");
      updateStagedCount();
      updateMissionCapacity();
      
      // [FIX v1.4.4] Update button text after photos are staged
      if (stagedFiles.length > 0) {
        photoSelectBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add More Photos';
      }
      
      // Clear input so same files can be selected again
      photoInput.value = "";
    });
  }
  
  // Handle remove from staging
  if (stagingPreview) {
    stagingPreview.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".staging-remove");
      if (removeBtn) {
        const idx = parseInt(removeBtn.dataset.idx);
        stagedFiles.splice(idx, 1);
        removeBtn.closest(".staging-item").remove();
        updateStagedCount();
        updateMissionCapacity();
        
        // Re-index remaining items
        stagingPreview.querySelectorAll(".staging-remove").forEach((btn, i) => {
          btn.dataset.idx = i;
        });
        
        if (stagedFiles.length === 0) {
          photoStagingArea.classList.add("hidden");
          // [FIX v1.4.4] Reset button text when staging empty
          if (photoSelectBtn) {
            photoSelectBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Select Photos';
          }
        }
      }
    });
  }
  
  // Mission select change updates capacity
  if (photoMissionSelect) {
    photoMissionSelect.addEventListener("change", updateMissionCapacity);
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
      // [FIX v1.4.4] Reset button text
      if (photoSelectBtn) {
        photoSelectBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Select Photos';
      }
    });
  }
  
  // Submit staged photos
  if (photoSubmitBtn) {
    photoSubmitBtn.addEventListener("click", async () => {
      if (stagedFiles.length === 0) {
        showToast("No photos to upload!");
        return;
      }
      
      // [FIX v1.4.4] Date is now optional
      const date = photoDateInput?.value || '';
      
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
      
      // [FIX v1.4.4] Reset button text after submit
      if (photoSelectBtn) {
        photoSelectBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Select Photos';
      }
      
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

  // [FIX] Game Clips upload button (renamed from Medal)
  const gameClipUploadBtn = $("refreshMedal"); // Reuse same button ID
  if (gameClipUploadBtn) {
    // Change button to upload
    gameClipUploadBtn.innerHTML = '<i class="fas fa-plus"></i>';
    gameClipUploadBtn.title = "Upload a game clip";
    
    gameClipUploadBtn.addEventListener("click", () => {
      showGameClipUploadModal();
    });
  }
  
  function showGameClipUploadModal() {
    const existing = document.querySelector(".game-clip-upload-modal");
    if (existing) existing.remove();
    
    const modal = document.createElement("div");
    modal.className = "game-clip-upload-modal confirm-modal-overlay";
    modal.innerHTML = `
      <div class="confirm-modal" style="max-width: 400px;">
        <h4 style="margin-bottom: 15px;"><i class="fas fa-video"></i> Upload Game Clip</h4>
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 5px; font-size: 11px; color: var(--muted);">VIDEO OR IMAGE FILE *</label>
          <input type="file" id="gameClipFile" accept="video/*,image/*" style="width: 100%;">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 5px; font-size: 11px; color: var(--muted);">TITLE (OPTIONAL)</label>
          <input type="text" id="gameClipTitle" placeholder="Enter clip title..." class="input" style="width: 100%; padding: 8px;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-size: 11px; color: var(--muted);">DATE (OPTIONAL)</label>
          <input type="date" id="gameClipDate" class="input" style="width: 100%; padding: 8px;">
        </div>
        <div class="confirm-modal-buttons">
          <button class="btn" id="cancelGameClipUpload">Cancel</button>
          <button class="btn primary" id="confirmGameClipUpload"><i class="fas fa-upload"></i> Upload</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set default date to today
    const dateInput = modal.querySelector("#gameClipDate");
    dateInput.value = new Date().toISOString().split('T')[0];
    
    modal.querySelector("#cancelGameClipUpload").addEventListener("click", () => modal.remove());
    
    modal.querySelector("#confirmGameClipUpload").addEventListener("click", async () => {
      const fileInput = modal.querySelector("#gameClipFile");
      const titleInput = modal.querySelector("#gameClipTitle");
      const dateInputVal = modal.querySelector("#gameClipDate");
      
      const file = fileInput.files?.[0];
      if (!file) {
        showAlertModal("Please select a video or image file");
        return;
      }
      
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      
      if (!isVideo && !isImage) {
        showAlertModal("Only video and image files are allowed");
        return;
      }
      
      // Size check (150MB max for videos to support 2-min clips, 20MB for images)
      const maxSize = isVideo ? 150 * 1024 * 1024 : 20 * 1024 * 1024;
      const maxLabel = isVideo ? "150MB" : "20MB";
      
      if (file.size > maxSize) {
        // Show prominent center notification
        showFileTooLargeNotification(file.name, maxLabel);
        return;
      }
      
      const title = titleInput.value.trim();
      const date = dateInputVal.value;
      
      modal.querySelector("#confirmGameClipUpload").disabled = true;
      modal.querySelector("#confirmGameClipUpload").innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      
      const success = await uploadGameClip(file, title, date);
      
      if (success) {
        modal.remove();
      } else {
        modal.querySelector("#confirmGameClipUpload").disabled = false;
        modal.querySelector("#confirmGameClipUpload").innerHTML = '<i class="fas fa-upload"></i> Upload';
      }
    });
    
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  const btnDownloadEl = $("btnDownloadText");
  if (btnDownloadEl) {
    btnDownloadEl.addEventListener("click", () => {
      const active = loadActive();
      const completed = loadCompleted().filter(c => !c.isExample);

      const text = `kywee + yessir bucket list - 2026
====================

SYSTEM MESSAGE:
${loadSystemMessage()}

ACTIVE MISSIONS:
${active.map(i => `[ ] ${i.title}  ${i.desc} (#${i.tag})`).join("\n")}

COMPLETED MISSIONS:
${completed.map(i => `[X] ${i.title}  ${i.desc} (#${i.tag})`).join("\n")}
`;

      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kywee-yessir-bucket-list-2026.txt";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const themeBtnEl = $("themeBtn");
  if (themeBtnEl) {
    themeBtnEl.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent document click handler from firing
      const dropdown = $("themeDropdown");
      if (dropdown) dropdown.classList.toggle("active");
    });
  }

  document.querySelectorAll(".theme-option").forEach(option => {
    option.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent document click handler from firing
      const theme = option.dataset.theme;
      saveTheme(theme);
      applyTheme(theme);
      const dropdown = $("themeDropdown");
      if (dropdown) dropdown.classList.remove("active");
    });
  });

  document.addEventListener("click", (e) => {
    const themeDropdown = $("themeDropdown");
    const notifDropdown = $("notificationDropdown");
    if (!e.target.closest(".theme-switcher") && themeDropdown) themeDropdown.classList.remove("active");
    if (!e.target.closest("#notificationBell") && !e.target.closest("#notificationDropdown") && notifDropdown) {
      notifDropdown.classList.remove("active");
    }
  });

  // ========== SETTINGS MODAL (v1.4.5) ==========
  const settingsBtn = $("settingsBtn");
  const settingsModal = $("settingsModal");
  const closeSettingsModal = $("closeSettingsModal");
  
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      if (settingsModal) {
        settingsModal.classList.add("active");
        settingsModal.setAttribute("aria-hidden", "false");
      }
    });
  }
  
  if (closeSettingsModal) {
    closeSettingsModal.addEventListener("click", () => {
      if (settingsModal) {
        settingsModal.classList.remove("active");
        settingsModal.setAttribute("aria-hidden", "true");
      }
    });
  }
  
  // [NEW] Snow level select handler
  const snowLevelSelect = $("snowLevelSelect");
  if (snowLevelSelect) {
    // Set initial value from localStorage
    snowLevelSelect.value = currentSnowLevel;
    
    snowLevelSelect.addEventListener("change", (e) => {
      setSnowLevel(e.target.value);
      showToast(`Snow: ${e.target.value.toUpperCase()}`);
    });
  }
  
  // Clear chat messages
  const clearChatBtn = $("clearChatBtn");
  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", () => {
      showConfirmModal("Delete ALL chat messages? This cannot be undone.", async () => {
        localStorage.setItem(KEY_MESSAGES, JSON.stringify([]));
        // Also clear from server
        try {
          const resp = await fetch(`/.netlify/functions/room?room=${ROOM_CODE}`);
          const data = await resp.json();
          const payload = data.payload || {};
          payload.messages = [];
          await fetch("/.netlify/functions/room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: ROOM_CODE, payload })
          });
        } catch(e) { console.error("Clear chat server error:", e); }
        renderMessages();
        showToast("All messages cleared");
        if (settingsModal) settingsModal.classList.remove("active");
      });
    });
  }
  
  // Clear photos
  const clearPhotosBtn = $("clearPhotosBtn");
  if (clearPhotosBtn) {
    clearPhotosBtn.addEventListener("click", () => {
      showConfirmModal("Delete ALL photos? This cannot be undone.", async () => {
        localStorage.setItem(KEY_PHOTOS, JSON.stringify([]));
        try {
          const resp = await fetch(`/.netlify/functions/room?room=${ROOM_CODE}`);
          const data = await resp.json();
          const payload = data.payload || {};
          payload.photos = [];
          await fetch("/.netlify/functions/room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: ROOM_CODE, payload })
          });
        } catch(e) { console.error("Clear photos server error:", e); }
        renderPhotoGallery();
        showToast("All photos cleared");
        if (settingsModal) settingsModal.classList.remove("active");
      });
    });
  }
  
  // Clear uploaded clips
  const clearClipsBtn = $("clearClipsBtn");
  if (clearClipsBtn) {
    clearClipsBtn.addEventListener("click", () => {
      showConfirmModal("Delete all UPLOADED clips? (Medal clips won't be affected)", async () => {
        localStorage.setItem(KEY_GAME_CLIPS, JSON.stringify([]));
        try {
          const resp = await fetch(`/.netlify/functions/room?room=${ROOM_CODE}`);
          const data = await resp.json();
          const payload = data.payload || {};
          payload.gameClips = [];
          await fetch("/.netlify/functions/room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: ROOM_CODE, payload })
          });
        } catch(e) { console.error("Clear clips server error:", e); }
        renderGameClips();
        showToast("Uploaded clips cleared");
        if (settingsModal) settingsModal.classList.remove("active");
      });
    });
  }
  
  // Clear everything
  const clearAllBtn = $("clearAllBtn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      showConfirmModal("Delete EVERYTHING? (Messages, photos, clips) This cannot be undone!", async () => {
        localStorage.setItem(KEY_MESSAGES, JSON.stringify([]));
        localStorage.setItem(KEY_PHOTOS, JSON.stringify([]));
        localStorage.setItem(KEY_GAME_CLIPS, JSON.stringify([]));
        try {
          const resp = await fetch(`/.netlify/functions/room?room=${ROOM_CODE}`);
          const data = await resp.json();
          const payload = data.payload || {};
          payload.messages = [];
          payload.photos = [];
          payload.gameClips = [];
          await fetch("/.netlify/functions/room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: ROOM_CODE, payload })
          });
        } catch(e) { console.error("Clear all server error:", e); }
        renderMessages();
        renderPhotoGallery();
        renderGameClips();
        showToast("Everything cleared");
        if (settingsModal) settingsModal.classList.remove("active");
      });
    });
  }
  
  // Logout from settings
  const logoutSettingsBtn = $("logoutSettingsBtn");
  if (logoutSettingsBtn) {
    logoutSettingsBtn.addEventListener("click", () => {
      if (settingsModal) settingsModal.classList.remove("active");
      clearUser();
      stopPresence();
      openWhoModal();
      const closeBtn = $("closeWhoModal");
      if (closeBtn) closeBtn.classList.add("hidden");
    });
  }
  
  // Reset gift experience (for testing) - shows gift immediately
  const resetGiftBtn = $("resetGiftBtn");
  if (resetGiftBtn) {
    resetGiftBtn.addEventListener("click", () => {
      // Close settings modal
      if (settingsModal) settingsModal.classList.remove("active");
      
      // Reset the flag and show gift immediately
      localStorage.removeItem("bucketlist_gift_shown_2025");
      
      // Show the gift experience right now
      if (typeof window.showGiftExperience === 'function') {
        window.showGiftExperience();
      }
    });
  }

  // ---------- Init ----------
  (async function init() {
    // [FIX v1.4.4] Critical: Open modal FIRST if no user, before anything else
    // This ensures tests can proceed even if other init code fails
    const userExists = hasUser();
    if (!userExists) {
      try { stopPresence(); } catch(e) { console.warn("stopPresence error:", e); }
      openWhoModal();
      const closeBtn = $("closeWhoModal");
      if (closeBtn) closeBtn.classList.add("hidden");
    }

    // Now continue with rest of init (errors here won't block modal)
    try {
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
    } catch (e) {
      console.error("Init setup error:", e);
    }

    // [OK] Show sync overlay on initial load
    const overlay = document.createElement("div");
    overlay.id = "syncOverlay";
    overlay.innerHTML = `<div class="sync-overlay-content"><div class="sync-spinner"></div><div>SYNCING...</div></div>`;
    document.body.appendChild(overlay);

    // pull once on load (with overlay)  always remove overlay
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

    // [FIX] Render game clips (user uploads)
    renderGameClips();

    // [OK] Render big calendar initially
    renderBigCalendar();

    // [OK] If user exists, set up presence (modal already handled above)
    if (userExists) {
      const closeBtn = $("closeWhoModal");
      if (closeBtn) closeBtn.classList.remove("hidden");
      // [FIX] Set grace period on page load to prevent false conflicts
      loginGraceUntil = Date.now() + 3000;
      // Immediately claim device on page load for existing users
      await pushRemoteState();
      startPresence();
      updateUserDuoPills();
      console.log("[DEVICE] Claimed device for", loadUser());
    }
  })();

// ============================================
// PLANNING BOARD SYSTEM
// ============================================

(function initPlanningBoard() {
  "use strict";
  
  // State
  let pbIdeas = [];
  let pbCurrentMonthIndex = 0;
  const PB_MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const PB_MONTH_NAMES = ['Unplanned', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let pbPeopleList = [];
  let pbPhotosList = [];
  
  // Example ideas (DON'T count in stats)
  const PB_EXAMPLES = [
    {
      id: 'example-1',
      title: 'Game Night Ideas',
      desc: 'Example: Board games, snacks, and friends!',
      targetMonth: '',
      priority: 'low',
      tag: 'fun',
      location: 'Home',
      people: ['Alex', 'Sam'],
      isExample: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'example-2',
      title: 'Anniversary Dinner',
      desc: 'Example: Special restaurant reservation',
      targetMonth: 'Feb',
      priority: 'high',
      tag: 'romantic',
      location: 'Downtown',
      datetime: '2026-02-14T19:00',
      people: ['Partner'],
      isExample: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'example-3',
      title: 'Visit Art Museum',
      desc: 'Example: Check out the new exhibit',
      targetMonth: 'Mar',
      priority: 'medium',
      tag: 'culture',
      location: 'City Art Museum',
      isExample: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  // Code snippets for streaming effect
  const PB_CODE_SNIPPETS = [
    '// loading idea data...',
    'const idea = await fetch();',
    'if (idea.priority === "high")',
    'render(idea.details);',
    'function displayIdea() {',
    '  return <IdeaCard />;',
    '}',
    'export default idea;',
    'import { love } from "heart";',
    '// compiled with ❤️',
    'const memories = [];',
    'memories.push(moment);',
    'await createMemory();',
    'promise.resolve(joy);',
    'const plan = new Plan();',
    'plan.execute(dreams);',
    '// optimizing happiness...',
    'while(together) { smile(); }',
    'return Infinity;',
  ];
  
  // Helper: Get element by ID
  function $(id) {
    return document.getElementById(id);
  }
  
  // Load ideas from localStorage
  function pbLoadIdeas() {
    const stored = localStorage.getItem('planning_board_ideas');
    pbIdeas = stored ? JSON.parse(stored) : [];
  }
  
  // Save ideas to localStorage
  function pbSaveIdeas() {
    localStorage.setItem('planning_board_ideas', JSON.stringify(pbIdeas));
  }
  
  // Get all ideas including examples for display
  function pbGetAllIdeasForDisplay() {
    return [...PB_EXAMPLES, ...pbIdeas];
  }
  
  // Get ideas for a specific month (examples + real)
  function pbGetIdeasForMonth(monthKey) {
    const allIdeas = pbGetAllIdeasForDisplay();
    return allIdeas.filter(function(idea) { return idea.targetMonth === monthKey; });
  }
  
  // Update stats (ONLY count real ideas, NOT examples)
  function pbUpdateStats() {
    const total = pbIdeas.length;
    const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
    const thisMonth = pbIdeas.filter(function(i) { return i.targetMonth === currentMonth; }).length;
    const highPriority = pbIdeas.filter(function(i) { return i.priority === 'high'; }).length;
    const unplanned = pbIdeas.filter(function(i) { return !i.targetMonth || i.targetMonth === ''; }).length;
    
    const elTotal = $('pbStatTotal');
    const elThisMonth = $('pbStatThisMonth');
    const elHighPriority = $('pbStatHighPriority');
    const elUnplanned = $('pbStatUnplanned');
    
    if (elTotal) elTotal.textContent = total;
    if (elThisMonth) elThisMonth.textContent = thisMonth;
    if (elHighPriority) elHighPriority.textContent = highPriority;
    if (elUnplanned) elUnplanned.textContent = unplanned;
  }
  
  // Boot Screen Animation
  function pbShowBootScreen() {
    return new Promise(function(resolve) {
      const elBoot = $('pbBootScreen');
      const elLog = $('pbBootLog');
      const elProgress = $('pbBootProgressBar');
      const elStatus = $('pbBootStatus');
      
      if (!elBoot || !elLog || !elProgress || !elStatus) {
        resolve();
        return;
      }
      
      elBoot.classList.remove('hidden');
      elLog.innerHTML = '';
      elProgress.style.width = '0%';
      
      // Get current theme for themed boot messages
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'system';
      
      // Add blizzard effect for Christmas theme
      let blizzardEl = null;
      if (currentTheme === 'christmas') {
        blizzardEl = document.createElement('div');
        blizzardEl.className = 'christmas-blizzard';
        blizzardEl.innerHTML = `
          <div class="blizzard-layer blizzard-layer-1"></div>
          <div class="blizzard-layer blizzard-layer-2"></div>
          <div class="blizzard-layer blizzard-layer-3"></div>
        `;
        elBoot.appendChild(blizzardEl);
        
        // Intensify blizzard over time
        setTimeout(() => blizzardEl.classList.add('intensifying'), 500);
        setTimeout(() => blizzardEl.classList.add('peak'), 1200);
      }
      
      // Theme-specific boot messages
      let bootMessages;
      let bootDuration = 1800;
      
      if (currentTheme === 'christmas') {
        bootDuration = 2500; // Slower, more dramatic for Christmas
        bootMessages = [
          { text: 'Braving the winter storm...', delay: 200 },
          { text: 'Checking naughty/nice list...', delay: 500 },
          { text: 'Warming up the hot cocoa...', delay: 800 },
          { text: 'Counting presents under tree...', delay: 1100 },
          { text: 'Feeding the reindeer...', delay: 1400 },
          { text: 'Polishing the sleigh bells...', delay: 1700 },
          { text: 'Spreading holiday cheer...', delay: 2000 },
          { text: 'Ho ho ho! Ready!', delay: 2300, success: true },
        ];
      } else {
        bootMessages = [
          { text: '[OK] Initializing Planning Board...', delay: 200 },
          { text: '[OK] Loading year calendar...', delay: 400 },
          { text: '[OK] Syncing idea database...', delay: 600 },
          { text: '[OK] Preparing card navigator...', delay: 800 },
          { text: '[OK] Loading theme assets...', delay: 1000 },
          { text: '[OK] All systems ready', delay: 1200, success: true },
        ];
      }
      
      let progress = 0;
      const progressInterval = setInterval(function() {
        progress += 2;
        if (progress <= 100) {
          elProgress.style.width = progress + '%';
        }
      }, 25);
      
      bootMessages.forEach(function(msg) {
        setTimeout(function() {
          const elItem = document.createElement('div');
          elItem.className = 'pb-boot-log-item' + (msg.success ? ' success' : '');
          elItem.textContent = msg.text;
          elLog.appendChild(elItem);
          // Update status text based on theme
          if (currentTheme === 'christmas') {
            elStatus.textContent = msg.success ? 'Merry Planning!' : msg.text;
          } else {
            elStatus.textContent = msg.text.replace('[OK] ', '');
          }
        }, msg.delay);
      });
      
      setTimeout(function() {
        clearInterval(progressInterval);
        elProgress.style.width = '100%';
        if (currentTheme === 'christmas') {
          elStatus.textContent = 'Unwrapping your plans...';
          // Fade blizzard
          if (blizzardEl) {
            blizzardEl.classList.add('fading');
          }
        } else {
          elStatus.textContent = 'Launching...';
        }
        
        setTimeout(function() {
          if (blizzardEl) blizzardEl.remove();
          elBoot.classList.add('hidden');
          resolve();
        }, 500);
      }, bootDuration);
    });
  }
  
  // Generate code block for streaming effect
  function pbGenerateCodeBlock() {
    let code = '';
    for (let i = 0; i < 30; i++) {
      code += PB_CODE_SNIPPETS[Math.floor(Math.random() * PB_CODE_SNIPPETS.length)] + '\n';
    }
    return code;
  }
  
  // Create code stream effect (performant version)
  function pbCreateCodeStream(container) {
    container.innerHTML = '';
    const columns = 8;
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < columns; i++) {
      const col = document.createElement('div');
      col.className = 'pb-code-stream-column';
      col.style.left = (i * 12.5) + '%';
      col.style.animationDuration = (1 + Math.random() * 0.5) + 's';
      col.style.animationDelay = (Math.random() * 0.3) + 's';
      col.textContent = pbGenerateCodeBlock();
      fragment.appendChild(col);
    }
    
    container.appendChild(fragment);
    container.classList.add('active');
  }
  
  // Stop code stream
  function pbStopCodeStream(container) {
    container.classList.remove('active');
    // Clean up after animation
    setTimeout(function() {
      container.innerHTML = '';
    }, 500);
  }
  
  // Render month card content
  function pbRenderMonthCard(monthIndex) {
    const monthKey = PB_MONTHS[monthIndex];
    const monthName = PB_MONTH_NAMES[monthIndex];
    const ideas = pbGetIdeasForMonth(monthKey);
    const realIdeasCount = ideas.filter(function(i) { return !i.isExample; }).length;
    
    let html = '<div class="pb-month-card-header">' +
      '<div class="pb-month-card-title">' + monthName + '</div>' +
      '<div class="pb-month-card-count">' + realIdeasCount + ' idea' + (realIdeasCount !== 1 ? 's' : '') + '</div>' +
      '</div>';
    
    if (ideas.length === 0) {
      html += '<div class="pb-empty-state">' +
        '<div class="pb-empty-state-icon"><i class="fas fa-lightbulb"></i></div>' +
        '<div>No ideas yet for ' + monthName + '</div>' +
        '<div style="font-size: 12px; margin-top: 10px;">Click "Add Detailed Idea" to get started!</div>' +
        '</div>';
    } else {
      html += '<div class="pb-ideas-grid">';
      ideas.forEach(function(idea) {
        html += '<div class="pb-idea-card ' + (idea.isExample ? 'is-example' : '') + '" data-idea-id="' + idea.id + '">' +
          '<div class="pb-idea-card-title">' + idea.title + '</div>' +
          (idea.desc ? '<div class="pb-idea-card-desc">' + idea.desc + '</div>' : '') +
          '<div class="pb-idea-card-meta">' +
          (idea.location ? '<span class="pb-idea-card-location"><i class="fas fa-map-marker-alt"></i> ' + idea.location + '</span>' : '') +
          (idea.people && idea.people.length > 0 ? '<span class="pb-idea-card-people"><i class="fas fa-users"></i> ' + idea.people.join(', ') + '</span>' : '') +
          (idea.tag ? '<span class="pb-idea-card-tag">' + idea.tag + '</span>' : '') +
          '<span class="pb-idea-card-priority ' + idea.priority + '">' + idea.priority + '</span>' +
          '</div>' +
          '</div>';
      });
      html += '</div>';
    }
    
    return html;
  }
  
  // Navigate months with card animation
  function pbNavigateMonth(direction) {
    const container = $('pbCardContainer');
    const prevBtn = $('pbNavPrev');
    const nextBtn = $('pbNavNext');
    
    if (!container) return;
    
    const newIndex = pbCurrentMonthIndex + direction;
    if (newIndex < 0 || newIndex > 12) return;
    
    // Get current card
    const currentCard = container.querySelector('.pb-month-card.active');
    
    // Create new card
    const newCard = document.createElement('div');
    newCard.className = 'pb-month-card ' + (direction > 0 ? 'next' : 'prev');
    newCard.innerHTML = pbRenderMonthCard(newIndex);
    container.appendChild(newCard);
    
    // Force reflow
    void newCard.offsetHeight;
    
    // Animate
    requestAnimationFrame(function() {
      if (currentCard) {
        currentCard.classList.remove('active');
        currentCard.classList.add(direction > 0 ? 'prev' : 'next');
      }
      newCard.classList.remove('prev', 'next');
      newCard.classList.add('active');
    });
    
    // Clean up old card
    setTimeout(function() {
      if (currentCard) currentCard.remove();
    }, 600);
    
    pbCurrentMonthIndex = newIndex;
    
    // Update button states
    if (prevBtn) prevBtn.disabled = pbCurrentMonthIndex === 0;
    if (nextBtn) nextBtn.disabled = pbCurrentMonthIndex === 12;
  }
  
  // Render initial card
  function pbRenderInitialCard() {
    const container = $('pbCardContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'pb-month-card active';
    card.innerHTML = pbRenderMonthCard(pbCurrentMonthIndex);
    container.appendChild(card);
    
    // Update nav buttons
    const prevBtn = $('pbNavPrev');
    const nextBtn = $('pbNavNext');
    if (prevBtn) prevBtn.disabled = pbCurrentMonthIndex === 0;
    if (nextBtn) nextBtn.disabled = pbCurrentMonthIndex === 12;
  }
  
  // Show expanded idea with code stream
  function pbShowExpandedIdea(ideaId) {
    const allIdeas = pbGetAllIdeasForDisplay();
    const idea = allIdeas.find(function(i) { return i.id === ideaId; });
    if (!idea) return;
    
    const expanded = $('pbIdeaExpanded');
    const codeStream = $('pbCodeStream');
    const content = $('pbExpandedContent');
    
    if (!expanded || !codeStream || !content) return;
    
    // Build content HTML
    let contentHtml = '<h2 class="pb-expanded-title">' + idea.title + '</h2>' +
      (idea.desc ? '<p class="pb-expanded-desc">' + idea.desc + '</p>' : '') +
      '<div class="pb-expanded-details">' +
      '<div class="pb-expanded-detail">' +
        '<div class="pb-expanded-detail-label">Month</div>' +
        '<div class="pb-expanded-detail-value">' + (idea.targetMonth || 'Unplanned') + '</div>' +
      '</div>' +
      '<div class="pb-expanded-detail">' +
        '<div class="pb-expanded-detail-label">Priority</div>' +
        '<div class="pb-expanded-detail-value" style="text-transform: capitalize;">' + idea.priority + '</div>' +
      '</div>';
    
    if (idea.tag) {
      contentHtml += '<div class="pb-expanded-detail">' +
        '<div class="pb-expanded-detail-label">Tag</div>' +
        '<div class="pb-expanded-detail-value" style="text-transform: capitalize;">' + idea.tag + '</div>' +
        '</div>';
    }
    
    if (idea.location) {
      contentHtml += '<div class="pb-expanded-detail">' +
        '<div class="pb-expanded-detail-label">Location</div>' +
        '<div class="pb-expanded-detail-value"><i class="fas fa-map-marker-alt"></i> ' + idea.location + '</div>' +
        '</div>';
    }
    
    if (idea.datetime) {
      contentHtml += '<div class="pb-expanded-detail">' +
        '<div class="pb-expanded-detail-label">Date & Time</div>' +
        '<div class="pb-expanded-detail-value">' + new Date(idea.datetime).toLocaleString() + '</div>' +
        '</div>';
    }
    
    if (idea.people && idea.people.length > 0) {
      contentHtml += '<div class="pb-expanded-detail">' +
        '<div class="pb-expanded-detail-label">People</div>' +
        '<div class="pb-expanded-detail-value"><i class="fas fa-users"></i> ' + idea.people.join(', ') + '</div>' +
        '</div>';
    }
    
    contentHtml += '</div>';
    
    if (idea.photos && idea.photos.length > 0) {
      contentHtml += '<div class="pb-expanded-photos">';
      idea.photos.forEach(function(p) {
        contentHtml += '<img src="' + p + '" class="pb-expanded-photo" alt="Idea photo">';
      });
      contentHtml += '</div>';
    }
    
    // [NEW] Add delete button for non-example ideas
    if (!idea.isExample) {
      contentHtml += '<div class="pb-expanded-actions">' +
        '<button class="btn danger pb-delete-idea" data-idea-id="' + idea.id + '">' +
        '<i class="fas fa-trash"></i> Delete Idea</button>' +
        '</div>';
    }
    
    content.innerHTML = contentHtml;
    
    // [NEW] Add delete button handler with confirmation
    const deleteBtn = content.querySelector('.pb-delete-idea');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        showConfirmModal('Are you sure you want to delete this idea? This cannot be undone.', function() {
          // Find and remove the idea
          const ideaIdx = pbIdeas.findIndex(function(i) { return i.id === ideaId; });
          if (ideaIdx !== -1) {
            pbIdeas.splice(ideaIdx, 1);
            pbSaveIdeas();
            pbUpdateStats();
            pbRenderInitialCard();
            pbCloseExpandedIdea();
            showToast('Idea deleted');
          }
        });
      });
    }
    
    // Show overlay
    expanded.classList.remove('hidden');
    
    // Start code stream
    pbCreateCodeStream(codeStream);
    
    // Show content after code stream
    setTimeout(function() {
      expanded.classList.add('content-visible');
    }, 400);
  }
  
  // Close expanded idea
  function pbCloseExpandedIdea() {
    const expanded = $('pbIdeaExpanded');
    const codeStream = $('pbCodeStream');
    
    if (!expanded || !codeStream) return;
    
    // Remove content visibility first
    expanded.classList.remove('content-visible');
    
    // Start exit code stream
    pbCreateCodeStream(codeStream);
    
    // Then hide
    setTimeout(function() {
      pbStopCodeStream(codeStream);
      expanded.classList.add('hidden');
    }, 600);
  }
  
  // Open Planning Board
  function pbOpen() {
    pbShowBootScreen().then(function() {
      const overlay = $('planningBoardOverlay');
      if (overlay) {
        overlay.classList.remove('hidden');
        pbLoadIdeas();
        pbUpdateStats();
        pbCurrentMonthIndex = 0;
        pbRenderInitialCard();
      }
    });
  }
  
  // Close Planning Board with cool effect
  function pbClose() {
    var closeEffect = $('pbCloseEffect');
    var overlay = $('planningBoardOverlay');
    var currentTheme = document.documentElement.getAttribute('data-theme') || 'system';
    
    if (currentTheme === 'christmas' && overlay) {
      // Christmas freeze-over effect
      var freezeOverlay = document.createElement('div');
      freezeOverlay.className = 'christmas-freeze-overlay';
      freezeOverlay.innerHTML = `
        <div class="freeze-frost"></div>
        <div class="freeze-ice-crystals"></div>
        <div class="freeze-breath"></div>
      `;
      overlay.appendChild(freezeOverlay);
      
      // Trigger freeze animation
      setTimeout(function() {
        freezeOverlay.classList.add('freezing');
      }, 50);
      
      // After freeze, show defrost and close
      setTimeout(function() {
        freezeOverlay.classList.add('defrosting');
      }, 1200);
      
      setTimeout(function() {
        overlay.classList.add('hidden');
        freezeOverlay.remove();
      }, 2000);
      
    } else if (closeEffect && overlay) {
      // Standard glitch effect
      closeEffect.classList.remove('hidden');
      
      setTimeout(function() {
        overlay.classList.add('hidden');
        closeEffect.classList.add('hidden');
      }, 800);
    } else if (overlay) {
      overlay.classList.add('hidden');
    }
  }
  
  // Add simple idea
  function pbAddSimpleIdea() {
    const input = $('pbQuickInput');
    if (!input) return;
    
    const title = input.value.trim();
    if (!title) return;
    
    const newIdea = {
      id: 'idea-' + Date.now(),
      title: title,
      desc: '',
      targetMonth: '',
      priority: 'medium',
      tag: 'fun',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    pbIdeas.push(newIdea);
    pbSaveIdeas();
    pbUpdateStats();
    pbRenderInitialCard();
    
    input.value = '';
  }
  
  // Open add modal
  function pbOpenAddModal() {
    const modal = $('pbAddModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('active');
      pbPeopleList = [];
      pbPhotosList = [];
      pbRenderPeopleTags();
      pbRenderPhotoPreviews();
    }
  }
  
  // Close add modal
  function pbCloseAddModal() {
    const modal = $('pbAddModal');
    const form = $('pbAddForm');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('active');
    }
    if (form) form.reset();
    pbPeopleList = [];
    pbPhotosList = [];
  }
  
  // Render people tags
  function pbRenderPeopleTags() {
    const container = $('pbPeopleTags');
    if (!container) return;
    
    container.innerHTML = pbPeopleList.map(function(person, i) {
      return '<span class="pb-people-tag">' +
        '<i class="fas fa-user"></i> ' + person +
        '<span class="pb-people-tag-remove" data-index="' + i + '">✕</span>' +
        '</span>';
    }).join('');
  }
  
  // Render photo previews
  function pbRenderPhotoPreviews() {
    const container = $('pbPhotoPreviews');
    if (!container) return;
    
    container.innerHTML = pbPhotosList.map(function(photo, i) {
      return '<div class="pb-photo-preview">' +
        '<img src="' + photo + '" alt="Preview ' + (i + 1) + '">' +
        '<button type="button" class="pb-photo-preview-remove" data-index="' + i + '">✕</button>' +
        '</div>';
    }).join('');
  }
  
  // Handle form submit
  function pbHandleFormSubmit(e) {
    e.preventDefault();
    
    const titleEl = $('pbFormTitle');
    const title = titleEl ? titleEl.value.trim() : '';
    if (!title) return;
    
    const descEl = $('pbFormDesc');
    const monthEl = $('pbFormMonth');
    const priorityEl = $('pbFormPriority');
    const tagEl = $('pbFormTag');
    const locationEl = $('pbFormLocation');
    const datetimeEl = $('pbFormDatetime');
    
    const newIdea = {
      id: 'idea-' + Date.now(),
      title: title,
      desc: descEl ? descEl.value.trim() : '',
      targetMonth: monthEl ? monthEl.value : '',
      priority: priorityEl ? priorityEl.value : 'low',
      tag: tagEl ? tagEl.value : '',
      location: locationEl ? locationEl.value.trim() : '',
      datetime: datetimeEl ? datetimeEl.value : '',
      people: pbPeopleList.slice(),
      photos: pbPhotosList.slice(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    pbIdeas.push(newIdea);
    pbSaveIdeas();
    pbUpdateStats();
    pbRenderInitialCard();
    pbCloseAddModal();
  }
  
  // Event Listeners
  function pbInitEventListeners() {
    // Open Planning Board
    var openBtn = $('openPlanningBoard');
    if (openBtn) {
      openBtn.addEventListener('click', pbOpen);
    }
    
    // Close Planning Board
    var closeBtn = $('closePlanningBoard');
    if (closeBtn) {
      closeBtn.addEventListener('click', pbClose);
    }
    
    // Navigation arrows
    var prevBtn = $('pbNavPrev');
    var nextBtn = $('pbNavNext');
    if (prevBtn) {
      prevBtn.addEventListener('click', function() { pbNavigateMonth(-1); });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function() { pbNavigateMonth(1); });
    }
    
    // Quick add
    var quickInput = $('pbQuickInput');
    if (quickInput) {
      quickInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          pbAddSimpleIdea();
        }
      });
    }
    
    var addSimpleBtn = $('pbAddSimple');
    if (addSimpleBtn) {
      addSimpleBtn.addEventListener('click', pbAddSimpleIdea);
    }
    
    // Open detailed modal
    var addDetailedBtn = $('pbAddDetailed');
    if (addDetailedBtn) {
      addDetailedBtn.addEventListener('click', pbOpenAddModal);
    }
    
    // Close modal
    var modalClose = $('pbModalClose');
    var formCancel = $('pbFormCancel');
    if (modalClose) {
      modalClose.addEventListener('click', pbCloseAddModal);
    }
    if (formCancel) {
      formCancel.addEventListener('click', pbCloseAddModal);
    }
    
    // Form submit
    var form = $('pbAddForm');
    if (form) {
      form.addEventListener('submit', pbHandleFormSubmit);
    }
    
    // People input
    var peopleInput = $('pbFormPeopleInput');
    if (peopleInput) {
      peopleInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var name = peopleInput.value.trim();
          if (name && pbPeopleList.indexOf(name) === -1) {
            pbPeopleList.push(name);
            pbRenderPeopleTags();
            peopleInput.value = '';
          }
        }
      });
    }
    
    // Remove person tag (event delegation)
    var peopleTags = $('pbPeopleTags');
    if (peopleTags) {
      peopleTags.addEventListener('click', function(e) {
        var removeEl = e.target.closest('.pb-people-tag-remove');
        if (removeEl) {
          var index = parseInt(removeEl.dataset.index, 10);
          pbPeopleList.splice(index, 1);
          pbRenderPeopleTags();
        }
      });
    }
    
    // Photo upload
    var dropzone = $('pbPhotoDropzone');
    var photoInput = $('pbPhotoInput');
    if (dropzone && photoInput) {
      dropzone.addEventListener('click', function() { photoInput.click(); });
      
      photoInput.addEventListener('change', function(e) {
        var files = e.target.files;
        if (files) {
          Array.from(files).forEach(function(file) {
            var reader = new FileReader();
            reader.onload = function(event) {
              pbPhotosList.push(event.target.result);
              pbRenderPhotoPreviews();
            };
            reader.readAsDataURL(file);
          });
        }
      });
      
      // Drag and drop
      dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--accent)';
      });
      
      dropzone.addEventListener('dragleave', function() {
        dropzone.style.borderColor = '';
      });
      
      dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropzone.style.borderColor = '';
        var files = e.dataTransfer ? e.dataTransfer.files : null;
        if (files) {
          Array.from(files).forEach(function(file) {
            if (file.type.indexOf('image/') === 0) {
              var reader = new FileReader();
              reader.onload = function(event) {
                pbPhotosList.push(event.target.result);
                pbRenderPhotoPreviews();
              };
              reader.readAsDataURL(file);
            }
          });
        }
      });
    }
    
    // Remove photo (event delegation)
    var photoPreviews = $('pbPhotoPreviews');
    if (photoPreviews) {
      photoPreviews.addEventListener('click', function(e) {
        var removeEl = e.target.closest('.pb-photo-preview-remove');
        if (removeEl) {
          var index = parseInt(removeEl.dataset.index, 10);
          pbPhotosList.splice(index, 1);
          pbRenderPhotoPreviews();
        }
      });
    }
    
    // Close expanded idea
    var expandedClose = $('pbExpandedClose');
    if (expandedClose) {
      expandedClose.addEventListener('click', pbCloseExpandedIdea);
    }
    
    // Click on idea card (event delegation on document)
    document.addEventListener('click', function(e) {
      var ideaCard = e.target.closest('.pb-idea-card');
      if (ideaCard && ideaCard.dataset.ideaId) {
        pbShowExpandedIdea(ideaCard.dataset.ideaId);
      }
    });
    
    // Close expanded on backdrop click
    var expanded = $('pbIdeaExpanded');
    if (expanded) {
      expanded.addEventListener('click', function(e) {
        if (e.target === expanded) {
          pbCloseExpandedIdea();
        }
      });
    }
    
    // Close modal on backdrop click
    var modal = $('pbAddModal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          pbCloseAddModal();
        }
      });
    }
    
    // Custom tag handling
    var tagSelect = $('pbFormTag');
    var customTagField = $('pbCustomTagField');
    if (tagSelect && customTagField) {
      tagSelect.addEventListener('change', function() {
        if (tagSelect.value === 'custom') {
          customTagField.classList.remove('hidden');
        } else {
          customTagField.classList.add('hidden');
        }
      });
    }
    
    // Bug report modal
    var bugBtn = $('pbBugReport');
    var bugModal = $('pbBugModal');
    var bugModalClose = $('pbBugModalClose');
    var bugCancel = $('pbBugCancel');
    var bugForm = $('pbBugForm');
    
    if (bugBtn && bugModal) {
      bugBtn.addEventListener('click', function() {
        bugModal.classList.remove('hidden');
        bugModal.classList.add('active');
      });
    }
    
    // Floating Bug Report Button (FAB)
    var fabBugBtn = $('fabBugReport');
    if (fabBugBtn && bugModal) {
      fabBugBtn.addEventListener('click', function() {
        bugModal.classList.remove('hidden');
        bugModal.classList.add('active');
      });
    }
    
    function closeBugModal() {
      if (bugModal) {
        bugModal.classList.add('hidden');
        bugModal.classList.remove('active');
      }
      if (bugForm) bugForm.reset();
    }
    
    if (bugModalClose) bugModalClose.addEventListener('click', closeBugModal);
    if (bugCancel) bugCancel.addEventListener('click', closeBugModal);
    if (bugModal) {
      bugModal.addEventListener('click', function(e) {
        if (e.target === bugModal) closeBugModal();
      });
    }
    
    if (bugForm) {
      bugForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Store bug report in localStorage for now
        var bugReports = JSON.parse(localStorage.getItem('bug_reports') || '[]');
        bugReports.push({
          id: 'bug-' + Date.now(),
          title: $('pbBugTitle') ? $('pbBugTitle').value : '',
          desc: $('pbBugDesc') ? $('pbBugDesc').value : '',
          steps: $('pbBugSteps') ? $('pbBugSteps').value : '',
          device: $('pbBugDevice') ? $('pbBugDevice').value : '',
          theme: $('pbBugTheme') ? $('pbBugTheme').value : '',
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('bug_reports', JSON.stringify(bugReports));
        closeBugModal();
        showAlertModal('Bug report submitted! Thank you for your feedback.');
      });
    }
    
    // Import from Planning Board
    var importBtn = document.getElementById('btnImportFromPB');
    var importModal = $('importPBModal');
    var importModalClose = $('importPBModalClose');
    var importList = $('pbImportList');
    var importEmpty = $('pbImportEmpty');
    
    if (importBtn && importModal) {
      importBtn.addEventListener('click', function() {
        // Load ideas from localStorage
        var storedIdeas = JSON.parse(localStorage.getItem('planning_board_ideas') || '[]');
        
        if (storedIdeas.length === 0) {
          if (importList) importList.classList.add('hidden');
          if (importEmpty) importEmpty.classList.remove('hidden');
        } else {
          if (importList) {
            importList.classList.remove('hidden');
            importList.innerHTML = storedIdeas.map(function(idea) {
              return '<div class="pb-import-item" data-idea-id="' + idea.id + '">' +
                '<div class="pb-import-item-content">' +
                  '<div class="pb-import-item-title">' + idea.title + '</div>' +
                  (idea.desc ? '<div class="pb-import-item-desc">' + idea.desc + '</div>' : '') +
                  '<div class="pb-import-item-meta">' +
                    '<span>' + (idea.targetMonth || 'Unplanned') + '</span>' +
                    '<span>' + idea.priority + '</span>' +
                    (idea.tag ? '<span>' + idea.tag + '</span>' : '') +
                  '</div>' +
                '</div>' +
                '<div class="pb-import-item-actions">' +
                  '<button class="btn pb-import-select" data-action="select">SELECT</button>' +
                  '<button class="btn pb-import-edit" data-action="edit">EDIT</button>' +
                '</div>' +
              '</div>';
            }).join('');
          }
          if (importEmpty) importEmpty.classList.add('hidden');
        }
        
        importModal.classList.remove('hidden');
        importModal.classList.add('active');
      });
    }
    
    function closeImportModal() {
      if (importModal) {
        importModal.classList.add('hidden');
        importModal.classList.remove('active');
      }
    }
    
    if (importModalClose) importModalClose.addEventListener('click', closeImportModal);
    if (importModal) {
      importModal.addEventListener('click', function(e) {
        if (e.target === importModal) closeImportModal();
        
        // Handle clicking on import item buttons
        var importItem = e.target.closest('.pb-import-item');
        if (!importItem || !importItem.dataset.ideaId) return;
        
        var actionBtn = e.target.closest('[data-action]');
        var action = actionBtn ? actionBtn.dataset.action : 'select';
        
        var storedIdeas = JSON.parse(localStorage.getItem('planning_board_ideas') || '[]');
        var idea = storedIdeas.find(function(i) { return i.id === importItem.dataset.ideaId; });
        
        if (!idea) return;
        
        if (action === 'edit') {
          // Close import modal and open Planning Board Advanced Modal
          closeImportModal();
          
          // Open Planning Board add modal with pre-filled data
          var pbAddModal = $('pbAddModal');
          if (pbAddModal) {
            pbAddModal.classList.remove('hidden');
            pbAddModal.classList.add('active');
            
            // Pre-fill the Planning Board form
            var pbTitle = document.getElementById('pbFormTitle');
            var pbDesc = document.getElementById('pbFormDesc');
            var pbTag = document.getElementById('pbFormTag');
            var pbMonth = document.getElementById('pbFormMonth');
            var pbPriority = document.getElementById('pbFormPriority');
            
            if (pbTitle) pbTitle.value = idea.title || '';
            if (pbDesc) pbDesc.value = idea.desc || '';
            if (pbTag && idea.tag) {
              var tagExists = Array.from(pbTag.options).some(function(opt) { return opt.value === idea.tag; });
              if (tagExists) {
                pbTag.value = idea.tag;
              }
            }
            if (pbMonth && idea.targetMonth) pbMonth.value = idea.targetMonth;
            if (pbPriority && idea.priority) pbPriority.value = idea.priority;
            
            showToast("Edit in Advanced Mode - Add when ready!");
          } else {
            // Fallback to simple form if Planning Board modal not available
            var newTitle = document.getElementById('newTitle');
            var newDesc = document.getElementById('newDesc');
            var newTag = document.getElementById('newTag');
            var customTagField = document.getElementById('customTagField');
            var customTagInput = document.getElementById('customTagInput');
            
            if (newTitle) newTitle.value = idea.title;
            if (newDesc) newDesc.value = idea.desc || '';
            if (newTag && idea.tag) {
              var tagExists = Array.from(newTag.options).some(function(opt) { return opt.value === idea.tag; });
              if (tagExists) {
                newTag.value = idea.tag;
                if (customTagField) customTagField.classList.add('hidden');
              } else {
                newTag.value = 'custom';
                if (customTagField) customTagField.classList.remove('hidden');
                if (customTagInput) customTagInput.value = idea.tag;
              }
            }
            showToast("Edit the mission details and click Add!");
          }
        } else {
          // Default: Select and fill form
          var newTitle = document.getElementById('newTitle');
          var newDesc = document.getElementById('newDesc');
          var newTag = document.getElementById('newTag');
          
          if (newTitle) newTitle.value = idea.title;
          if (newDesc) newDesc.value = idea.desc || '';
          if (newTag && idea.tag) {
            var tagExists = Array.from(newTag.options).some(function(opt) { return opt.value === idea.tag; });
            if (tagExists) {
              newTag.value = idea.tag;
            }
          }
          
          closeImportModal();
          showToast("Idea imported! Click Add Mission to save.");
        }
      });
    }
  }
  
  // Make pbLoadIdeas and pbIdeas accessible for import feature
  window.pbGetIdeas = function() {
    return JSON.parse(localStorage.getItem('planning_board_ideas') || '[]');
  };
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pbInitEventListeners);
  } else {
    pbInitEventListeners();
  }
  
  console.log('[PLANNING BOARD] System initialized');
  
})();
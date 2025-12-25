/* ============================================
   GIFT EXPERIENCE v2.0
   Interactive gift unwrapping with letter reveal
   - State machine for clean state management
   - 3D box with lid animation
   - Letter/envelope opening animation
   - Confetti celebration
   ============================================ */

(function() {
  'use strict';
  
  const GIFT_SHOWN_KEY = "bucketlist_gift_shown_2025";
  
  // ===== STATE MACHINE =====
  const STATE = {
    IDLE: 'idle',
    OPENING: 'opening',
    BOX_OPEN: 'box-open',
    LETTER_OPEN: 'letter-open',
    CLOSING: 'closing'
  };
  
  let currentState = STATE.IDLE;
  let wasOpen = false;
  
  // ===== DOM ELEMENTS (cached) =====
  let overlay = null;
  let scene = null;
  let floor = null;
  let lid = null;
  let qmark = null;
  let letter = null;
  let envelope = null;
  let continueBtn = null;
  
  // ===== UTILITY FUNCTIONS =====
  const $ = (id) => document.getElementById(id);
  const clamp = (min, value, max) => Math.min(Math.max(min, value), max);
  
  const rangify = (value, percent) => {
    const numerator = percent >= 0.5 
      ? (percent - 0.5) 
      : (0.5 - percent) * -1;
    return value * (numerator / 0.5);
  };
  
  // ===== CHECK IF GIFT SHOULD SHOW =====
  function shouldShowGift() {
    const user = localStorage.getItem("bucketlist_2026_user");
    if (!user) return false;
    if (user.toLowerCase() !== "kylee") return false;
    if (localStorage.getItem(GIFT_SHOWN_KEY) === "true") return false;
    return true;
  }
  
  // ===== STATE TRANSITIONS =====
  function setState(newState) {
    console.log(`[GIFT] State: ${currentState} → ${newState}`);
    const prevState = currentState;
    currentState = newState;
    
    // Update overlay classes
    overlay.classList.remove('opening', 'box-open', 'letter-open', 'unwrapping');
    
    switch (newState) {
      case STATE.OPENING:
        overlay.classList.add('opening');
        lid.classList.remove('open', 'closing');
        lid.classList.add('opening');
        if (qmark) qmark.textContent = '!';
        
        // After animation, transition to BOX_OPEN
        setTimeout(() => {
          if (currentState === STATE.OPENING) {
            setState(STATE.BOX_OPEN);
          }
        }, 1000);
        break;
        
      case STATE.BOX_OPEN:
        wasOpen = true;
        overlay.classList.add('box-open');
        lid.classList.remove('opening', 'closing');
        lid.classList.add('open');
        
        // After heart shows, open letter
        setTimeout(() => {
          if (currentState === STATE.BOX_OPEN) {
            setState(STATE.LETTER_OPEN);
          }
        }, 2000);
        break;
        
      case STATE.LETTER_OPEN:
        overlay.classList.add('box-open', 'letter-open');
        
        // Open the envelope after a moment
        setTimeout(() => {
          if (envelope) {
            envelope.classList.add('opened');
          }
        }, 500);
        break;
        
      case STATE.CLOSING:
        overlay.classList.add('unwrapping');
        
        // Trigger confetti
        if (window.ConfettiStorm) {
          window.ConfettiStorm.start(6000);
        }
        
        // Mark as shown
        localStorage.setItem(GIFT_SHOWN_KEY, "true");
        
        // Clean up after animation
        setTimeout(() => {
          cleanup();
        }, 1500);
        break;
        
      case STATE.IDLE:
      default:
        lid.classList.remove('opening', 'open', 'closing');
        if (qmark) qmark.textContent = '?';
        wasOpen = false;
        break;
    }
  }
  
  // ===== TOGGLE BOX (like the React version) =====
  function toggleBox() {
    if (currentState === STATE.IDLE) {
      setState(STATE.OPENING);
    } else if (currentState === STATE.BOX_OPEN) {
      // Close the lid (optional feature)
      lid.classList.remove('open');
      lid.classList.add('closing');
      if (qmark) qmark.textContent = '?';
      
      setTimeout(() => {
        lid.classList.remove('closing');
        currentState = STATE.IDLE;
        overlay.classList.remove('box-open');
      }, 1000);
    }
  }
  
  // ===== 3D TILT EFFECT =====
  function handleMouseMove(e) {
    if (currentState === STATE.LETTER_OPEN || !scene) return;
    
    const rect = scene.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPercent = mouseX / rect.width;
    const yPercent = mouseY / rect.height;
    
    const xDeg = rangify(12, yPercent);
    const yDeg = rangify(-12, xPercent);
    
    scene.style.transform = `perspective(1200px) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
  }
  
  function handleMouseLeave() {
    if (currentState === STATE.LETTER_OPEN || !scene) return;
    scene.classList.add('tilt-transition');
    scene.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    setTimeout(() => scene.classList.remove('tilt-transition'), 500);
  }
  
  // ===== EVENT HANDLERS =====
  function handleLidClick(e) {
    e.stopPropagation();
    if (currentState === STATE.IDLE || currentState === STATE.BOX_OPEN) {
      toggleBox();
    }
  }
  
  function handleFloorClick(e) {
    if (currentState === STATE.IDLE) {
      toggleBox();
    }
  }
  
  function handleContinue() {
    if (currentState === STATE.LETTER_OPEN) {
      setState(STATE.CLOSING);
    }
  }
  
  // ===== CLEANUP =====
  function cleanup() {
    // Remove event listeners
    if (scene) {
      scene.removeEventListener('mousemove', handleMouseMove);
      scene.removeEventListener('mouseleave', handleMouseLeave);
    }
    if (lid) lid.removeEventListener('click', handleLidClick);
    if (floor) floor.removeEventListener('click', handleFloorClick);
    if (continueBtn) continueBtn.removeEventListener('click', handleContinue);
    
    // Reset and hide
    if (overlay) {
      overlay.classList.remove('active', 'opening', 'box-open', 'letter-open', 'unwrapping');
      overlay.style.display = 'none';
    }
    if (envelope) envelope.classList.remove('opened');
    if (lid) lid.classList.remove('opening', 'open', 'closing');
    if (qmark) qmark.textContent = '?';
    
    document.body.style.overflow = '';
    currentState = STATE.IDLE;
    wasOpen = false;
    
    console.log('[GIFT] Experience complete!');
  }
  
  // ===== RESET (for testing/preview) =====
  function resetGiftState() {
    cleanup();
    localStorage.removeItem(GIFT_SHOWN_KEY);
  }
  
  // ===== INITIALIZE =====
  function initGiftExperience() {
    // Cache DOM elements
    overlay = $('giftOverlay');
    if (!overlay) {
      console.error('[GIFT] Overlay not found!');
      return;
    }
    
    scene = overlay.querySelector('.gift-scene');
    floor = overlay.querySelector('.gift-floor');
    lid = overlay.querySelector('.gift-lid');
    qmark = overlay.querySelector('.gift-qmark');
    letter = overlay.querySelector('.gift-letter');
    envelope = overlay.querySelector('.envelope');
    continueBtn = overlay.querySelector('.letter-continue-btn');
    
    // Reset state
    currentState = STATE.IDLE;
    wasOpen = false;
    
    // Reset classes
    overlay.classList.remove('opening', 'box-open', 'letter-open', 'unwrapping');
    if (lid) lid.classList.remove('opening', 'open', 'closing');
    if (envelope) envelope.classList.remove('opened');
    if (qmark) qmark.textContent = '?';
    
    // Show overlay
    overlay.style.display = '';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    console.log('[GIFT] Experience started!');
    
    // Add event listeners
    if (scene) {
      scene.addEventListener('mousemove', handleMouseMove);
      scene.addEventListener('mouseleave', handleMouseLeave);
    }
    
    if (lid) {
      lid.addEventListener('click', handleLidClick);
    }
    
    if (floor) {
      floor.addEventListener('click', handleFloorClick);
    }
    
    if (continueBtn) {
      // Clone to remove old listeners
      const newBtn = continueBtn.cloneNode(true);
      continueBtn.parentNode.replaceChild(newBtn, continueBtn);
      continueBtn = newBtn;
      continueBtn.addEventListener('click', handleContinue);
    }
  }
  
  // ===== AUTO INIT =====
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndShow);
    } else {
      checkAndShow();
    }
  }
  
  function checkAndShow() {
    setTimeout(() => {
      if (shouldShowGift()) {
        initGiftExperience();
      }
    }, 800);
  }
  
  // ===== PUBLIC API =====
  window.showGiftExperience = function() {
    localStorage.removeItem(GIFT_SHOWN_KEY);
    initGiftExperience();
  };
  
  window.resetGiftExperience = function() {
    resetGiftState();
    console.log('[GIFT] Experience reset!');
  };
  
  window.shouldShowGift = shouldShowGift;
  
  // Auto-init
  init();
  
})();
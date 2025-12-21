/* ============================================
   GIFT EXPERIENCE v1.5.0
   Interactive gift unwrapping for Kylee
   - 3D scene tilt on mouse move
   - Box opening animation
   - Terminal typewriter effect
   ============================================ */

(function() {
  'use strict';
  
  const GIFT_SHOWN_KEY = "bucketlist_gift_shown_2025";
  
  // ===== UTILITY FUNCTIONS =====
  const clamp = (min, value, max) => Math.min(Math.max(min, value), max);
  
  const rangify = (value, percent) => {
    const numerator = percent >= 0.5 
      ? (percent - 0.5) 
      : (0.5 - percent) * -1;
    const adjustedPercent = numerator / 0.5;
    return value * adjustedPercent;
  };
  
  // ===== CHECK IF GIFT SHOULD SHOW =====
  function shouldShowGift() {
    const user = localStorage.getItem("bucketlist_2026_user");
    if (!user) return false;
    
    // Only show for Kylee
    if (user.toLowerCase() !== "kylee") return false;
    
    // Only show once
    if (localStorage.getItem(GIFT_SHOWN_KEY) === "true") return false;
    
    return true;
  }
  
  // ===== RESET GIFT (for testing) =====
  window.resetGiftExperience = function() {
    localStorage.removeItem(GIFT_SHOWN_KEY);
    console.log("[GIFT] Experience reset! Refresh as Kylee to see it.");
  };
  
  // ===== MAIN GIFT EXPERIENCE =====
  function initGiftExperience() {
    const overlay = document.getElementById("giftOverlay");
    if (!overlay) {
      console.error("[GIFT] Overlay not found!");
      return;
    }
    
    const scene = overlay.querySelector(".gift-scene");
    const floor = overlay.querySelector(".gift-floor");
    const lid = overlay.querySelector(".gift-lid");
    const qmark = overlay.querySelector(".gift-qmark");
    const terminal = overlay.querySelector(".gift-terminal");
    const continueBtn = document.getElementById("giftContinueBtn");
    
    // Show the overlay
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    
    console.log("[GIFT] Experience started!");
    
    // ===== 3D TILT EFFECT ON MOUSE MOVE =====
    if (scene) {
      scene.addEventListener("mousemove", (e) => {
        // Don't tilt when terminal is open
        if (overlay.classList.contains("terminal-open")) return;
        
        const rect = scene.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const xPercent = mouseX / rect.width;
        const yPercent = mouseY / rect.height;
        
        // Calculate tilt angles
        const xDeg = rangify(12, yPercent);
        const yDeg = rangify(-12, xPercent);
        
        scene.style.transform = `perspective(1200px) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
      });
      
      scene.addEventListener("mouseleave", () => {
        if (overlay.classList.contains("terminal-open")) return;
        scene.classList.add("tilt-transition");
        scene.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
        setTimeout(() => scene.classList.remove("tilt-transition"), 500);
      });
    }
    
    // ===== CLICK ON LID/BOX TO OPEN =====
    function openBox() {
      if (overlay.classList.contains("opening") || overlay.classList.contains("box-open")) return;
      
      console.log("[GIFT] Opening box...");
      overlay.classList.add("opening");
      
      // Change ? to !
      if (qmark) qmark.textContent = "!";
      
      // After lid floats up, show domo and then terminal
      setTimeout(() => {
        overlay.classList.remove("opening");
        overlay.classList.add("box-open");
        console.log("[GIFT] Box opened, showing domo...");
        
        // After a moment with domo, show terminal
        setTimeout(() => {
          console.log("[GIFT] Opening terminal...");
          overlay.classList.add("terminal-open");
          
          // Start typewriter effect
          setTimeout(() => typeMessage(), 300);
        }, 2000);
      }, 1000);
    }
    
    if (lid) {
      lid.addEventListener("click", openBox);
    }
    
    // Also allow clicking the whole floor area
    if (floor) {
      floor.addEventListener("click", (e) => {
        // Only if not clicking the lid directly
        if (!lid || !lid.contains(e.target)) {
          openBox();
        }
      });
    }
    
    // ===== CONTINUE BUTTON - UNWRAP AND REVEAL =====
    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        console.log("[GIFT] Unwrapping...");
        overlay.classList.remove("terminal-open");
        overlay.classList.add("unwrapping");
        
        // Mark as shown
        localStorage.setItem(GIFT_SHOWN_KEY, "true");
        
        // Remove overlay after animation
        setTimeout(() => {
          overlay.classList.remove("active", "unwrapping", "box-open");
          overlay.style.display = "none";
          document.body.style.overflow = "";
          console.log("[GIFT] Experience complete!");
        }, 1500);
      });
    }
  }
  
  // ===== TYPEWRITER EFFECT FOR TERMINAL =====
  function typeMessage() {
    const greeting = document.querySelector(".terminal-greeting");
    const messages = document.querySelectorAll(".terminal-message");
    const signature = document.querySelector(".terminal-signature");
    const btn = document.getElementById("giftContinueBtn");
    
    let delay = 0;
    
    // Show greeting first
    if (greeting) {
      setTimeout(() => {
        greeting.classList.add("visible");
      }, delay);
      delay += 500;
    }
    
    // Show each message line
    messages.forEach((msg, index) => {
      setTimeout(() => {
        msg.classList.add("visible");
      }, delay);
      delay += 600;
    });
    
    // Show signature
    if (signature) {
      setTimeout(() => {
        signature.classList.add("visible");
      }, delay);
      delay += 500;
    }
    
    // Show button
    if (btn) {
      setTimeout(() => {
        btn.classList.add("visible");
      }, delay);
    }
  }
  
  // ===== INITIALIZATION =====
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", checkAndShow);
    } else {
      checkAndShow();
    }
  }
  
  function checkAndShow() {
    // Small delay to let main app initialize
    setTimeout(() => {
      if (shouldShowGift()) {
        initGiftExperience();
      }
    }, 800);
  }
  
  // Expose for manual triggering and testing
  window.showGiftExperience = initGiftExperience;
  window.shouldShowGift = shouldShowGift;
  
  // Auto-init
  init();
  
})();
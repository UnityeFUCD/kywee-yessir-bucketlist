/* ============================================
   GIFT EXPERIENCE v1.5.2
   Interactive gift unwrapping for Kylee
   - 3D scene tilt on mouse move
   - Box opening animation
   - Terminal typewriter effect
   - Code dissipation effect
   - Canvas confetti storm
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
    if (user.toLowerCase() !== "kylee") return false;
    if (localStorage.getItem(GIFT_SHOWN_KEY) === "true") return false;
    return true;
  }
  
  // ===== RESET GIFT (for testing) =====
  window.resetGiftExperience = function() {
    localStorage.removeItem(GIFT_SHOWN_KEY);
    console.log("[GIFT] Experience reset!");
  };
  
  // ===== CODE RAIN EFFECT - Enhanced with realistic code =====
  function generateCodeBlock() {
    const snippets = [
      '// compiled preview • love.exe',
      '/* generated with heart */',
      'const LOVE = true;',
      'const FOREVER = Infinity;',
      'let happiness = 100;',
      'function hug() { return warmth; }',
      'class Heart extends Life {}',
      'export default joy;',
      'await nextAdventure();',
      'promise.resolve(us);',
      '// I love you <3',
      'hearts.push(yours);',
      'const us = you + me;',
      'while(together) { smile(); }',
      'import { love } from "heart";',
      'if (you) { heart++; }',
      'return happiness * Infinity;',
      'const smile = () => true;',
      'let forever = new Promise();',
      'function cherish(moment) {}',
      'const joy = feelings.max();',
      'loop { createMemories(); }',
      'state.happiness = MAX_INT;',
      'const warmth = hugs + kisses;',
    ];
    
    let code = '';
    for (let i = 0; i < 40; i++) {
      code += snippets[Math.floor(Math.random() * snippets.length)] + '\n';
    }
    return code;
  }
  
  function createCodeRain() {
    const codeRain = document.getElementById('codeRain');
    if (!codeRain) return;
    
    codeRain.innerHTML = '';
    const columns = 12;
    
    for (let i = 0; i < columns; i++) {
      const column = document.createElement('div');
      column.className = 'code-column';
      column.style.left = (i * 8.5) + '%';
      column.style.animationDelay = (Math.random() * 5) + 's';
      column.style.animationDuration = (Math.random() * 6 + 8) + 's';
      column.style.color = `rgba(${180 + Math.random() * 40}, ${200 + Math.random() * 55}, ${220 + Math.random() * 35}, ${0.3 + Math.random() * 0.4})`;
      column.textContent = generateCodeBlock();
      codeRain.appendChild(column);
    }
    
    codeRain.classList.add('active');
  }
  
  // ===== RESET GIFT STATE (for preview button) =====
  function resetGiftState() {
    const overlay = document.getElementById("giftOverlay");
    if (!overlay) return;
    
    // Remove all state classes
    overlay.classList.remove("active", "opening", "box-open", "terminal-open", "unwrapping");
    overlay.style.display = "";
    
    // Reset question mark
    const qmark = overlay.querySelector(".gift-qmark");
    if (qmark) qmark.textContent = "?";
    
    // Reset terminal content
    const terminalContent = document.getElementById("terminalContent");
    if (terminalContent) {
      terminalContent.classList.remove("dissipating");
      const elements = terminalContent.querySelectorAll(".visible");
      elements.forEach(el => el.classList.remove("visible"));
    }
    
    // Reset code rain
    const codeRain = document.getElementById("codeRain");
    if (codeRain) {
      codeRain.classList.remove("active");
      codeRain.innerHTML = "";
    }
    
    // Reset button
    const btn = document.getElementById("giftContinueBtn");
    if (btn) btn.classList.remove("visible");
  }
  
  // ===== MAIN GIFT EXPERIENCE =====
  function initGiftExperience() {
    const overlay = document.getElementById("giftOverlay");
    if (!overlay) {
      console.error("[GIFT] Overlay not found!");
      return;
    }
    
    // Reset state first (important for Preview button)
    resetGiftState();
    
    const scene = overlay.querySelector(".gift-scene");
    const floor = overlay.querySelector(".gift-floor");
    const lid = overlay.querySelector(".gift-lid");
    const qmark = overlay.querySelector(".gift-qmark");
    const terminal = overlay.querySelector(".gift-terminal");
    const terminalContent = document.getElementById("terminalContent");
    const continueBtn = document.getElementById("giftContinueBtn");
    
    // Show the overlay
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    
    console.log("[GIFT] Experience started!");
    
    // ===== 3D TILT EFFECT ON MOUSE MOVE =====
    function handleMouseMove(e) {
      if (overlay.classList.contains("terminal-open")) return;
      
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
      if (overlay.classList.contains("terminal-open")) return;
      scene.classList.add("tilt-transition");
      scene.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
      setTimeout(() => scene.classList.remove("tilt-transition"), 500);
    }
    
    if (scene) {
      scene.addEventListener("mousemove", handleMouseMove);
      scene.addEventListener("mouseleave", handleMouseLeave);
    }
    
    // ===== CLICK ON LID/BOX TO OPEN =====
    function openBox() {
      if (overlay.classList.contains("opening") || overlay.classList.contains("box-open")) return;
      
      console.log("[GIFT] Opening box...");
      overlay.classList.add("opening");
      
      if (qmark) qmark.textContent = "!";
      
      setTimeout(() => {
        overlay.classList.remove("opening");
        overlay.classList.add("box-open");
        console.log("[GIFT] Box opened, showing heart...");
        
        setTimeout(() => {
          console.log("[GIFT] Opening terminal...");
          overlay.classList.add("terminal-open");
          setTimeout(() => typeMessage(), 300);
        }, 2000);
      }, 1000);
    }
    
    function handleLidClick(e) {
      e.stopPropagation();
      openBox();
    }
    
    function handleFloorClick(e) {
      if (!lid || !lid.contains(e.target)) {
        openBox();
      }
    }
    
    if (lid) {
      lid.addEventListener("click", handleLidClick);
    }
    
    if (floor) {
      floor.addEventListener("click", handleFloorClick);
    }
    
    // ===== CONTINUE BUTTON - CONFETTI + DISSIPATION + UNWRAP =====
    function handleContinue() {
      console.log("[GIFT] Opening gift with confetti storm...");
      
      // 1. Trigger confetti storm
      if (window.ConfettiStorm) {
        window.ConfettiStorm.start(7000);
      }
      
      // 2. Start code dissipation effect
      if (terminalContent) {
        terminalContent.classList.add('dissipating');
      }
      
      // 3. Show code rain after text dissipates
      setTimeout(() => {
        createCodeRain();
      }, 800);
      
      // 4. Start unwrap after effects
      setTimeout(() => {
        overlay.classList.remove("terminal-open");
        overlay.classList.add("unwrapping");
        
        // Mark as shown
        localStorage.setItem(GIFT_SHOWN_KEY, "true");
        
        // Remove overlay after animation
        setTimeout(() => {
          // Clean up event listeners
          if (scene) {
            scene.removeEventListener("mousemove", handleMouseMove);
            scene.removeEventListener("mouseleave", handleMouseLeave);
          }
          if (lid) lid.removeEventListener("click", handleLidClick);
          if (floor) floor.removeEventListener("click", handleFloorClick);
          if (continueBtn) continueBtn.removeEventListener("click", handleContinue);
          
          overlay.classList.remove("active", "unwrapping", "box-open");
          overlay.style.display = "none";
          document.body.style.overflow = "";
          console.log("[GIFT] Experience complete!");
        }, 1800);
      }, 2500);
    }
    
    if (continueBtn) {
      // Remove any existing listeners first
      continueBtn.replaceWith(continueBtn.cloneNode(true));
      const newBtn = document.getElementById("giftContinueBtn");
      if (newBtn) {
        newBtn.addEventListener("click", handleContinue);
      }
    }
  }
  
  // ===== TYPEWRITER EFFECT FOR TERMINAL =====
  function typeMessage() {
    const greeting = document.querySelector(".terminal-greeting");
    const messages = document.querySelectorAll(".terminal-message");
    const signature = document.querySelector(".terminal-signature");
    const btn = document.getElementById("giftContinueBtn");
    
    let delay = 0;
    
    if (greeting) {
      setTimeout(() => {
        greeting.classList.add("visible");
      }, delay);
      delay += 500;
    }
    
    messages.forEach((msg, index) => {
      setTimeout(() => {
        msg.classList.add("visible");
      }, delay);
      delay += 600;
    });
    
    if (signature) {
      setTimeout(() => {
        signature.classList.add("visible");
      }, delay);
      delay += 500;
    }
    
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
    setTimeout(() => {
      if (shouldShowGift()) {
        initGiftExperience();
      }
    }, 800);
  }
  
  // Expose for manual triggering (Preview button)
  window.showGiftExperience = function() {
    // Clear the flag so it can show
    localStorage.removeItem(GIFT_SHOWN_KEY);
    initGiftExperience();
  };
  window.shouldShowGift = shouldShowGift;
  
  // Auto-init
  init();
  
})();
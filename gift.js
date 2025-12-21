/* ============================================
   GIFT EXPERIENCE v1.5.1
   Interactive gift unwrapping for Kylee
   - 3D scene tilt on mouse move
   - Box opening animation
   - Terminal typewriter effect
   - Code dissipation effect
   - Christmas confetti
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
  
  // ===== CHRISTMAS CONFETTI =====
  function createConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    
    const colors = ['red', 'green', 'gold', 'white', 'silver'];
    const shapes = ['circle', 'square', 'star'];
    const confettiCount = 150;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      confetti.className = `confetti ${color} ${shape}`;
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
      confetti.style.animationDelay = Math.random() * 1.5 + 's';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      // Vary sizes
      const size = Math.random() * 10 + 6;
      confetti.style.width = size + 'px';
      confetti.style.height = size + 'px';
      
      container.appendChild(confetti);
    }
    
    // Remove after animation
    setTimeout(() => {
      container.remove();
    }, 6000);
  }
  
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
    const terminalContent = document.getElementById("terminalContent");
    const continueBtn = document.getElementById("giftContinueBtn");
    
    // Show the overlay
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    
    console.log("[GIFT] Experience started!");
    
    // ===== 3D TILT EFFECT ON MOUSE MOVE =====
    if (scene) {
      scene.addEventListener("mousemove", (e) => {
        if (overlay.classList.contains("terminal-open")) return;
        
        const rect = scene.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const xPercent = mouseX / rect.width;
        const yPercent = mouseY / rect.height;
        
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
    
    if (lid) {
      lid.addEventListener("click", openBox);
    }
    
    if (floor) {
      floor.addEventListener("click", (e) => {
        if (!lid || !lid.contains(e.target)) {
          openBox();
        }
      });
    }
    
    // ===== CONTINUE BUTTON - CONFETTI + DISSIPATION + UNWRAP =====
    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        console.log("[GIFT] Opening gift with confetti...");
        
        // 1. Trigger confetti
        createConfetti();
        
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
            overlay.classList.remove("active", "unwrapping", "box-open");
            overlay.style.display = "none";
            document.body.style.overflow = "";
            console.log("[GIFT] Experience complete!");
          }, 1800);
        }, 2500);
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
  
  // Expose for manual triggering
  window.showGiftExperience = initGiftExperience;
  window.shouldShowGift = shouldShowGift;
  
  // Auto-init
  init();
  
})();
const btnEn = document.querySelector(".english");
const btnHi = document.querySelector(".hindi");
const btnGu = document.querySelector(".gujrati");

const DEFAULT_LANG = "English";

// translations come from assets/js/data.js, which must be loaded first
let translations = typeof data !== "undefined" ? data : {};

// set active button
function setActiveButton(activeBtn) {
  [btnEn, btnHi, btnGu].forEach((btn) => btn.classList.remove("active"));
  activeBtn.classList.add("active");
}

// apply language
function applyLanguage(lang) {
  const langData = translations[lang];
  if (!langData) return;

  document.documentElement.lang = lang;

  if (lang === "English") {
    document.body.setAttribute("data-lang", "en");
    setActiveButton(btnEn);
  } else if (lang === "Hindi") {
    document.body.setAttribute("data-lang", "hi");
    setActiveButton(btnHi);
  } else if (lang === "Gujarati") {
    document.body.setAttribute("data-lang", "gu");
    setActiveButton(btnGu);
  }

  document.querySelectorAll("[data-lang-key]").forEach((el) => {
    const key = el.getAttribute("data-lang-key");
    if (langData[key] !== undefined) {
      let text = String(langData[key]);

      // data-first-only: show just the first of several "a / b / c" names
      if (el.hasAttribute("data-first-only")) {
        text = text.split("/")[0].trim();
      }

      el.innerHTML = text.replace(/\n/g, "<br>");
    }
  });

  document.dispatchEvent(new CustomEvent("languageApplied"));
}

// always load English on refresh/page load
window.addEventListener("DOMContentLoaded", () => {
  if (!Object.keys(translations).length) {
    console.error(
      "Translations not loaded: include assets/js/data.js before this script",
    );
  }
  applyLanguage(DEFAULT_LANG); // always reset to English
});

// button clicks
btnEn.addEventListener("click", () => {
  playLangSound("English");
  applyLanguage("English");
});
btnHi.addEventListener("click", () => {
  playLangSound("Hindi");
  applyLanguage("Hindi");
});
btnGu.addEventListener("click", () => {
  playLangSound("Gujarati");
  applyLanguage("Gujarati");
});

/* ==================================================
   AUDIO
   Shared across every page (this file is loaded everywhere), delegated so it
   still works for elements added dynamically after this script runs.
=================================================== */

const AUDIO_PATH = "./assets/audio/";
const MAX_NAV_WAIT = 600;

const LANG_SFX = {
  English: new Audio(`${AUDIO_PATH}Eng.mpeg`),
  Hindi: new Audio(`${AUDIO_PATH}Hin.mpeg`),
  Gujarati: new Audio(`${AUDIO_PATH}Guj.mpeg`),
};

const clickAudio = new Audio(`${AUDIO_PATH}click.mp3`);
const topicAudio = new Audio(`${AUDIO_PATH}topic.mp3`);
const swiperAudio = new Audio(`${AUDIO_PATH}swiper.mp3`);

function playLangSound(lang) {
  const audio = LANG_SFX[lang];
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playSwiperSound() {
  swiperAudio.currentTime = 0;
  swiperAudio.play().catch(() => {});
}

function playTopicSound() {
  topicAudio.currentTime = 0;
  topicAudio.play().catch(() => {});
}

// play a sound, then leave the page once it finishes (or the wait cap is hit)
function playThenNavigate(audio, url) {
  let navigated = false;

  const go = () => {
    if (navigated) return;
    navigated = true;
    window.location.href = url;
  };

  audio.currentTime = 0;
  audio.addEventListener("ended", go, { once: true });

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(go);
  }

  setTimeout(go, MAX_NAV_WAIT);
}

// Capture phase, not delegated on document: tithi.html's own viewer-prev/
// viewer-next handlers call e.stopPropagation(), which would stop a
// document-level bubble-phase listener from ever seeing the click. Capture
// runs on the way DOWN to the target, before that stopPropagation happens.
document.addEventListener(
  "click",
  (e) => {
    const navBtn = e.target.closest(
      ".viewer-prev, .viewer-next, .month-swiper-prev, .month-swiper-next",
    );
    if (navBtn) playSwiperSound();
  },
  true,
);

document.addEventListener("click", (e) => {
  const homeOrBack = e.target.closest(".home-button, .home-btn-1, .back-btn");
  if (homeOrBack && homeOrBack.tagName === "A") {
    const href = homeOrBack.getAttribute("href");
    if (href && href !== "#") {
      e.preventDefault();
      playThenNavigate(clickAudio, href);
    }
    return;
  }

  // subpoint-style links: tithi.html's 16 topic rows (no href — just open an
  // in-page viewer, so only the sound plays) and index.html's Tithi/Months
  // choice cards (real hrefs, so sound-then-navigate applies)
  const topicLink = e.target.closest("a.row, .tithi-img, .month-img");
  if (topicLink) {
    const href = topicLink.getAttribute("href");
    if (href && href !== "#") {
      e.preventDefault();
      playThenNavigate(topicAudio, href);
    } else {
      playTopicSound();
    }
  }
});

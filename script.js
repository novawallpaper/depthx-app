/* =========================================================
   depthnova — app logic
   NOTE: replace GOOGLE_CLIENT_ID and RAZORPAY_KEY_ID with your
   own keys before going live (see comments below).
   ========================================================= */

const GOOGLE_CLIENT_ID = "452456583028-1l86bibq60ggkl3o1h5j88sed7v04eof.apps.googleusercontent.com";
const RAZORPAY_KEY_ID = "rzp_live_TCZM7OsD80tNpH"; // <-- put your real live key here

/* ---------------- EmailJS config (welcome mail on sign-in) --------- */
const EMAILJS_SERVICE_ID = "service_k4uj8nw";
const EMAILJS_TEMPLATE_ID = "template_qsicw1k";
const EMAILJS_PUBLIC_KEY = "LPclgEk_ra9199b8m";

/* ---------------- Support contact info --------- */
const SUPPORT_EMAIL = "dethnovacustomersupport@gmail.com";
const TELEGRAM_URL = "https://t.me/depthnova";

/* ---------------- Free-tier ad unlock limit --------- */
const FREE_AD_UNLOCKS_PER_DAY = 1;

/* ---------------- In-memory state ---------------
   NOTE: this demo keeps everything in memory so it is safe to preview
   live. When you deploy this for real users, swap the small block
   marked "PERSISTENCE" below for localStorage or your backend so
   favorites / ad-unlock count / premium status survive a reload.
---------------------------------------------------- */
const state = {
  activeTab: "explore",
  activeCategory: "All",
  activeFilter: "grid",
  catDetailCategory: null,
  catDetailFilter: "all",
  searchQuery: "",
  favorites: new Set(),
  isSignedIn: false,
  user: null,
  currentWallpaper: null,
  isPremium: false,
  selectedPlan: "lifetime",
  use24Hour: false,
  unlockedIds: new Set(), // wallpaper ids unlocked via ad today
  adUnlocksUsedToday: 0,
  lastAdDate: null,
  hourlyUsed: 0,
  dailyUsed: 0,
  orderImage: null, // { dataUrl, file }
};

/* PERSISTENCE: reset the daily ad counter if the date has rolled over */
function todayKey() {
  return new Date().toDateString();
}
function ensureAdCounterFresh() {
  const today = todayKey();
  if (state.lastAdDate !== today) {
    state.lastAdDate = today;
    state.adUnlocksUsedToday = 0;
    state.unlockedIds = new Set();
  }
}

/* ---------------- Category collections ---------------- */
const COLLECTIONS = [
  { key: "Space", title: "Aero Space", img: "https://novawallpaper.github.io/depthx-app/pexels-koyeldey-31179659.jpg" },
  { key: "Cyber", title: "Cyber", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-29986988.jpg" },
  { key: "Nature", title: "Nature", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30018099.jpg" },
  { key: "Gaming", title: "Gaming", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30843199.jpg" },
  { key: "Anime", title: "Anime Vibes", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30936352.jpg" },
  {key: "Heros", titel: "Heros ", img: "https:novawallpaper.github.io/depthx-app/pexels-steve-30936352.jpg" },
];

/* ---------------- Sample wallpaper data ---------------- */
const WALLPAPERS = [
  { id: "w1", title: "Wallpaper 1", time: "02:30", category: "Space", premium: true, tag: "fire", img: "https://novawallpaper.github.io/depthx-app/pexels-koyeldey-31179659.jpg" },
  { id: "w2", title: "Wallpaper 2", time: "09:15", category: "Space", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-29986988.jpg" },
  { id: "w3", title: "Wallpaper 3", time: "23:47", category: "Cyber", premium: true, tag: "fire", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30018099.jpg" },
  { id: "w4", title: "Wallpaper 4", time: "18:05", category: "Cyber", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30843199.jpg" },
  { id: "w5", title: "Wallpaper 5", time: "06:20", category: "Nature", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30936352.jpg" },
  { id: "w6", title: "Wallpaper 6", time: "17:40", category: "Nature", premium: true, tag: "diamond", img: "https://novawallpaper.github.io/depthx-app/pexels-koyeldey-31179659.jpg" },

  { id: "w11", title: "Login Frame 01", time: "03:10", category: "Abstract", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-29986988.jpg" },
  { id: "w12", title: "Login Frame 02", time: "11:25", category: "Abstract", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30018099.jpg" },
  { id: "w13", title: "Login Frame 03", time: "15:40", category: "Abstract", premium: true, tag: "diamond", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30843199.jpg" },
  { id: "w14", title: "Login Frame 04", time: "19:55", category: "Nature", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30936352.jpg" },
  { id: "w15", title: "Login Frame 05", time: "08:15", category: "Nature", premium: true, tag: "fire", img: "https://novawallpaper.github.io/depthx-app/pexels-koyeldey-31179659.jpg" },
  { id: "w16", title: "Login Frame 06", time: "22:30", category: "Dark", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-29986988.jpg" },
  { id: "w17", title: "Login Frame 07", time: "05:45", category: "Nature", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30018099.jpg" },
  { id: "w18", title: "Login Frame 08", time: "13:20", category: "Minimal", premium: true, tag: "diamond", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30843199.jpg" },
  { id: "w19", title: "Login Frame 09", time: "20:05", category: "Dark", premium: false, tag: "fire", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30936352.jpg" },
  { id: "w20", title: "Login Frame 10", time: "16:50", category: "Nature", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/pexels-koyeldey-31179659.jpg" },
  { id: "w21", title: "Login Frame 11", time: "10:35", category: "Abstract", premium: true, tag: "diamond", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-29986988.jpg" },
  { id: "w22", title: "Login Frame 12", time: "04:00", category: "Nature", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30018099.jpg" },

  { id: "w23", title: "Wallpaper 23", time: "08:12", category: "Minimal", premium: true, tag: "diamond", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30843199.jpg" },
  { id: "w24", title: "Wallpaper 24", time: "08:12", category: "Minimal", premium: true, tag: "diamond", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-30936352.jpg" },
  { id: "w25", title: "Wallpaper 25", time: "08:12", category: "Minimal", premium: true, tag: "diamond", img: "https://novawallpaper.github.io/depthx-app/pexels-koyeldey-31179659.jpg" },
  { id: "w26", title: "Wallpaper 26", time: "08:12", category: "Minimal", premium: true, tag: "diamond", img: "https://novawallpaper.github.io/depthx-app/pexels-steve-29986988.jpg" }
];

const SAMPLES = WALLPAPERS.slice(0, 4);

/* =========================================================
   Init
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  ensureAdCounterFresh();
  initEmailJS();
  waitForGoogleThenInit();
  renderCollections();
  renderWallpapers();
  renderSamples();
  wireSearch();
  wireModalClose();
  updateAdUnlockLabel();
  updateRateLimitsUI();
});

/* =========================================================
   Tabs / navigation
   ========================================================= */
function switchTab(tab, el) {
  state.activeTab = tab;

  document.querySelectorAll(".screen-content").forEach((s) => s.classList.remove("active"));
  document.getElementById(`screen-${tab}`).classList.add("active");

  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  if (el) el.classList.add("active");
}

/* ----- Collections (Categories tab) ----- */
function renderCollections() {
  const el = document.getElementById("collection-carousel");
  el.innerHTML = COLLECTIONS.map((c) => {
    const count = WALLPAPERS.filter((w) => w.category === c.key).length;
    return `
      <div class="carousel-card" style="background-image:url('${c.img}')" onclick="openCategory('${c.key}')">
        <div class="carousel-info">
          <h2>${c.title}</h2>
          <p>${count} wallpaper${count === 1 ? "" : "s"}</p>
          <button class="explore-pill-btn" onclick="event.stopPropagation(); openCategory('${c.key}')">Explore</button>
        </div>
      </div>
    `;
  }).join("");
}

/* ----- Category detail screen (image 2 style) ----- */
function openCategory(category) {
  state.catDetailCategory = category;
  state.catDetailFilter = "all";
  document.getElementById("cat-detail-title").textContent =
    COLLECTIONS.find((c) => c.key === category)?.title || category;

  document.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("active"));
  document.querySelector('.cat-tab[data-cat-filter="all"]').classList.add("active");

  switchTab("category-detail", null);
  renderCategoryDetailGrid();
}

function switchCatTab(el) {
  document.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
  state.catDetailFilter = el.dataset.catFilter;
  renderCategoryDetailGrid();
}

function renderCategoryDetailGrid() {
  let list = WALLPAPERS.filter((w) => w.category === state.catDetailCategory);
  if (state.catDetailFilter === "premium") list = list.filter((w) => w.premium);
  if (state.catDetailFilter === "free") list = list.filter((w) => !w.premium);

  const container = document.getElementById("cat-detail-grid");
  if (list.length === 0) {
    container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:30px 0;">No wallpapers found.</p>`;
    return;
  }
  container.innerHTML = list.map(cardHtml).join("");
}

function switchSubCat(el) {
  document.querySelectorAll(".sub-cat-item").forEach((s) => s.classList.remove("active"));
  el.classList.add("active");
  state.activeFilter = el.dataset.filter;
  renderWallpapers();
}

function filterByFavoritesQuick() {
  state.activeFilter = "star";
  document.querySelectorAll(".sub-cat-item").forEach((s) => s.classList.remove("active"));
  document.querySelector('.sub-cat-item[data-filter="star"]').classList.add("active");
  renderWallpapers();
}

/* =========================================================
   Search
   ========================================================= */
function wireSearch() {
  const input = document.getElementById("search-input");
  input.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    renderWallpapers();
  });
}

/* =========================================================
   Rendering (Explore tab)
   ========================================================= */
function getFilteredWallpapers() {
  let list = WALLPAPERS.slice();

  if (state.activeCategory !== "All") {
    list = list.filter((w) => w.category === state.activeCategory);
  }

  if (state.searchQuery) {
    list = list.filter((w) => w.title.toLowerCase().includes(state.searchQuery));
  }

  switch (state.activeFilter) {
    case "gift":
      list = list.filter((w) => !w.premium);
      break;
    case "diamond":
      list = list.filter((w) => w.premium);
      break;
    case "star":
      list = list.filter((w) => state.favorites.has(w.id));
      break;
    case "fire":
      list = list.filter((w) => w.tag === "fire");
      break;
    case "shuffle":
      list = list.sort(() => Math.random() - 0.5);
      break;
    default:
      break;
  }

  return list;
}

function renderWallpapers() {
  const container = document.getElementById("wallpaper-grid-container");
  const list = getFilteredWallpapers();

  if (list.length === 0) {
    container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:30px 0;">No wallpapers found.</p>`;
    return;
  }

  container.innerHTML = list.map(cardHtml).join("");
}

function renderSamples() {
  document.getElementById("samples-grid").innerHTML = SAMPLES.map(cardHtml).join("");
}

function cardHtml(w) {
  const favClass = state.favorites.has(w.id) ? "favorited" : "";
  return `
    <div class="wallpaper-card" style="background-image:url('${w.img}')" onclick="openWallpaper('${w.id}')">
      <div class="card-top">
        <div class="star-badge ${favClass}" onclick="toggleFavorite(event, '${w.id}')">
          <i class="fa-solid fa-heart"></i>
        </div>
        ${w.premium ? `<div class="premium-badge">PRO</div>` : `<div class="free-badge">FREE</div>`}
      </div>
      <div class="card-bottom">
        <div class="card-time">${w.category}</div>
        <div class="card-title">${w.title}</div>
      </div>
    </div>
  `;
}

function toggleFavorite(event, id) {
  event.stopPropagation();
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  renderWallpapers();
  renderSamples();
  renderCategoryDetailGrid();
}

function toggleFavoriteModal() {
  if (!state.currentWallpaper) return;
  const id = state.currentWallpaper.id;
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  document.getElementById("modal-fav-btn").classList.toggle("favorited", state.favorites.has(id));
  renderWallpapers();
  renderSamples();
  renderCategoryDetailGrid();
}

/* =========================================================
   Wallpaper preview modal
   ========================================================= */
function openWallpaper(id) {
  const wp = WALLPAPERS.find((w) => w.id === id) || SAMPLES.find((w) => w.id === id);
  if (!wp) return;

  state.currentWallpaper = wp;

  ensureAdCounterFresh();
  const isUnlocked = !wp.premium || state.isPremium || state.unlockedIds.has(wp.id);

  // Premium wallpaper that isn't unlocked yet -> straight to the unlock choice sheet.
  if (!isUnlocked) {
    openUnlockSheet(wp);
    return;
  }

  // Free (or already-unlocked) wallpaper -> open the editor screen.
  openEditorScreen(wp);
}

function closeWallpaperModal() {
  document.getElementById("wallpaper-modal").classList.remove("active");
}

function wireModalClose() {
  const modal = document.getElementById("wallpaper-modal");
  modal.addEventListener("click", (e) => {
    const rect = modal.getBoundingClientRect();
    const clickedCloseZone = e.clientX < rect.left + 56 && e.clientY < rect.top + 56;
    if (clickedCloseZone) closeWallpaperModal();
  });

  document.getElementById("modal-download-action").addEventListener("click", () => {
    requestDownload(state.currentWallpaper);
  });

  document.getElementById("modal-set-action").addEventListener("click", () => {
    requestSetWallpaper(state.currentWallpaper);
  });
}

/* =========================================================
   Set Wallpaper
   NOTE: a website in a plain mobile browser has no permission to set
   the device's system wallpaper directly — that's an OS-level action
   only a native app can perform. This function:
     1) If this page is running inside a native Android/iOS wrapper
        that exposes a bridge (see below), it calls that bridge.
     2) Otherwise it downloads the image and tells the user to finish
        the last step themselves (their gallery app's own
        "Set as wallpaper" option), which is the only thing a browser
        can legally do.

   TO WIRE UP A REAL NATIVE "SET WALLPAPER":
   If/when you wrap this site in a native WebView (Capacitor, Cordova,
   or a plain Android WebView with a JavascriptInterface), expose a
   bridge object called `NativeBridge` with a `setWallpaper(imageUrl)`
   method on the native side, backed by Android's WallpaperManager
   (or the iOS equivalent). This code will automatically use it the
   moment it exists — no other JS changes needed.
   ========================================================= */
function requestSetWallpaper(wp) {
  if (!wp) return;

  const isUnlocked = !wp.premium || state.isPremium || state.unlockedIds.has(wp.id);
  if (!isUnlocked) {
    closeWallpaperModal();
    openUnlockSheet(wp);
    return;
  }

  // 1) Native bridge path (only exists once wrapped in a native app)
  if (window.NativeBridge && typeof window.NativeBridge.setWallpaper === "function") {
    try {
      window.NativeBridge.setWallpaper(wp.img);
      showToast(`"${wp.title}" set as wallpaper`);
      closeWallpaperModal();
      return;
    } catch (err) {
      logDebug("Native setWallpaper failed: " + err.message);
    }
  }

  // 2) Plain browser fallback — download it, then guide the user
  showToast("Browsers can't set wallpaper directly — downloading image…");
  performDownload(wp);
  setTimeout(() => {
    showToast("Open it from your gallery, then tap 'Set as wallpaper'");
  }, 2400);
  closeWallpaperModal();
}

/* =========================================================
   Download / unlock flow
   ========================================================= */

// Entry point every "Download" tap goes through.
function requestDownload(wp) {
  if (!wp) return;

  ensureAdCounterFresh();

  const isUnlocked = !wp.premium || state.isPremium || state.unlockedIds.has(wp.id);

  if (isUnlocked) {
    performDownload(wp);
    return;
  }

  // Premium wallpaper, not unlocked yet -> show the unlock choice sheet.
  openUnlockSheet(wp);
}

function openUnlockSheet(wp) {
  state.currentWallpaper = wp;
  updateAdUnlockLabel();
  document.getElementById("unlock-sheet-overlay").classList.add("active");
}

function closeUnlockSheet() {
  document.getElementById("unlock-sheet-overlay").classList.remove("active");
}

function updateAdUnlockLabel() {
  ensureAdCounterFresh();
  const remaining = Math.max(0, FREE_AD_UNLOCKS_PER_DAY - state.adUnlocksUsedToday);
  const desc = document.getElementById("unlock-ad-desc");
  const btn = document.getElementById("unlock-ad-btn");
  if (desc) desc.textContent = `Free — used ${state.adUnlocksUsedToday} / ${FREE_AD_UNLOCKS_PER_DAY} today`;
  if (btn) btn.disabled = remaining <= 0;
}

function chooseUnlockPremium() {
  closeUnlockSheet();
  openPremiumScreen();
}

function chooseUnlockAd() {
  ensureAdCounterFresh();
  if (state.adUnlocksUsedToday >= FREE_AD_UNLOCKS_PER_DAY) {
    showToast("You've used today's free unlock. Come back tomorrow or go Premium.");
    return;
  }
  closeUnlockSheet();
  playRewardedAd(() => {
    if (!state.currentWallpaper) return;
    state.unlockedIds.add(state.currentWallpaper.id);
    state.adUnlocksUsedToday += 1;
    showToast("Unlocked! Starting download…");
    performDownload(state.currentWallpaper);
  });
}

// Simulated rewarded-ad experience.
// TODO(production): replace this timer with a real rewarded-ad SDK call
// (e.g. Google AdMob via a native wrapper, or a web rewarded-ads network),
// and only invoke onReward() from that SDK's real "reward earned" callback.
function playRewardedAd(onReward) {
  const overlay = document.getElementById("ad-overlay");
  const timerEl = document.getElementById("ad-overlay-timer");
  let secondsLeft = 5;
  timerEl.textContent = secondsLeft;
  overlay.classList.add("active");

  const iv = setInterval(() => {
    secondsLeft -= 1;
    timerEl.textContent = Math.max(secondsLeft, 0);
    if (secondsLeft <= 0) {
      clearInterval(iv);
      overlay.classList.remove("active");
      onReward();
    }
  }, 1000);
}

// Actually download the wallpaper file to the device.
function performDownload(wp) {
  if (!wp) return;
  const filename = `${wp.title.replace(/\s+/g, "_")}.jpg`;

  showToast("Downloading…");

  fetch(wp.img, { mode: "cors" })
    .then((res) => {
      if (!res.ok) throw new Error("bad response");
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast("Download complete");
    })
    .catch(() => {
      // Cross-origin images without CORS headers can't be fetched as a
      // blob from the browser — fall back to opening the image directly
      // so the user can long-press / use their browser's save option.
      const a = document.createElement("a");
      a.href = wp.img;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("Opened image — save it from your browser");
    });
}

/* =========================================================
   Toast
   ========================================================= */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("app-toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* =========================================================
   Premium / Subscription screen
   ========================================================= */
function openPremiumScreen() {
  closeUnlockSheet();
  switchTab("premium", null);
}
function closePremiumScreen() {
  switchTab(state.activeTab === "premium" ? "settings" : state.activeTab, document.getElementById(`nav-${state.activeTab}`) || document.getElementById("nav-settings"));
}

function selectPlan(el) {
  document.querySelectorAll(".plan-option").forEach((p) => p.classList.remove("selected"));
  el.classList.add("selected");
  state.selectedPlan = el.dataset.plan;
}

function startPremiumUpgrade() {
  const selectedEl = document.querySelector(".plan-option.selected");
  const amount = parseInt(selectedEl?.dataset.amount || "14900", 10);
  const planName = selectedEl?.querySelector(".plan-option-text h4")?.textContent || "Premium";

  openRazorpay({
    amount,
    name: `depthnova — ${planName}`,
    description: "Unlock premium wallpapers, full editing & all collections",
    onSuccess: () => {
      state.isPremium = true;
      state.unlockedIds = new Set(WALLPAPERS.map((w) => w.id));
      document.getElementById("tier-label").textContent = "Premium";
      updateRateLimitsUI();
      showToast("You're now Premium! 🎉");
      switchTab("settings", document.getElementById("nav-settings"));
    },
  });
}

/* =========================================================
   Order Wallpaper screen
   ========================================================= */
function openOrderScreen() {
  switchTab("order", null);
}

function triggerImageUpload() {
  document.getElementById("order-file-input").click();
}

function handleOrderImageSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    showToast("Image is larger than 10MB");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    state.orderImage = { dataUrl: e.target.result, file };
    const box = document.getElementById("order-upload-box");
    box.classList.add("has-image");
    box.innerHTML = `
      <img src="${e.target.result}" alt="Selected wallpaper image" />
      <div class="order-upload-remove" onclick="event.stopPropagation(); clearOrderImage()">Remove image</div>
    `;
    document.getElementById("order-pay-btn").classList.add("ready");
  };
  reader.readAsDataURL(file);
}

function clearOrderImage() {
  state.orderImage = null;
  document.getElementById("order-file-input").value = "";
  const box = document.getElementById("order-upload-box");
  box.classList.remove("has-image");
  box.innerHTML = `
    <div class="order-upload-icon"><i class="fa-solid fa-image"></i></div>
    <h4>Tap to select image</h4>
    <p>JPG, PNG, WebP • Max 10MB</p>
  `;
  document.getElementById("order-pay-btn").classList.remove("ready");
}

function submitOrderPayment() {
  if (!state.orderImage) {
    showToast("Please select an image first");
    return;
  }

  openRazorpay({
    amount: 3500, // ₹35.00 in paise
    name: "depthnova — Custom Depth Wallpaper",
    description: "AI generated depth wallpaper",
    onSuccess: () => {
      // TODO(production): upload state.orderImage.file + the message
      // text to your backend/storage here, alongside the Razorpay
      // payment id from the handler response, so your team can review
      // and craft the order.
      showToast("Order placed! We'll notify you when it's ready.");
      clearOrderImage();
      document.getElementById("order-message").value = "";
      switchTab("request", document.getElementById("nav-request"));
    },
  });
}

/* =========================================================
   Settings — preferences & wallpaper toggles
   ========================================================= */
function toggleSetting(row, key) {
  const toggle = document.getElementById(`toggle-${key}`);
  const isOn = toggle.classList.toggle("on");

  if (key === "clock24") {
    state.use24Hour = isOn;
    document.getElementById("clock-format-desc").textContent = isOn
      ? "24-hour format (14:30)"
      : "12-hour format (2:30 PM)";
  }
}

function updateRateLimitsUI() {
  const hourlyMax = state.isPremium ? 200 : 30;
  const dailyMax = state.isPremium ? 1000 : 100;
  document.getElementById("hourly-label").textContent = `${state.hourlyUsed} / ${hourlyMax} used`;
  document.getElementById("daily-label").textContent = `${state.dailyUsed} / ${dailyMax} used`;
  document.getElementById("hourly-bar").style.width = `${Math.min(100, (state.hourlyUsed / hourlyMax) * 100)}%`;
  document.getElementById("daily-bar").style.width = `${Math.min(100, (state.dailyUsed / dailyMax) * 100)}%`;
}

/* =========================================================
   Support — email & telegram
   ========================================================= */
function contactSupportEmail() {
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("depthnova support")}`;
}

function contactSupportTelegram() {
  window.open(TELEGRAM_URL, "_blank", "noopener");
}

/* =========================================================
   Google Sign-In
   ========================================================= */
function waitForGoogleThenInit() {
  const statusEl = document.getElementById("signin-status");
  const fallbackBtn = document.getElementById("google-fallback-btn");
  let attempts = 0;

  const poll = setInterval(() => {
    attempts++;

    if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
      clearInterval(poll);
      initGoogleSignIn();
      return;
    }

    if (attempts > 25) {
      clearInterval(poll);
      logDebug("Google Identity Services script did not load in time.");
      if (statusEl) statusEl.textContent = "Couldn't load Google Sign-In";
      if (fallbackBtn) fallbackBtn.style.display = "flex";
    }
  }, 200);
}

function initGoogleSignIn() {
  const statusEl = document.getElementById("signin-status");
  const fallbackBtn = document.getElementById("google-fallback-btn");

  if (typeof google === "undefined" || !google.accounts) {
    statusEl.textContent = "Couldn't load Google Sign-In";
    fallbackBtn.style.display = "flex";
    return;
  }

  try {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
    });

    google.accounts.id.renderButton(document.getElementById("google-signin-btn-gate"), {
      theme: "filled_white",
      size: "large",
      shape: "pill",
      width: 320,
    });

    statusEl.textContent = "";
  } catch (err) {
    logDebug("Google init failed: " + err.message);
    fallbackBtn.style.display = "flex";
    statusEl.textContent = "Sign-in unavailable — using fallback";
  }
}

function handleCredentialResponse(response) {
  try {
    const payload = decodeJwt(response.credential);
    signInUser({
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    });
  } catch (err) {
    logDebug("Credential decode failed: " + err.message);
    showToast("Sign-in failed, please try again");
  }
}

function handleFallbackGoogleClick() {
  if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
    google.accounts.id.prompt();
  } else {
    logDebug("Fallback button clicked — check Authorized JavaScript origins in Google Cloud Console.");
    showToast("Sign-in isn't configured yet");
  }
}

function decodeJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
  return JSON.parse(json);
}

function signInUser(user) {
  state.isSignedIn = true;
  state.user = user;

  document.getElementById("login-gate").classList.add("hidden");

  document.getElementById("profile-name-text").textContent = user.name;
  document.getElementById("profile-email-text").textContent = user.email;
  document.getElementById("verified-badge").style.display = "flex";

  const avatar = document.getElementById("profile-avatar");
  if (user.picture) {
    avatar.innerHTML = `<img src="${user.picture}" style="width:100%;height:100%;object-fit:cover;" />`;
  } else {
    avatar.textContent = user.name?.[0]?.toUpperCase() || "U";
  }

  showToast(`Welcome, ${user.name.split(" ")[0]}!`);

  sendWelcomeEmail(user);
}

function signOutGoogle() {
  state.isSignedIn = false;
  state.user = null;

  if (typeof google !== "undefined" && google.accounts) {
    google.accounts.id.disableAutoSelect();
  }

  document.getElementById("profile-name-text").textContent = "Not signed in";
  document.getElementById("profile-email-text").textContent = "";
  document.getElementById("verified-badge").style.display = "none";
  document.getElementById("profile-avatar").innerHTML = "U";

  document.getElementById("login-gate").classList.remove("hidden");
  showToast("Signed out");
}

function logDebug(msg) {
  const el = document.getElementById("debug-log");
  el.classList.add("show");
  const line = document.createElement("div");
  line.textContent = msg;
  el.appendChild(line);
}

/* =========================================================
   EmailJS — welcome mail on sign-in
   ========================================================= */
function initEmailJS() {
  if (typeof emailjs === "undefined") {
    logDebug("EmailJS script did not load — welcome mail disabled.");
    return;
  }
  try {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  } catch (err) {
    logDebug("EmailJS init failed: " + err.message);
  }
}

function sendWelcomeEmail(user) {
  if (typeof emailjs === "undefined") {
    logDebug("EmailJS script not loaded — welcome mail not sent.");
    return;
  }

  emailjs
    .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_name: user.name,
      to_email: user.email,
    })
    .then(
      () => {
        console.log("Welcome email sent to", user.email);
      },
      (err) => {
        logDebug("Welcome email failed: " + JSON.stringify(err));
      }
    );
}

/* =========================================================
   Payments (Razorpay)
   NOTE: These call Razorpay Checkout directly from the client.
   In production, create the order on your backend first
   (to avoid trusting the amount from the client), then pass
   the order_id here.
   ========================================================= */
function openRazorpay({ amount, name, description, onSuccess }) {
  if (typeof Razorpay === "undefined") {
    showToast("Payments unavailable right now");
    return;
  }

  const options = {
    key: RAZORPAY_KEY_ID,
    amount,
    currency: "INR",
    name,
    description,
    prefill: {
      name: state.user?.name || "",
      email: state.user?.email || "",
    },
    theme: { color: "#1a6cf0" },
    handler: function (response) {
      // response.razorpay_payment_id is available here — send it to
      // your backend to verify + fulfil the order/subscription.
      onSuccess?.(response);
    },
    modal: {
      ondismiss: function () {
        showToast("Payment cancelled");
      },
    },
  };

  const rzp = new Razorpay(options);
  rzp.on("payment.failed", function () {
    showToast("Payment failed, please try again");
  });
  rzp.open();
}

/* =========================================================
   WALLPAPER EDITOR SCREEN (added feature)
   ========================================================= */

const EDITOR_MAIN_TABS = [
  { id: "clock", label: "Clock", icon: "fa-solid fa-clock", locked: false },
  { id: "date", label: "Date", icon: "fa-solid fa-calendar-days", locked: false },
  { id: "text", label: "Text", icon: "fa-solid fa-font", locked: true },
  { id: "stroke", label: "", icon: "fa-solid fa-slash", locked: true },
  { id: "parallax", label: "Parallax", icon: "fa-solid fa-cube", locked: true },
];

// Sub-tabs available once a main tab is unlocked (clock / date).
const EDITOR_SUB_TABS = [
  { id: "format", label: "Format", locked: false },
  { id: "typography", label: "Typography", locked: true },
  { id: "colors", label: "Colors", locked: true },
  { id: "position", label: "Position", locked: false },
  { id: "effects", label: "Effects", locked: true },
  { id: "transform", label: "Transform", locked: true },
];

const TIME_FORMATS = [
  { id: "hhmm", label: "hhmm" },
  { id: "hh mm", label: "hh mm" },
  { id: "hh:mm", label: "hh:mm" },
  { id: "hh.mm", label: "hh.mm" },
  { id: "hh mm ss", label: "hh mm ss" },
  { id: "hhmmss", label: "hhmmss" },
  { id: "hh:mm:ss", label: "hh:mm:ss" },
  { id: "hh.mm.ss", label: "hh.mm.ss" },
  { id: "h:mm", label: "h:mm" },
  { id: "hmm", label: "hmm" },
];

const DATE_FORMATS = [
  { id: "dd MMM yyyy", label: "dd MMM yyyy" },
  { id: "MMM dd, yyyy", label: "MMM dd, yyyy" },
  { id: "yyyy-MM-dd", label: "yyyy-MM-dd" },
  { id: "EEEE MMMM dd", label: "EEEE MMMM dd" },
];

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAY_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

state.editor = {
  wallpaper: null,
  returnTab: "explore",
  activeMainTab: "clock",
  activeSubTab: "format",
  showClock: true,
  timeFormat: "hhmm",
  showDate: true,
  dateFormat: "dd MMM yyyy",
  dateUppercase: false,
  // Position tab
  posX: 0,
  posY: 0,
  layeringDepth: false,
  showOverForeground: false,
  showOverForegroundHour: false,
  showOverForegroundMinute: false,
  // Transform tab
  rotX: 0,
  rotY: 0,
  skewH: 0,
  skewV: 0,
  rotAngle: 0,
  stretchH: 100,
};

/* ---- Slider field definitions (Position / Transform) ---- */
const POSITION_SLIDERS = [
  { key: "posX", label: "Horizontal Position", min: -100, max: 100, step: 0.1, default: 0 },
  { key: "posY", label: "Vertical Position", min: -100, max: 100, step: 0.1, default: 0 },
];
const TRANSFORM_PERSPECTIVE_SLIDERS = [
  { key: "rotX", label: "X-Axis Rotation", min: -45, max: 45, step: 0.1, default: 0 },
  { key: "rotY", label: "Y-Axis Rotation", min: -45, max: 45, step: 0.1, default: 0 },
];
const TRANSFORM_SKEW_SLIDERS = [
  { key: "skewV", label: "Top → Bottom", min: -45, max: 45, step: 0.1, default: 0, group: "Top/Bottom Skew" },
  { key: "skewH", label: "Left → Right", min: -45, max: 45, step: 0.1, default: 0, group: "Left/Right Skew" },
];
const TRANSFORM_ROTSTRETCH_SLIDERS = [
  { key: "rotAngle", label: "Rotation Angle", min: -180, max: 180, step: 1, default: 0 },
  { key: "stretchH", label: "Horizontal Stretch", min: 50, max: 200, step: 1, default: 100 },
];
let editorClockInterval = null;

function openEditorScreen(wp) {
  state.editor.wallpaper = wp;
  state.editor.returnTab = state.activeTab;
  state.editor.activeMainTab = "clock";
  state.editor.activeSubTab = "format";

  document.getElementById("editor-title").textContent = wp.title;
  document.getElementById("editor-preview-img").style.backgroundImage = `url('${wp.img}')`;
  document.getElementById("editor-fav-btn").classList.toggle("favorited", state.favorites.has(wp.id));

  switchTab("editor", null);
  renderEditorMainTabs();
  renderEditorSubTabs();
  renderEditorPanel();
  startEditorClock();
  applyEditorTransform();
}

function closeEditorScreen() {
  stopEditorClock();
  switchTab(state.editor.returnTab || "explore", document.getElementById(`nav-${state.editor.returnTab}`) || document.getElementById("nav-explore"));
}

function startEditorClock() {
  stopEditorClock();
  tickEditorPreview();
  editorClockInterval = setInterval(tickEditorPreview, 1000);
}
function stopEditorClock() {
  if (editorClockInterval) clearInterval(editorClockInterval);
  editorClockInterval = null;
}

function pad2(n) { return String(n).padStart(2, "0"); }

function formatEditorTime(now, formatId) {
  const h = pad2(now.getHours());
  const m = pad2(now.getMinutes());
  const s = pad2(now.getSeconds());
  switch (formatId) {
    case "hh mm": return `${h} ${m}`;
    case "hh:mm": return `${h}:${m}`;
    case "hh.mm": return `${h}.${m}`;
    case "hh mm ss": return `${h} ${m} ${s}`;
    case "hhmmss": return `${h}${m}${s}`;
    case "hh:mm:ss": return `${h}:${m}:${s}`;
    case "hh.mm.ss": return `${h}.${m}.${s}`;
    case "h:mm": return `${now.getHours()}:${m}`;
    case "hmm": return `${now.getHours()}${m}`;
    case "hhmm":
    default: return `${h}${m}`;
  }
}

function formatEditorDate(now, formatId, uppercase) {
  const dd = pad2(now.getDate());
  const MMM = MONTH_SHORT[now.getMonth()];
  const MMMM = MONTH_LONG[now.getMonth()];
  const EEEE = WEEKDAY_LONG[now.getDay()];
  const yyyy = now.getFullYear();
  const MM = pad2(now.getMonth() + 1);
  let out;
  switch (formatId) {
    case "MMM dd, yyyy": out = `${MMM} ${dd}, ${yyyy}`; break;
    case "yyyy-MM-dd": out = `${yyyy}-${MM}-${dd}`; break;
    case "EEEE MMMM dd": out = `${EEEE} ${MMMM} ${dd}`; break;
    case "dd MMM yyyy":
    default: out = `${dd} ${MMM} ${yyyy}`; break;
  }
  return uppercase ? out.toUpperCase() : out;
}

/* ---- Generic slider row (used by Position + Transform panels) ---- */
function formatSliderVal(val, step) {
  return step >= 1 ? String(Math.round(val)) : (Math.round(val * 10) / 10).toFixed(1);
}
function clampVal(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
function editorSliderRowHtml(def) {
  const val = state.editor[def.key] != null ? state.editor[def.key] : def.default;
  const pct = ((val - def.min) / (def.max - def.min)) * 100;
  return `
    <div class="editor-slider-block">
      <div class="editor-slider-toprow">
        <span class="editor-slider-name">${def.label}</span>
      </div>
      <div class="editor-slider-controls">
        <div class="slider-step-btn" onclick="adjustEditorSlider('${def.key}', ${def.min}, ${def.max}, ${def.step}, -1)"><i class="fa-solid fa-minus"></i></div>
        <div class="slider-value-box" id="val-${def.key}">${formatSliderVal(val, def.step)}</div>
        <div class="slider-step-btn" onclick="adjustEditorSlider('${def.key}', ${def.min}, ${def.max}, ${def.step}, 1)"><i class="fa-solid fa-plus"></i></div>
        <div class="slider-reset-btn" onclick="resetEditorSlider('${def.key}', ${def.default})"><i class="fa-solid fa-arrows-rotate"></i></div>
      </div>
      <input type="range" class="editor-range" id="range-${def.key}"
        min="${def.min}" max="${def.max}" step="${def.step}" value="${val}"
        oninput="setEditorSlider('${def.key}', this.value)"
        style="background: linear-gradient(to right, var(--primary-color) ${pct}%, #e2e8f0 ${pct}%)" />
    </div>
  `;
}
function updateSliderRowUI(key, min, max, step) {
  const input = document.getElementById(`range-${key}`);
  const box = document.getElementById(`val-${key}`);
  if (!input || !box) return;
  const val = state.editor[key];
  const pct = ((val - min) / (max - min)) * 100;
  input.value = val;
  input.style.background = `linear-gradient(to right, var(--primary-color) ${pct}%, #e2e8f0 ${pct}%)`;
  box.textContent = formatSliderVal(val, step);
}
function adjustEditorSlider(key, min, max, step, dir) {
  const cur = state.editor[key] != null ? state.editor[key] : 0;
  state.editor[key] = clampVal(Math.round((cur + dir * step) * 10) / 10, min, max);
  updateSliderRowUI(key, min, max, step);
  applyEditorTransform();
}
function setEditorSlider(key, value) {
  state.editor[key] = parseFloat(value);
  const input = document.getElementById(`range-${key}`);
  const box = document.getElementById(`val-${key}`);
  if (input && box) {
    const min = parseFloat(input.min), max = parseFloat(input.max), step = parseFloat(input.step);
    updateSliderRowUI(key, min, max, step);
  }
  applyEditorTransform();
}
function resetEditorSlider(key, def) {
  state.editor[key] = def;
  const input = document.getElementById(`range-${key}`);
  if (input) updateSliderRowUI(key, parseFloat(input.min), parseFloat(input.max), parseFloat(input.step));
  applyEditorTransform();
}

// Applies the Position + Transform values live onto the preview overlay.
function applyEditorTransform() {
  const overlay = document.getElementById("editor-preview-overlay");
  if (!overlay) return;
  const ed = state.editor;
  const tx = ed.posX || 0;
  const ty = ed.posY || 0;
  const rotX = ed.rotX || 0;
  const rotY = ed.rotY || 0;
  const skewH = ed.skewH || 0;
  const skewV = ed.skewV || 0;
  const rotAngle = ed.rotAngle || 0;
  const stretchH = ed.stretchH != null ? ed.stretchH : 100;
  overlay.style.transform =
    `translate(${tx}%, ${ty}%) perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) ` +
    `rotate(${rotAngle}deg) skew(${skewH}deg, ${skewV}deg) scaleX(${stretchH / 100})`;
}

function tickEditorPreview() {
  const now = new Date();
  const clockEl = document.getElementById("editor-preview-clock");
  const dateEl = document.getElementById("editor-preview-date");
  if (!clockEl || !dateEl) return;

  const ed = state.editor;
  if (ed.showClock) {
    const h = pad2(now.getHours());
    const rest = formatEditorTime(now, ed.timeFormat).slice(h.length);
    clockEl.innerHTML = `${h}<span class="clk-accent">${rest}</span>`;
    clockEl.style.display = "";
  } else {
    clockEl.style.display = "none";
  }

  if (ed.showDate) {
    dateEl.textContent = formatEditorDate(now, ed.dateFormat, ed.dateUppercase);
    dateEl.style.display = "";
  } else {
    dateEl.style.display = "none";
  }
}

function renderEditorMainTabs() {
  const el = document.getElementById("editor-maintabs");
  const active = state.editor.activeMainTab;
  el.innerHTML = EDITOR_MAIN_TABS.map((t) => `
    <div class="editor-maintab ${active === t.id ? "active" : ""}" onclick="selectEditorMainTab('${t.id}')">
      <i class="${t.icon}"></i>${t.label ? `<span>${t.label}</span>` : ""}
      ${t.locked ? `<span class="tab-lock-dot"><i class="fa-solid fa-lock"></i></span>` : ""}
    </div>
  `).join("") + `
    <div class="editor-maintab reset-btn" onclick="resetEditorSettings()"><i class="fa-solid fa-arrows-rotate"></i></div>
  `;
}

function selectEditorMainTab(id) {
  state.editor.activeMainTab = id;
  state.editor.activeSubTab = "format";
  renderEditorMainTabs();
  renderEditorSubTabs();
  renderEditorPanel();
}

function renderEditorSubTabs() {
  const el = document.getElementById("editor-subtabs");
  const mainTab = EDITOR_MAIN_TABS.find((t) => t.id === state.editor.activeMainTab);

  // Fully-locked main tabs (Text / stroke-effects / Parallax) don't show sub-tabs.
  if (mainTab && mainTab.locked) {
    el.innerHTML = "";
    el.style.display = "none";
    return;
  }
  el.style.display = "flex";

  const active = state.editor.activeSubTab;
  el.innerHTML = EDITOR_SUB_TABS.map((t) => `
    <div class="editor-subtab ${active === t.id ? "active" : ""}" onclick="selectEditorSubTab('${t.id}')">
      ${t.label}${t.locked ? `<i class="fa-solid fa-lock lock-mini"></i>` : ""}
    </div>
  `).join("");
}

function selectEditorSubTab(id) {
  state.editor.activeSubTab = id;
  renderEditorSubTabs();
  renderEditorPanel();
}

function renderEditorPanel() {
  const el = document.getElementById("editor-panel");
  const mainTab = EDITOR_MAIN_TABS.find((t) => t.id === state.editor.activeMainTab);

  // Whole main tab is premium-only (Text, stroke-effects, Parallax).
  if (mainTab && mainTab.locked) {
    el.innerHTML = premiumLockHtml();
    return;
  }

  const subTab = EDITOR_SUB_TABS.find((t) => t.id === state.editor.activeSubTab);
  if (subTab && subTab.locked) {
    el.innerHTML = premiumLockHtml();
    return;
  }

  if (state.editor.activeSubTab === "format") {
    el.innerHTML = state.editor.activeMainTab === "date" ? dateFormatPanelHtml() : clockFormatPanelHtml();
  } else if (state.editor.activeSubTab === "position") {
    el.innerHTML = positionPanelHtml();
  } else if (state.editor.activeSubTab === "transform") {
    el.innerHTML = transformPanelHtml();
  } else {
    el.innerHTML = premiumLockHtml();
  }
}

function premiumLockHtml() {
  return `
    <div class="editor-premium-lock">
      <div class="editor-premium-lock-icon"><i class="fa-solid fa-lock"></i></div>
      <h4>Premium Feature</h4>
      <p>This feature is available for Premium users only</p>
      <button class="editor-premium-upgrade-btn" onclick="openPremiumScreen()">Upgrade</button>
    </div>
  `;
}

function clockFormatPanelHtml() {
  const ed = state.editor;
  return `
    <div class="editor-panel-row">
      <div class="editor-panel-row-text"><h4>Show Clock</h4></div>
      <div class="toggle-switch ${ed.showClock ? "on" : ""}" onclick="toggleEditorFlag('showClock')"></div>
    </div>
    <div class="editor-section-label">Time Format</div>
    <div class="editor-format-grid">
      ${TIME_FORMATS.map((f) => `
        <div class="editor-format-btn ${ed.timeFormat === f.id ? "active" : ""}" onclick="selectTimeFormat('${f.id}')">${f.label}</div>
      `).join("")}
    </div>
  `;
}

function dateFormatPanelHtml() {
  const ed = state.editor;
  return `
    <div class="editor-panel-row">
      <div class="editor-panel-row-text"><h4>Show Date</h4></div>
      <div class="toggle-switch ${ed.showDate ? "on" : ""}" onclick="toggleEditorFlag('showDate')"></div>
    </div>
    <div class="editor-section-label">Date Format</div>
    ${DATE_FORMATS.map((f) => `
      <div class="editor-list-option ${ed.dateFormat === f.id ? "active" : ""}" onclick="selectDateFormat('${f.id}')">${f.label}</div>
    `).join("")}
    <div class="editor-section-label" style="margin-top:18px;">Text Style</div>
    <div class="editor-panel-row">
      <div class="editor-panel-row-text"><h4>All Uppercase</h4></div>
      <div class="toggle-switch ${ed.dateUppercase ? "on" : ""}" onclick="toggleEditorFlag('dateUppercase')"></div>
    </div>
  `;
}

function positionPanelHtml() {
  const ed = state.editor;
  return `
    <div class="editor-section-label">Position</div>
    ${editorSliderRowHtml(POSITION_SLIDERS[0])}
    ${editorSliderRowHtml(POSITION_SLIDERS[1])}

    <div class="editor-section-label" style="margin-top:22px;">Layering (Depth)</div>
    <div class="editor-panel-row">
      <div class="editor-panel-row-text">
        <h4>Layering (Depth)</h4>
        <p>Places this element on its own depth layer for a parallax effect.</p>
      </div>
      <div class="toggle-switch ${ed.layeringDepth ? "on" : ""}" onclick="toggleEditorFlag('layeringDepth')"></div>
    </div>
    <div class="editor-panel-row">
      <div class="editor-panel-row-text">
        <h4>Show Over Foreground</h4>
        <p>Clock appears BEHIND foreground elements (sandwiched).</p>
      </div>
      <div class="toggle-switch ${ed.showOverForeground ? "on" : ""}" onclick="toggleEditorFlag('showOverForeground')"></div>
    </div>
    <div class="editor-panel-row">
      <div class="editor-panel-row-text"><h4>Show Over Foreground (for Hour)</h4></div>
      <div class="toggle-switch ${ed.showOverForegroundHour ? "on" : ""}" onclick="toggleEditorFlag('showOverForegroundHour')"></div>
    </div>
    <div class="editor-panel-row">
      <div class="editor-panel-row-text"><h4>Show Over Foreground (for Minute)</h4></div>
      <div class="toggle-switch ${ed.showOverForegroundMinute ? "on" : ""}" onclick="toggleEditorFlag('showOverForegroundMinute')"></div>
    </div>
  `;
}

function transformPanelHtml() {
  return `
    <div class="editor-section-label">Perspective</div>
    ${editorSliderRowHtml(TRANSFORM_PERSPECTIVE_SLIDERS[0])}
    ${editorSliderRowHtml(TRANSFORM_PERSPECTIVE_SLIDERS[1])}

    <div class="editor-section-label" style="margin-top:22px;">Skew</div>
    <div class="editor-section-sub-label">Top/Bottom Skew</div>
    ${editorSliderRowHtml(TRANSFORM_SKEW_SLIDERS[0])}
    <div class="editor-section-sub-label">Left/Right Skew</div>
    ${editorSliderRowHtml(TRANSFORM_SKEW_SLIDERS[1])}

    <div class="editor-section-label" style="margin-top:22px;">Rotation &amp; Stretch</div>
    ${editorSliderRowHtml(TRANSFORM_ROTSTRETCH_SLIDERS[0])}
    ${editorSliderRowHtml(TRANSFORM_ROTSTRETCH_SLIDERS[1])}
  `;
}

function toggleEditorFlag(key) {
  state.editor[key] = !state.editor[key];
  renderEditorPanel();
  tickEditorPreview();
}

function selectTimeFormat(id) {
  state.editor.timeFormat = id;
  renderEditorPanel();
  tickEditorPreview();
}

function selectDateFormat(id) {
  state.editor.dateFormat = id;
  renderEditorPanel();
  tickEditorPreview();
}

function resetEditorSettings() {
  state.editor.showClock = true;
  state.editor.timeFormat = "hhmm";
  state.editor.showDate = true;
  state.editor.dateFormat = "dd MMM yyyy";
  state.editor.dateUppercase = false;
  state.editor.posX = 0;
  state.editor.posY = 0;
  state.editor.layeringDepth = false;
  state.editor.showOverForeground = false;
  state.editor.showOverForegroundHour = false;
  state.editor.showOverForegroundMinute = false;
  state.editor.rotX = 0;
  state.editor.rotY = 0;
  state.editor.skewH = 0;
  state.editor.skewV = 0;
  state.editor.rotAngle = 0;
  state.editor.stretchH = 100;
  renderEditorPanel();
  tickEditorPreview();
  applyEditorTransform();
  showToast("Reset to default");
}

function toggleFavoriteEditor() {
  const wp = state.editor.wallpaper;
  if (!wp) return;
  if (state.favorites.has(wp.id)) state.favorites.delete(wp.id);
  else state.favorites.add(wp.id);
  document.getElementById("editor-fav-btn").classList.toggle("favorited", state.favorites.has(wp.id));
  renderWallpapers();
  renderSamples();
  renderCategoryDetailGrid();
}

function applyEditorWallpaper() {
  const wp = state.editor.wallpaper;
  if (!wp) return;
  requestSetWallpaperFromEditor(wp);
}

// Same unlock / native-bridge / download logic as requestSetWallpaper,
// but returns the user to the editor screen instead of closing a modal.
function requestSetWallpaperFromEditor(wp) {
  const isUnlocked = !wp.premium || state.isPremium || state.unlockedIds.has(wp.id);
  if (!isUnlocked) {
    openUnlockSheet(wp);
    return;
  }

  if (window.NativeBridge && typeof window.NativeBridge.setWallpaper === "function") {
    try {
      window.NativeBridge.setWallpaper(wp.img);
      showToast(`"${wp.title}" set as wallpaper`);
      return;
    } catch (err) {
      logDebug("Native setWallpaper failed: " + err.message);
    }
  }

  showToast("Browsers can't set wallpaper directly — downloading image…");
  performDownload(wp);
  setTimeout(() => {
    showToast("Open it from your gallery, then tap 'Set as wallpaper'");
  }, 2400);
}

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
  { key: "Space", title: "Aero Space", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900" },
  { key: "Cyber", title: "Cyber", img: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=900" },
  { key: "Nature", title: "Nature", img: "https://novawallpaper.github.io/depthx-app/nature-001.jpg" },
  { key: "Gaming", title: "Gaming", img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=900" },
  { key: "Anime", title: "Anime Vibes", img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900" },
];

/* ---------------- Sample wallpaper data ---------------- */
const WALLPAPERS = [
  { id: "w1", title: "Wallpaper 1", time: "02:30", category: "Space", premium: true,  tag: "fire", img: "https://novawallpaper.github.io/depthx-app/1.jpg" },
  { id: "w2", title: "Wallpaper 2", time: "09:15", category: "Space", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/2.jpg" },
  { id: "w3", title: "Wallpaper 3", time: "23:47", category: "Cyber", premium: true,  tag: "fire", img: "https://novawallpaper.github.io/depthx-app/3.jpg" },
  { id: "w4", title: "Wallpaper 4", time: "18:05", category: "Cyber", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/4.jpg" },
  { id: "w5", title: "Wallpaper 5", time: "06:20", category: "Nature", premium: false, tag: "gift", img: "https://novawallpaper.github.io/depthx-app/5.jpg" },
  { id: "w6", title: "Wallpaper 6", time: "17:40", category: "Nature", premium: true,  tag: "diamond", img: "https://novawallpaper.github.io/depthx-app/6.jpg" },
  { id: "w11", title: "Login Frame 01", time: "03:10", category: "Abstract", premium: false, tag: "gift", img: "https://i.ibb.co/Kz81yjgy/10a83c4fd7e6525b092666eae2a24828.jpg" },
  { id: "w12", title: "Login Frame 02", time: "11:25", category: "Abstract", premium: false, tag: "gift", img: "https://i.ibb.co/TBgPsR0D/e41abb1adaa447b0ace2f00943fc2cf6.jpg" },
  { id: "w13", title: "Login Frame 03", time: "15:40", category: "Abstract", premium: true, tag: "diamond", img: "https://i.ibb.co/prM7ZcbB/f5e4b804c06fb5441d2392f4d6361714.jpg" },
  { id: "w14", title: "Login Frame 04", time: "19:55", category: "Nature", premium: false, tag: "gift", img: "https://i.ibb.co/RGVkzJxy/f5ae1610b81259691d8ac579db0ddb7c.jpg" },
  { id: "w15", title: "Login Frame 05", time: "08:15", category: "Nature", premium: true, tag: "fire", img: "https://i.ibb.co/JR3xrx4S/653a056fd4b86d41d868843de536ed9b.jpg" },
  { id: "w16", title: "Login Frame 06", time: "22:30", category: "Dark", premium: false, tag: "gift", img: "https://i.ibb.co/zVKnHdyL/3087a2ae0bc62298d176b86580bbc2b0.jpg" },
  { id: "w17", title: "Login Frame 07", time: "05:45", category: "Nature", premium: false, tag: "gift", img: "https://i.ibb.co/3m8B4SJR/479f69994761abea0968e875f84bb8d3.jpg" },
  { id: "w18", title: "Login Frame 08", time: "13:20", category: "Minimal", premium: true, tag: "diamond", img: "https://i.ibb.co/zWf2Nghf/c8a59f5672cb86f4b04da4adabb30111.jpg" },
  { id: "w19", title: "Login Frame 09", time: "20:05", category: "Dark", premium: false, tag: "fire", img: "https://i.ibb.co/z9j0y40/aa587ae4dd0e290dc436fd3e30e2fa5a.jpg" },
  { id: "w20", title: "Login Frame 10", time: "16:50", category: "Nature", premium: false, tag: "gift", img: "https://i.ibb.co/TBSJPY1y/06e8afef8d9a920f428e997edca9e41f.jpg" },
  { id: "w21", title: "Login Frame 11", time: "10:35", category: "Abstract", premium: true, tag: "diamond", img: "https://i.ibb.co/kskPzj5r/c9130ea644806251ce4b1413af0865c9.jpg" },
  { id: "w22", title: "Login Frame 12", time: "04:00", category: "Nature", premium: false, tag: "gift", img: "https://i.ibb.co/yBpwd5CJ/1db3adb82e25ecf99a201f21d6e6f324.jpg" },
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
        ${w.premium ? `<div class="premium-badge">PRO</div>` : `<div></div>`}
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

  document.getElementById("modal-preview-bg").style.backgroundImage = `url('${wp.img}')`;
  document.getElementById("modal-wallpaper-title").textContent = wp.title;
  document.getElementById("modal-fav-btn").classList.toggle("favorited", state.favorites.has(id));
  document.getElementById("wallpaper-modal").classList.add("active");
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

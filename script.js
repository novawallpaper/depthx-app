/* =========================================================
   DepthX — app logic
   NOTE: replace GOOGLE_CLIENT_ID and RAZORPAY_KEY_ID with your
   own keys before going live (see comments below).

   IMPORTANT: This file does NOT require any changes to
   index.html or style.css. Everything new (the premium
   unlock sheet, the simulated ad overlay, and the bottom-nav
   stability fix) is created/injected at runtime from this
   file alone, using your original HTML/CSS as-is.
   ========================================================= */

const GOOGLE_CLIENT_ID = "452456583028-1l86bibq60ggkl3o1h5j88sed7v04eof.apps.googleusercontent.com";
const RAZORPAY_KEY_ID = "rzp_test_TCD8788xLE6UZd";

/* How long the simulated rewarded-ad plays for, in seconds */
const AD_DURATION_SECONDS = 5;

/* localStorage key prefix used to remember, per signed-in user (by email),
   whether they are subscribed and whether they've already used their
   one free "watch an ad to unlock" pass. */
const ENTITLEMENTS_PREFIX = "depthx_entitlements_";

/* ---------------- In-memory state --------------- */
const state = {
  activeTab: "explore",
  activeCategory: "All",
  activeFilter: "grid",
  searchQuery: "",
  favorites: new Set(),
  isSignedIn: false,
  user: null,
  currentWallpaper: null,

  /* Premium entitlement state for the current signed-in user */
  isSubscribed: false,
  adUsed: false,
  adUnlockedWallpaperId: null,

  /* The wallpaper the unlock sheet / ad is currently working on unlocking,
     so we know what to download once the ad finishes or the purchase
     succeeds. */
  pendingUnlockWallpaper: null,
  pendingUnlockAction: null,
};

/* ---------------- Sample wallpaper data ---------------- */
const WALLPAPERS = [
{
id:"w1",
title:"Wallpaper 1",
category:"Space",
premium:true,
tag:"fire",
img:"https://i.ibb.co/Kz81yjgy/10a83c4fd7e6525b092666eae2a24828.jpg"
},
{
id:"w2",
title:"Wallpaper 2",
category:"Nature",
premium:false,
tag:"gift",
img:"https://i.ibb.co/TBgPsR0D/e41abb1adaa447b0ace2f00943fc2cf6.jpg"
},
{
id:"w3",
title:"Wallpaper 3",
category:"Gaming",
premium:true,
tag:"diamond",
img:"https://i.ibb.co/prM7ZcbB/f5e4b804c06fb5441d2392f4d6361714.jpg"
},
{
id:"w4",
title:"Wallpaper 4",
category:"Cyber",
premium:false,
tag:"gift",
img:"https://i.ibb.co/RGVkzJxy/f5ae1610b81259691d8ac579db0ddb7c.jpg"
},
{
id:"w5",
title:"Wallpaper 5",
category:"Nature",
premium:true,
tag:"fire",
img:"https://i.ibb.co/JR3xrx4S/653a056fd4b86d41d868843de536ed9b.jpg"
},
{
id:"w6",
title:"Wallpaper 6",
category:"Space",
premium:false,
tag:"gift",
img:"https://i.ibb.co/zVKnHdyL/3087a2ae0bc62298d176b86580bbc2b0.jpg"
},
{
id:"w7",
title:"Wallpaper 7",
category:"Gaming",
premium:true,
tag:"diamond",
img:"https://i.ibb.co/3m8B4SJR/479f69994761abea0968e875f84bb8d3.jpg"
},
{
id:"w8",
title:"Wallpaper 8",
category:"Cyber",
premium:false,
tag:"gift",
img:"https://i.ibb.co/zWf2Nghf/c8a59f5672cb86f4b04da4adabb30111.jpg"
},
{
id:"w9",
title:"Wallpaper 9",
category:"Nature",
premium:true,
tag:"fire",
img:"https://i.ibb.co/z9j0y40/aa587ae4dd0e290dc436fd3e30e2fa5a.jpg"
},
{
id:"w10",
title:"Wallpaper 10",
category:"Space",
premium:false,
tag:"gift",
img:"https://i.ibb.co/TBSJPY1y/06e8afef8d9a920f428e997edca9e41f.jpg"
},
{
id:"w11",
title:"Wallpaper 11",
category:"Gaming",
premium:true,
tag:"diamond",
img:"https://i.ibb.co/kskPzj5r/c9130ea644806251ce4b1413af0865c9.jpg"
},
{
id:"w12",
title:"Wallpaper 12",
category:"Cyber",
premium:false,
tag:"gift",
img:"https://i.ibb.co/yBpwd5CJ/1db3adb82e25ecf99a201f21d6e6f324.jpg"
}
];

const SAMPLES = WALLPAPERS.slice(0,4);

/* =========================================================
   Init
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  injectExtraStyles();
  injectUnlockUi();

  initGoogleSignIn();
  renderWallpapers();
  renderSamples();
  wireSearch();
  wireModalClose();
  wireUnlockModalClose();
});

/* =========================================================
   Tabs / navigation
   ========================================================= */
function switchTab(tab, el) {
  state.activeTab = tab;

  document.querySelectorAll(".screen-content").forEach((s) => s.classList.remove("active"));
  document.getElementById(`screen-${tab}`).classList.add("active");

  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  el.classList.add("active");
}

function openCategory(category) {
  state.activeCategory = category;
  state.activeFilter = "grid";
  document.getElementById("explore-title").textContent = category;

  document.querySelectorAll(".sub-cat-item").forEach((s) => s.classList.remove("active"));
  document.querySelector('.sub-cat-item[data-filter="grid"]').classList.add("active");

  switchTab("explore", document.getElementById("nav-explore"));
  renderWallpapers();
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
   Rendering
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
      break; // "grid" = no extra filtering
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
  document.getElementById("wallpaper-modal").classList.add("active");
}

function closeWallpaperModal() {
  document.getElementById("wallpaper-modal").classList.remove("active");
}

function wireModalClose() {
  const modal = document.getElementById("wallpaper-modal");
  // clicking the "x" pseudo-element area (top-right) closes the modal
  modal.addEventListener("click", (e) => {
    const rect = modal.getBoundingClientRect();
    const clickedCloseZone = e.clientX > rect.right - 56 && e.clientY < rect.top + 56;
    if (clickedCloseZone) closeWallpaperModal();
  });

  document.getElementById("modal-download-action").addEventListener("click", () => {
    requestPremiumAction(state.currentWallpaper, performDownload);
  });

  document.getElementById("modal-set-action").addEventListener("click", () => {
    requestPremiumAction(state.currentWallpaper, performSetWallpaper);
  });
}

/* =========================================================
   Premium gating: ad-unlock (one free use per account) or subscription
   All markup + styles for this feature are injected below in
   injectUnlockUi() / injectExtraStyles() — index.html and
   style.css are never touched.
   ========================================================= */

/* Shared entry point used by BOTH the Download button and the Set
   Wallpaper button. Decides whether the requested action can happen
   right away, or whether the user needs to watch an ad / subscribe
   first — either action is blocked the same way for premium items. */
function requestPremiumAction(wp, action) {
  if (!wp) return;

  if (!wp.premium) {
    action(wp);
    return;
  }

  if (!state.isSignedIn) {
    showToast("Sign in to access premium wallpapers");
    return;
  }

  if (state.isSubscribed) {
    action(wp);
    return;
  }

  if (state.adUnlockedWallpaperId === wp.id) {
    // Already unlocked this exact wallpaper with their one free ad
    action(wp);
    return;
  }

  state.pendingUnlockAction = action;
  openUnlockModal(wp);
}

/* Actually downloads the file. Images here are hosted on a different
   domain (i.ibb.co), and browsers ignore the `download` attribute for
   cross-origin links unless the file is fetched first — otherwise it
   just opens in a new tab instead of saving. So we fetch it as a blob
   and download that instead, with a graceful fallback if the host
   doesn't allow cross-origin fetches. */
async function performDownload(wp) {
  showToast("Preparing download…");

  try {
    const response = await fetch(wp.img, { mode: "cors" });
    if (!response.ok) throw new Error("Bad response");

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = sanitizeFileName(wp.title) + ".jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    showToast("Download started");
  } catch (err) {
    // Fallback: open the image directly so the user can long-press /
    // right-click and save it manually.
    window.open(wp.img, "_blank");
    showToast("Opened image — tap and hold to save it");
  }

  closeWallpaperModal();
}

function performSetWallpaper(wp) {
  showToast(`"${wp.title}" set as wallpaper`);
  closeWallpaperModal();
}

function sanitizeFileName(name) {
  return name.replace(/[^a-z0-9\-_]+/gi, "_");
}

function openUnlockModal(wp) {
  state.pendingUnlockWallpaper = wp;

  const adBtn = document.getElementById("unlock-btn-ad");
  const alreadyUsedAd = state.adUsed && state.adUnlockedWallpaperId !== wp.id;

  if (alreadyUsedAd) {
    adBtn.disabled = true;
    adBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Free Ad Unlock Already Used`;
  } else {
    adBtn.disabled = false;
    adBtn.innerHTML = `<i class="fa-solid fa-play"></i> Watch Ad to Unlock`;
  }

  document.getElementById("unlock-modal").classList.add("active");
}

function closeUnlockModal() {
  document.getElementById("unlock-modal").classList.remove("active");
}

function wireUnlockModalClose() {
  const modal = document.getElementById("unlock-modal");
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeUnlockModal();
  });
}

function watchAdToUnlock() {
  if (state.adUsed && state.adUnlockedWallpaperId !== state.pendingUnlockWallpaper?.id) {
    showToast("Your one free ad-unlock has already been used");
    return;
  }

  closeUnlockModal();

  const overlay = document.getElementById("ad-overlay");
  const timerEl = document.getElementById("ad-timer");
  let secondsLeft = AD_DURATION_SECONDS;

  timerEl.textContent = secondsLeft;
  overlay.classList.add("active");

  const interval = setInterval(() => {
    secondsLeft -= 1;

    if (secondsLeft <= 0) {
      clearInterval(interval);
      overlay.classList.remove("active");
      onAdWatched();
    } else {
      timerEl.textContent = secondsLeft;
    }
  }, 1000);
}

function onAdWatched() {
  const wp = state.pendingUnlockWallpaper;
  const action = state.pendingUnlockAction || performDownload;
  if (!wp) return;

  state.adUsed = true;
  state.adUnlockedWallpaperId = wp.id;
  saveEntitlements();

  showToast("Unlocked!");
  action(wp);

  state.pendingUnlockWallpaper = null;
  state.pendingUnlockAction = null;
}

/* =========================================================
   Runtime UI injection (keeps index.html / style.css untouched)
   ========================================================= */
function injectUnlockUi() {
  const container = document.querySelector(".app-container");
  if (!container) return;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div id="unlock-modal" class="unlock-modal">
      <div class="unlock-sheet">
        <div class="unlock-icon">
          <i class="fa-solid fa-gem"></i>
        </div>
        <h3>Premium Wallpaper</h3>
        <p>
          This wallpaper is Premium. Watch a short ad to unlock it once,
          or subscribe for unlimited premium downloads.
        </p>
        <div class="unlock-options">
          <button id="unlock-btn-ad" class="unlock-btn unlock-btn-ad" onclick="watchAdToUnlock()">
            <i class="fa-solid fa-play"></i>
            Watch Ad to Unlock
          </button>
          <button class="unlock-btn unlock-btn-sub" onclick="closeUnlockModal(); startPremiumUpgrade();">
            <i class="fa-solid fa-crown"></i>
            Subscribe for Unlimited
          </button>
        </div>
        <button class="unlock-cancel" onclick="closeUnlockModal()">Cancel</button>
      </div>
    </div>
    <div id="ad-overlay" class="ad-overlay">
      <div class="ad-label">Advertisement</div>
      <div class="ad-timer" id="ad-timer">5</div>
      <div class="ad-note">Unlocking your wallpaper…</div>
    </div>
  `;

  // Move the generated nodes into app-container (append at the end so
  // they layer above everything else, matching their z-index).
  while (wrapper.firstChild) {
    container.appendChild(wrapper.firstChild);
  }
}

function injectExtraStyles() {
  const style = document.createElement("style");
  style.id = "depthx-injected-styles";
  style.textContent = `
    /* --- Bottom nav stability fix (prevents it from flickering/
       disappearing on iOS/Safari during scroll) --- */
    .bottom-nav {
      -webkit-backdrop-filter: blur(15px);
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
      will-change: transform;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    .screen-content {
      -webkit-overflow-scrolling: touch;
    }

    /* --- Premium unlock sheet --- */
    .unlock-modal {
      position: absolute;
      inset: 0;
      z-index: 400;
      background: rgba(5, 5, 5, 0.72);
      display: none;
      align-items: flex-end;
      justify-content: center;
    }
    .unlock-modal.active { display: flex; }
    .unlock-sheet {
      width: 100%;
      max-width: 430px;
      background: #fff;
      border-radius: 26px 26px 0 0;
      padding: 26px 24px 32px 24px;
      text-align: center;
    }
    .unlock-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--primary-light);
      color: var(--primary-color);
      font-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 14px auto;
    }
    .unlock-sheet h3 {
      font-size: 18px;
      color: var(--text-dark);
      margin-bottom: 6px;
    }
    .unlock-sheet p {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .unlock-options {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .unlock-btn {
      border: none;
      border-radius: 14px;
      padding: 14px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }
    .unlock-btn-ad {
      background: var(--primary-light);
      color: var(--primary-color);
    }
    .unlock-btn-ad:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .unlock-btn-sub {
      background: var(--primary-color);
      color: #fff;
    }
    .unlock-cancel {
      margin-top: 14px;
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    /* --- Simulated ad overlay --- */
    .ad-overlay {
      position: absolute;
      inset: 0;
      z-index: 450;
      background: #000;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .ad-overlay.active { display: flex; }
    .ad-overlay .ad-label {
      font-size: 12px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 10px;
    }
    .ad-overlay .ad-timer {
      font-size: 42px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .ad-overlay .ad-note {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
  `;
  document.head.appendChild(style);
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
   Google Sign-In
   ========================================================= */
function initGoogleSignIn(retriesLeft) {
  if (retriesLeft === undefined) retriesLeft = 50; // ~5 seconds of retrying

  const statusEl = document.getElementById("signin-status");
  const fallbackBtn = document.getElementById("google-fallback-btn");

  if (typeof google === "undefined" || !google.accounts) {
    // Google's script loads with async/defer, so it can still be on its
    // way when this runs. Retry for a few seconds before giving up and
    // showing the fallback button, instead of failing immediately.
    if (retriesLeft > 0) {
      setTimeout(() => initGoogleSignIn(retriesLeft - 1), 100);
      return;
    }
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
  // Used only if the real Google button fails to render
  // (e.g. this origin isn't added to Authorized JavaScript origins yet).
  logDebug("Fallback button clicked — check Authorized JavaScript origins in Google Cloud Console.");
  showToast("Sign-in isn't configured yet");
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

  const avatar = document.getElementById("profile-avatar");
  if (user.picture) {
    avatar.innerHTML = `<img src="${user.picture}" style="width:100%;height:100%;object-fit:cover;" />`;
  } else {
    avatar.textContent = user.name?.[0]?.toUpperCase() || "U";
  }

  loadEntitlements();
  updateUpgradeUi();

  showToast(`Welcome, ${user.name.split(" ")[0]}!`);
}

function signOutGoogle() {
  state.isSignedIn = false;
  state.user = null;
  state.isSubscribed = false;
  state.adUsed = false;
  state.adUnlockedWallpaperId = null;

  if (typeof google !== "undefined" && google.accounts) {
    google.accounts.id.disableAutoSelect();
  }

  document.getElementById("profile-name-text").textContent = "Not signed in";
  document.getElementById("profile-email-text").textContent = "";
  document.getElementById("profile-avatar").innerHTML = "U";

  updateUpgradeUi();

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
   Entitlements (subscription + one-time free ad unlock),
   remembered per signed-in Google account.
   ========================================================= */
function entitlementsKey() {
  if (!state.user?.email) return null;
  return ENTITLEMENTS_PREFIX + state.user.email.toLowerCase();
}

function loadEntitlements() {
  state.isSubscribed = false;
  state.adUsed = false;
  state.adUnlockedWallpaperId = null;

  const key = entitlementsKey();
  if (!key) return;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.isSubscribed = !!data.isSubscribed;
    state.adUsed = !!data.adUsed;
    state.adUnlockedWallpaperId = data.adUnlockedWallpaperId || null;
  } catch (err) {
    // ignore corrupt/missing storage
  }
}

function saveEntitlements() {
  const key = entitlementsKey();
  if (!key) return;

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        isSubscribed: state.isSubscribed,
        adUsed: state.adUsed,
        adUnlockedWallpaperId: state.adUnlockedWallpaperId,
      })
    );
  } catch (err) {
    // ignore storage failures (e.g. private browsing)
  }
}

function updateUpgradeUi() {
  const tierTitle = document.querySelector(".tier-left h2");
  const tierSub = document.querySelector(".tier-left p");
  const upgradeBtn = document.querySelector(".upgrade-btn");
  if (!tierTitle || !tierSub || !upgradeBtn) return;

  if (state.isSubscribed) {
    tierTitle.textContent = "PREMIUM PLAN";
    tierSub.textContent = "You have unlimited premium wallpapers";
    upgradeBtn.textContent = "Active";
    upgradeBtn.disabled = true;
  } else {
    tierTitle.textContent = "FREE PLAN";
    tierSub.textContent = "Upgrade for Premium Wallpapers";
    upgradeBtn.textContent = "Upgrade";
    upgradeBtn.disabled = false;
  }
}

/* =========================================================
   Payments (Razorpay)
   NOTE: These call Razorpay Checkout directly from the client.
   In production, create the order on your backend first
   (to avoid trusting the amount from the client), then pass
   the order_id here.
   ========================================================= */
function startCustomOrderPayment() {
  openRazorpay({
    amount: 3500, // ₹35.00 in paise
    name: "DepthX — Custom Wallpaper",
    description: "AI generated depth wallpaper",
    onSuccess: () => showToast("Order placed! We'll notify you when it's ready."),
  });
}

function startPremiumUpgrade() {
  if (!state.isSignedIn) {
    showToast("Sign in first to subscribe");
    return;
  }

  openRazorpay({
    amount: 14900, // e.g. ₹149.00 in paise — adjust to your real price
    name: "DepthX — Premium",
    description: "Unlock premium wallpapers, AI edit & collections",
    onSuccess: () => {
      state.isSubscribed = true;
      saveEntitlements();
      updateUpgradeUi();
      showToast("You're now Premium! 🎉");

      // If they were trying to download / set a specific premium
      // wallpaper, finish that action now that they're subscribed.
      if (state.pendingUnlockWallpaper) {
        const wp = state.pendingUnlockWallpaper;
        const action = state.pendingUnlockAction || performDownload;
        state.pendingUnlockWallpaper = null;
        state.pendingUnlockAction = null;
        action(wp);
      }
    },
  });
}

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
    handler: function () {
      onSuccess?.();
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

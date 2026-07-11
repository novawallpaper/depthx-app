// ======================================================
// PART 0 - ON-PAGE DEBUG LOG (mobile-friendly, no DevTools needed)
// ======================================================
// Mirrors console.error / console.warn / window errors into a visible
// box on the login screen so issues (like Google Sign-In config
// problems) can be read and screenshotted directly from the phone.
// Safe to remove this whole block once everything is confirmed working.

(function setupOnPageDebugLog() {
    function appendDebugLine(text) {
        const box = document.getElementById("debug-log");
        if (!box) return;
        box.classList.add("show");
        const line = document.createElement("div");
        line.innerText = text;
        box.appendChild(line);
        box.scrollTop = box.scrollHeight;
    }

    const originalError = console.error.bind(console);
    console.error = function (...args) {
        originalError(...args);
        appendDebugLine("ERROR: " + args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    };

    const originalWarn = console.warn.bind(console);
    console.warn = function (...args) {
        originalWarn(...args);
        appendDebugLine("WARN: " + args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    };

    window.addEventListener("error", (e) => {
        appendDebugLine("JS ERROR: " + e.message);
    });
})();

// ======================================================
// PART 1A - WALLPAPER DATABASE
// ======================================================

const wallpaperData = [];

const wallpaperThemes = [
    "Porsche GT","Erling Haaland","Luka Modric","Aero Space Prime","Neon Cyber Rider",
    "Shadow Action","Dark Horizon","Abstract Wave","Anime Glow","Minimal Peak",
    "BMW M4","Mercedes AMG","Bugatti Chiron","Koenigsegg Jesko","Lamborghini SVJ",
    "McLaren P1","Ferrari SF90","GTR R35","Supra MK4","Audi RS7"
];

const wallpaperCategories = ["Cars","Sports","Anime","Cyber","Nature","Space","Abstract","Gaming","Dark","Minimal"];
const filterTags = ["grid","gift","diamond","shuffle","star","fire"];

// Build a shuffled premium/free flag list so premium & free wallpapers mix
// throughout the grid instead of all premium appearing first.
function buildShuffledPremiumFlags(total, premiumCount) {
    const flags = [];
    for (let i = 0; i < total; i++) flags.push(i < premiumCount);
    // Fisher-Yates shuffle
    for (let i = flags.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flags[i], flags[j]] = [flags[j], flags[i]];
    }
    return flags;
}

const TOTAL_WALLPAPERS = 100;
const PREMIUM_COUNT = 45;
const premiumFlags = buildShuffledPremiumFlags(TOTAL_WALLPAPERS, PREMIUM_COUNT);

for (let i = 1; i <= TOTAL_WALLPAPERS; i++) {
    wallpaperData.push({
        id: i,
        title: `${wallpaperThemes[(i - 1) % wallpaperThemes.length]} #${i}`,
        category: wallpaperCategories[(i - 1) % wallpaperCategories.length],
        tag: filterTags[(i - 1) % filterTags.length],
        premium: premiumFlags[i - 1],
        trending: i % 28 === 0,
        favorite: false,
        // Real downloadable images (Picsum). Replace with your own CDN/asset
        // URLs later — just make sure they are real, reachable image files.
        image: `https://picsum.photos/seed/wallpaper${i}/800/1400`
    });
}

let currentCategory = "All";
let currentSubFilter = "grid";
let favoritesList = [];
let showingFavoritesOnly = false;

const gridContainer = document.getElementById("wallpaper-grid-container");
const samplesGrid = document.getElementById("samples-grid");
const searchInput = document.getElementById("search-input");
const exploreTitle = document.getElementById("explore-title");
const wallpaperModal = document.getElementById("wallpaper-modal");
const modalBg = document.getElementById("modal-preview-bg");
const modalTitle = document.getElementById("modal-wallpaper-title");
const toast = document.getElementById("app-toast");

// ======================================================
// PART 1B - INIT + RENDER + SEARCH
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    // Close modal when tapping the black background area (or the X in the
    // top-right corner, which is drawn via CSS ::before on .wallpaper-modal)
    if (wallpaperModal) {
        wallpaperModal.addEventListener("click", (e) => {
            if (e.target === wallpaperModal) {
                closeWallpaperModal();
            }
        });
    }

    renderWallpapers();
    renderSampleWallpapers();
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            renderWallpapers(this.value.trim().toLowerCase());
        });
    }

    // Reflect current login state on first paint, then try to init
    // Google Identity Services (script is loaded async/defer so we poll
    // briefly until the `google` global is ready).
    renderProfileUI();
    waitForGoogleThenInit();
});

function renderWallpapers(searchQuery = "") {
    if (!gridContainer) return;
    gridContainer.innerHTML = "";
    let list = [...wallpaperData];

    if (currentCategory !== "All") {
        list = list.filter(item => item.category === currentCategory);
    }

    switch (currentSubFilter) {
        case "gift": list = list.filter(item => !item.premium); break;
        case "diamond": list = list.filter(item => item.premium); break;
        case "fire": list = list.filter(item => item.trending); break;
        case "star": list = list.filter(item => favoritesList.includes(item.id)); break;
        case "shuffle": list.sort(() => Math.random() - 0.5); break;
    }

    if (showingFavoritesOnly) {
        list = list.filter(item => favoritesList.includes(item.id));
    }

    if (searchQuery !== "") {
        list = list.filter(item => item.title.toLowerCase().includes(searchQuery));
    }

    if (list.length === 0) {
        gridContainer.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#777;">No Wallpapers Found</div>`;
        return;
    }

    list.forEach(createWallpaperCard);
}

function createWallpaperCard(wp) {
    const liked = favoritesList.includes(wp.id);
    const card = document.createElement("div");
    card.className = "wallpaper-card";
    card.style.backgroundImage = `url('${wp.image}')`;
    card.onclick = () => openWallpaperModal(wp.id);

    card.innerHTML = `
    <div class="card-top">
        ${wp.premium ? `<span class="premium-badge"><i class="fa-solid fa-gem"></i> PRO</span>` : `<span></span>`}
        <div class="star-badge ${liked ? "favorited" : ""}" onclick="toggleFavorite(event,${wp.id})">
            <i class="fa-solid fa-star"></i>
        </div>
    </div>
    <div class="card-bottom">
        <div class="card-time">Tuesday, June 30</div>
        <div class="card-clock">02:30</div>
        <div class="card-title">${wp.title}</div>
    </div>
    `;

    gridContainer.appendChild(card);
}

// ======================================================
// PART 2A - NAV + FILTERS + FAVORITES
// ======================================================

function switchTab(tabName, element) {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    document.querySelectorAll(".screen-content").forEach(screen => screen.classList.remove("active"));
    if (element) element.classList.add("active");
    const screen = document.getElementById("screen-" + tabName);
    if (screen) screen.classList.add("active");
}

function openCategory(categoryName) {
    currentCategory = categoryName;
    showingFavoritesOnly = false;
    if (exploreTitle) exploreTitle.innerText = categoryName;
    const exploreBtn = document.getElementById("nav-explore");
    switchTab("explore", exploreBtn);
    renderWallpapers(searchInput ? searchInput.value.toLowerCase() : "");
}

function switchSubCat(element) {
    document.querySelectorAll(".sub-cat-item").forEach(item => item.classList.remove("active"));
    element.classList.add("active");
    currentSubFilter = element.dataset.filter;
    showingFavoritesOnly = false;
    if (exploreTitle) exploreTitle.innerText = element.querySelector(".sub-cat-text").innerText;
    renderWallpapers(searchInput ? searchInput.value.toLowerCase() : "");
}

function toggleFavorite(event, id) {
    event.stopPropagation();
    const index = favoritesList.indexOf(id);
    if (index > -1) {
        favoritesList.splice(index, 1);
        showToast("Removed from Favorites ❤️");
    } else {
        favoritesList.push(id);
        showToast("Added to Favorites ❤️");
    }
    renderWallpapers(searchInput ? searchInput.value.toLowerCase() : "");
}

function filterByFavoritesQuick() {
    showingFavoritesOnly = !showingFavoritesOnly;
    if (showingFavoritesOnly) {
        if (exploreTitle) exploreTitle.innerText = "Favorites";
        showToast("Showing Favorite Wallpapers");
    } else {
        if (exploreTitle) exploreTitle.innerText = currentCategory;
        showToast("Showing All Wallpapers");
    }
    renderWallpapers(searchInput ? searchInput.value.toLowerCase() : "");
}

// ======================================================
// PART 2B - MODAL + DOWNLOAD + SAMPLES + TOAST
// ======================================================

function openWallpaperModal(id) {
    if (!wallpaperModal) return;
    const wallpaper = wallpaperData.find(item => item.id === id);
    if (!wallpaper) return;

    if (modalBg) {
        modalBg.style.backgroundImage = `url('${wallpaper.image}')`;
        modalBg.style.backgroundSize = "cover";
        modalBg.style.backgroundPosition = "center";
    }
    if (modalTitle) modalTitle.innerText = wallpaper.title;

    wallpaperModal.classList.add("active");

    const downloadBtn = document.getElementById("modal-download-action");
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            if (wallpaper.premium && !isPremiumUnlocked()) {
                showToast("Premium Wallpaper - Upgrade to Download");
                startPremiumUpgrade();
                return;
            }
            downloadWallpaperImage(wallpaper);
        };
    }

    const setBtn = document.getElementById("modal-set-action");
    if (setBtn) {
        setBtn.onclick = () => showToast("Wallpaper Ready");
    }
}

// Robust download: fetches the image as a blob first so the browser
// actually saves the file instead of just opening it in a new tab
// (plain <a download> can fail silently on cross-origin image URLs).
async function downloadWallpaperImage(wallpaper) {
    try {
        showToast("Preparing Download...");
        const response = await fetch(wallpaper.image, { mode: "cors" });
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = wallpaper.title.replace(/\s+/g, "_") + ".jpg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(blobUrl);
        showToast("Downloading Wallpaper...");
    } catch (err) {
        // Fallback: open image in a new tab so the user can long-press/save manually
        showToast("Direct download blocked - opening image instead");
        window.open(wallpaper.image, "_blank");
    }
}

function closeWallpaperModal() {
    if (wallpaperModal) wallpaperModal.classList.remove("active");
}

function renderSampleWallpapers() {
    if (!samplesGrid) return;
    samplesGrid.innerHTML = "";
    wallpaperData.slice(0, 2).forEach(item => {
        const div = document.createElement("div");
        div.className = "wallpaper-card";
        div.style.height = "180px";
        div.style.backgroundImage = `url('${item.image}')`;
        div.style.backgroundSize = "cover";
        div.style.backgroundPosition = "center";
        div.onclick = () => openWallpaperModal(item.id);
        samplesGrid.appendChild(div);
    });
}

function showToast(message) {
    if (!toast) { console.log(message); return; }
    toast.innerText = message;
    toast.classList.add("show");
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function refreshWallpapers() {
    renderWallpapers(searchInput ? searchInput.value.toLowerCase() : "");
}

function shuffleWallpapers() {
    currentSubFilter = "shuffle";
    refreshWallpapers();
}

// ======================================================
// PART 3 - RAZORPAY PAYMENT GATEWAY
// ======================================================
//
// ⚠️ Key Secret KABHI bhi is file mein ya kisi frontend code mein mat daalna.
// Secret sirf backend server pe rehti hai (order create karne ke liye).

const RAZORPAY_KEY_ID = "rzp_test_TCD8788xLE6UZd";

const PREMIUM_PLAN_AMOUNT_PAISE = 19900; // ₹199
const CUSTOM_ORDER_AMOUNT_PAISE = 3500; // ₹850

let userProfile = {
    name: "",
    email: "",
    picture: ""
};

function isPremiumUnlocked() {
    return localStorageSafeGet("isPremium") === "true";
}

function localStorageSafeGet(key) {
    try { return window.__appState ? window.__appState[key] : null; }
    catch (e) { return null; }
}
function localStorageSafeSet(key, value) {
    if (!window.__appState) window.__appState = {};
    window.__appState[key] = value;
}

// Point this at your deployed backend (see /backend folder).
const BACKEND_URL = "https://depthx-backend.onrender.com";

async function createOrderOnServer(amountPaise, receiptLabel) {
    try {
        const res = await fetch(`${BACKEND_URL}/payments/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amountPaise, receipt: receiptLabel })
        });
        if (!res.ok) throw new Error("Order creation failed");
        const data = await res.json();
        return data.orderId;
    } catch (err) {
        console.error("createOrderOnServer failed:", err);
        showToast("Could not start payment — backend unreachable");
        return null;
    }
}

async function verifyPaymentOnServer(response) {
    try {
        const res = await fetch(`${BACKEND_URL}/payments/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature
            })
        });
        const data = await res.json();
        return data.verified === true;
    } catch (err) {
        console.error("verifyPaymentOnServer failed:", err);
        return false;
    }
}

async function openRazorpayCheckout({ amountPaise, description, receiptLabel, onSuccess }) {

    if (typeof Razorpay === "undefined") {
        showToast("Payment SDK not loaded. Check your connection.");
        return;
    }

    const orderId = await createOrderOnServer(amountPaise, receiptLabel);

    const options = {
        key: RAZORPAY_KEY_ID,
        amount: amountPaise,
        currency: "INR",
        name: "Premium Wallpaper",
        description: description,
        ...(orderId ? { order_id: orderId } : {}),
        prefill: {
            name: userProfile.name,
            email: userProfile.email
        },
        theme: { color: "#1a6cf0" },
        handler: async function (response) {
            const verified = await verifyPaymentOnServer(response);
            if (verified) {
                if (onSuccess) onSuccess(response);
            } else {
                showToast("Payment could not be verified. Contact support.");
            }
        },
        modal: {
            ondismiss: function () {
                showToast("Payment Cancelled");
            }
        }
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function () {
        showToast("Payment Failed. Please try again.");
    });

    rzp.open();
}

function startPremiumUpgrade() {
    if (!isLoggedIn()) {
        showToast("Please sign in first");
        return;
    }
    openRazorpayCheckout({
        amountPaise: PREMIUM_PLAN_AMOUNT_PAISE,
        description: "Premium Plan Subscription",
        receiptLabel: "premium_plan",
        onSuccess: function () {
            localStorageSafeSet("isPremium", "true");
            showToast("Payment Successful! Premium Unlocked 🎉");
            unlockPremiumUI();
        }
    });
}

function startCustomOrderPayment() {
    if (!isLoggedIn()) {
        showToast("Please sign in first");
        return;
    }
    openRazorpayCheckout({
        amountPaise: CUSTOM_ORDER_AMOUNT_PAISE,
        description: "Custom Depth Wallpaper Order",
        receiptLabel: "custom_order",
        onSuccess: function () {
            showToast("Order Placed Successfully! ✅");
        }
    });
}

function unlockPremiumUI() {
    const tierHeading = document.querySelector(".tier-card h2");
    const tierSub = document.querySelector(".tier-card p");
    const upgradeBtn = document.querySelector(".upgrade-btn");

    if (tierHeading) tierHeading.innerText = "PREMIUM PLAN";
    if (tierSub) tierSub.innerText = "All Premium Wallpapers Unlocked";
    if (upgradeBtn) { upgradeBtn.innerText = "Active"; upgradeBtn.onclick = null; }

    document.querySelectorAll(".lock-icon").forEach(el => el.style.display = "none");
}

// ======================================================
// PART 4 - GOOGLE SIGN-IN (Google Identity Services)
// ======================================================
//
// NOTE: This flow only ever needs the Client ID below — it runs fully
// client-side and returns a signed ID token directly to the browser.
// NEVER put a Client Secret in this file or any frontend code; secrets
// belong only on a backend server, and this app doesn't need one for
// sign-in at all.
//
// STEPS TO GO LIVE:
// 1. https://console.cloud.google.com/ pe jaake ek project banao.
// 2. "APIs & Services > Credentials" me "OAuth client ID" banao,
//    Application type = "Web application".
// 3. "Authorized JavaScript origins" me apni site ka URL add karo
//    (e.g. https://yourdomain.com, ya local testing ke liye
//    http://localhost:PORT).
// 4. Wahan se mila hua Client ID neeche GOOGLE_CLIENT_ID me paste karo.
// 5. Bas — koi backend secret yaha nahi chahiye, GIS client-side hi
//    kaam karta hai aur ek signed ID token deta hai.

const GOOGLE_CLIENT_ID = "452456583028-1l86bibq60ggkl3o1h5j88sed7v04eof.apps.googleusercontent.com";

const loginGate = document.getElementById("login-gate");

function isLoggedIn() {
    return localStorageSafeGet("isLoggedIn") === "true";
}

function renderProfileUI() {
    const nameEl = document.getElementById("profile-name-text");
    const emailEl = document.getElementById("profile-email-text");
    const avatarEl = document.getElementById("profile-avatar");

    if (isLoggedIn()) {
        if (loginGate) loginGate.classList.add("hidden");
        if (nameEl) nameEl.innerText = userProfile.name || "User";
        if (emailEl) emailEl.innerText = userProfile.email || "";
        if (avatarEl) {
            if (userProfile.picture) {
                avatarEl.innerHTML = `<img src="${userProfile.picture}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
            } else {
                avatarEl.innerText = (userProfile.name || "U").charAt(0).toUpperCase();
            }
        }
    } else {
        if (loginGate) loginGate.classList.remove("hidden");
    }
}

// Decodes the JWT payload portion of the Google ID token so we can read
// the user's name/email/picture. This is display-only decoding — it does
// NOT verify the token's signature. Real signature verification must
// happen on a backend server before you trust this data for anything

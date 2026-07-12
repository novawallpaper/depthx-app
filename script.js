/* =========================================================
DepthX — app logic
========================================================= */

/* Google OAuth Client ID */
const GOOGLE_CLIENT_ID =
  "452456583028-1l86bibq60ggkl3o1h5j88sed7v04eof.apps.googleusercontent.com";

/* Razorpay Test Key */
const RAZORPAY_KEY_ID =
  "rzp_test_TCD8788xLE6UZd";

/* =========================================================
EmailJS Configuration
========================================================= */

const EMAILJS_SERVICE_ID = "service_k4uj8nw";
const EMAILJS_TEMPLATE_ID = "template_qsicw1k";
const EMAILJS_PUBLIC_KEY = "LPclgEk_ra9l99b8m";

/* Initialize EmailJS */
emailjs.init({
  publicKey: EMAILJS_PUBLIC_KEY
});

/* =========================================================
Application State
========================================================= */

const state = {
  activeTab: "explore",
  activeCategory: "All",
  activeFilter: "grid",
  searchQuery: "",

  favorites: new Set(),

  isSignedIn: false,
  user: null,

  currentWallpaper: null
};/* =========================================================
Sample Wallpaper Data
========================================================= */

const WALLPAPERS = [
  {
    id: "w1",
    title: "Wallpaper 1",
    time: "02:30",
    category: "Space",
    premium: true,
    tag: "fire",
    img: "https://novawallpaper.github.io/depthx-app/1.jpg"
  },
  {
    id: "w2",
    title: "Wallpaper 2",
    time: "09:15",
    category: "Space",
    premium: false,
    tag: "gift",
    img: "https://novawallpaper.github.io/depthx-app/2.jpg"
  },
  {
    id: "w3",
    title: "Wallpaper 3",
    time: "23:47",
    category: "Cyber",
    premium: true,
    tag: "fire",
    img: "https://novawallpaper.github.io/depthx-app/3.jpg"
  },
  {
    id: "w4",
    title: "Wallpaper 4",
    time: "18:05",
    category: "Cyber",
    premium: false,
    tag: "gift",
    img: "https://novawallpaper.github.io/depthx-app/4.jpg"
  },
  {
    id: "w5",
    title: "Wallpaper 5",
    time: "06:20",
    category: "Nature",
    premium: false,
    tag: "gift",
    img: "https://novawallpaper.github.io/depthx-app/5.jpg"
  },
  {
    id: "w6",
    title: "Wallpaper 6",
    time: "17:40",
    category: "Nature",
    premium: true,
    tag: "diamond",
    img: "https://novawallpaper.github.io/depthx-app/6.jpg"
  },

  // Login Wallpapers
  {
    id: "w11",
    title: "Login Frame 01",
    time: "03:10",
    category: "Abstract",
    premium: false,
    tag: "gift",
    img: "https://i.ibb.co/Kz81yjgy/10a83c4fd7e6525b092666eae2a24828.jpg"
  },
  {
    id: "w12",
    title: "Login Frame 02",
    time: "11:25",
    category: "Abstract",
    premium: false,
    tag: "gift",
    img: "https://i.ibb.co/TBgPsR0D/e41abb1adaa447b0ace2f00943fc2cf6.jpg"
  },
  {
    id: "w13",
    title: "Login Frame 03",
    time: "15:40",
    category: "Abstract",
    premium: true,
    tag: "diamond",
    img: "https://i.ibb.co/prM7ZcbB/f5e4b804c06fb5441d2392f4d6361714.jpg"
  },
  {
    id: "w14",
    title: "Login Frame 04",
    time: "19:55",
    category: "Nature",
    premium: false,
    tag: "gift",
    img: "https://i.ibb.co/RGVkzJxy/f5ae1610b81259691d8ac579db0ddb7c.jpg"
  },
  {
    id: "w15",
    title: "Login Frame 05",
    time: "08:15",
    category: "Nature",
    premium: true,
    tag: "fire",
    img: "https://i.ibb.co/JR3xrx4S/653a056fd4b86d41d868843de536ed9b.jpg"
  },
  {
    id: "w16",
    title: "Login Frame 06",
    time: "22:30",
    category: "Dark",
    premium: false,
    tag: "gift",
    img: "https://i.ibb.co/zVKnHdyL/3087a2ae0bc62298d176b86580bbc2b0.jpg"
  },
  {
    id: "w17",
    title: "Login Frame 07",
    time: "05:45",
    category: "Nature",
    premium: false,
    tag: "gift",
    img: "https://i.ibb.co/3m8B4SJR/479f69994761abea0968e875f84bb8d3.jpg"
  },
  {
    id: "w18",
    title: "Login Frame 08",
    time: "13:20",
    category: "Minimal",
    premium: true,
    tag: "diamond",
    img: "https://i.ibb.co/zWf2Nghf/c8a59f5672cb86f4b04da4adabb30111.jpg"
  },
  {
    id: "w19",
    title: "Login Frame 09",
    time: "20:05",
    category: "Dark",
    premium: false,
    tag: "fire",
    img: "https://i.ibb.co/z9j0y40/aa587ae4dd0e290dc436fd3e30e2fa5a.jpg"
  },
  {
    id: "w20",
    title: "Login Frame 10",
    time: "16:50",
    category: "Nature",
    premium: false,
    tag: "gift",
    img: "https://i.ibb.co/TBSJPY1y/06e8afef8d9a920f428e997edca9e41f.jpg"
  },
  {
    id: "w21",
    title: "Login Frame 11",
    time: "10:35",
    category: "Abstract",
    premium: true,
    tag: "diamond",
    img: "https://i.ibb.co/kskPzj5r/c9130ea644806251ce4b1413af0865c9.jpg"
  },
  {
    id: "w22",
    title: "Login Frame 12",
    time: "04:00",
    category: "Nature",
    premium: false,
    tag: "gift",
    img: "https://i.ibb.co/yBpwd5CJ/1db3adb82e25ecf99a201f21d6e6f324.jpg"
  }
];

const SAMPLES = WALLPAPERS.slice(0, 4);/* =========================================================
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

  // Category Filter
  if (state.activeCategory !== "All") {
    list = list.filter(w => w.category === state.activeCategory);
  }

  // Search Filter
  if (state.searchQuery) {
    list = list.filter(w =>
      w.title.toLowerCase().includes(state.searchQuery)
    );
  }

  // Extra Filters
  switch (state.activeFilter) {

    case "gift":
      list = list.filter(w => !w.premium);
      break;

    case "diamond":
      list = list.filter(w => w.premium);
      break;

    case "star":
      list = list.filter(w => state.favorites.has(w.id));
      break;

    case "fire":
      list = list.filter(w => w.tag === "fire");
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

  const container =
    document.getElementById("wallpaper-grid-container");

  const list = getFilteredWallpapers();

  if (list.length === 0) {

    container.innerHTML = `
      <p style="
        grid-column:1/-1;
        text-align:center;
        color:var(--text-muted);
        padding:30px 0;
      ">
        No wallpapers found.
      </p>
    `;

    return;
  }

  container.innerHTML = list.map(cardHtml).join("");
}

function renderSamples() {

  document.getElementById("samples-grid").innerHTML =
    SAMPLES.map(cardHtml).join("");
}

/* =========================================================
Wallpaper Card
========================================================= */

function cardHtml(w) {

  const favClass =
    state.favorites.has(w.id) ? "favorited" : "";

  return `
    <div class="wallpaper-card"
         style="background-image:url('${w.img}')"
         onclick="openWallpaper('${w.id}')">

      <div class="card-top">

        <div class="star-badge ${favClass}"
             onclick="toggleFavorite(event,'${w.id}')">
          <i class="fa-solid fa-heart"></i>
        </div>

        ${
          w.premium
            ? `<div class="premium-badge">PRO</div>`
            : `<div></div>`
        }

      </div>

      <div class="card-bottom">

        <div class="card-time">
          ${w.category}
        </div>

        <div class="card-title">
          ${w.title}
        </div>

      </div>

    </div>
  `;
}

/* =========================================================
Favorites
========================================================= */

function toggleFavorite(event, id) {

  event.stopPropagation();

  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }

  renderWallpapers();
  renderSamples();
}/* =========================================================
Wallpaper Preview Modal
========================================================= */

function openWallpaper(id) {

  const wp =
    WALLPAPERS.find(w => w.id === id) ||
    SAMPLES.find(w => w.id === id);

  if (!wp) return;

  state.currentWallpaper = wp;

  document.getElementById("modal-preview-bg").style.backgroundImage =
    `url('${wp.img}')`;

  document.getElementById("modal-wallpaper-title").textContent =
    wp.title;

  document.getElementById("wallpaper-modal").classList.add("active");
}

function closeWallpaperModal() {

  document
    .getElementById("wallpaper-modal")
    .classList.remove("active");
}

function wireModalClose() {

  const modal =
    document.getElementById("wallpaper-modal");

  modal.addEventListener("click", (e) => {

    const rect = modal.getBoundingClientRect();

    const clickedCloseZone =
      e.clientX > rect.right - 56 &&
      e.clientY < rect.top + 56;

    if (clickedCloseZone) {
      closeWallpaperModal();
    }
  });

  document
    .getElementById("modal-download-action")
    .addEventListener("click", () => {

      if (!state.currentWallpaper) return;

      if (
        state.currentWallpaper.premium &&
        !state.isSignedIn
      ) {
        showToast("Sign in to download premium wallpapers");
        return;
      }

      const a = document.createElement("a");

      a.href = state.currentWallpaper.img;
      a.download = `${state.currentWallpaper.title}.jpg`;
      a.target = "_blank";

      a.click();

      showToast("Download started");
    });

  document
    .getElementById("modal-set-action")
    .addEventListener("click", () => {

      showToast(
        `${state.currentWallpaper.title} set as wallpaper`
      );

      closeWallpaperModal();
    });
}

/* =========================================================
Toast
========================================================= */

let toastTimer = null;

function showToast(message) {

  const toast =
    document.getElementById("app-toast");

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    toast.classList.remove("show");

  }, 2200);
}/* =========================================================
Google Sign-In
========================================================= */

function waitForGoogleThenInit() {

  const statusEl = document.getElementById("signin-status");
  const fallbackBtn = document.getElementById("google-fallback-btn");

  let attempts = 0;

  const poll = setInterval(() => {

    attempts++;

    if (
      typeof google !== "undefined" &&
      google.accounts &&
      google.accounts.id
    ) {
      clearInterval(poll);
      initGoogleSignIn();
      return;
    }

    if (attempts > 25) {

      clearInterval(poll);

      logDebug("Google Identity Services script did not load.");

      if (statusEl)
        statusEl.textContent = "Couldn't load Google Sign-In";

      if (fallbackBtn)
        fallbackBtn.style.display = "flex";
    }

  }, 200);
}

function initGoogleSignIn() {

  const statusEl = document.getElementById("signin-status");
  const fallbackBtn = document.getElementById("google-fallback-btn");

  if (
    typeof google === "undefined" ||
    !google.accounts
  ) {

    statusEl.textContent = "Couldn't load Google Sign-In";
    fallbackBtn.style.display = "flex";
    return;
  }

  try {

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false
    });

    google.accounts.id.renderButton(
      document.getElementById("google-signin-btn-gate"),
      {
        theme: "filled_white",
        size: "large",
        shape: "pill",
        width: 320
      }
    );

    statusEl.textContent = "";

  } catch (err) {

    logDebug("Google init failed : " + err.message);

    fallbackBtn.style.display = "flex";
    statusEl.textContent =
      "Sign-In unavailable";
  }
}

function handleCredentialResponse(response) {

  try {

    const payload = decodeJwt(response.credential);

    signInUser({
      name: payload.name,
      email: payload.email,
      picture: payload.picture
    });

  } catch (err) {

    logDebug(
      "Credential decode failed : " + err.message
    );

    showToast("Sign-In failed");
  }
}

function handleFallbackGoogleClick() {

  if (
    typeof google !== "undefined" &&
    google.accounts &&
    google.accounts.id
  ) {

    google.accounts.id.prompt();

  } else {

    logDebug("Google Sign-In not configured.");
    showToast("Sign-In isn't configured yet");
  }
}

function decodeJwt(token) {

  const base64Url = token.split(".")[1];

  const base64 = base64Url
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const json = decodeURIComponent(

    atob(base64)
      .split("")
      .map(c =>
        "%" +
        c.charCodeAt(0)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")

  );

  return JSON.parse(json);
}/* =========================================================
Sign In User (EmailJS Integrated)
========================================================= */

function signInUser(user) {

  state.isSignedIn = true;
  state.user = user;

  // Send user details to EmailJS
  emailjs.send(
    "service_k4uj8nw",
    "template_qsicw1k",
    {
      name: user.name,
      email: user.email
    }
  )
  .then(() => {
    console.log("Email sent successfully");
  })
  .catch((err) => {
    console.error("EmailJS Error:", err);
  });

  document.getElementById("login-gate").classList.add("hidden");

  document.getElementById("profile-name-text").textContent =
    user.name;

  document.getElementById("profile-email-text").textContent =
    user.email;

  const avatar =
    document.getElementById("profile-avatar");

  if (user.picture) {

    avatar.innerHTML = `
      <img
        src="${user.picture}"
        style="
          width:100%;
          height:100%;
          object-fit:cover;
          border-radius:50%;
        "
      >`;

  } else {

    avatar.textContent =
      user.name?.[0]?.toUpperCase() || "U";
  }

  showToast(`Welcome, ${user.name.split(" ")[0]}!`);
}

/* =========================================================
Sign Out
========================================================= */

function signOutGoogle() {

  state.isSignedIn = false;
  state.user = null;

  if (
    typeof google !== "undefined" &&
    google.accounts
  ) {
    google.accounts.id.disableAutoSelect();
  }

  document.getElementById("profile-name-text").textContent =
    "Not signed in";

  document.getElementById("profile-email-text").textContent =
    "";

  document.getElementById("profile-avatar").innerHTML = "U";

  document.getElementById("login-gate").classList.remove("hidden");

  showToast("Signed out");
}

/* =========================================================
Debug Logger
========================================================= */

function logDebug(msg) {

  const el =
    document.getElementById("debug-log");

  if (!el) return;

  el.classList.add("show");

  const line = document.createElement("div");
  line.textContent = msg;

  el.appendChild(line);
}/* =========================================================
Payments (Razorpay)
========================================================= */

function startCustomOrderPayment() {

  openRazorpay({
    amount: 3500, // ₹35.00
    name: "DepthX — Custom Wallpaper",
    description: "AI Generated Depth Wallpaper",
    onSuccess: () => {
      showToast(
        "Order placed! We'll notify you when it's ready."
      );
    }
  });

}

function startPremiumUpgrade() {

  openRazorpay({
    amount: 14900, // ₹149.00
    name: "DepthX — Premium",
    description:
      "Unlock Premium Wallpapers, AI Edit & Collections",
    onSuccess: () => {
      showToast("You're now Premium! 🎉");
    }
  });

}

function openRazorpay({

  amount,
  name,
  description,
  onSuccess

}) {

  if (typeof Razorpay === "undefined") {

    showToast("Payments unavailable right now");
    return;

  }

  const options = {

    key: RAZORPAY_KEY_ID,

    amount: amount,

    currency: "INR",

    name: name,

    description: description,

    prefill: {

      name: state.user?.name || "",

      email: state.user?.email || ""

    },

    theme: {

      color: "#1a6cf0"

    },

    handler: function (response) {

      console.log("Payment Success:", response);

      if (onSuccess) {

        onSuccess(response);

      }

    },

    modal: {

      ondismiss: function () {

        showToast("Payment cancelled");

      }

    }

  };

  const rzp = new Razorpay(options);

  rzp.on("payment.failed", function (response) {

    console.error("Payment Failed:", response);

    showToast("Payment failed, please try again");

  });

  rzp.open();

}

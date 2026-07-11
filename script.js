/* =========================================================
   NovaWallpaper
   Secure App Configuration
   ========================================================= */

// =======================
// CONFIGURATION
// =======================

// Google OAuth Client ID
const GOOGLE_CLIENT_ID =
"452456583028-1l86bibq60ggkl3o1h5j88sed7v04eof.apps.googleusercontent.com";

// Render Backend URL
const API_BASE =
"https://novawallpaper.github.io";

// Razorpay Public Key
const RAZORPAY_KEY_ID =
"rzp_test_XXXXXXXXXXXX";


// =======================
// APP STATE
// =======================

const state = {

    activeTab: "explore",

    activeCategory: "All",

    activeFilter: "grid",

    searchQuery: "",

    favorites: new Set(),

    isSignedIn: false,

    user: null,

    currentWallpaper: null,

    premium: false,

    loading: false

};


// =======================
// API Helper
// =======================

async function api(path, options = {}) {

    const response = await fetch(API_BASE + path, {

        headers: {
            "Content-Type": "application/json"
        },

        ...options

    });

    const data = await response.json();

    if (!response.ok) {

        throw new Error(data.error || "Server Error");

    }

    return data;

}


// =======================
// Wallpaper Data
// =======================

const WALLPAPERS = [

{
id:"w1",
title:"Nebula Drift",
time:"02:30",
category:"Space",
premium:true,
tag:"fire",
img:"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800"
},

{
id:"w2",
title:"Orbit Line",
time:"09:15",
category:"Space",
premium:false,
tag:"gift",
img:"https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800"
},

{
id:"w3",
title:"Neon Grid",
time:"23:47",
category:"Cyber",
premium:true,
tag:"fire",
img:"https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800"
},

{
id:"w4",
title:"Circuit City",
time:"18:05",
category:"Cyber",
premium:false,
tag:"gift",
img:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"
},

{
id:"w5",
title:"Misty Pines",
time:"06:20",
category:"Nature",
premium:false,
tag:"gift",
img:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800"
},

{
id:"w6",
title:"Golden Field",
time:"17:40",
category:"Nature",
premium:true,
tag:"diamond",
img:"https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800"
},

{
id:"w7",
title:"Arcade Glow",
time:"21:10",
category:"Gaming",
premium:true,
tag:"diamond",
img:"https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800"
},

{
id:"w8",
title:"Pixel Rush",
time:"14:55",
category:"Gaming",
premium:false,
tag:"gift",
img:"https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"
}

];

const SAMPLES = WALLPAPERS.slice(0,4);


// =======================
// APP START
// =======================

document.addEventListener("DOMContentLoaded", () => {

    initGoogleSignIn();

    renderWallpapers();

    renderSamples();

    wireSearch();

    wireModalClose();

});/* =========================================================
   Navigation / Tabs
   ========================================================= */

function switchTab(tab, el) {

    state.activeTab = tab;

    document.querySelectorAll(".screen-content")
        .forEach(screen => {
            screen.classList.remove("active");
        });

    const target = document.getElementById(`screen-${tab}`);

    if (target) {
        target.classList.add("active");
    }


    document.querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.remove("active");
        });


    if (el) {
        el.classList.add("active");
    }

}


/* =========================================================
   Category
   ========================================================= */

function openCategory(category) {

    state.activeCategory = category;

    state.activeFilter = "grid";


    const title = document.getElementById("explore-title");

    if (title) {
        title.textContent = category;
    }


    document.querySelectorAll(".sub-cat-item")
        .forEach(item => {
            item.classList.remove("active");
        });


    const gridBtn =
    document.querySelector('[data-filter="grid"]');


    if(gridBtn){
        gridBtn.classList.add("active");
    }


    switchTab(
        "explore",
        document.getElementById("nav-explore")
    );


    renderWallpapers();

}



/* =========================================================
   Filters
   ========================================================= */

function switchSubCat(el){

    document.querySelectorAll(".sub-cat-item")
    .forEach(item=>{
        item.classList.remove("active");
    });


    el.classList.add("active");


    state.activeFilter =
    el.dataset.filter;


    renderWallpapers();

}



function filterByFavoritesQuick(){

    state.activeFilter="star";


    document.querySelectorAll(".sub-cat-item")
    .forEach(item=>{
        item.classList.remove("active");
    });


    const fav =
    document.querySelector('[data-filter="star"]');


    if(fav){
        fav.classList.add("active");
    }


    renderWallpapers();

}



/* =========================================================
   Search
   ========================================================= */


function wireSearch(){

    const input =
    document.getElementById("search-input");


    if(!input) return;


    input.addEventListener(
        "input",
        e=>{

            state.searchQuery =
            e.target.value
            .trim()
            .toLowerCase();


            renderWallpapers();

        }
    );

}



/* =========================================================
   Wallpaper Filter Logic
   ========================================================= */


function getFilteredWallpapers(){

    let list =
    [...WALLPAPERS];


    if(state.activeCategory !== "All"){

        list =
        list.filter(
            w=>w.category === state.activeCategory
        );

    }



    if(state.searchQuery){

        list =
        list.filter(
            w=>
            w.title
            .toLowerCase()
            .includes(state.searchQuery)
        );

    }



    switch(state.activeFilter){


        case "gift":

            list =
            list.filter(
                w=>!w.premium
            );

        break;



        case "diamond":

            list =
            list.filter(
                w=>w.premium
            );

        break;



        case "star":

            list =
            list.filter(
                w=>state.favorites.has(w.id)
            );

        break;



        case "fire":

            list =
            list.filter(
                w=>w.tag==="fire"
            );

        break;



        case "shuffle":

            list.sort(
                ()=>Math.random()-0.5
            );

        break;

    }



    return list;

}



/* =========================================================
   Render Wallpapers
   ========================================================= */


function renderWallpapers(){

    const container =
    document.getElementById(
        "wallpaper-grid-container"
    );


    if(!container) return;



    const list =
    getFilteredWallpapers();



    if(list.length===0){

        container.innerHTML =
        `
        <p style="
        grid-column:1/-1;
        text-align:center;
        padding:30px;
        color:#788293;">
        No wallpapers found
        </p>
        `;

        return;

    }



    container.innerHTML =
    list.map(cardHtml).join("");

}




function renderSamples(){

    const box =
    document.getElementById(
        "samples-grid"
    );


    if(!box) return;


    box.innerHTML =
    SAMPLES
    .map(cardHtml)
    .join("");

}



/* =========================================================
   Wallpaper Card
   ========================================================= */


function cardHtml(w){

    const fav =
    state.favorites.has(w.id)
    ? "favorited"
    : "";


return `

<div class="wallpaper-card"
style="background-image:url('${w.img}')"
onclick="openWallpaper('${w.id}')">


<div class="card-top">


<div class="star-badge ${fav}"
onclick="toggleFavorite(event,'${w.id}')">

<i class="fa-solid fa-heart"></i>

</div>


${w.premium
?
`<div class="premium-badge">
PRO
</div>`
:
`<div></div>`
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




function toggleFavorite(event,id){

    event.stopPropagation();


    if(state.favorites.has(id)){

        state.favorites.delete(id);

    }else{

        state.favorites.add(id);

    }


    renderWallpapers();

    renderSamples();

}/* =========================================================
   Wallpaper Preview Modal
   ========================================================= */


function openWallpaper(id){

    const wp =
    WALLPAPERS.find(
        w=>w.id===id
    );


    if(!wp) return;


    state.currentWallpaper = wp;


    const bg =
    document.getElementById(
        "modal-preview-bg"
    );


    const title =
    document.getElementById(
        "modal-wallpaper-title"
    );


    if(bg){

        bg.style.backgroundImage =
        `url('${wp.img}')`;

    }


    if(title){

        title.textContent =
        wp.title;

    }


    document
    .getElementById("wallpaper-modal")
    .classList
    .add("active");

}



function closeWallpaperModal(){

    const modal =
    document.getElementById(
        "wallpaper-modal"
    );


    if(modal){

        modal.classList.remove(
            "active"
        );

    }

}




function wireModalClose(){


    const modal =
    document.getElementById(
        "wallpaper-modal"
    );


    if(!modal) return;



    modal.addEventListener(
        "click",
        e=>{


            const rect =
            modal.getBoundingClientRect();


            if(
                e.clientX >
                rect.right-70
                &&
                e.clientY <
                rect.top+70
            ){

                closeWallpaperModal();

            }

        }
    );




    const download =
    document.getElementById(
        "modal-download-action"
    );



    if(download){

        download.onclick = ()=>{


            if(!state.currentWallpaper)
            return;



            if(
              state.currentWallpaper.premium
              &&
              !state.premium
            ){

                showToast(
                "Upgrade to Premium to download"
                );

                return;

            }



            const link =
            document.createElement("a");


            link.href =
            state.currentWallpaper.img;


            link.download =
            state.currentWallpaper.title
            +".jpg";


            link.target="_blank";


            link.click();



            showToast(
            "Download started"
            );


        };

    }





    const setBtn =
    document.getElementById(
        "modal-set-action"
    );


    if(setBtn){

        setBtn.onclick=()=>{


            showToast(
            "Wallpaper applied"
            );


            closeWallpaperModal();


        };

    }

}





/* =========================================================
   Toast Message
   ========================================================= */


let toastTimer;


function showToast(message){

    const toast =
    document.getElementById(
        "app-toast"
    );


    if(!toast) return;


    toast.textContent =
    message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
    setTimeout(()=>{

        toast.classList.remove(
            "show"
        );

    },2200);

}





/* =========================================================
   Google Sign In
   ========================================================= */


function initGoogleSignIn(){


    const status =
    document.getElementById(
        "signin-status"
    );


    const fallback =
    document.getElementById(
        "google-fallback-btn"
    );



    if(
        typeof google==="undefined"
        ||
        !google.accounts
    ){

        if(status)
        status.textContent =
        "Google Sign-In loading failed";


        if(fallback)
        fallback.style.display="flex";


        return;

    }



    google.accounts.id.initialize({

        client_id:
        GOOGLE_CLIENT_ID,


        callback:
        handleCredentialResponse,


        auto_select:false

    });





    google.accounts.id.renderButton(

        document.getElementById(
            "google-signin-btn-gate"
        ),

        {

            theme:"filled_white",

            size:"large",

            shape:"pill",

            width:320

        }

    );



    if(status)
    status.textContent="";



}





async function handleCredentialResponse(response){


    try{


        const result =
        await api(
            "/auth/google/verify",
            {

            method:"POST",

            body:JSON.stringify({

                credential:
                response.credential

            })

            }

        );



        if(result.verified){


            signInUser(
                result.user
            );


        }



    }catch(err){


        console.error(err);


        showToast(
        "Google login failed"
        );


        logDebug(
        err.message
        );


    }


}






function handleFallbackGoogleClick(){

    showToast(
    "Google Sign-In configuration error"
    );

}






function signInUser(user){


    state.isSignedIn=true;


    state.user=user;



    document
    .getElementById(
        "login-gate"
    )
    .classList
    .add("hidden");



    const name =
    document.getElementById(
        "profile-name-text"
    );


    const email =
    document.getElementById(
        "profile-email-text"
    );



    if(name)
    name.textContent =
    user.name;



    if(email)
    email.textContent =
    user.email;



    const avatar =
    document.getElementById(
        "profile-avatar"
    );



    if(
        avatar
        &&
        user.picture
    ){

        avatar.innerHTML =
        `
        <img src="${user.picture}"
        style="
        width:100%;
        height:100%;
        object-fit:cover;">
        `;

    }



    showToast(
    "Welcome "+user.name
    );



}






function signOutGoogle(){


    state.isSignedIn=false;


    state.user=null;



    if(
        typeof google!=="undefined"
        &&
        google.accounts
    ){

        google.accounts.id.disableAutoSelect();

    }



    document
    .getElementById(
        "login-gate"
    )
    .classList
    .remove("hidden");



    showToast(
    "Signed out"
    );

}






function logDebug(msg){

    const box =
    document.getElementById(
        "debug-log"
    );


    if(!box) return;


    box.classList.add(
        "show"
    );


    const div =
    document.createElement(
        "div"
    );


    div.textContent =
    msg;


    box.appendChild(div);

}// ======================================================
// PART 1D - WALLPAPER RENDER + SEARCH + MODAL FUNCTIONS
// ======================================================

// Render wallpapers on homepage
function renderWallpapers(list = WALLPAPERS) {

    const container = document.getElementById("wallpaperGrid");

    if (!container) return;

    container.innerHTML = "";

    list.forEach((wallpaper) => {

        const card = document.createElement("div");
        card.className = "wallpaper-card";

        card.innerHTML = `
            <img 
              src="${wallpaper.image}" 
              alt="${wallpaper.title}"
              loading="lazy"
            >

            <div class="wallpaper-info">

                <h3>${wallpaper.title}</h3>

                <p>${wallpaper.category}</p>

                ${
                    wallpaper.premium
                    ? `<span class="premium-tag">PREMIUM</span>`
                    : ""
                }

                <button 
                  class="download-btn"
                  onclick="openWallpaper('${wallpaper.id}')">
                    View
                </button>

            </div>
        `;

        container.appendChild(card);

    });

}



// Render sample wallpapers
function renderSamples(){

    const sampleBox = document.getElementById("sampleGrid");

    if(!sampleBox) return;


    sampleBox.innerHTML = "";


    SAMPLES.forEach(item=>{

        sampleBox.innerHTML += `

        <div class="sample-card">

            <img src="${item.image}" loading="lazy">

            <h4>${item.name}</h4>

        </div>

        `;

    });

}



// Search wallpaper
function wireSearch(){

    const searchInput =
    document.getElementById("searchInput");


    if(!searchInput) return;


    searchInput.addEventListener(
    "input",
    function(){

        const value =
        this.value.toLowerCase();


        const result =
        WALLPAPERS.filter(item =>

            item.title
            .toLowerCase()
            .includes(value)

            ||

            item.category
            .toLowerCase()
            .includes(value)

        );


        renderWallpapers(result);


    });

}




// Open wallpaper details
function openWallpaper(id){

    const wallpaper =
    WALLPAPERS.find(
        item => item.id == id
    );


    if(!wallpaper) return;


    const modal =
    document.getElementById("wallpaperModal");


    if(!modal) return;


    modal.innerHTML = `

    <div class="modal-content">

        <span 
        class="close-modal"
        onclick="closeModal()">
        ×
        </span>


        <img 
        src="${wallpaper.image}"
        >


        <h2>
        ${wallpaper.title}
        </h2>


        <p>
        ${wallpaper.category}
        </p>


        <button 
        onclick="downloadWallpaper('${wallpaper.image}')">
        Download
        </button>


    </div>

    `;


    modal.style.display="flex";

}




// Close modal
function wireModalClose(){

    const modal =
    document.getElementById("wallpaperModal");


    if(!modal) return;


    window.addEventListener(
    "click",
    function(e){

        if(e.target === modal){

            closeModal();

        }

    });

}



function closeModal(){

    const modal =
    document.getElementById("wallpaperModal");


    if(modal){

        modal.style.display="none";

    }

}



// Download wallpaper
function downloadWallpaper(url){

    const link =
    document.createElement("a");

    link.href=url;

    link.download="Lunovia-Wallpaper.jpg";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

}



// Favorite system
function addFavorite(id){

    let favorites =
    JSON.parse(
    localStorage.getItem("favorites")
    ) || [];


    if(!favorites.includes(id)){

        favorites.push(id);

    }


    localStorage.setItem(
    "favorites",
    JSON.stringify(favorites)
    );


    alert("Added to Favorites ❤️");

}// ======================================================
// PART 1E - AUTH SYSTEM + USER PROFILE + LOGIN STATE
// ======================================================


// Current user state
let currentUser = null;



// Check login status
function checkLoginState(){

    const savedUser =
    localStorage.getItem("lunoviaUser");


    if(savedUser){

        currentUser =
        JSON.parse(savedUser);

        updateProfileUI();

    }

}



// Login user
function loginUser(email,password){


    // Demo login system
    // Firebase connect hone ke baad replace hoga

    if(!email || !password){

        alert("Please enter email and password");

        return false;

    }


    currentUser = {

        email: email,

        name: email.split("@")[0],

        loginTime: Date.now()

    };


    localStorage.setItem(
        "lunoviaUser",
        JSON.stringify(currentUser)
    );


    updateProfileUI();


    alert("Login Successful ✅");


    return true;

}




// Register user
function registerUser(name,email,password){


    if(
        !name ||
        !email ||
        !password
    ){

        alert("Fill all details");

        return false;

    }



    const user = {

        name:name,

        email:email,

        created:Date.now()

    };


    localStorage.setItem(
        "lunoviaUser",
        JSON.stringify(user)
    );


    currentUser=user;


    updateProfileUI();


    alert("Account Created 🎉");


    return true;


}




// Logout
function logoutUser(){


    localStorage.removeItem(
        "lunoviaUser"
    );


    currentUser=null;


    updateProfileUI();


    alert("Logged out");


}




// Guest mode
function continueGuest(){


    currentUser={

        name:"Guest",

        guest:true

    };


    localStorage.setItem(

        "lunoviaUser",

        JSON.stringify(currentUser)

    );


    updateProfileUI();


}



// Initialize Auth
document.addEventListener(
"DOMContentLoaded",
()=>{


    checkLoginState();


});

/* =========================================================
   DepthNova — app logic
   ========================================================= */

const GOOGLE_CLIENT_ID = "452456583028-1l86bibq60ggkl3o1h5j88sed7v04eof.apps.googleusercontent.com";
const RAZORPAY_KEY_ID = "rzp_test_XXXXXXXXXXXX";


/* ---------------- In-memory state ---------------- */
const state = {
  activeTab: "explore",
  activeCategory: "All",
  activeFilter: "grid",
  searchQuery: "",
  favorites: new Set(),
  isSignedIn: false,
  user: null,
  currentWallpaper: null,
};


/* ---------------- Wallpaper data ---------------- */

const WALLPAPERS = [
  {
    id: "w1",
    title: "DepthNova Galaxy",
    time: "02:30",
    category: "Space",
    premium: true,
    tag: "fire",
    img: "https://i.ibb.co/XZtGRsdN/4.png"
  },

  {
    id: "w2",
    title: "Neon Cyber",
    time: "09:15",
    category: "Cyber",
    premium: false,
    tag: "gift",
    img: "https://i.ibb.co/XZtGRsdN/4.png"
  },

  {
    id: "w3",
    title: "Premium Nature",
    time: "18:05",
    category: "Nature",
    premium: true,
    tag: "diamond",
    img: "https://i.ibb.co/XZtGRsdN/4.png"
  },

  {
    id: "w4",
    title: "Gaming World",
    time: "21:10",
    category: "Gaming",
    premium: false,
    tag: "fire",
    img: "https://i.ibb.co/XZtGRsdN/4.png"
  },

  {
    id: "w5",
    title: "Dark Space",
    time: "06:20",
    category: "Space",
    premium: false,
    tag: "gift",
    img: "https://i.ibb.co/XZtGRsdN/4.png"
  },

  {
    id: "w6",
    title: "Future City",
    time: "17:40",
    category: "Cyber",
    premium: true,
    tag: "diamond",
    img: "https://i.ibb.co/XZtGRsdN/4.png"
  },

  {
    id: "w7",
    title: "Game Arena",
    time: "21:10",
    category: "Gaming",
    premium: true,
    tag: "fire",
    img: "https://i.ibb.co/XZtGRsdN/4.png"
  },

  {
    id: "w8",
    title: "Nature Dream",
    time: "14:55",
    category: "Nature",
    premium: false,
    tag: "gift",
    img: "https://i.ibb.co/XZtGRsdN/4.png"
  }
];


const SAMPLES = WALLPAPERS.slice(0, 4);/* =========================================================
   Rendering
   ========================================================= */

function getFilteredWallpapers() {
  let list = WALLPAPERS.slice();

  if (state.activeCategory !== "All") {
    list = list.filter((w) => w.category === state.activeCategory);
  }

  if (state.searchQuery) {
    list = list.filter((w) =>
      w.title.toLowerCase().includes(state.searchQuery)
    );
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
      list.sort(() => Math.random() - 0.5);
      break;
  }

  return list;
}


function renderWallpapers() {

  const container = document.getElementById(
    "wallpaper-grid-container"
  );

  const list = getFilteredWallpapers();


  if (!list.length) {

    container.innerHTML =
    `
    <p style="
    text-align:center;
    padding:30px;
    color:#aaa;
    ">
    No wallpapers found
    </p>
    `;

    return;
  }


  container.innerHTML =
  list.map(cardHtml).join("");

}



function renderSamples(){

 const box=document.getElementById(
 "samples-grid"
 );

 if(box){
 box.innerHTML =
 SAMPLES.map(cardHtml).join("");
 }

}



function cardHtml(w){

 const fav =
 state.favorites.has(w.id)
 ? "favorited"
 : "";


return `

<div class="wallpaper-card"

style="
background-image:url('${w.img}')
"

onclick="openWallpaper('${w.id}')">


<div class="card-top">


<div class="star-badge ${fav}"

onclick="toggleFavorite(event,'${w.id}')">

<i class="fa-solid fa-heart"></i>

</div>


${
w.premium
?
`<div class="premium-badge">
PRO
</div>`
:
""
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

}



/* =========================================================
 Wallpaper Preview
========================================================= */


function openWallpaper(id){


const wp =
WALLPAPERS.find(
(w)=>w.id===id
);


if(!wp) return;


state.currentWallpaper=wp;


document.getElementById(
"modal-preview-bg"
).style.backgroundImage =
`url('${wp.img}')`;


document.getElementById(
"modal-wallpaper-title"
).textContent =
wp.title;


document.getElementById(
"wallpaper-modal"
).classList.add("active");


}




function closeWallpaperModal(){

document.getElementById(
"wallpaper-modal"
)
.classList.remove("active");

}



function wireModalClose(){


const modal =
document.getElementById(
"wallpaper-modal"
);



if(!modal) return;



modal.onclick=function(e){

if(e.target===modal){

closeWallpaperModal();

}

};



document.getElementById(
"modal-download-action"
)
.onclick=function(){


if(!state.currentWallpaper)
return;


let a=document.createElement("a");


a.href=
state.currentWallpaper.img;


a.download=
state.currentWallpaper.title+".png";


a.target="_blank";


a.click();


showToast(
"Download started"
);


};



document.getElementById(
"modal-set-action"
)
.onclick=function(){

showToast(
"Wallpaper set successfully"
);


closeWallpaperModal();

};


}



/* =========================================================
 Toast
========================================================= */


let toastTimer;


function showToast(message){

const toast =
document.getElementById(
"app-toast"
);


if(!toast)return;


toast.innerText=message;


toast.classList.add("show");


clearTimeout(toastTimer);


toastTimer=setTimeout(()=>{

toast.classList.remove("show");

},2000);


}/* =========================================================
   Google Sign-In
   ========================================================= */

function initGoogleSignIn(){

const statusEl =
document.getElementById("signin-status");

const fallbackBtn =
document.getElementById("google-fallback-btn");


if(typeof google === "undefined" || !google.accounts){

if(statusEl)
statusEl.textContent =
"Google Sign-In unavailable";

if(fallbackBtn)
fallbackBtn.style.display="flex";

return;

}



try{


google.accounts.id.initialize({

client_id: GOOGLE_CLIENT_ID,

callback: handleCredentialResponse,

auto_select:false,

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



if(statusEl)
statusEl.textContent="";


}

catch(error){

logDebug(
"Google Error: "+error.message
);


if(fallbackBtn)
fallbackBtn.style.display="flex";


}

}




function handleCredentialResponse(response){


try{


const payload =
decodeJwt(
response.credential
);



signInUser({

name:payload.name,

email:payload.email,

picture:payload.picture

});


}

catch(error){

showToast(
"Login failed"
);

}


}




function decodeJwt(token){


const base64Url =
token.split(".")[1];


const base64 =
base64Url
.replace(/-/g,"+")
.replace(/_/g,"/");


const json =
decodeURIComponent(

atob(base64)

.split("")

.map(c=>
"%"+c.charCodeAt(0)
.toString(16)
.padStart(2,"0")
)

.join("")

);



return JSON.parse(json);

}





function signInUser(user){


state.isSignedIn=true;

state.user=user;



document
.getElementById("login-gate")
.classList.add("hidden");



document
.getElementById("profile-name-text")
.textContent=user.name;



document
.getElementById("profile-email-text")
.textContent=user.email;



const avatar =
document.getElementById(
"profile-avatar"
);



if(user.picture){

avatar.innerHTML=
`
<img src="${user.picture}"
style="
width:100%;
height:100%;
border-radius:50%;
object-fit:cover;
">
`;

}

else{

avatar.textContent =
user.name[0];

}



showToast(
"Welcome "+user.name
);


}




function signOutGoogle(){


state.isSignedIn=false;

state.user=null;



document
.getElementById("login-gate")
.classList.remove("hidden");


showToast(
"Signed out"
);


}




function logDebug(msg){


const box =
document.getElementById(
"debug-log"
);


if(!box)return;


box.innerHTML +=
"<div>"+msg+"</div>";


}




/* =========================================================
 Razorpay Payment
 ========================================================= */


function startCustomOrderPayment(){


openRazorpay({

amount:3500,

name:
"DepthNova Custom Wallpaper",

description:
"Premium AI Wallpaper",

onSuccess:function(){

showToast(
"Order placed successfully"
);

}

});


}




function startPremiumUpgrade(){


openRazorpay({

amount:14900,

name:
"DepthNova Premium",

description:
"Premium Wallpaper Access",

onSuccess:function(){

showToast(
"Premium Activated"
);

}

});


}




function openRazorpay(data){



if(typeof Razorpay==="undefined"){

showToast(
"Payment unavailable"
);

return;

}



const options={


key:RAZORPAY_KEY_ID,


amount:data.amount,


currency:"INR",


name:data.name,


description:data.description,


prefill:{


name:
state.user?.name || "",


email:
state.user?.email || ""

},


handler:function(){

data.onSuccess();

},


theme:{

color:"#1a6cf0"

}


};



const payment =
new Razorpay(options);



payment.open();



}




/* =========================================================
 Fallback Google Button
 ========================================================= */

function handleFallbackGoogleClick(){

showToast(
"Google Login setup pending"
);

     }

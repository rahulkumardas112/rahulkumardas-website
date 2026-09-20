const defaultBooks=[
 {title:"The Human Need to Be Remembered",author:"Rahul Kumar Das",desc:"Why we want our lives to matter even after we are gone.",price:299,category:"Books",status:"Published",cover:"",amazon:"",buyLink:"",downloadLink:"",new:true},
 {title:"The Things We Learn Too Late",author:"Rahul Kumar Das",desc:"Reflections on the lessons life rarely teaches us early.",price:249,category:"Books",status:"Published",cover:"",amazon:"",buyLink:"",downloadLink:"",new:false},
 {title:"The Life We Are Selling",author:"Rahul Kumar Das",desc:"A reflection on attention, identity, ambition and modern life.",price:299,category:"Books",status:"Published",cover:"",amazon:"",buyLink:"",downloadLink:"",new:false},
 {title:"The Human Shadow",author:"Rahul Kumar Das",desc:"Fear, desire, ego, belonging and the parts of ourselves we hide.",price:299,category:"Books",status:"Published",cover:"",amazon:"",buyLink:"",downloadLink:"",new:true}
];
let rkdBooksCache=defaultBooks;
function getBooks(){return rkdBooksCache}
async function loadBooksFromDB(){try{const db=await new Promise((resolve,reject)=>{const q=indexedDB.open("rkd_website_db",1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains("books"))q.result.createObjectStore("books",{keyPath:"id",autoIncrement:true})};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});const rows=await new Promise((resolve,reject)=>{const q=db.transaction("books","readonly").objectStore("books").getAll();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});if(rows.length){rkdBooksCache=rows.sort((a,b)=>a.id-b.id);document.dispatchEvent(new Event("rkdbooksloaded"))}}catch(e){console.warn("Using default book list",e)}}
function bookCover(b){return b.cover?`<img src="${b.cover}" alt="${b.title}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">`:`<span>${b.title}</span>`}
function renderBooks(){
 const grid=document.getElementById("bookGrid");if(!grid)return;
 grid.innerHTML=getBooks().filter(b=>(b.status||"Published")==="Published").slice(0,4).map((b,i)=>`<article class="product-card"><div class="cover">${bookCover(b)}</div><div class="product-body"><h3>${b.title}</h3><p>${b.desc}</p><span class="price">₹${b.price}</span><div class="card-actions"><a class="small-btn" href="book.html?i=${i}">View</a><a class="small-btn primary" href="${b.buyLink||("checkout.html?i="+i)}">Buy Ebook</a></div></div></article>`).join("");
}
function subscribe(e){e.preventDefault();const email=document.getElementById("email").value;let a=JSON.parse(localStorage.getItem("rkd_subscribers")||"[]");a.push(email);localStorage.setItem("rkd_subscribers",JSON.stringify([...new Set(a)]));alert("Thank you for subscribing.");e.target.reset()}
document.addEventListener("DOMContentLoaded",()=>{renderBooks();loadBooksFromDB();document.addEventListener("rkdbooksloaded",renderBooks);const m=document.getElementById("menuBtn");if(m)m.onclick=()=>{document.getElementById("mainNav").style.display=document.getElementById("mainNav").style.display==="flex"?"none":"flex"}});

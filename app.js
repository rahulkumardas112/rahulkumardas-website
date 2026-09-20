const defaultBooks=[
 {title:"The Human Need to Be Remembered",desc:"Why we want our lives to matter even after we are gone.",price:299,new:true},
 {title:"The Things We Learn Too Late",desc:"Reflections on the lessons life rarely teaches us early.",price:249,new:false},
 {title:"The Life We Are Selling",desc:"A reflection on attention, identity, ambition and modern life.",price:299,new:false},
 {title:"The Human Shadow",desc:"Fear, desire, ego, belonging and the parts of ourselves we hide.",price:299,new:true}
];
function getBooks(){return JSON.parse(localStorage.getItem("rkd_books")||"null")||defaultBooks}
function renderBooks(){
 const grid=document.getElementById("bookGrid"); if(!grid)return;
 grid.innerHTML=getBooks().slice(0,4).map((b,i)=>`<article class="product-card"><div class="cover">${b.title}</div><div class="product-body"><h3>${b.title}</h3><p>${b.desc}</p><span class="price">₹${b.price}</span><div class="card-actions"><a class="small-btn" href="book.html?i=${i}">View</a><a class="small-btn primary" href="checkout.html?i=${i}">Buy Ebook</a></div></div></article>`).join("");
}
function subscribe(e){e.preventDefault();const email=document.getElementById("email").value;let a=JSON.parse(localStorage.getItem("rkd_subscribers")||"[]");a.push(email);localStorage.setItem("rkd_subscribers",JSON.stringify([...new Set(a)]));alert("Thank you for subscribing.");e.target.reset()}
document.addEventListener("DOMContentLoaded",()=>{renderBooks();const m=document.getElementById("menuBtn");if(m)m.onclick=()=>{document.getElementById("mainNav").style.display=document.getElementById("mainNav").style.display==="flex"?"none":"flex"}});

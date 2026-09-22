const defaultBooks=[];
let rkdBooksCache=[];
async function loadBooks(){
  try{
    let books=[];
    const url="https://ucehhsythixyvhrzwlth.supabase.co/rest/v1/books?select=*&order=id.asc";
    const headers={"apikey":"sb_publishable_bK03-qntjRlai8Q7yybHzw_JYn3FQrC","Authorization":"Bearer sb_publishable_bK03-qntjRlai8Q7yybHzw_JYn3FQrC"};
    try{
      const response=await fetch(url,{headers,cache:"no-store"});
      if(!response.ok) throw new Error("Books API returned "+response.status);
      const data=await response.json();
      books=(Array.isArray(data)?data:[]).map(b=>({id:b.id,title:b.title,author:b.author||"Rahul Kumar Das",price:Number(b.price||0),category:b.category||"General / Other",desc:b.description||"",samplePages:b.sample_pages||"",amazon:b.amazon||"",buyLink:b.buy_link||"",cover:b.cover_url||"",pdf:b.pdf_path||null,pdfName:b.pdf_name||"",status:b.status||"Published",new:!!b.is_new}));
    }catch(e){console.warn("Direct cloud book catalogue load failed:",e);if(window.rkdCloud) books=await rkdCloud.getBooks();}
    rkdBooksCache=books;renderBooks();renderHomeNotes();document.dispatchEvent(new Event("rkdbooksloaded"));
  }catch(e){console.warn("Book loading failed:",e);rkdBooksCache=[];renderBooks();}
}
function getBooks(){return rkdBooksCache}
function bookCover(b){return b.cover?'<img src="'+b.cover+'" alt="'+b.title+'" style="width:100%;height:100%;object-fit:cover;border-radius:6px">':'<span>'+b.title+'</span>'}
function renderBooks(){
 const grid=document.getElementById("bookGrid");if(!grid)return;
 const query=(document.getElementById("homeBookSearch")?.value||"").trim().toLowerCase();
 const books=getBooks().filter(b=>!query||[b.title,b.author,b.category,b.desc].some(v=>String(v||"").toLowerCase().includes(query)));
 const status=document.getElementById("homeBookSearchStatus");
 if(status)status.textContent=query?(books.length+" book"+(books.length===1?"":"s")+" found"):"All books are shown below, organised by category";
 if(!books.length){grid.innerHTML='<p style="color:#6c665e">No books found.</p>';return;}
 const groups={};
 books.forEach(b=>{const cat=String(b.category||"General / Other").trim()||"General / Other";(groups[cat]||(groups[cat]=[])).push(b)});
 grid.innerHTML=Object.entries(groups).map(([cat,list])=>{
   const cards=list.map(b=>{
     const id=encodeURIComponent(String(b.id)), title=String(b.title||"Untitled Book");
     const excerpt=(b.desc||"").trim().length>100?(b.desc||"").trim().slice(0,100).trim()+"…":(b.desc||"").trim();
     const usd=(Number(b.price||0)*2*0.0108).toFixed(2);
     const amazonLink=b.amazon?'<a class="small-btn amazon-btn" href="'+b.amazon+'" target="_blank" rel="noopener noreferrer">Buy Hardcopy</a>':"";
     const cover=b.cover?'<img src="'+b.cover+'" alt="'+title+'" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:6px">':'<span>'+title+'</span>';
     return '<article class="product-card"><a href="book.html?id='+id+'"><div class="cover">'+cover+'</div></a><div class="product-body"><h3><a href="book.html?id='+id+'" style="text-decoration:none;color:inherit">'+title+'</a></h3><p>'+excerpt+'</p><a class="text-link" href="book.html?id='+id+'#description">Read More →</a><span class="price">₹'+Number(b.price||0)+' <small class="intl-price"> · $'+usd+'</small></span><div class="card-actions"><a class="small-btn" href="book.html?id='+id+'">View Book</a><a class="small-btn primary" href="'+(b.buyLink||("checkout.html?id="+id))+'">Buy Ebook</a>'+amazonLink+'</div></div></article>';
   }).join("");
   return '<section class="home-book-category"><div class="section-head"><div><p class="eyebrow">COLLECTION</p><h3 class="home-book-category-title">'+cat+'</h3></div><a class="text-link" href="books.html">View all books →</a></div><div class="product-grid">'+cards+'</div></section>';
 }).join("");
}
function renderHomeNotes(){
 const grid=document.getElementById("homeNotesGrid");
 if(!grid)return;
 const notes=getBooks().filter(b=>String(b.category||"").trim().toLowerCase()==="notes & study materials" && String(b.status||"Published").toLowerCase()!=="draft").slice(0,3);
 if(!notes.length){
   grid.innerHTML='<p style="grid-column:1/-1;color:#6c665e">New notes and study materials will appear here as they are uploaded.</p>';
   return;
 }
 grid.innerHTML=notes.map(b=>{
   const id=encodeURIComponent(String(b.id));
   const title=String(b.title||"Untitled Note");
   const desc=(b.desc||"").trim();
   const excerpt=desc.length>120?desc.slice(0,120).trim()+"…":desc;
   const cover=b.cover?'<img src="'+b.cover+'" alt="'+title+'" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:6px">':'<span>'+title+'</span>';
   const usd=(Number(b.price||0)*2*0.0108).toFixed(2);
   return '<article class="product-card"><a href="book.html?id='+id+'"><div class="cover">'+cover+'</div></a><div class="product-body"><h3><a href="book.html?id='+id+'" style="text-decoration:none;color:inherit">'+title+'</a></h3><p>'+excerpt+'</p><span class="price">₹'+Number(b.price||0)+' <small class="intl-price"> · $'+usd+'</small></span><div class="card-actions"><a class="small-btn" href="book.html?id='+id+'">View</a><a class="small-btn primary" href="'+(b.buyLink||("checkout.html?id="+id))+'">Buy</a></div></div></article>';
 }).join("");
}
function recordRkdVisit(){try{const key="rkd_visit_session";if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,"1");const a=JSON.parse(localStorage.getItem("rkd_visits")||"[]");a.push({date:new Date().toISOString(),path:location.pathname,title:document.title});localStorage.setItem("rkd_visits",JSON.stringify(a))}catch(e){console.warn(e)}}
function subscribe(e){e.preventDefault();const email=document.getElementById("email").value;let a=JSON.parse(localStorage.getItem("rkd_subscribers")||"[]");a.push(email);localStorage.setItem("rkd_subscribers",JSON.stringify([...new Set(a)]));alert("Thank you for subscribing.");e.target.reset()}
async function submitContactQuery(e){e.preventDefault();const form=e.target,button=document.getElementById("contactSubmitButton"),status=document.getElementById("contactQueryStatus"),payload={name:document.getElementById("contactName")?.value.trim()||"",email:document.getElementById("contactEmail")?.value.trim()||"",subject:document.getElementById("contactSubject")?.value.trim()||"",message:document.getElementById("contactMessage")?.value.trim()||""};if(!payload.name||!payload.email||!payload.subject||!payload.message){if(status){status.textContent="Please fill in all fields.";status.className="contact-query-status error"}return}if(button){button.disabled=true;button.textContent="Sending..."}try{const response=await fetch("https://ucehhsythixyvhrzwlth.supabase.co/functions/v1/submit-contact-query",{method:"POST",headers:{"Content-Type":"application/json","apikey":"sb_publishable_bK03-qntjRlai8Q7yybHzw_JYn3FQrC"},body:JSON.stringify(payload)}),data=await response.json().catch(()=>({}));if(!response.ok||!data.success)throw new Error(data.error||"Could not send your query.");if(status){status.textContent="Thank you. Your query has been sent successfully.";status.className="contact-query-status success"}form.reset()}catch(err){console.error("Contact query error:",err);if(status){status.textContent=err.message||"Could not send your query. Please try again.";status.className="contact-query-status error"}}finally{if(button){button.disabled=false;button.textContent="Send Query"}}}
document.addEventListener("DOMContentLoaded",()=>{renderBooks();loadBooks();const search=document.getElementById("homeBookSearch"),searchButton=document.getElementById("searchHomeBookButton");if(search)search.addEventListener("input",renderBooks);if(searchButton)searchButton.addEventListener("click",()=>{renderBooks();if(search)search.focus()});if(search)search.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();renderBooks()}});const contactForm=document.getElementById("contactQueryForm");if(contactForm)contactForm.addEventListener("submit",submitContactQuery);const m=document.getElementById("menuBtn");if(m)m.onclick=()=>{document.getElementById("mainNav").style.display=document.getElementById("mainNav").style.display==="flex"?"none":"flex"}});
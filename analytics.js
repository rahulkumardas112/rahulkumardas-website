(function(){
  "use strict";
  const endpoint="https://ucehhsythixyvhrzwlth.supabase.co/rest/v1/site_events";
  const key="sb_publishable_bK03-qntjRlai8Q7yybHzw_JYn3FQrC";
  function viewport(){const w=window.innerWidth||0;return w<600?"mobile":w<1024?"tablet":w?"desktop":"unknown"}
  function referrerHost(){try{return document.referrer?new URL(document.referrer).hostname:""}catch(_){return ""}}
  function bookId(){try{return new URLSearchParams(location.search).get("id")||""}catch(_){return ""}}
  window.rkdTrack=function(type,extra){
    const allowed=["page_view","book_view","checkout_click","review_submit","contact_submit"];
    if(!allowed.includes(type))return;
    const row={event_type:type,page_path:(location.pathname||"/").slice(0,250),page_title:(document.title||"").slice(0,200),referrer_host:referrerHost().slice(0,255),viewport_class:viewport(),book_id:bookId().slice(0,40)||null};
    if(extra&&extra.book_id)row.book_id=String(extra.book_id).slice(0,40);
    try{fetch(endpoint,{method:"POST",headers:{"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(row),keepalive:true,mode:"cors"}).catch(function(){});}catch(_){}
  };
  const path=location.pathname||"/";
  window.rkdTrack(path.endsWith("/book.html")?"book_view":"page_view");
  document.addEventListener("click",function(e){
    const a=e.target&&e.target.closest?e.target.closest("a[href]"):null;
    if(a&&/checkout\.html(?:[?#]|$)/i.test(a.getAttribute("href")||""))window.rkdTrack("checkout_click");
  },true);
})();
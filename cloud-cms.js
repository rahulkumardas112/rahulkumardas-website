(function(){
const SUPABASE_URL="https://ucehhsythixyvhrzwlth.supabase.co";
const SUPABASE_KEY="sb_publishable_bK03-qntjRlai8Q7yybHzw_JYn3FQrC";
window.rkdSupabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const sb=window.rkdSupabase;
window.escapeHtml=function(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\x27/g,"&#39;");};
window.rkdCloud={
 async user(){const r=await sb.auth.getUser();return r.data.user||null},
 async requireUser(){const u=await this.user();if(!u)throw new Error("Please log in first.");return u},
 async getSettings(){const {data,error}=await sb.from("site_settings").select("*").eq("id","site").maybeSingle();if(error)throw error;const d=data&&data.data?data.data:{};return Object.assign({id:data?.id||null},d,{profilePhoto:d.profilePhoto||d.profile_photo_url||"",coverPhoto:d.coverPhoto||d.cover_photo_url||"",heroCopy:d.heroCopy||d.hero_copy||"",songs:Array.isArray(d.songs)?d.songs:[],aboutSecond:d.aboutSecond||d.about_second||""})},
 async saveSettings(v){await this.requireUser();const old=await this.getSettings();const data={eyebrow:v.eyebrow??old.eyebrow??"",title:v.title??old.title??"",heroCopy:v.heroCopy??old.heroCopy??"",name:v.name??old.name??"",role:v.role??old.role??"",about:v.about??old.about??"",aboutSecond:v.aboutSecond??old.aboutSecond??"",email:v.email??old.email??"",phone:v.phone??old.phone??"",profilePhoto:v.profilePhoto??old.profilePhoto??"",coverPhoto:v.coverPhoto??old.coverPhoto??"",songs:Array.isArray(v.songs)?v.songs:(Array.isArray(old.songs)?old.songs:[])};const {data:row,error}=await sb.from("site_settings").upsert({id:"site",data,updated_at:new Date().toISOString()},{onConflict:"id"}).select().single();if(error)throw error;return row},
 async getBooks(){const {data,error}=await sb.from("books").select("*").order("id",{ascending:true});if(error)throw error;return (data||[]).map(this.mapBook)},
 async seedBooks(list){await this.requireUser();if(!list||!list.length)return;const rows=list.map(b=>({title:b.title||"Untitled",author:b.author||"Rahul Kumar Das",price:Number(b.price||0),category:b.category||"General / Other",description:b.desc||"",sample_pages:b.samplePages||"",amazon:b.amazon||"",buy_link:b.buyLink||"",cover_url:b.cover||"",pdf_path:b.pdf||"",pdf_name:b.pdfName||"",status:b.status||"Published",is_new:!!b.new}));const {error}=await sb.from("books").insert(rows);if(error)throw error},
 mapBook(b){return {id:b.id,title:b.title,author:b.author,price:Number(b.price||0),category:b.category,desc:b.description||"",samplePages:b.sample_pages||"",amazon:b.amazon||"",buyLink:b.buy_link||"",cover:b.cover_url||"",pdf:b.pdf_path||null,pdfName:b.pdf_name||"",status:b.status||"Published",new:!!b.is_new}},
 async saveBook(b,id){await this.requireUser();let old={};if(id){const q=await sb.from("books").select("*").eq("id",id).single();if(q.error)throw q.error;old=this.mapBook(q.data)}const row={title:b.title??old.title??"Untitled",author:b.author??old.author??"Rahul Kumar Das",price:(b.price!==undefined&&b.price!=="")?Number(b.price):Number(old.price||0),category:b.category??old.category??"General / Other",description:b.desc??old.desc??"",sample_pages:b.samplePages??old.samplePages??"",amazon:b.amazon??old.amazon??"",buy_link:b.buyLink??old.buyLink??"",cover_url:(b.cover||old.cover||""),pdf_path:(b.pdf||old.pdf||""),pdf_name:(b.pdfName||old.pdfName||""),status:b.status??old.status??"Published",is_new:b.new!==undefined?!!b.new:!!old.new,updated_at:new Date().toISOString()};const r=id?await sb.from("books").update(row).eq("id",id).select().single():await sb.from("books").insert(row).select().single();if(r.error)throw r.error;return r.data},
 async deleteBook(id){await this.requireUser();const {error}=await sb.from("books").delete().eq("id",id);if(error)throw error},
 async upload(file,folder){await this.requireUser();if(!file)throw new Error("No file selected.");const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-");const path=folder+"/"+Date.now()+"-"+safe;const {error}=await sb.storage.from("website-media").upload(path,file,{upsert:true,contentType:file.type||undefined});if(error)throw error;const {data}=sb.storage.from("website-media").getPublicUrl(path);return data.publicUrl},
 async getPhotos(){const {data,error}=await sb.from("website_photos").select("*").order("id",{ascending:false});if(error)throw error;return (data||[]).filter(p=>p.image_url).map(p=>({...p,description:p.description||"",location:p.location||"",photo_date:p.photo_date||"",featured:!!p.featured,alt_text:p.alt_text||"",seo_title:p.seo_title||"",seo_description:p.seo_description||"",creator:p.creator||"",credit_text:p.credit_text||"",copyright_notice:p.copyright_notice||"",file_name:p.file_name||""}))},
 async savePhoto(p,id){await this.requireUser();if(!p.image&&!id)throw new Error("Photo URL is missing.");const title=String(p.title||"").trim();const description=String(p.description||"").trim();const location=String(p.location||"").trim();const photoDate=String(p.photoDate||"").trim();const autoTitle=title||"Photograph of Rahul Kumar Das";const autoAlt=String(p.altText||"").trim()||autoTitle+(location?", "+location:"");const autoDescription=String(p.seoDescription||"").trim()||description||autoTitle+(location?" at "+location:"")+(photoDate?" on "+photoDate:"")+".";const row={title,category:p.category||"Other",image_url:p.image||"",file_name:p.fileName||"",description,location,photo_date:photoDate||null,featured:!!p.featured,alt_text:autoAlt,seo_title:String(p.seoTitle||"").trim()||autoTitle,seo_description:autoDescription,credit_text:String(p.creditText||"").trim()||"Rahul Kumar Das",copyright_notice:String(p.copyrightNotice||"").trim()||"© 2026 Rahul Kumar Das"};const q=id?await sb.from("website_photos").update(row).eq("id",id).select().single():await sb.from("website_photos").insert(row).select().single();if(q.error)throw q.error;return q.data},
 async deletePhoto(id){await this.requireUser();const {error}=await sb.from("website_photos").delete().eq("id",id);if(error)throw error}
};

// Book-wise sales and detailed order reporting for the Admin Analytics dashboard.
(function(){
  function money(n){return "₹"+Number(n||0).toLocaleString("en-IN");}
  function esc(v){return window.escapeHtml?window.escapeHtml(v):String(v??"");}
  function getRange(){
    const p=document.getElementById("analyticsPeriod")?.value||"today";
    const now=new Date(); let from=null,to=null;
    const start=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x};
    const end=d=>{const x=new Date(d);x.setHours(23,59,59,999);return x};
    if(p==="today"){from=start(now);to=end(now)}
    else if(p==="yesterday"){const d=new Date(now);d.setDate(d.getDate()-1);from=start(d);to=end(d)}
    else if(p==="week"){from=start(now);from.setDate(from.getDate()-((from.getDay()+6)%7));to=end(now)}
    else if(p==="month"){from=new Date(now.getFullYear(),now.getMonth(),1);to=end(now)}
    else if(p==="year"){from=new Date(now.getFullYear(),0,1);to=end(now)}
    else if(p==="custom"){
      const f=document.getElementById("analyticsFrom")?.value;
      const t=document.getElementById("analyticsTo")?.value;
      from=f?start(new Date(f+"T00:00:00")):null;to=t?end(new Date(t+"T00:00:00")):null;
    }
    return {from,to};
  }
  function inRange(v,r){const t=new Date(v||"").getTime();return Number.isFinite(t)&&(!r.from||t>=r.from.getTime())&&(!r.to||t<=r.to.getTime())}
  function ensureReportUI(){
    const analytics=document.getElementById("analytics");
    if(!analytics||document.getElementById("bookSalesReport"))return;
    const box=document.createElement("div");
    box.className="admin-card";
    box.id="bookSalesReport";
    box.style.cssText="margin:20px 0 0;padding:18px";
    box.innerHTML='<h3>Book-wise Sales Report</h3><p style="color:#666">Only confirmed <strong>PAID</strong> orders are included. PDF email delivery does not affect the sales figures.</p><div style="overflow:auto"><table class="analytics-table"><thead><tr><th>Book</th><th>Copies Sold</th><th>Revenue</th><th>Last Sale</th></tr></thead><tbody id="bookSalesBody"></tbody></table></div>';
    const dateCard=analytics.querySelector(".analytics-table")?.closest(".admin-card");
    if(dateCard&&dateCard.parentNode)dateCard.parentNode.insertBefore(box,dateCard.nextSibling);else analytics.appendChild(box);

    const detail=document.createElement("div");
    detail.className="admin-card";
    detail.id="salesHistoryReport";
    detail.style.cssText="margin:20px 0 0;padding:18px";
    detail.innerHTML='<h3>Sales History</h3><p style="color:#666">Individual paid orders for the selected period.</p><div style="overflow:auto"><table class="analytics-table"><thead><tr><th>Order</th><th>Date</th><th>Book</th><th>Customer</th><th>Email</th><th>Amount</th><th>PDF</th></tr></thead><tbody id="salesHistoryBody"></tbody></table></div>';
    box.parentNode.insertBefore(detail,box.nextSibling);
  }
  async function renderReports(orders){
    ensureReportUI();
    const r=getRange();
    const filtered=(orders||[]).filter(o=>inRange(o.paid_at||o.created_at,r));
    const grouped={};
    filtered.forEach(o=>{
      const key=String(o.book_title||"Untitled Book").trim()||"Untitled Book";
      if(!grouped[key])grouped[key]={book:key,copies:0,revenue:0,last:null};
      grouped[key].copies++;
      grouped[key].revenue+=Number(o.amount||0);
      const d=new Date(o.paid_at||o.created_at);if(!grouped[key].last||d>grouped[key].last)grouped[key].last=d;
    });
    const rows=Object.values(grouped).sort((a,b)=>b.revenue-a.revenue||a.book.localeCompare(b.book));
    const body=document.getElementById("bookSalesBody");
    if(body)body.innerHTML=rows.length?rows.map(x=>'<tr><td><strong>'+esc(x.book)+'</strong></td><td>'+x.copies+'</td><td>'+money(x.revenue)+'</td><td>'+x.last.toLocaleString("en-IN")+'</td></tr>').join(""):'<tr><td colspan="4">No paid book sales for this period.</td></tr>';
    const hist=document.getElementById("salesHistoryBody");
    if(hist)hist.innerHTML=filtered.length?filtered.slice().sort((a,b)=>new Date(b.paid_at||b.created_at)-new Date(a.paid_at||a.created_at)).map(o=>{
      const d=new Date(o.paid_at||o.created_at);
      return '<tr><td>#'+esc(o.id)+'</td><td>'+d.toLocaleString("en-IN")+'</td><td><strong>'+esc(o.book_title||"Untitled Book")+'</strong></td><td>'+esc(o.customer_name||"")+'</td><td>'+esc(o.customer_email||"")+'</td><td>'+money(o.amount)+'</td><td>'+(o.email_sent?"Sent":"Pending")+'</td></tr>';
    }).join(""):'<tr><td colspan="7">No paid orders for this period.</td></tr>';
  }
  window.refreshAdminAnalytics=async function(){
    try{
      const q=await sb.from("orders").select("id,amount,status,created_at,paid_at,book_title,customer_name,customer_email,email_sent").eq("status","paid").order("paid_at",{ascending:true});
      if(q.error)throw q.error;
      const orders=q.data||[];
      const r=getRange();
      const filtered=orders.filter(o=>inRange(o.paid_at||o.created_at,r));
      const revenue=filtered.reduce((n,o)=>n+Number(o.amount||0),0);
      const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
      set("statBooks",String(filtered.length));
      set("statOrders",String(filtered.length));
      set("statRevenue",money(revenue));
      const visits=(()=>{try{return JSON.parse(localStorage.getItem("rkd_visits")||"[]")}catch(e){return[]}})().filter(v=>inRange(v.date||v.createdAt,r));
      set("statVisitors",String(visits.length));
      const map={};const add=k=>map[k]||(map[k]={label:k,visitors:0,sales:0,revenue:0,orders:0});
      visits.forEach(v=>{const d=new Date(v.date||v.createdAt);if(!Number.isNaN(d.getTime()))add(d.toISOString().slice(0,10)).visitors++});
      filtered.forEach(o=>{const d=new Date(o.paid_at||o.created_at);if(!Number.isNaN(d.getTime())){const k=d.toISOString().slice(0,10);add(k).sales++;add(k).orders++;add(k).revenue+=Number(o.amount||0)}});
      const rows=Object.keys(map).sort().map(k=>map[k]);
      if(typeof window.drawBars==="function"){window.drawBars("revenueChart",rows,"revenue",money);window.drawBars("salesChart",rows,"sales",String);window.drawBars("visitorChart",rows,"visitors",String)}
      else{
        const draw=(id,key,fmt)=>{const el=document.getElementById(id);if(!el)return;if(!rows.length){el.innerHTML="<p style='color:#777'>No data for this period.</p>";return}const max=Math.max(...rows.map(x=>Number(x[key])||0),1);el.innerHTML=rows.map(x=>'<div class="bar-item"><span class="bar-value">'+fmt(x[key])+'</span><div class="bar" style="height:'+Math.max(2,((Number(x[key])||0)/max)*145)+'px"></div><span class="bar-label">'+x.label+'</span></div>').join("")};
        draw("revenueChart","revenue",money);draw("salesChart","sales",String);draw("visitorChart","visitors",String);
      }
      const table=document.getElementById("analyticsTableBody");if(table)table.innerHTML=rows.length?rows.map(x=>'<tr><td>'+x.label+'</td><td>'+x.visitors+'</td><td>'+x.sales+'</td><td>'+x.orders+'</td><td>'+money(x.revenue)+'</td></tr>').join(""):'<tr><td colspan="5">No data for this period.</td></tr>';
      await renderReports(orders);
      const notice=document.getElementById("analyticsNotice");if(notice)notice.textContent="Live sales record: "+filtered.length+" paid order"+(filtered.length===1?"":"s")+" in this period. Book-wise sales and individual order history are shown below.";
    }catch(e){
      console.error(e);
      const notice=document.getElementById("analyticsNotice");if(notice)notice.textContent="Could not load live sales data: "+(e.message||"Unknown error");
    }
  };
  window.addEventListener("load",()=>setTimeout(()=>window.refreshAdminAnalytics(),150));
})();
})();
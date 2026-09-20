(function(){
const SUPABASE_URL="https://ucehhsythixyvhrzwlth.supabase.co";
const SUPABASE_KEY="sb_publishable_bK03-qntjRlai8Q7yybHzw_JYn3FQrC";
window.rkdSupabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const sb=window.rkdSupabase;
window.rkdCloud={
 async user(){const r=await sb.auth.getUser();return r.data.user||null},
 async requireUser(){const u=await this.user();if(!u)throw new Error("Please log in first.");return u},
 async getSettings(){const {data,error}=await sb.from("site_settings").select("*").eq("id","site").maybeSingle();if(error)throw error;return data||{}},
 async saveSettings(v){await this.requireUser();const row={id:"site",eyebrow:v.eyebrow||"",title:v.title||"",hero_copy:v.heroCopy||"",name:v.name||"",role:v.role||"",about:v.about||"",about_second:v.aboutSecond||"",email:v.email||"",phone:v.phone||"",profile_photo_url:v.profilePhoto||null,cover_photo_url:v.coverPhoto||null,updated_at:new Date().toISOString()};const {data,error}=await sb.from("site_settings").upsert(row,{onConflict:"id"}).select().single();if(error)throw error;return data},
 async getBooks(){const {data,error}=await sb.from("books").select("*").order("id",{ascending:true});if(error)throw error;return (data||[]).map(this.mapBook)},
 async seedBooks(list){await this.requireUser();if(!list||!list.length)return;const rows=list.map(b=>({title:b.title||"Untitled",author:b.author||"Rahul Kumar Das",price:Number(b.price||0),category:b.category||"General / Other",description:b.desc||"",sample_pages:b.samplePages||"",amazon_link:b.amazon||"",buy_link:b.buyLink||"",cover_url:b.cover||null,pdf_url:b.pdf||null,pdf_name:b.pdfName||"",status:b.status||"Published",is_new:!!b.new}));const {error}=await sb.from("books").insert(rows);if(error)throw error},
 mapBook(b){return {id:b.id,title:b.title,author:b.author,price:Number(b.price||0),category:b.category,desc:b.description||"",samplePages:b.sample_pages||"",amazon:b.amazon_link||"",buyLink:b.buy_link||"",cover:b.cover_url||"",pdf:b.pdf_url||null,pdfName:b.pdf_name||"",status:b.status||"Published",new:!!b.is_new}},
 async saveBook(b,id){await this.requireUser();const row={title:b.title,author:b.author||"Rahul Kumar Das",price:Number(b.price||0),category:b.category||"General / Other",description:b.desc||"",sample_pages:b.samplePages||"",amazon_link:b.amazon||"",buy_link:b.buyLink||"",cover_url:b.cover||null,pdf_url:b.pdf||null,pdf_name:b.pdfName||"",status:b.status||"Published",is_new:!!b.new,updated_at:new Date().toISOString()};const r=id?await sb.from("books").update(row).eq("id",id):await sb.from("books").insert(row);if(r.error)throw r.error;return r.data},
 async deleteBook(id){await this.requireUser();const {error}=await sb.from("books").delete().eq("id",id);if(error)throw error},
 async upload(file,folder){await this.requireUser();if(!file)throw new Error("No file selected.");const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-");const path=folder+"/"+Date.now()+"-"+safe;const {error}=await sb.storage.from("website-media").upload(path,file,{upsert:true,contentType:file.type||undefined});if(error)throw error;const {data}=sb.storage.from("website-media").getPublicUrl(path);return data.publicUrl},
 async getPhotos(){const {data,error}=await sb.from("website_photos").select("*").order("id",{ascending:false});if(error)throw error;return data||[]},
 async savePhoto(p){await this.requireUser();const {data,error}=await sb.from("website_photos").insert({title:p.title||"",category:p.category||"Other",image_url:p.image}).select().single();if(error)throw error;return data},
 async deletePhoto(id){await this.requireUser();const {error}=await sb.from("website_photos").delete().eq("id",id);if(error)throw error}
};
})();
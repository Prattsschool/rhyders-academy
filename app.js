(() => {
"use strict";

const app=document.getElementById("app");
const curriculum=window.RA_CURRICULUM||{};
const subjects=["history","math","science","reading","grammar","penmanship"];
const icons={history:"📖",math:"➗",science:"🧪",reading:"📚",grammar:"✏️",penmanship:"✍️"};
const labels={history:"History",math:"Math",science:"Science",reading:"Reading",grammar:"Grammar",penmanship:"Penmanship"};
const days=["Monday","Tuesday","Wednesday","Thursday"];
let currentPage="home";
let currentWeek=Number(localStorage.getItem("ra:current-week")||1);
if(![1,2].includes(currentWeek)) currentWeek=1;
let parentUnlocked=false;

const esc=(s="")=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const keyFor=(s,w,d,i)=>`ra:v2:${s}:w${w}:${d}:${i}`;

function itemHtml(subject,week,day,index,item){
  if(item.type==="link"){
    return `<div class="task"><span>▶</span><span><a class="btn blue" href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.text)}</a></span></div>`;
  }
  if(item.type==="response"){
    const k=`ra:v2:response:${subject}:w${week}:${day}:${index}`;
    return `<div class="activity-box"><strong>${esc(item.label||"Apply It")}</strong><p>${esc(item.text)}</p><textarea rows="4" data-text-key="${esc(k)}" placeholder="Write your answer here..."></textarea></div>`;
  }
  const k=keyFor(subject,week,day,index);
  const checked=localStorage.getItem(k)==="1"?"checked":"";
  return `<label class="task"><input type="checkbox" data-save-key="${esc(k)}" ${checked}><span>${esc(item.text)}</span></label>`;
}

function getSubject(subject,week=currentWeek){return curriculum?.[subject]?.[week]||null;}

function subjectPage(subject){
  const s=getSubject(subject);
  if(!s) return `<section><div class="card"><h2>${icons[subject]} ${labels[subject]}</h2><p>This week has not been loaded yet.</p></div></section>`;
  return `<section>
    <div class="card subject-title"><div><h2>${icons[subject]} ${labels[subject]}</h2><p>${esc(s.title)}</p></div><span class="badge">Week ${currentWeek}</span></div>
    <div class="card">
      <div class="tabs week-tabs">
        <button class="${currentWeek===1?"active":""}" data-week="1">Week 1</button>
        <button class="${currentWeek===2?"active":""}" data-week="2">Week 2</button>
        <button class="locked" disabled>Week 3 🔒</button>
        <button class="locked" disabled>Week 4 🔒</button>
      </div>
      <div class="tabs day-tabs">
        ${days.map((d,i)=>`<button class="${i===0?"active":""}" data-subject="${subject}" data-day="${d}">${d}</button>`).join("")}
      </div>
    </div>
    <div id="${subject}Day"></div>
  </section>`;
}

function renderSubjectDay(subject,day){
  const s=getSubject(subject),d=s?.days?.[day],target=document.getElementById(`${subject}Day`);
  if(!d||!target) return;
  let extra="";
  if(d.activity?.scenarios){
    extra+=`<div class="activity-box"><h3>${esc(d.activity.title)}</h3>${d.activity.scenarios.map((sc,i)=>`
      <div class="card printable"><h4>${i+1}. ${esc(sc.title)}</h4><p>${esc(sc.text)}</p>
      <p>☐ Fair &nbsp;&nbsp; ☐ Not Fair</p>
      <p><strong>Why?</strong></p><div class="lines"></div>
      <p><strong>If it is not fair, how would you fix it?</strong></p><div class="lines"></div></div>`).join("")}</div>`;
  }
  if(d.practice){
    extra+=`<div class="activity-box printable"><h3>✍️ Practice Sheet</h3><div class="trace">${esc(d.practice).replace(/\n/g,"<br>")}</div><div class="hand-lines"></div><div class="hand-lines"></div></div>`;
  }
  target.innerHTML=`<div class="card">
    <h2>${esc(day)} • ${esc(d.title)}</h2>
    ${d.miniLesson?`<div class="mini-lesson"><h3>Mini Lesson</h3><p>${esc(d.miniLesson)}</p></div>`:""}
    ${d.vocabulary?`<p><strong>Vocabulary:</strong> ${d.vocabulary.map(esc).join(" • ")}</p>`:""}
    ${extra}
    ${(d.tasks||[]).map((t,i)=>itemHtml(subject,currentWeek,day,i,t)).join("")}
  </div>`;
  bindInteractive();
}

function progressPercent(){
  let total=0,done=0;
  subjects.forEach(s=>{
    [1,2].forEach(w=>{
      const data=curriculum?.[s]?.[w]; if(!data)return;
      days.forEach(d=>(data.days?.[d]?.tasks||[]).forEach((t,i)=>{
        if(t.type==="check"){total++;if(localStorage.getItem(keyFor(s,w,d,i))==="1")done++;}
      }));
    });
  });
  return total?Math.round(done/total*100):0;
}

function home(){
  const pct=progressPercent();
  return `<section>
    <div class="hero">
      <div class="card">
        <h2 id="greeting">Good Morning, Rhyder!</h2>
        <p><strong id="dateLine"></strong><br><span id="timeLine"></span></p>
        <div class="progress"><span style="width:${pct}%"></span></div><p><strong>${pct}% complete</strong></p>
        <button class="btn start" data-page="today">▶ Start School</button>
      </div>
      <div class="card weather"><h3>🌤️ Weather</h3><p id="weatherText">Loading weather…</p><button class="btn blue" id="refreshWeather">Refresh</button></div>
    </div>
    <div class="card"><h3>Mom's Note</h3><p>${esc(localStorage.getItem("ra:mom-note")||"Have a great school day!")}</p></div>
    <div class="card"><h3>Current Week</h3><div class="tabs"><button class="${currentWeek===1?"active":""}" data-home-week="1">Week 1</button><button class="${currentWeek===2?"active":""}" data-home-week="2">Week 2</button></div></div>
    <div class="grid">${subjects.map(s=>{const data=getSubject(s);return `<div class="tile" data-page="${s}"><h3>${icons[s]} ${labels[s]}</h3><p>${esc(data?.title||"Coming soon")}</p></div>`}).join("")}
      <div class="tile" data-page="coach"><h3>💬 Ask Coach</h3><p>Get a hint without being given the answer.</p></div>
      <div class="tile" data-page="print"><h3>🖨️ Print Center</h3><p>Print lesson pages and handwriting practice.</p></div>
    </div>
  </section>`;
}

function today(){
  return `<section><div class="card"><h2>📅 Week ${currentWeek} • Monday–Thursday</h2><p>Choose a subject, then choose the correct day.</p></div>
  <div class="grid">${subjects.map(s=>`<div class="tile" data-page="${s}"><h3>${icons[s]} ${labels[s]}</h3><p>${esc(getSubject(s)?.title||"Coming soon")}</p></div>`).join("")}</div></section>`;
}

function coach(){
  return `<section><div class="card"><h2>💬 Ask Coach</h2><p>Coach explains and gives hints but does not complete the assignment.</p></div>
  <div class="card"><label class="field">Subject</label><select id="coachSubject">${subjects.map(s=>`<option>${labels[s]}</option>`).join("")}<option>Research</option></select>
  <label class="field">What are you stuck on?</label><textarea id="coachQuestion" rows="7"></textarea>
  <p><button class="btn blue" id="askCoach">Copy Question & Open ChatGPT</button></p><div id="coachStatus" class="notice" hidden></div></div></section>`;
}

function research(){
  return `<section><div class="card"><h2>🕵️ Research</h2><p>Use this page for History Detective and other research notes.</p></div>
  <div class="card"><label class="field">Question</label><textarea rows="3" data-text-key="ra:research:q"></textarea>
  <label class="field">Source 1 Notes</label><textarea rows="5" data-text-key="ra:research:s1"></textarea>
  <label class="field">Source 2 Notes</label><textarea rows="5" data-text-key="ra:research:s2"></textarea>
  <label class="field">Conclusion</label><textarea rows="7" data-text-key="ra:research:c"></textarea></div></section>`;
}

function progress(){
  const pct=progressPercent();
  return `<section><div class="card"><h2>📊 Progress</h2><div class="progress"><span style="width:${pct}%"></span></div><p><strong>${pct}% complete</strong></p><p class="small">Progress is saved on this device.</p></div></section>`;
}

function printCenter(){
  return `<section><div class="card no-print"><h2>🖨️ Print Center</h2><p>For a cursive worksheet, open Penmanship, choose the day, then print the page.</p><button class="btn" onclick="window.print()">Print Current Page</button></div>
  <div class="print-sheet"><h1>Science Data Sheet</h1><p>Name: __________________ Date: __________</p><p>Question:</p><div class="lines"></div><p>Hypothesis:</p><div class="lines"></div><p>Trial / Data:</p><div class="lines"></div><p>Conclusion:</p><div class="lines"></div></div></section>`;
}

function parent(){
  const ans=curriculum?.science?.[2]?.parentAnswers?.Tuesday||[];
  return `<section><div class="card"><h2>🔒 Parent</h2><span class="badge">Subject Files v2.0</span></div>
  <div class="card"><h3>Mom's Note</h3><textarea id="momNote" rows="4">${esc(localStorage.getItem("ra:mom-note")||"Have a great school day!")}</textarea><p><button class="btn" id="saveMomNote">Save Note</button></p></div>
  <div class="card"><h3>Google Drive</h3><a class="btn blue" href="https://drive.google.com/drive/folders/1P0YHmUGEadS95J3PVRqxYUepwUcIg7Hu?usp=sharing" target="_blank" rel="noopener">Open Pratt Homeschool Drive</a></div>
  <div class="card"><h3>Science Week 2 Answer Key</h3>${ans.map((a,i)=>`<div class="answer-key"><strong>${i+1}.</strong> ${esc(a)}</div>`).join("")}</div>
  <div class="card"><h3>Parent PIN</h3><button class="btn blue" id="changePin">Change PIN</button></div></section>`;
}

function render(page){
  currentPage=page;
  if(page==="home") app.innerHTML=home();
  else if(page==="today") app.innerHTML=today();
  else if(subjects.includes(page)){app.innerHTML=subjectPage(page);renderSubjectDay(page,"Monday");}
  else if(page==="coach") app.innerHTML=coach();
  else if(page==="research") app.innerHTML=research();
  else if(page==="progress") app.innerHTML=progress();
  else if(page==="print") app.innerHTML=printCenter();
  else if(page==="parent") app.innerHTML=parent();
  else app.innerHTML=home();
  bindPage();
  if(page==="home"){updateClock();loadWeather();}
  window.scrollTo(0,0);
}

function bindInteractive(){
  document.querySelectorAll("[data-save-key]").forEach(cb=>cb.addEventListener("change",()=>localStorage.setItem(cb.dataset.saveKey,cb.checked?"1":"0")));
  document.querySelectorAll("[data-text-key]").forEach(el=>{
    el.value=localStorage.getItem(el.dataset.textKey)||"";
    el.addEventListener("input",()=>localStorage.setItem(el.dataset.textKey,el.value));
  });
}

function bindPage(){
  document.querySelectorAll("[data-page]").forEach(el=>el.addEventListener("click",()=>render(el.dataset.page)));
  document.querySelectorAll(".day-tabs button").forEach(btn=>btn.addEventListener("click",()=>{
    btn.parentElement.querySelectorAll("button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");renderSubjectDay(btn.dataset.subject,btn.dataset.day);
  }));
  document.querySelectorAll(".week-tabs [data-week]").forEach(btn=>btn.addEventListener("click",()=>{
    currentWeek=Number(btn.dataset.week);localStorage.setItem("ra:current-week",currentWeek);render(currentPage);
  }));
  document.querySelectorAll("[data-home-week]").forEach(btn=>btn.addEventListener("click",()=>{
    currentWeek=Number(btn.dataset.homeWeek);localStorage.setItem("ra:current-week",currentWeek);render("home");
  }));
  bindInteractive();
  const r=document.getElementById("refreshWeather");if(r)r.addEventListener("click",loadWeather);
  const a=document.getElementById("askCoach");if(a)a.addEventListener("click",askCoach);
  const s=document.getElementById("saveMomNote");if(s)s.addEventListener("click",()=>{localStorage.setItem("ra:mom-note",document.getElementById("momNote").value.trim()||"Have a great school day!");alert("Mom's note saved.");});
  const c=document.getElementById("changePin");if(c)c.addEventListener("click",changePin);
}

function updateClock(){
  const d=new Date(),h=d.getHours();const g=document.getElementById("greeting"),dt=document.getElementById("dateLine"),tm=document.getElementById("timeLine");
  if(g)g.textContent=(h<12?"Good Morning":h<17?"Good Afternoon":"Good Evening")+", Rhyder!";
  if(dt)dt.textContent=d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  if(tm)tm.textContent=d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
}
function codeText(c){return ({0:"Clear",1:"Mostly clear",2:"Partly cloudy",3:"Cloudy",45:"Foggy",48:"Foggy",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",80:"Showers",81:"Showers",82:"Heavy showers",95:"Thunderstorms"})[c]||"Current conditions";}
async function fetchWeather(lat,lon,label){
  const el=document.getElementById("weatherText");if(!el)return;
  try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`;
  const r=await fetch(u),w=await r.json();el.innerHTML=`<strong>${label}</strong><br>${Math.round(w.current.temperature_2m)}°F • ${codeText(w.current.weather_code)}<br>High ${Math.round(w.daily.temperature_2m_max[0])}° • Low ${Math.round(w.daily.temperature_2m_min[0])}°<br>Rain chance ${w.daily.precipitation_probability_max[0]}%`;
  }catch(e){el.textContent="Weather unavailable.";}
}
function loadWeather(){
  const el=document.getElementById("weatherText");if(el)el.textContent="Loading weather…";
  if(navigator.geolocation)navigator.geolocation.getCurrentPosition(p=>fetchWeather(p.coords.latitude,p.coords.longitude,"Current location"),()=>fetchWeather(35.4492,-86.7889,"Lewisburg, TN"),{timeout:5000});
  else fetchWeather(35.4492,-86.7889,"Lewisburg, TN");
}
async function askCoach(){
  const q=document.getElementById("coachQuestion").value.trim();if(!q){alert("Type your question first.");return;}
  const subject=document.getElementById("coachSubject").value;
  const prompt=`You are Coach for Rhyder, a sixth-grade homeschool student.\n\nSubject: ${subject}\nRhyder's question: ${q}\n\nRules:\n- Explain at a sixth-grade level.\n- Do not complete the assignment or give the final answer.\n- Ask what he has tried.\n- Give one hint at a time.\n- Use short, clear steps.\n- Encourage independent thinking.`;
  const status=document.getElementById("coachStatus");
  try{await navigator.clipboard.writeText(prompt);status.hidden=false;status.textContent="Question copied. ChatGPT is opening—paste and send it.";}catch(e){status.hidden=false;status.textContent=prompt;}
  window.open("https://chatgpt.com/","_blank");
}
function openParent(){
  const saved=localStorage.getItem("ra:parent-pin");
  if(!saved){const p=prompt("Create a 4–6 digit Parent PIN:");if(p===null)return;if(!/^\d{4,6}$/.test(p)){alert("Use 4–6 numbers.");return;}const c=prompt("Enter the PIN again:");if(c!==p){alert("PINs did not match.");return;}localStorage.setItem("ra:parent-pin",p);parentUnlocked=true;render("parent");return;}
  if(parentUnlocked){render("parent");return;}
  const p=prompt("Enter Parent PIN:");if(p===saved){parentUnlocked=true;render("parent");}else if(p!==null)alert("Incorrect PIN.");
}
function changePin(){
  const saved=localStorage.getItem("ra:parent-pin"),old=prompt("Enter current PIN:");if(old!==saved){if(old!==null)alert("Incorrect PIN.");return;}
  const p=prompt("Create a new 4–6 digit PIN:");if(p===null)return;if(!/^\d{4,6}$/.test(p)){alert("Use 4–6 numbers.");return;}const c=prompt("Enter new PIN again:");if(c!==p){alert("PINs did not match.");return;}localStorage.setItem("ra:parent-pin",p);alert("Parent PIN changed.");
}

document.querySelectorAll(".nav [data-page]").forEach(btn=>btn.addEventListener("click",()=>render(btn.dataset.page)));
document.getElementById("parentButton").addEventListener("click",openParent);
setInterval(()=>{if(currentPage==="home")updateClock();},30000);
render("home");
})();
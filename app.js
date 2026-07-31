(() => {
  "use strict";
  const app = document.getElementById("app");
  const week = window.RHYDER_WEEK1;
  const subjects = ["history","math","science","reading","writing"];
  const subjectIcons = {history:"📖",math:"➗",science:"🧪",reading:"📚",writing:"✍️"};
  let currentPage = "home";
  let parentUnlocked = false;

  const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const keyFor = (subject,day,index) => `ra:v1:${subject}:${day}:${index}`;

  function checkbox(subject, day, index, text){
    const key = keyFor(subject,day,index);
    const checked = localStorage.getItem(key)==="1" ? "checked" : "";
    return `<label class="task"><input type="checkbox" data-save-key="${esc(key)}" ${checked}><span>${esc(text)}</span></label>`;
  }

  function taskHtml(subject,day,index,task){
    if(task.type==="link"){
      return `<div class="task"><span>▶</span><span><a class="btn blue" href="${esc(task.url)}" target="_blank" rel="noopener">${esc(task.text)}</a></span></div>`;
    }
    return checkbox(subject,day,index,task.text);
  }

  function subjectPage(subject){
    const s = week[subject];
    const days = week.meta.schoolDays;
    return `
      <section>
        <div class="card subject-title"><div><h2>${subjectIcons[subject]} ${subject[0].toUpperCase()+subject.slice(1)}</h2><p>${esc(s.title)}</p></div><span class="badge">Week 1</span></div>
        <div class="card">
          <div class="tabs week-tabs">
            <button class="active">Week 1</button>
            <button class="locked" disabled>Week 2 🔒</button>
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
    const d = week[subject].days[day];
    const target = document.getElementById(`${subject}Day`);
    if(!target) return;
    target.innerHTML = `
      <div class="card">
        <h2>${esc(day)} • ${esc(d.title)}</h2>
        ${d.miniLesson ? `<div class="mini-lesson"><h3>Mini Lesson</h3><p>${esc(d.miniLesson)}</p></div>` : ""}
        ${d.vocabulary ? `<p><strong>Vocabulary:</strong> ${d.vocabulary.map(esc).join(" • ")}</p>` : ""}
        ${d.tasks.map((t,i)=>taskHtml(subject,day,i,t)).join("")}
      </div>`;
    bindCheckboxes();
  }

  function home(){
    const pct = progressPercent();
    return `
      <section>
        <div class="hero">
          <div class="card">
            <h2 id="greeting">Good Morning, Rhyder!</h2>
            <p><strong id="dateLine"></strong><br><span id="timeLine"></span></p>
            <div class="progress"><span style="width:${pct}%"></span></div>
            <p><strong>${pct}% complete</strong></p>
            <button class="btn start" data-page="today">▶ Start School</button>
          </div>
          <div class="card weather"><h3>🌤️ Weather</h3><p id="weatherText">Loading weather…</p><button class="btn blue" id="refreshWeather">Refresh</button></div>
        </div>
        <div class="card"><h3>Mom's Note</h3><p>${esc(localStorage.getItem("ra:mom-note") || "Have a great school day!")}</p></div>
        <div class="grid">
          <div class="tile" data-page="today"><h3>📅 Week 1</h3><p>Four-day school week.</p></div>
          ${subjects.map(s=>`<div class="tile" data-page="${s}"><h3>${subjectIcons[s]} ${s[0].toUpperCase()+s.slice(1)}</h3><p>${esc(week[s].title)}</p></div>`).join("")}
          <div class="tile" data-page="coach"><h3>💬 Ask Coach</h3><p>Get a hint without being given the answer.</p></div>
          <div class="tile" data-page="print"><h3>🖨️ Print Center</h3><p>Week 1 printable pages.</p></div>
        </div>
      </section>`;
  }

  function today(){
    return `<section>
      <div class="card"><h2>📅 Week 1 • Monday–Thursday</h2><p>Choose a subject and then choose the correct day tab.</p></div>
      <div class="grid">
        ${subjects.map(s=>`<div class="tile" data-page="${s}"><h3>${subjectIcons[s]} ${s[0].toUpperCase()+s.slice(1)}</h3><p>${esc(week[s].title)}</p></div>`).join("")}
      </div>
    </section>`;
  }

  function coach(){
    return `<section>
      <div class="card"><h2>💬 Ask Coach</h2><p>Coach will explain, give hints, and ask questions—not complete the assignment.</p></div>
      <div class="card">
        <label class="field">Subject</label>
        <select id="coachSubject">${subjects.map(s=>`<option>${s[0].toUpperCase()+s.slice(1)}</option>`).join("")}<option>Research</option></select>
        <label class="field">What are you stuck on?</label>
        <textarea id="coachQuestion" rows="7" placeholder="Example: I do not understand what a hypothesis is."></textarea>
        <p><button class="btn blue" id="askCoach">Copy Question & Open ChatGPT</button></p>
        <div id="coachStatus" class="notice" hidden></div>
      </div>
    </section>`;
  }

  function research(){
    return `<section>
      <div class="card"><h2>🕵️ History Detective • Week 1</h2><p>Compare two sources about early music or metalworking.</p></div>
      <div class="card">
        ${["Source 1 title or link","Source 1 notes","Source 2 title or link","Source 2 notes","Where do the sources agree?","Where are they different?","My 5–8 sentence conclusion"].map((label,i)=>`
          <label class="field">${label}</label>
          ${i===0||i===2?`<input type="text" data-text-key="ra:research:${i}">`:`<textarea rows="${i===6?8:4}" data-text-key="ra:research:${i}"></textarea>`}
        `).join("")}
      </div>
    </section>`;
  }

  function progress(){
    const pct = progressPercent();
    return `<section><div class="card"><h2>📊 Progress</h2><div class="progress"><span style="width:${pct}%"></span></div><p><strong>${pct}% complete</strong></p><p class="small">Progress is saved on this device.</p></div></section>`;
  }

  function printCenter(){
    return `<section>
      <div class="card no-print"><h2>🖨️ Print Center</h2><button class="btn" onclick="window.print()">Print All Week 1 Sheets</button></div>
      <div class="print-sheet"><h1>Rhyder's Academy</h1><h2>Creation Timeline</h2><p>Name: __________________ Date: __________</p><div class="two-col"><div><h3>Day 1</h3><div class="lines"></div><h3>Day 2</h3><div class="lines"></div><h3>Day 3</h3><div class="lines"></div></div><div><h3>Day 4</h3><div class="lines"></div><h3>Day 5</h3><div class="lines"></div><h3>Day 6 and Day 7</h3><div class="lines"></div></div></div></div>
      <div class="print-sheet"><h1>Rhyder's Academy</h1><h2>History Detective Notes</h2><p>Research question:</p><div class="lines"></div><p>Source 1:</p><div class="lines"></div><p>Source 2:</p><div class="lines"></div><p>Conclusion:</p><div class="lines"></div></div>
      <div class="print-sheet"><h1>Rhyder's Academy</h1><h2>Science Lab • Paper Airplanes</h2><p><strong>Question:</strong> How does airplane design affect flight distance?</p><p><strong>Hypothesis:</strong></p><div class="lines"></div><p>Design A distances: ______  ______  ______ &nbsp; Average: ______</p><p>Design B distances: ______  ______  ______ &nbsp; Average: ______</p><p><strong>Independent variable:</strong> ________________________</p><p><strong>Dependent variable:</strong> __________________________</p><p><strong>Constants:</strong> _________________________________</p><p><strong>Conclusion:</strong></p><div class="lines"></div></div>
    </section>`;
  }

  function parent(){
    return `<section>
      <div class="card"><h2>🔒 Parent</h2><span class="badge">Clean Master v1.0</span></div>
      <div class="card"><h3>Mom's Note</h3><textarea id="momNote" rows="4">${esc(localStorage.getItem("ra:mom-note")||"Have a great school day!")}</textarea><p><button class="btn" id="saveMomNote">Save Note</button></p></div>
      <div class="card"><h3>Google Drive</h3><a class="btn blue" href="https://drive.google.com/drive/folders/1P0YHmUGEadS95J3PVRqxYUepwUcIg7Hu?usp=sharing" target="_blank" rel="noopener">Open Pratt Homeschool Drive</a></div>
      <div class="card"><h3>Parent PIN</h3><button class="btn blue" id="changePin">Change PIN</button></div>
      <div class="card"><button class="btn light" id="resetProgress">Reset All Checkboxes</button></div>
    </section>`;
  }

  function render(page){
    currentPage = page;
    if(page==="home") app.innerHTML=home();
    else if(page==="today") app.innerHTML=today();
    else if(subjects.includes(page)){
      app.innerHTML=subjectPage(page);
      renderSubjectDay(page,"Monday");
    }
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

  function bindPage(){
    document.querySelectorAll("[data-page]").forEach(el=>el.addEventListener("click",()=>render(el.dataset.page)));
    document.querySelectorAll(".day-tabs button").forEach(btn=>btn.addEventListener("click",()=>{
      btn.parentElement.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      renderSubjectDay(btn.dataset.subject,btn.dataset.day);
    }));
    bindCheckboxes();
    document.querySelectorAll("[data-text-key]").forEach(el=>{
      el.value=localStorage.getItem(el.dataset.textKey)||"";
      el.addEventListener("input",()=>localStorage.setItem(el.dataset.textKey,el.value));
    });
    const refresh=document.getElementById("refreshWeather"); if(refresh) refresh.addEventListener("click",loadWeather);
    const ask=document.getElementById("askCoach"); if(ask) ask.addEventListener("click",askCoach);
    const save=document.getElementById("saveMomNote"); if(save) save.addEventListener("click",()=>{
      localStorage.setItem("ra:mom-note",document.getElementById("momNote").value.trim()||"Have a great school day!");
      alert("Mom's note saved.");
    });
    const change=document.getElementById("changePin"); if(change) change.addEventListener("click",changePin);
    const reset=document.getElementById("resetProgress"); if(reset) reset.addEventListener("click",resetProgress);
  }

  function bindCheckboxes(){
    document.querySelectorAll("[data-save-key]").forEach(cb=>cb.addEventListener("change",()=>{
      localStorage.setItem(cb.dataset.saveKey,cb.checked?"1":"0");
    }));
  }

  function allTaskKeys(){
    const keys=[];
    subjects.forEach(s=>week.meta.schoolDays.forEach(d=>week[s].days[d].tasks.forEach((t,i)=>{if(t.type==="check") keys.push(keyFor(s,d,i));})));
    return keys;
  }
  function progressPercent(){
    const keys=allTaskKeys(); const done=keys.filter(k=>localStorage.getItem(k)==="1").length;
    return keys.length?Math.round(done/keys.length*100):0;
  }

  function updateClock(){
    const d=new Date(),h=d.getHours();
    const g=document.getElementById("greeting"),date=document.getElementById("dateLine"),time=document.getElementById("timeLine");
    if(g) g.textContent=(h<12?"Good Morning":h<17?"Good Afternoon":"Good Evening")+", Rhyder!";
    if(date) date.textContent=d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    if(time) time.textContent=d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
  }
  function codeText(c){return ({0:"Clear",1:"Mostly clear",2:"Partly cloudy",3:"Cloudy",45:"Foggy",48:"Foggy",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",80:"Showers",81:"Showers",82:"Heavy showers",95:"Thunderstorms"})[c]||"Current conditions";}
  async function fetchWeather(lat,lon,label){
    const el=document.getElementById("weatherText"); if(!el) return;
    try{
      const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`;
      const r=await fetch(u),w=await r.json();
      el.innerHTML=`<strong>${label}</strong><br>${Math.round(w.current.temperature_2m)}°F • ${codeText(w.current.weather_code)}<br>High ${Math.round(w.daily.temperature_2m_max[0])}° • Low ${Math.round(w.daily.temperature_2m_min[0])}°<br>Rain chance ${w.daily.precipitation_probability_max[0]}%`;
    }catch(e){el.textContent="Weather unavailable. Internet is required.";}
  }
  function loadWeather(){
    const el=document.getElementById("weatherText"); if(el) el.textContent="Loading weather…";
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(p=>fetchWeather(p.coords.latitude,p.coords.longitude,"Current location"),()=>fetchWeather(35.4492,-86.7889,"Lewisburg, TN"),{timeout:5000});
    }else fetchWeather(35.4492,-86.7889,"Lewisburg, TN");
  }

  async function askCoach(){
    const q=document.getElementById("coachQuestion").value.trim();
    if(!q){alert("Type your question first.");return;}
    const subject=document.getElementById("coachSubject").value;
    const prompt=`You are Coach for Rhyder, a sixth-grade homeschool student.\n\nSubject: ${subject}\nRhyder's question: ${q}\n\nRules:\n- Explain at a sixth-grade level.\n- Do not complete the assignment or give the final answer.\n- Ask what he has tried.\n- Give one hint at a time.\n- Use short, clear steps.\n- Encourage effort and independent thinking.`;
    const status=document.getElementById("coachStatus");
    try{await navigator.clipboard.writeText(prompt);status.hidden=false;status.textContent="Question copied. ChatGPT is opening—paste and send it.";}
    catch(e){status.hidden=false;status.textContent=prompt;}
    window.open("https://chatgpt.com/","_blank");
  }

  function openParent(){
    const saved=localStorage.getItem("ra:parent-pin");
    if(!saved){
      const p=prompt("Create a 4–6 digit Parent PIN:");
      if(p===null) return;
      if(!/^\d{4,6}$/.test(p)){alert("Use 4–6 numbers.");return;}
      const c=prompt("Enter the PIN again:");
      if(c!==p){alert("PINs did not match.");return;}
      localStorage.setItem("ra:parent-pin",p);parentUnlocked=true;render("parent");return;
    }
    if(parentUnlocked){render("parent");return;}
    const p=prompt("Enter Parent PIN:");
    if(p===saved){parentUnlocked=true;render("parent");}else if(p!==null) alert("Incorrect PIN.");
  }
  function changePin(){
    const saved=localStorage.getItem("ra:parent-pin");
    const old=prompt("Enter current PIN:"); if(old!==saved){if(old!==null) alert("Incorrect PIN.");return;}
    const p=prompt("Create a new 4–6 digit PIN:"); if(p===null)return;
    if(!/^\d{4,6}$/.test(p)){alert("Use 4–6 numbers.");return;}
    const c=prompt("Enter the new PIN again:"); if(c!==p){alert("PINs did not match.");return;}
    localStorage.setItem("ra:parent-pin",p);alert("Parent PIN changed.");
  }
  function resetProgress(){
    if(!confirm("Reset every lesson checkbox?")) return;
    allTaskKeys().forEach(k=>localStorage.removeItem(k));alert("Progress reset.");render("progress");
  }

  document.querySelectorAll(".nav [data-page]").forEach(btn=>btn.addEventListener("click",()=>render(btn.dataset.page)));
  document.getElementById("parentButton").addEventListener("click",openParent);
  setInterval(()=>{if(currentPage==="home")updateClock();},30000);
  render("home");
})();
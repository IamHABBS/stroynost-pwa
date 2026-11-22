const KEY='stroynost-v1';
const fresh={doctorApproved:true,week:1,weight:[],sessions:[],active:null};
const newState=()=>({doctorApproved:true,week:1,weight:[],sessions:[],active:null});
function normalizeState(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return newState();
  const week=Number.isInteger(value.week)&&value.week>=1&&value.week<=8?value.week:1;
  const weight=(Array.isArray(value.weight)?value.weight:[]).filter(row=>
    row&&typeof row==='object'&&Number.isFinite(Number(row.value))&&typeof row.at==='string'
  ).map(row=>({value:Number(row.value),at:row.at}));
  const session=record=>record&&typeof record==='object'&&
    (record.kind==='strength'||record.kind==='walk')&&Number.isInteger(record.week)&&
    record.week>=1&&record.week<=8&&typeof record.startedAt==='string'&&
    Array.isArray(record.items)&&record.items.every(item=>typeof item==='string');
  const sessions=(Array.isArray(value.sessions)?value.sessions:[]).filter(record=>
    session(record)&&typeof record.endedAt==='string'&&Array.isArray(record.done)
  ).map(record=>({...record,done:record.done.filter(item=>typeof item==='string')}));
  const active=session(value.active)?value.active:null;
  return {
    doctorApproved:true,
    week,
    weight,
    sessions,
    active
  };
}
function loadState(){
  try{return normalizeState(JSON.parse(localStorage.getItem(KEY)||'null'));}
  catch(error){console.warn('Не удалось прочитать локальные данные «Стройность»',error);return newState();}
}
let state=loadState();
const $=s=>document.querySelector(s);
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const date=(d=new Date())=>new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'long',year:'numeric'}).format(d);
const time=d=>new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit'}).format(d);
const toast=m=>{const x=$('#toast');x.textContent=m;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2600)};

const art={
 walk:`<svg viewBox="0 0 100 100" aria-label="Иллюстрация прогулки"><circle cx="49" cy="19" r="8" fill="#164d42"/><path d="M49 28l-7 24 14 12m-7-36l14 18m-19 7l-16 14m27-3l-10 24m10-24l17 17" fill="none" stroke="#164d42" stroke-width="7" stroke-linecap="round"/><path d="M12 88h76" stroke="#c9572f" stroke-width="5" stroke-linecap="round"/></svg>`,
 chair:`<svg viewBox="0 0 100 100" aria-label="Иллюстрация вставания со стула"><circle cx="43" cy="16" r="8" fill="#164d42"/><path d="M42 25l3 25 19 8m-19-8L27 65m18-15l-1 28m20-20l11 18m-11-18l18 1" fill="none" stroke="#164d42" stroke-width="7" stroke-linecap="round"/><path d="M67 45v38m18-38v38M61 83h31" fill="none" stroke="#c9572f" stroke-width="5" stroke-linecap="round"/></svg>`,
 wall:`<svg viewBox="0 0 100 100" aria-label="Иллюстрация отжиманий от стены"><path d="M81 14v73" stroke="#c9572f" stroke-width="7"/><circle cx="43" cy="25" r="8" fill="#164d42"/><path d="M40 34l13 17 20 0M53 51L36 65m17-14l-4 30m4-30l13 29" fill="none" stroke="#164d42" stroke-width="7" stroke-linecap="round"/></svg>`,
 side:`<svg viewBox="0 0 100 100" aria-label="Иллюстрация отведения ноги"><circle cx="45" cy="17" r="8" fill="#164d42"/><path d="M45 26v32m0-22l-17 11m17 11l-11 25m11-25l24 14" fill="none" stroke="#164d42" stroke-width="7" stroke-linecap="round"/><path d="M76 16v68" stroke="#c9572f" stroke-width="6"/></svg>`,
 heel:`<svg viewBox="0 0 100 100" aria-label="Иллюстрация подъёмов на носки"><circle cx="45" cy="17" r="8" fill="#164d42"/><path d="M45 26v31m0-20l-17 9m17 11l-10 25m10-25l14 25" fill="none" stroke="#164d42" stroke-width="7" stroke-linecap="round"/><path d="M22 86h51M79 18v67" stroke="#c9572f" stroke-width="5" stroke-linecap="round"/></svg>`
};
const base=[
 {id:'walk',name:'Спокойная ходьба',dose:'10–15 минут в комфортном темпе',note:'Можно разбить на 2–3 коротких выхода. Разговор должен оставаться возможным.'},
 {id:'chair',name:'Вставание с высокого стула',dose:'2 подхода по 5 повторов',note:'Стул устойчивый; руками помогать можно. Вставай не рывком.'},
 {id:'wall',name:'Отжимания от стены',dose:'2 подхода по 5 повторов',note:'Корпус ровный, выдох на отталкивании, не задерживай дыхание.'},
 {id:'side',name:'Отведение ноги в сторону',dose:'2 подхода по 6 на сторону',note:'Держись за стену или стол; корпус не наклоняй.'},
 {id:'heel',name:'Подъёмы на носки',dose:'2 подхода по 8 повторов',note:'Держись за опору, двигайся медленно.'}
];
function dose(ex,week){let n=week<=2?0:week<=4?1:week<=6?2:3;let text=ex.dose;if(ex.id==='walk') return week<3?text:week<5?'15–18 минут в комфортном темпе':'18–20 минут в комфортном темпе';return text.replace(/(5|6|8)/,m=>String(+m+n*2))}
function typeFor(day){return [1,3,5].includes(day)?'strength':'walk'};
function todays(){const d=new Date().getDay()||7;return {day:d,type:typeFor(d)}}
function routine(kind,week){return kind==='walk'?[base[0]]:[base[1],base[2],base[3],base[4]]}
function exerciseCard(ex,week){return `<article class="exercise">${art[ex.id]}<div><span class="tag">${dose(ex,week)}</span><h3>${ex.name}</h3><p>${ex.note}</p></div></article>`}
function renderToday(){const {day,type}=todays(), names=['','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];$('#weekChip').textContent=`Неделя ${state.week} из 8`;$('#heroText').textContent=state.active?'Тренировка идёт. Спокойно и без натуживания.':'Спокойный старт. Важнее регулярность, чем героизм.';$('#todayCard').innerHTML=`<h2>${names[day]}: ${type==='strength'?'мягкая силовая':'прогулка'}</h2><p>План уже содержит все восемь недель — обновлять его не нужно.</p><button class="primary" id="startToday" ${state.active?'disabled':''}>${state.active?'Тренировка уже началась':'Начать тренировку'}</button>`;$('#startToday')?.addEventListener('click',()=>startSession(type));}
function renderPlan(){let days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];let today=(new Date().getDay()||7)-1;$('#plan').innerHTML=`<div class="panel"><h2>Вся программа</h2><p class="log-meta">Выбери любую неделю: будущие упражнения уже здесь.</p><div class="week-picker">${[1,2,3,4,5,6,7,8].map(w=>`<button class="${w===state.week?'active':''}" data-week="${w}">${w}</button>`).join('')}</div><div class="calendar">${days.map((d,i)=>`<div class="day ${typeFor(i+1)} ${i===today?'today':''}"><span>${d}</span><b>${typeFor(i+1)==='strength'?'Силовая':'Прогулка'}</b></div>`).join('')}</div><p class="log-meta">Недели 1–2 — знакомство. Затем добавляются только повторы или минуты, без новых рискованных движений.</p>${routine('strength',state.week).map(x=>exerciseCard(x,state.week)).join('')}<p class="safety"><strong>Стоп-сигнал:</strong> боль в животе, усиление выпячивания, боль в пояснице/колене, тошнота или выраженная слабость. Заверши занятие; при тревожных симптомах действуй по инструкции врача.</p></div>`;document.querySelectorAll('[data-week]').forEach(b=>b.onclick=()=>{state.week=+b.dataset.week;save();render()})}
function startSession(kind){const exercises=routine(kind,state.week);const id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;state.active={id,week:state.week,kind,startedAt:new Date().toISOString(),items:exercises.map(x=>x.id)};save();render();toast('Время пошло');}
function renderJournal(){let active=state.active;if(active){const list=active.items.map(id=>base.find(x=>x.id===id));$('#journal').innerHTML=`<div class="panel"><h2>Тренировка идёт</h2><p class="log-meta">Начало: ${time(new Date(active.startedAt))}. Отметь выполненное; если стало некомфортно — заверши без чувства вины.</p><div class="checklist">${list.map(x=>`<label><input type="checkbox" value="${x.id}"><span>${x.name}<small>${dose(x,active.week)}</small></span></label>`).join('')}</div><div class="session-actions"><button class="secondary" id="cancelSession">Отменить запись</button><button class="primary" id="finishSession">Завершить</button></div></div>`;$('#cancelSession').onclick=()=>{state.active=null;save();render();toast('Запись отменена')};$('#finishSession').onclick=()=>finishSession();return}const ordered=[...state.sessions].reverse();$('#journal').innerHTML=`<div class="panel"><h2>История занятий</h2>${ordered.length?ordered.map(s=>`<div class="session-item"><div><strong>${s.kind==='strength'?'Мягкая силовая':'Прогулка'} · неделя ${s.week}</strong><small>${date(new Date(s.startedAt))}, ${time(new Date(s.startedAt))}–${time(new Date(s.endedAt))}</small></div><b>${s.done.length}/${s.items.length}</b></div>`).join(''):'<p class="empty">Здесь появится первая завершённая тренировка.</p>'}</div>`}
function finishSession(){let done=[...document.querySelectorAll('.checklist input:checked')].map(x=>x.value);state.sessions.push({...state.active,endedAt:new Date().toISOString(),done});state.active=null;save();render();toast('Занятие сохранено')}
function renderWeight(){const rows=[...state.weight].reverse();let last=rows[0];$('#weight').innerHTML=`<div class="panel"><h2>Вес</h2><p class="log-meta">Достаточно одного взвешивания в неделю утром, в одинаковых условиях.</p><form id="weightForm"><label class="field">Вес, кг<input required inputmode="decimal" name="value" placeholder="135,0"></label><button class="primary">Сохранить вес</button></form></div><div class="panel"><h2>${last?`${last.value.toLocaleString('ru-RU')} кг — последняя запись`:'Динамика появится здесь'}</h2>${rows.length?rows.map(w=>`<div class="weight-item"><strong>${w.value.toLocaleString('ru-RU')} кг</strong><small>${date(new Date(w.at))}</small></div>`).join(''):'<p class="empty">Первое значение — это точка отсчёта, не оценка.</p>'}</div>`;$('#weightForm').onsubmit=e=>{e.preventDefault();let v=Number(new FormData(e.target).get('value').replace(',','.'));if(!v||v>400){toast('Проверь значение веса');return}state.weight.push({value:v,at:new Date().toISOString()});save();render();toast('Вес сохранён')}}
function renderSettings(){$('#settings').innerHTML=`<div class="panel"><h2>Правила безопасности</h2><p class="log-meta">Умеренная нагрузка разрешена врачом. Всё равно не задерживай дыхание, не натуживайся, не делай упражнения на пресс, прыжки и тяжести. При боли в животе, усилении выпячивания, боли в пояснице или коленях — заверши тренировку.</p></div><div class="panel"><h2>Передать данные Гите</h2><p class="log-meta">Скачается файл с весом, датами тренировок, их продолжительностью и выполненными упражнениями. Никаких данных питания нет.</p><button class="primary" id="export">Скачать отчёт</button><label class="field">Восстановить резервную копию<input id="import" type="file" accept="application/json"></label></div><div class="panel"><h2 class="danger">Стереть всё</h2><button class="secondary" id="reset">Удалить локальные данные</button></div>`;$('#export').onclick=exportData;$('#import').onchange=importData;$('#reset').onclick=()=>{if(confirm('Удалить журнал веса и тренировок с этого устройства?')){state=newState();save();render();toast('Данные удалены')}}}
function exportData(){let data={app:'Стройность',version:1,exportedAt:new Date().toISOString(),data:state};let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=`стройность-отчёт-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);toast('Отчёт скачан')}
function importData(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let x=JSON.parse(r.result);if(!x.data||x.app!=='Стройность')throw 0;state=normalizeState(x.data);save();render();toast('Резервная копия восстановлена')}catch{toast('Это не файл «Стройность»')}};r.readAsText(f)}
function render(){renderToday();renderPlan();renderJournal();renderWeight();renderSettings();}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab,.view').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.view).classList.add('active')});
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');render();

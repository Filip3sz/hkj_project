/* JAPAN: AFTER DARK — interactive presentation. Works with local file:// URLs. */
'use strict';
document.documentElement.classList.add('js-enabled');

const chapters = [...document.querySelectorAll('.chapter')];
const totalChapters = chapters.length;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let activeChapter = 0;
let noteChapter = 0;
let lastFocus = null;

function goToChapter(index) {
  const target = chapters[Math.max(0, Math.min(totalChapters - 1, index))];
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  closeDrawer();
}

function updateScrollUI() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  $('#progress-bar').style.width = `${Math.min(100, Math.max(0, scrollY / max * 100))}%`;
  const center = window.innerHeight * .44;
  let nearest = 0;
  let distance = Infinity;
  chapters.forEach((chapter, index) => {
    const r = chapter.getBoundingClientRect();
    const d = r.top <= center && r.bottom >= center ? 0 : Math.min(Math.abs(r.top - center), Math.abs(r.bottom - center));
    if (d < distance) { distance = d; nearest = index; }
  });
  if (nearest !== activeChapter) { activeChapter = nearest; paintActiveChapter(); }
}

function paintActiveChapter() {
  $('#chapter-count').textContent = `${String(activeChapter + 1).padStart(2,'0')} / ${totalChapters}`;
  $$('.rail-item,.drawer-link').forEach(el => {
    const active = Number(el.dataset.index) === activeChapter;
    el.classList.toggle('active', active);
    if (el.classList.contains('rail-item')) el.setAttribute('aria-current', active ? 'true' : 'false');
  });
  $('#next-chapter').style.display = activeChapter === 11 ? 'none' : '';
  $('#next-btn span').textContent = activeChapter === 10 ? 'PRZEJDŹ DO QUIZU' : 'NASTĘPNY ROZDZIAŁ';
}

const rail = $('#chapter-rail');
const drawerList = $('#drawer-list');
chapters.forEach((chapter, i) => {
  const n = String(i + 1).padStart(2,'0');
  const title = chapter.dataset.title;
  const railBtn = document.createElement('button');
  railBtn.type = 'button';
  railBtn.className = 'rail-item';
  railBtn.dataset.index = i;
  railBtn.title = `${n} — ${title}`;
  railBtn.setAttribute('aria-label', `Rozdział ${n}: ${title}`);
  railBtn.innerHTML = `<span class="rail-dot"></span><span class="rail-label">${n}</span>`;
  railBtn.addEventListener('click', () => goToChapter(i));
  rail.append(railBtn);
  const link = document.createElement('a');
  link.href = '#' + chapter.id;
  link.className = 'drawer-link';
  link.dataset.index = i;
  link.innerHTML = `<span>${n}</span><strong>${title}</strong>`;
  link.addEventListener('click', () => closeDrawer());
  drawerList.append(link);
});
paintActiveChapter();
window.addEventListener('scroll', updateScrollUI, { passive:true });
window.addEventListener('resize', updateScrollUI, { passive:true });
updateScrollUI();
$('#next-btn').addEventListener('click', () => goToChapter(activeChapter + 1));

/* Full-featured accessible chapter drawer */
const drawer = $('#chapter-drawer');
function openDrawer() {
  drawer.classList.add('open');
  $('#drawer-backdrop').classList.add('open');
  drawer.setAttribute('aria-hidden','false');
  $('#menu-trigger').setAttribute('aria-expanded','true');
  document.body.classList.add('no-scroll');
  $('#drawer-close').focus();
}
function closeDrawer() {
  if (!drawer.classList.contains('open')) return;
  drawer.classList.remove('open');
  $('#drawer-backdrop').classList.remove('open');
  drawer.setAttribute('aria-hidden','true');
  $('#menu-trigger').setAttribute('aria-expanded','false');
  document.body.classList.remove('no-scroll');
  $('#menu-trigger').focus();
}
$('#menu-trigger').addEventListener('click', () => drawer.classList.contains('open') ? closeDrawer() : openDrawer());
$('#drawer-close').addEventListener('click', closeDrawer);
$('#drawer-backdrop').addEventListener('click', closeDrawer);

/* Keyboard presenter shortcuts */
document.addEventListener('keydown', event => {
  const target = event.target;
  if (target.matches('input,textarea,select,[contenteditable]')) return;
  if (event.key === 'Escape') { if (drawer.classList.contains('open')) closeDrawer(); return; }
  if ([...document.querySelectorAll('dialog')].some(dialog => dialog.open) || drawer.classList.contains('open')) return;
  if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); goToChapter(activeChapter + 1); }
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); goToChapter(activeChapter - 1); }
  if (event.key.toLowerCase() === 'n') { event.preventDefault(); openNotes(activeChapter); }
  if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
  if (event.key.toLowerCase() === 'm') { event.preventDefault(); openDrawer(); }
});

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch(err) { $('#fullscreen-btn').title = 'Tryb pełnoekranowy jest niedostępny w tej przeglądarce'; }
}
$('#fullscreen-btn').addEventListener('click', toggleFullscreen);

/* Reveal, with graceful fallback */
if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const selectors = ['.split-head','.bento-top','.bento-card','.method-card','.method-detail','.global-map-panel','.global-bottom','.lemans-card','.car-card','.tech-layout','.jdm-definition','.jdm-culture','.culture-card','.future-card','.quiz-panel'];
  $$(selectors.join(',')).forEach((el, index) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(index % 3) * 85}ms`;
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold:.075, rootMargin:'0px 0px -35px 0px' });
  $$('.reveal').forEach(el => observer.observe(el));
}

/* Historical clickable timeline */
const milestones = [
  { year:'1907', label:'Pierwsze próby budowy aut', tag:'PIONIERSKA ERA', title:'Takuri — japoński pionier', description:'Konstrukcja Takuri należy do najwcześniejszych japońskich samochodów benzynowych. Początki branży to lokalni konstruktorzy, eksperymenty i nauka.' },
  { year:'1933', label:'Powstaje dział samochodowy', tag:'KORZENIE TOYOTY', title:'Od maszyn tkackich do motoryzacji', description:'Toyoda Automatic Loom Works otwiera dział samochodowy. Kiichiro Toyoda postanawia rozwijać produkcję krajowych pojazdów.' },
  { year:'1937', label:'Powstaje Toyota Motor', tag:'PRZEMYSŁ NABIERA TEMPA', title:'Narodziny Toyota Motor Co.', description:'Dział samochodowy oddziela się od przedsiębiorstwa produkującego krosna. W tym okresie rozwija się także Nissan i inne marki.' },
  { year:'1948', label:'Zaczyna działalność Honda', tag:'NOWA GENERACJA', title:'Honda i powojenna odbudowa', description:'Honda Motor Co. powstaje w 1948 roku. W kolejnych latach rozbudowuje swoją pozycję w branży motocyklowej i samochodowej.' }
];
$$('.timeline-year').forEach(button => button.addEventListener('click', () => {
  const selected = Number(button.dataset.index);
  const item = milestones[selected];
  $$('.timeline-year').forEach(b => b.classList.toggle('active', b === button));
  $('#timeline-year').textContent = item.year;
  $('#timeline-caption').textContent = item.label;
  const container = $('#timeline-content');
  container.innerHTML = `<span class="mini-tag">${item.tag}</span><h3>${item.title}</h3><p>${item.description}</p>`;
  container.style.animation = 'none'; void container.offsetWidth; container.style.animation = '';
}));

/* Factory / TPS / philosophy click interaction */
const methods = [
  ['Ciągłe doskonalenie','Pracownicy obserwują proces i zgłaszają drobne zmiany, które usprawniają pracę, ograniczają straty i pomagają utrzymywać jakość.'],
  ['Dokładnie wtedy, gdy trzeba','Just-in-time oznacza produkowanie i dostarczanie potrzebnych elementów we właściwym momencie i odpowiedniej ilości — zamiast gromadzenia zbędnych zapasów.'],
  ['Błąd? Zatrzymaj i popraw.','Jidoka zakłada wykrywanie nieprawidłowości i możliwość wstrzymania procesu. Jakość należy zapewniać w trakcie pracy, a nie dopiero na końcu.']
];
$$('.method-card').forEach(card => card.addEventListener('click', () => {
  $$('.method-card').forEach(c => c.classList.toggle('active', c === card));
  const m = methods[Number(card.dataset.method)];
  $('#method-detail').innerHTML = `<div><span class="mini-tag">FILAR JAPOŃSKIEJ PRODUKCJI</span><h3>${m[0]}</h3></div><p>${m[1]}</p>`;
}));

/* Garage model detail modal */
const carData = {
  gtr:{ brand:'NISSAN', model:'SKYLINE GT-R', era:'R32 // 1989', motor:'RB26DETT', drivetrain:'AWD / ATTESA E-TS', origin:'Japonia, 1989', asset:'assets/car-gtr.svg', color:'#75e7ea', headline:'Technologiczna ikona „Godzilla”', description:'Model R32 zdobył legendarny status dzięki silnikowi R6 z dwoma turbosprężarkami, zaawansowanemu napędowi 4×4 i sukcesom na torach wyścigowych.'},
  supra:{ brand:'TOYOTA', model:'SUPRA A80', era:'A80 // 1993', motor:'2JZ-GTE', drivetrain:'RWD', origin:'Japonia, 1993', asset:'assets/car-supra.svg', color:'#f27aab', headline:'Legenda silnika 2JZ', description:'Czwarta generacja Supry połączyła charakterystyczne nadwozie z mocnym sześciocylindrowym silnikiem. Zyskała ogromną popularność wśród fanów tuningu i popkultury.'},
  rx7:{ brand:'MAZDA', model:'RX-7 FD', era:'FD3S // 1991', motor:'13B-REW', drivetrain:'RWD / ROTARY', origin:'Japonia, 1991', asset:'assets/car-rx7.svg', color:'#ffbd80', headline:'Lekkość i silnik rotacyjny', description:'Trzecia generacja RX-7 była smukłym, lekkim samochodem sportowym z dwuwirnikowym silnikiem Wankla i sekwencyjnym doładowaniem.'},
  nsx:{ brand:'HONDA', model:'NSX', era:'NA1 // 1990', motor:'V6 VTEC', drivetrain:'RWD / CENTRALNY SILNIK', origin:'Japonia, 1990', asset:'assets/car-nsx.svg', color:'#d4e8f4', headline:'Supersamochód na co dzień', description:'Honda NSX udowodniła, że supersamochód może łączyć osiągi, precyzyjne prowadzenie i codzienną wygodę. Ważnym elementem konstrukcji było aluminiowe nadwozie.'}
};
function showCar(carKey) {
  const car = carData[carKey]; if (!car) return;
  $('#car-dialog-body').innerHTML = `<div class="car-dialog-grid"><div class="car-dialog-art"><span class="mini-tag">LEGEND ARCHIVE / ${car.era}</span><img src="${car.asset}" alt="Autorska ilustracja — ${car.brand} ${car.model}"><span style="font:10px var(--mono);color:${car.color}">JAPANESE AUTOMOTIVE ICON</span></div><div class="car-dialog-info"><span class="mini-tag">${car.brand} / THE GOLDEN ERA</span><h2>${car.model}</h2><strong style="font:700 24px var(--display);color:${car.color}">${car.headline}</strong><p>${car.description}</p><div class="car-facts"><div><span>SILNIK</span><strong>${car.motor}</strong></div><div><span>NAPĘD</span><strong>${car.drivetrain}</strong></div><div><span>DEBIUT</span><strong>${car.origin}</strong></div><div><span>RYNEK</span><strong>JAPAN</strong></div></div></div></div>`;
  lastFocus = document.activeElement;
  $('#car-dialog').showModal();
}
$$('.car-card').forEach(card => card.addEventListener('click', () => showCar(card.dataset.car)));

/* Tech switcher */
const techData = [
  { tag:'01 / ENGINE SYSTEM', brand:'HONDA', main:'VTEC', code:'VARIABLE VALVE TIMING<br>& LIFT ELECTRONIC CONTROL', title:'Zmienna charakterystyka silnika', desc:'Układ Hondy dobiera charakterystykę pracy zaworów do zakresu obrotów i obciążenia. Symbol japońskich silników wysokoobrotowych.' },
  { tag:'02 / ROTARY POWER', brand:'MAZDA', main:'13B', code:'ROTARY ENGINE<br>WANKEL PRINCIPLE', title:'Silnik z wirującym tłokiem', desc:'Mazda rozwijała silniki Wankla, które zamiast tradycyjnych tłoków wykorzystują wirnik. Technologia wyróżniała serię RX i wyścigową 787B.' },
  { tag:'03 / ALL-WHEEL DRIVE', brand:'NISSAN / SUBARU', main:'AWD', code:'ALL WHEEL DRIVE<br>TRACTION SYSTEM', title:'Trakcja i precyzja prowadzenia', desc:'Rozwiązania 4×4 znane z aut takich jak Skyline GT-R i rajdowa Impreza pomagały wykorzystać moc oraz kontrolować zachowanie samochodu.' },
  { tag:'04 / HYBRID SYNERGY', brand:'TOYOTA', main:'HEV', code:'HYBRID ELECTRIC VEHICLE<br>PRIUS 1997', title:'Początek epoki masowej hybrydyzacji', desc:'W 1997 roku Toyota wprowadziła Priusa — pierwszy masowo produkowany samochód hybrydowy. Pojazd łączył silnik spalinowy z elektrycznym.' }
];
$$('.tech-option').forEach(option => option.addEventListener('click', () => {
  $$('.tech-option').forEach(el => { const active = el === option; el.classList.toggle('active',active); el.setAttribute('aria-selected',String(active)); });
  const d = techData[Number(option.dataset.tech)];
  $('#tech-feature').innerHTML = `<div class="tech-feature-top"><span class="mini-tag">${d.tag}</span><span>${d.brand}</span></div><div class="engine-visual"><span class="engine-orbit orbit-a"></span><span class="engine-orbit orbit-b"></span><span class="engine-center">${d.main}</span><span class="engine-code">${d.code}</span></div><h3>${d.title}</h3><p>${d.desc}</p>`;
  $('#tech-feature').style.animation = 'none'; void $('#tech-feature').offsetWidth; $('#tech-feature').style.animation = '';
}));

/* Quiz with choices, feedback, completion, restart */
const questions = [
  { q:'Co oznacza skrót JDM?', options:['Japan Drift Movement','Japanese Domestic Market','Japanese Design Motor','Japan Driving Mode'], correct:1, info:'JDM to Japanese Domestic Market, czyli rynek japoński.' },
  { q:'Ile wynosi maksymalna pojemność silnika współczesnego kei cara?', options:['660 cm³','1000 cm³','1600 cm³','2000 cm³'], correct:0, info:'660 cm³ to aktualny limit pojemności silnika kei carów.' },
  { q:'Który samochód wygrał Le Mans w 1991 roku?', options:['Honda NSX','Toyota Supra','Mazda 787B','Nissan GT-R R32'], correct:2, info:'Mazda 787B była pierwszym japońskim samochodem triumfującym w klasyfikacji generalnej Le Mans.' },
  { q:'Z czym związana jest filozofia kaizen?', options:['Z wyłącznie sportową jazdą','Z importem samochodów','Z silnikiem Wankla','Z ciągłym doskonaleniem'], correct:3, info:'Kaizen to ciągłe doskonalenie procesów i pracy.' }
];
let quizIndex=0, score=0, answered=false;
function renderQuiz() {
  const isFinished=quizIndex>=questions.length;
  $('#quiz-progress').style.width=`${isFinished?100:(quizIndex + 1)/questions.length*100}%`;
  $('#quiz-counter').textContent=isFinished?'KONIEC':`${String(quizIndex+1).padStart(2,'0')} / ${String(questions.length).padStart(2,'0')}`;
  if (isFinished) {
    $('#quiz-question').textContent=`${score} / ${questions.length} — ${score === 4 ? 'PERFEKCYJNA TRASA!' : 'META OSIĄGNIĘTA!'}`;
    $('#quiz-options').innerHTML='<div style="grid-column:span 2;font:13px/1.8 var(--mono);color:#d1d8e8">Koniec podróży po japońskiej motoryzacji. Dzięki za uwagę!</div>';
    $('#quiz-feedback').textContent='Wróć do wybranych rozdziałów lub powtórz quiz.';
    $('#quiz-next').innerHTML='POWTÓRZ QUIZ ↻';
    $('#quiz-next').disabled=false;
    return;
  }
  const q=questions[quizIndex];
  $('#quiz-question').textContent=q.q;
  $('#quiz-options').innerHTML='';
  q.options.forEach((option,i)=>{
    const button=document.createElement('button');
    button.className='quiz-choice';button.textContent=String.fromCharCode(65+i)+'. '+option;
    button.addEventListener('click',()=>answerQuiz(i));
    $('#quiz-options').append(button);
  });
  $('#quiz-feedback').textContent='WYBIERZ JEDNĄ ODPOWIEDŹ.';
  $('#quiz-next').disabled=true;
  $('#quiz-next').innerHTML='DALEJ <span>→</span>';
  answered=false;
}
function answerQuiz(choice) {
  if(answered)return;
  answered=true;
  const q=questions[quizIndex];
  if(choice===q.correct) score++;
  $$('.quiz-choice').forEach((button,i)=>{
    button.disabled=true;
    if(i===q.correct)button.classList.add('correct');
    else if(i===choice)button.classList.add('wrong');
  });
  $('#quiz-feedback').innerHTML=`<b>${choice===q.correct?'DOBRZE!':'NIE TYM RAZEM.'}</b> ${q.info}`;
  $('#quiz-next').disabled=false;
  $('#quiz-next').innerHTML=quizIndex===questions.length-1?'ZOBACZ WYNIK →':'DALEJ →';
}
$('#quiz-next').addEventListener('click',()=>{ if(quizIndex>=questions.length){quizIndex=0;score=0;}else quizIndex++;renderQuiz(); });
renderQuiz();

/* 12 chapter speaker notes, sourced from individual text files at build time */
function showNote(index) {
  if (!window.SPEAKER_NOTES) return;
  noteChapter=Math.max(0,Math.min(11,index));
  const note=window.SPEAKER_NOTES[noteChapter];
  $('#notes-title').textContent=`${note.no} / ${note.title}`;
  $('#notes-text').textContent=note.text;
  $('#notes-position').textContent=`${note.no} / 12`;
  $('#note-prev').disabled=noteChapter===0;
  $('#note-next').disabled=noteChapter===11;
  $('#note-prev').style.opacity=noteChapter===0?'.3':'1';
  $('#note-next').style.opacity=noteChapter===11?'.3':'1';
}
function openNotes(index) {showNote(index);lastFocus=document.activeElement;$('#notes-dialog').showModal();}
$('#notes-open').addEventListener('click',()=>openNotes(activeChapter));
$('#note-prev').addEventListener('click',()=>showNote(noteChapter-1));
$('#note-next').addEventListener('click',()=>showNote(noteChapter+1));
$('#copy-notes').addEventListener('click',async()=>{
  const text=window.SPEAKER_NOTES[noteChapter].text;
  try { await navigator.clipboard.writeText(text); $('#copy-notes').textContent='SKOPIOWANO ✓'; }
  catch(err) { const temp=document.createElement('textarea');temp.value=text;temp.style.position='fixed';temp.style.opacity='0';document.body.appendChild(temp);temp.select();document.execCommand('copy');temp.remove();$('#copy-notes').textContent='SKOPIOWANO ✓'; }
});

/* Sources and all modal close controls */
$('#sources-trigger').addEventListener('click',()=>{lastFocus=document.activeElement;$('#sources-dialog').showModal();});
$$('[data-close]').forEach(button=>button.addEventListener('click',()=>$('#'+button.dataset.close).close()));
$$('dialog').forEach(dialog=>{
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{if(lastFocus?.isConnected)lastFocus.focus();$('#copy-notes').textContent='KOPIUJ TEKST ↗';});
});

/* Tiny hero parallax; only desktop pointing devices, disabled for reduced motion */
if(!prefersReducedMotion && window.matchMedia('(pointer:fine)').matches){
  let ticking=false;
  $('#start').addEventListener('pointermove',event=>{
    if(ticking)return;ticking=true;
    requestAnimationFrame(()=>{
      const dx=(event.clientX/innerWidth-.5)*10;
      const dy=(event.clientY/innerHeight-.5)*8;
      $('.hero-city').style.translate=`${dx*-1}px ${dy*-1}px`;
      $('.hero-road-glow').style.translate=`${dx*1.7}px ${dy}px`;
      ticking=false;
    });
  },{passive:true});
}

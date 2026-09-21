const app = document.getElementById('app');
const WEB3FORMS_KEY = window.WOW_WEB3FORMS_ACCESS_KEY || '';
const DESTINATION_EMAIL = window.WOW_TEACHER_FORM_EMAIL || 'wow.school.english@gmail.com';
const STORAGE_KEY = 'wow_teacher_profile_form_v2';

const slides = [
  {key:'start', title:'Анкета преподавателя'},
  {key:'personal', title:'О вас'},
  {key:'education', title:'Образование'},
  {key:'experience', title:'Опыт'},
  {key:'areas', title:'Направления'},
  {key:'style', title:'Занятия'},
  {key:'strengths', title:'Сильные стороны'},
  {key:'results', title:'Результаты'},
  {key:'sendInfo', title:'Отправка'},
  {key:'review', title:'Проверка'},
];

const defaultData = {
  firstName:'', lastName:'', preferredName:'', age:'', country:'', city:'', phone:'', telegram:'', email:'',
  nativeSpeaker:'', englishLevel:'', russianLevel:'', otherLanguages:'',
  education:'', university:'', specialty:'', certificates:[], certificateDetails:'', englishEnvironment:'',
  yearsTeaching:'', audiences:[], minChildAge:'', teachingFormats:[], levels:[], workplaces:'', clubs:'',
  directions:[], exams:[], otherDirection:'',
  focus:[], methods:[], grammarStyle:'', correctionStyle:'', lessonDifference:'',
  strengths:[], otherStrength:'', qualities:[], hobbies:'', topics:'', funFact:'',
  studentResults:'', whyMe:'', importantNotes:'', photoVideoStatus:'',
  consent:false
};
let state = {screen:0, data:{...defaultData}, sent:false, pdfUrl:'', fileName:''};
try{
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if(saved?.data) state = {...state, ...saved, data:{...defaultData,...saved.data}};
}catch(e){}
state.screen = 0;

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function setVal(key,val){ state.data[key]=val; save(); }
function toggleArray(key,val,checked){ const s=new Set(state.data[key]||[]); checked?s.add(val):s.delete(val); state.data[key]=[...s]; save(); }
function checked(key,val){return (state.data[key]||[]).includes(val)?'checked':'';}
function selected(key,val){return state.data[key]===val?'selected':'';}

function header(){
  const pct = Math.max(0, Math.round((Math.max(0,state.screen)/(slides.length-1))*100));
  return `<div class="topbar">
    <div class="brand"><div class="logoTile"><img src="assets/images/wow-logo-white.png" alt="WOW SCHOOL"></div><div class="brandText"><strong>WOW SCHOOL</strong><span>анкета преподавателя</span></div></div>
    <div class="progressWrap"><div class="progressTrack"><i style="width:${pct}%"></i></div><div class="progressLabel">${state.screen===0?'Старт':`${Math.min(state.screen,slides.length-1)}/${slides.length-1}`}</div></div>
  </div>`;
}
function visual(file,icon,title,copy){
  return `<aside class="visual"><div class="visualInner" data-visual="${esc(file)}">
    <img src="assets/images/${esc(file)}" alt="" onload="this.parentElement.classList.add('hasImage')" onerror="this.remove()">
    <div class="placeholderCopy"><div class="visualIcon">${icon}</div><strong>${title}</strong><p>${copy}</p><code>assets/images/${file}</code></div>
  </div></aside>`;
}
function shell(inner){return `<div class="shell">${header()}<section class="stage">${inner}</section></div>`;}
function kicker(n,text){return `<div class="stepKicker"><span class="stepDot">${n}</span>${text}</div>`;}
function field(label,key,type='text',opts={}){
  const value=esc(state.data[key]||''); const req=opts.required?'<span class="req">*</span>':''; const full=opts.full?' full':'';
  let control='';
  if(type==='textarea') control=`<textarea data-field="${key}" placeholder="${esc(opts.placeholder||'')}">${value}</textarea>`;
  else if(type==='select') control=`<select data-field="${key}"><option value="">Выберите вариант</option>${opts.options.map(x=>`<option value="${esc(x)}" ${selected(key,x)}>${esc(x)}</option>`).join('')}</select>`;
  else control=`<input data-field="${key}" type="${type}" value="${value}" placeholder="${esc(opts.placeholder||'')}" ${opts.min?`min="${opts.min}"`:''}>`;
  return `<div class="field${full}"><label>${label} ${req}</label>${control}${opts.hint?`<div class="hint">${opts.hint}</div>`:''}</div>`;
}
function choices(key,items,{radio=false}={}){
  return `<div class="optionGroup">${items.map(item=>{
    const id=`${key}_${String(item).replace(/[^a-zA-Z0-9а-яА-Я]+/g,'_')}`;
    const isChecked=radio?state.data[key]===item:(state.data[key]||[]).includes(item);
    return `<span class="option ${radio?'radio':''}"><input id="${esc(id)}" data-choice-key="${key}" data-choice-value="${esc(item)}" type="${radio?'radio':'checkbox'}" name="${radio?key:id}" ${isChecked?'checked':''}><label for="${esc(id)}">${esc(item)}</label></span>`;
  }).join('')}</div>`;
}
function tip(text){return `<div class="tip"><span class="tipIcon">💡</span><div>${text}</div></div>`;}
function actions({back=true,next='Далее →',nextId='next',extra='' }={}){
  return `<div class="actions"><div>${back?'<button class="btn secondary" id="back">← Назад</button>':''}</div><div style="display:flex;gap:9px;align-items:center">${extra}<button class="btn primary" id="${nextId}">${next}</button></div></div>`;
}
function bindCommon(){
  document.querySelectorAll('[data-field]').forEach(el=>{
    const ev=el.tagName==='SELECT'?'change':'input';
    el.addEventListener(ev,()=>setVal(el.dataset.field,el.value));
  });
  document.querySelectorAll('[data-choice-key]').forEach(el=>el.addEventListener('change',()=>{
    const key=el.dataset.choiceKey, value=el.dataset.choiceValue;
    if(el.type==='radio') setVal(key,value); else toggleArray(key,value,el.checked);
  }));
  const b=document.getElementById('back'); if(b) b.onclick=()=>{state.screen=Math.max(0,state.screen-1);save();render();};
}
function goNext(validate){
  const btn=document.getElementById('next'); if(!btn)return;
  btn.onclick=()=>{ const ok=validate?validate():true; if(ok){state.screen++;save();render();} };
}
function required(keys){
  let first=null;
  keys.forEach(k=>{const el=document.querySelector(`[data-field="${k}"]`); if(!String(state.data[k]||'').trim()&&el){el.style.borderColor='#e7546c'; if(!first)first=el;} });
  if(first){first.focus();first.scrollIntoView({behavior:'smooth',block:'center'});return false;} return true;
}

function start(){
  app.innerHTML=shell(`<div class="hero">
    <div><div class="heroBadge">WOW SCHOOL · анкета преподавателя</div><h1>Расскажите о себе — <span>коротко и по фактам</span></h1>
    <p class="lead">На основе ответов мы подготовим вашу карточку для учеников. Большую часть анкеты можно заполнить галочками — обычно это занимает 7–10 минут.</p>
    <div class="heroPoints"><div class="heroPoint">✓ опыт и образование</div><div class="heroPoint">✓ с кем и с чем работаете</div><div class="heroPoint">✓ сильные стороны и стиль занятий</div><div class="heroPoint">✓ контакты и важные детали</div></div>
    ${tip('<b>Не нужно писать рекламный текст.</b> Нам нужны честные факты и ваши реальные сильные стороны — описание мы оформим сами.')}
    <div class="actions"><div></div><button class="btn primary" id="startBtn">Заполнить анкету →</button></div></div>
    <div class="heroVisual">${visual('teacher-form-preview.png','👩‍🏫','Место для обложки','Сюда можно добавить универсальную яркую фотографию преподавателя / команды WOW SCHOOL.')}</div>
  </div>`);
  document.getElementById('startBtn').onclick=()=>{state.screen=1;save();render();};
}

function personal(){
  app.innerHTML=shell(`<div class="slide"><div class="content">${kicker(1,'Основная информация')}<h1>Начнём с <span>вас</span></h1><p class="lead">Эти данные помогают нам корректно представить преподавателя и связаться с вами при необходимости.</p>
    <div class="formGrid">${field('Имя','firstName','text',{required:true,placeholder:'Например: Анна'})}${field('Фамилия','lastName','text',{required:true})}${field('Как лучше обращаться','preferredName','text',{placeholder:'Например: Александр → Саша'})}${field('Возраст','age','number',{min:18})}${field('Страна / гражданство','country','text',{required:true})}${field('Где сейчас живёте','city','text')}${field('Телефон','phone','tel',{required:true,placeholder:'+7 / +234 / ...'})}${field('Telegram','telegram','text',{placeholder:'@username'})}${field('Email','email','email',{required:true,full:true})}</div>
    <div class="sectionLabel">Вы носитель английского?</div>${choices('nativeSpeaker',['Да','Нет'],{radio:true})}
    <div class="formGrid" style="margin-top:14px">${field('Уровень английского','englishLevel','select',{options:['Native Speaker','C2','C1+','C1','B2–C1','B2','Другой']})}${field('Русский язык','russianLevel','select',{options:['Не говорю / почти не понимаю','A1','A2','B1','B2','C1 / свободно']})}${field('Другие языки','otherLanguages','text',{full:true,placeholder:'Если есть'})}</div>
    ${actions()}</div>${visual('teacher-form-personal.png','🌍','Личная информация','Место под фотографию/коллаж: преподаватели из разных стран, современный международный стиль.')}</div>`);
  bindCommon(); goNext(()=>required(['firstName','lastName','country','phone','email']));
}

function education(){
  app.innerHTML=shell(`<div class="slide"><div class="content">${kicker(2,'Образование и языковой опыт')}<h1>Что подтверждает вашу <span>экспертизу</span></h1><p class="lead">Указывайте только реальные факты. Если профильного образования нет — это нормально, важны и другие сильные стороны.</p>
    <div class="formGrid">${field('Образование','education','text',{placeholder:'Высшее / неоконченное высшее / другое'})}${field('Учебное заведение','university','text')}${field('Специальность','specialty','text',{full:true})}</div>
    <div class="sectionLabel">Сертификаты и экзамены</div>${choices('certificates',['TEFL','TESOL','CELTA','IELTS','TOEFL','DET','Cambridge','EF SET','Другие'])}
    <div class="formGrid" style="margin-top:14px">${field('Результаты / детали сертификатов','certificateDetails','textarea',{full:true,placeholder:'Например: IELTS 8.0, EF SET C1, TEFL 120 hours...'})}${field('Опыт жизни / учёбы / работы в англоязычной среде','englishEnvironment','textarea',{full:true,placeholder:'Где, сколько времени и как использовали английский'})}</div>
    ${actions()}</div>${visual('teacher-form-education.png','🎓','Образование','Место под визуал: сертификат, академическая среда, международный опыт.')}</div>`);
  bindCommon(); goNext();
}

function experience(){
  app.innerHTML=shell(`<div class="slide"><div class="content">${kicker(3,'Опыт преподавания')}<h1>С кем вы уже <span>работаете</span></h1><p class="lead">Эта часть особенно важна: ученик сразу должен понимать, подходит ли ему ваш опыт и формат.</p>
    <div class="formGrid">${field('Сколько лет преподаёте','yearsTeaching','number',{min:0,required:true})}${field('С какого возраста берёте детей','minChildAge','text',{placeholder:'Например: с 7 лет / не работаю с детьми'})}</div>
    <div class="sectionLabel">С кем работаете</div>${choices('audiences',['Дети','Подростки','Взрослые','Студенты','Старшие ученики 50+'])}
    <div class="sectionLabel">Форматы</div>${choices('teachingFormats',['Онлайн','Офлайн','Индивидуально','Парно','Группы','Разговорные клубы'])}
    <div class="sectionLabel">Уровни учеников</div>${choices('levels',['A0 / с нуля','A1','A2','B1','B2','C1','C2'])}
    <div class="formGrid" style="margin-top:14px">${field('Где преподавали / преподаёте','workplaces','textarea',{full:true,placeholder:'Школы, языковые центры, университет, частная практика — без лишних подробностей'})}${field('Разговорные клубы / интенсивы / спецпроекты','clubs','text',{full:true,placeholder:'Если есть'})}</div>
    ${actions()}</div>${visual('teacher-form-experience.png','🧩','Опыт','Место под визуал: преподаватель с подростком и взрослым, онлайн и офлайн форматы.')}</div>`);
  bindCommon(); goNext(()=>required(['yearsTeaching']));
}

function areas(){
  app.innerHTML=shell(`<div class="slide"><div class="content">${kicker(4,'Направления')}<h1>С чем к вам можно <span>приходить</span></h1><p class="lead">Отметьте только то, с чем вы действительно готовы работать. Это попадёт в карточку преподавателя.</p>
    <div class="sectionLabel">Направления</div>${choices('directions',['Общий английский','Разговорный английский','Английский с нуля','Для детей','Для подростков','Для взрослых','Business English','Academic English','Для работы','Для путешествий','Для переезда','Подготовка к собеседованию','Медицинский английский','Произношение / accent reduction'])}
    <div class="sectionLabel">Экзамены</div>${choices('exams',['ОГЭ','ЕГЭ','IELTS','TOEFL','DET','PET','FCE','CAE','CPE','SAT','GRE','Другие международные экзамены'])}
    <div class="formGrid" style="margin-top:14px">${field('Другое направление','otherDirection','text',{full:true,placeholder:'Если не нашли нужный вариант'})}</div>
    ${actions()}</div>${visual('teacher-form-areas.png','🎯','Цели учеников','Место под визуал: travel / career / exams / conversation в одном современном коллаже.')}</div>`);
  bindCommon(); goNext();
}

function style(){
  app.innerHTML=shell(`<div class="slide"><div class="content">${kicker(5,'Как проходят занятия')}<h1>Ваш <span>стиль</span> преподавания</h1><p class="lead">Здесь лучше выбрать реальные привычки и инструменты, а не то, что «хорошо звучит».</p>
    <div class="sectionLabel">На что чаще делаете акцент</div>${choices('focus',['Разговорная практика','Грамматика','Аудирование','Произношение','Словарный запас','Письмо','Чтение','Экзаменационные стратегии'])}
    <div class="sectionLabel">Что используете на занятиях</div>${choices('methods',['Диалоги','Ролевые ситуации','Видео','Аудио / подкасты','Игры','Статьи / новости','Кейсы','Проекты','Карточки / визуал','Обсуждения','Домашние задания'])}
    <div class="formGrid" style="margin-top:14px">${field('Как объясняете грамматику','grammarStyle','textarea',{placeholder:'Коротко, своими словами'})}${field('Как работаете с ошибками','correctionStyle','textarea',{placeholder:'Например: мягко исправляю в речи / разбираю после задания'})}${field('Что отличает ваши занятия','lessonDifference','textarea',{full:true,placeholder:'1–3 конкретные особенности'})}</div>
    ${actions()}</div>${visual('teacher-form-style.png','💬','Формат занятий','Место под визуал: диалог, видео, карточки, интерактивные задания.')}</div>`);
  bindCommon(); goNext();
}

function strengths(){
  app.innerHTML=shell(`<div class="slide"><div class="content">${kicker(6,'Сильные стороны')}<h1>Почему ученику будет <span>хорошо именно с вами</span></h1><p class="lead">Выберите 3–6 действительно сильных пунктов — это помогает нам сделать карточку персональной.</p>
    <div class="sectionLabel">Сильные стороны</div>${choices('strengths',['Хорошо работаю с детьми','Легко нахожу контакт с подростками','Умею объяснять простыми словами','Помогаю разговориться','Сильное произношение','Сильная грамматика','Современная лексика','Подготовка к экзаменам','Хорошо знаю русский язык','Сильна/силён с новичками','Мотивирую и поддерживаю','Умею работать с застенчивыми учениками','Business English','Английский для работы / карьеры'])}
    <div class="sectionLabel">Какие качества вас описывают</div>${choices('qualities',['Энергичный','Спокойный','Терпеливый','Позитивный','Структурный','Доброжелательный','Требовательный','С юмором','Внимательный','Коммуникабельный'])}
    <div class="formGrid" style="margin-top:14px">${field('Своя сильная сторона','otherStrength','text',{full:true})}${field('Хобби / интересы','hobbies','text')}${field('Темы, которые любите обсуждать','topics','text')}${field('Интересный факт о вас','funFact','text',{full:true})}</div>
    ${actions()}</div>${visual('teacher-form-strengths.png','✨','Личность преподавателя','Место под живой портрет/лайфстайл-фото преподавателя.')}</div>`);
  bindCommon(); goNext();
}

function results(){
  app.innerHTML=shell(`<div class="slide"><div class="content">${kicker(7,'Результаты и важные детали')}<h1>Что ещё поможет <span>представить вас ученикам</span></h1><p class="lead">Конкретные результаты — сильнее общих фраз. Если их пока нет или вы не хотите указывать — поле можно пропустить.</p>
    <div class="formGrid one">${field('Результаты учеников','studentResults','textarea',{placeholder:'Например: IELTS 7.5, ЕГЭ 90+, прошёл собеседование, переехал и начал свободно общаться...'})}${field('Почему ученику стоит попробовать занятия с вами?','whyMe','textarea',{placeholder:'2–4 предложения своими словами'})}${field('Что важно учитывать при выборе вас','importantNotes','textarea',{placeholder:'Например: работаю только A2+, урок почти полностью на английском, не беру детей младше 10 лет и т. п.'})}</div>
    <div class="sectionLabel">Фото и видеовизитка</div>${choices('photoVideoStatus',['Уже отправил(а)','Отправлю отдельно','Нужна помощь / уточнение'],{radio:true})}
    ${actions()}</div>${visual('teacher-form-results.png','🏆','Результаты','Место под визуал: прогресс ученика, сертификат, достижение цели.')}</div>`);
  bindCommon(); goNext();
}

function sendInfo(){
  app.innerHTML=shell(`<div class="slide"><div class="content">${kicker(8,'Отправка анкеты')}<h1>Остался <span>один шаг</span></h1><p class="lead">После заполнения ничего вручную собирать не нужно. На следующем экране проверьте ответы и нажмите «Отправить анкету».</p>
    <div class="sendSteps">
      <div class="sendStep"><span>1</span><div><b>Проверьте данные</b><p>Имя, контакты, опыт, направления, экзамены и сильные стороны.</p></div></div>
      <div class="sendStep"><span>2</span><div><b>Отправьте одной кнопкой</b><p>${ENDPOINT?'Система передаст ответы и сформирует PDF-анкету.':'Откроется готовое письмо на адрес WOW SCHOOL, а копия анкеты сохранится на устройство.'}</p></div></div>
      <div class="sendStep"><span>3</span><div><b>Готово</b><p>${ENDPOINT?`PDF уйдёт в WOW SCHOOL на <strong>${esc(DESTINATION_EMAIL)}</strong> и сохранится в нашей папке Google Drive.`:`Проверьте готовое письмо и нажмите «Отправить». Получатель уже указан: <strong>${esc(DESTINATION_EMAIL)}</strong>.`}</p></div></div>
    </div>
    <div class="recipientCard"><div class="recipientIcon">✉️</div><div><small>Получатель</small><strong>${esc(DESTINATION_EMAIL)}</strong><span>После успешной отправки на экране появится подтверждение.</span></div></div>
    ${tip('<b>Фото и видеовизитка.</b> Если вы уже отправляли их менеджеру — повторно ничего делать не нужно. Если ещё нет, отправьте их отдельно после анкеты.')}
    ${actions({next:'Проверить анкету →'})}</div>${visual('teacher-form-submit.png','📩','Отправка анкеты','Ваши ответы собираются в один структурированный файл и передаются WOW SCHOOL.')}</div>`);
  bindCommon(); goNext();
}

function val(v, empty='—'){ if(Array.isArray(v))return v.length?v.join(', '):empty; return String(v||'').trim()||empty; }
function summary(){
  const d=state.data;
  return [
    `ПРЕПОДАВАТЕЛЬ: ${[d.firstName,d.lastName].filter(Boolean).join(' ')}`,
    `Как обращаться: ${val(d.preferredName)}`,
    `Возраст: ${val(d.age)}`,
    `Страна / город: ${val(d.country)} / ${val(d.city)}`,
    `Телефон: ${val(d.phone)}`,
    `Telegram: ${val(d.telegram)}`,
    `Email: ${val(d.email)}`,
    `Native Speaker: ${val(d.nativeSpeaker)}`,
    `Уровень английского: ${val(d.englishLevel)}`,
    `Русский: ${val(d.russianLevel)}`,
    `Другие языки: ${val(d.otherLanguages)}`,
    '',
    `ОБРАЗОВАНИЕ: ${val(d.education)}`,
    `Учебное заведение: ${val(d.university)}`,
    `Специальность: ${val(d.specialty)}`,
    `Сертификаты: ${val(d.certificates)}`,
    `Детали сертификатов: ${val(d.certificateDetails)}`,
    `Англоязычная среда: ${val(d.englishEnvironment)}`,
    '',
    `ОПЫТ: ${val(d.yearsTeaching)} лет`,
    `С кем работает: ${val(d.audiences)}`,
    `Минимальный возраст ребёнка: ${val(d.minChildAge)}`,
    `Форматы: ${val(d.teachingFormats)}`,
    `Уровни: ${val(d.levels)}`,
    `Где преподавал(а): ${val(d.workplaces)}`,
    `Клубы / интенсивы: ${val(d.clubs)}`,
    '',
    `НАПРАВЛЕНИЯ: ${val(d.directions)}`,
    `ЭКЗАМЕНЫ: ${val(d.exams)}`,
    `Другое: ${val(d.otherDirection)}`,
    '',
    `АКЦЕНТЫ: ${val(d.focus)}`,
    `МЕТОДЫ: ${val(d.methods)}`,
    `Грамматика: ${val(d.grammarStyle)}`,
    `Работа с ошибками: ${val(d.correctionStyle)}`,
    `Что отличает занятия: ${val(d.lessonDifference)}`,
    '',
    `СИЛЬНЫЕ СТОРОНЫ: ${val(d.strengths)}`,
    `Качества: ${val(d.qualities)}`,
    `Своя сильная сторона: ${val(d.otherStrength)}`,
    `Хобби: ${val(d.hobbies)}`,
    `Любимые темы: ${val(d.topics)}`,
    `Интересный факт: ${val(d.funFact)}`,
    '',
    `РЕЗУЛЬТАТЫ УЧЕНИКОВ: ${val(d.studentResults)}`,
    `Почему выбрать: ${val(d.whyMe)}`,
    `Важно учитывать: ${val(d.importantNotes)}`,
    `Фото / видео: ${val(d.photoVideoStatus)}`,
  ].join('\n');
}
function review(){
  const d=state.data; const sum=summary();
  app.innerHTML=shell(`<div class="slide noVisual"><div class="content">${kicker(9,'Проверка и отправка')}<h1>Проверьте <span>анкету</span></h1><p class="lead">После нажатия кнопки анкета будет автоматически отправлена в WOW SCHOOL на <b>${esc(DESTINATION_EMAIL)}</b>. Дополнительно пересылать ответы не нужно.</p>
    <div class="reviewGrid">
      <div class="reviewCard"><h3>Контакты</h3><div class="reviewRows"><div class="reviewRow"><b>${esc(d.firstName)} ${esc(d.lastName)}</b></div><div class="reviewRow">📞 ${esc(val(d.phone))}</div><div class="reviewRow">✈️ ${esc(val(d.telegram))}</div><div class="reviewRow">✉️ ${esc(val(d.email))}</div></div></div>
      <div class="reviewCard"><h3>Ключевое</h3><div class="reviewRows"><div class="reviewRow">Опыт: <b>${esc(val(d.yearsTeaching))} лет</b></div><div class="reviewRow">Уровни: ${esc(val(d.levels))}</div><div class="reviewRow">Направления: ${esc(val(d.directions))}</div><div class="reviewRow">Экзамены: ${esc(val(d.exams))}</div></div></div>
    </div>
    <div class="sectionLabel">Готовая анкета</div><div class="summaryBox" id="summary">${esc(sum)}</div>
    <label class="consent"><input type="checkbox" id="consent" ${d.consent?'checked':''}><span>Подтверждаю, что указал(а) корректную информацию и разрешаю WOW SCHOOL использовать её для подготовки моей карточки преподавателя и связи со мной.</span></label>
    <div id="status" class="submitStatus neutral">${WEB3FORMS_KEY?`Всё готово. После отправки заполненная анкета автоматически придёт на ${esc(DESTINATION_EMAIL)}.`:`Автоматическая отправка ещё не подключена. При нажатии «Отправить анкету» откроется готовое письмо на ${esc(DESTINATION_EMAIL)}, а текстовая копия сохранится на устройство.`}</div>
    <div class="actions"><button class="btn secondary" id="back">← Назад</button><div style="display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end"><button class="btn secondary" id="copy">Копировать</button><button class="btn secondary" id="download">Скачать TXT</button><button class="btn primary" id="send">Отправить анкету →</button></div></div>
  </div></div>`);
  document.getElementById('back').onclick=()=>{state.screen=8;save();render();};
  document.getElementById('consent').onchange=e=>{setVal('consent',e.target.checked)};
  document.getElementById('copy').onclick=async()=>{await navigator.clipboard.writeText(sum);showStatus('Анкета скопирована в буфер обмена.','good');};
  document.getElementById('download').onclick=()=>downloadText(sum);
  document.getElementById('send').onclick=submitForm;
}
function showStatus(text,type='neutral'){const el=document.getElementById('status');if(el){el.textContent=text;el.className=`submitStatus ${type}`;}}
function downloadText(text){
  const blob=new Blob([text],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=`WOW_teacher_${state.data.firstName||'profile'}_${state.data.lastName||''}.txt`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
async function submitForm(){
  if(!state.data.consent){showStatus('Нужно подтвердить согласие перед отправкой.','bad');return;}
  const btn=document.getElementById('send');
  const text=summary();

  // Резервный режим: если Access Key Web3Forms ещё не добавлен,
  // сохраняем TXT и открываем готовое письмо на почту WOW SCHOOL.
  if(!WEB3FORMS_KEY){
    downloadText(text);
    const subject=`Анкета преподавателя WOW SCHOOL — ${state.data.firstName||''} ${state.data.lastName||''}`.trim();
    const body=`Здравствуйте!%0A%0AОтправляю заполненную анкету преподавателя WOW SCHOOL.%0A%0A${encodeURIComponent(text)}`;
    const gmail=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(DESTINATION_EMAIL)}&su=${encodeURIComponent(subject)}&body=${body}`;
    window.open(gmail,'_blank','noopener');
    showStatus('Готовое письмо открыто. Проверьте его и нажмите «Отправить». Копия анкеты также сохранена на устройство.', 'good');
    return;
  }

  btn.disabled=true; btn.textContent='Отправляем…'; showStatus('Отправляем анкету в WOW SCHOOL…','neutral');
  try{
    // Передаём данные в Web3Forms тем же набором полей, что и в их базовом HTML-примере.
    // Honeypot botcheck здесь намеренно не отправляем: он не нужен для этой формы.
    const formData=new FormData();
    formData.append('access_key', WEB3FORMS_KEY);
    formData.append('name', `${state.data.firstName||''} ${state.data.lastName||''}`.trim());
    formData.append('email', state.data.email || '');
    formData.append('message', text);
    formData.append('phone', state.data.phone || '');
    formData.append('telegram', state.data.telegram || '');
    formData.append('subject', `Новая анкета преподавателя WOW SCHOOL — ${state.data.firstName||''} ${state.data.lastName||''}`.trim());
    formData.append('from_name', 'WOW SCHOOL — Анкета преподавателя');

    const response=await fetch('https://api.web3forms.com/submit',{
      method:'POST',
      body:formData
    });

    let result={};
    try{ result=await response.json(); }catch(e){}
    if(!response.ok || result.success!==true){
      throw new Error(result.message || result?.body?.message || `Ошибка Web3Forms (${response.status})`);
    }

    state.sent=true; save(); state.screen=10; render();
  }catch(err){
    console.error('Web3Forms submit error:', err);
    showStatus(`Не удалось отправить анкету через Web3Forms${err?.message?`: ${err.message}`:''}. Данные сохранены — можно повторить отправку.`, 'bad');
    btn.disabled=false; btn.textContent='Отправить анкету →';
  }
}
function success(){
  app.innerHTML=shell(`<div class="success"><div><div class="successIcon">✓</div><h1>Анкета <span>отправлена</span></h1><p>Спасибо! Готовая анкета отправлена в WOW SCHOOL на <b>${esc(DESTINATION_EMAIL)}</b>. Дополнительно пересылать ответы не нужно.</p><div class="successNote">Если фото или видеовизитку вы ещё не отправляли менеджеру, пришлите их отдельно.</div><div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:18px"><button class="btn secondary" id="download">Скачать текстовую копию</button><button class="btn primary" id="new">Заполнить заново</button></div></div></div>`);
  document.getElementById('download').onclick=()=>downloadText(summary());
  document.getElementById('new').onclick=()=>{state={screen:0,data:{...defaultData},sent:false,pdfUrl:'',fileName:''};localStorage.removeItem(STORAGE_KEY);render();};
}
function render(){
  window.scrollTo({top:0,behavior:'instant'});
  ({0:start,1:personal,2:education,3:experience,4:areas,5:style,6:strengths,7:results,8:sendInfo,9:review,10:success}[state.screen]||start)();
}
render();

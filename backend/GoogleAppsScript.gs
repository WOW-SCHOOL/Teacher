/**
 * WOW SCHOOL — backend анкеты преподавателя.
 *
 * Что происходит после отправки формы:
 * 1) создаётся PDF-файл с полной анкетой;
 * 2) PDF сохраняется в Google Drive в папку "WOW SCHOOL — Анкеты преподавателей";
 * 3) ответы добавляются в Google Sheet "WOW SCHOOL — База преподавателей";
 * 4) PDF отправляется на wow.school.english@gmail.com;
 * 5) при желании можно дополнительно настроить Telegram.
 *
 * Обязательных Script Properties нет — папка и таблица создаются автоматически.
 * Опциональные Script Properties:
 * NOTIFY_EMAIL          другой email вместо wow.school.english@gmail.com
 * DRIVE_FOLDER_ID       использовать существующую папку Google Drive
 * SHEET_ID              использовать существующую Google Sheet
 * TELEGRAM_BOT_TOKEN    токен Telegram-бота
 * TELEGRAM_CHAT_ID      chat_id / group id
 */

var WOW_DEFAULT_EMAIL = 'wow.school.english@gmail.com';
var WOW_FOLDER_NAME = 'WOW SCHOOL — Анкеты преподавателей';
var WOW_SHEET_NAME = 'WOW SCHOOL — База преподавателей';
var WOW_DEFAULT_FOLDER_ID = '1jAGkUQAJAXIPTx-UCWxXh2D31ZgRTFau';
var WOW_DEFAULT_SHEET_ID = '1Ukhm0NKUAz3Ok_-JcDXlJlDfRRROutW6_Ri3XvYaD3g';

function doGet() {
  return json_({
    ok: true,
    service: 'WOW Teacher Form',
    email: PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || WOW_DEFAULT_EMAIL
  });
}

function doPost(e) {
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    validate_(payload);

    var folder = getOrCreateFolder_();
    var pdf = createPdf_(payload, folder);
    var ss = getOrCreateSpreadsheet_(folder);
    saveToSheet_(payload, ss, pdf.file.getUrl());
    notifyEmail_(payload, pdf.blob, pdf.file.getUrl());
    notifyTelegram_(payload, pdf.file.getUrl());

    return json_({
      ok: true,
      fileName: pdf.name,
      fileUrl: pdf.file.getUrl(),
      sheetUrl: ss.getUrl()
    });
  } catch (err) {
    return json_({
      ok: false,
      error: String(err && err.message || err)
    });
  }
}

/**
 * Запустите эту функцию вручную один раз после вставки кода в Apps Script.
 * Она запросит нужные разрешения и заранее создаст папку + Google Sheet.
 */
function setupWOWTeacherForm() {
  var folder = getOrCreateFolder_();
  var ss = getOrCreateSpreadsheet_(folder);
  Logger.log('WOW Teacher Form готов.');
  Logger.log('Папка: ' + folder.getUrl());
  Logger.log('Таблица: ' + ss.getUrl());
  Logger.log('Email: ' + (PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || WOW_DEFAULT_EMAIL));
}

function validate_(p) {
  ['firstName', 'lastName', 'phone', 'email'].forEach(function(k) {
    if (!String(p[k] || '').trim()) throw new Error('Не заполнено обязательное поле: ' + k);
  });
}

function getOrCreateFolder_() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('DRIVE_FOLDER_ID') || WOW_DEFAULT_FOLDER_ID;
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (e) {}
  }

  var found = DriveApp.getFoldersByName(WOW_FOLDER_NAME);
  var folder = found.hasNext() ? found.next() : DriveApp.createFolder(WOW_FOLDER_NAME);
  props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  return folder;
}

function getOrCreateSpreadsheet_(folder) {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('SHEET_ID') || WOW_DEFAULT_SHEET_ID;
  if (sheetId) {
    try { return SpreadsheetApp.openById(sheetId); } catch (e) {}
  }

  var ss = SpreadsheetApp.create(WOW_SHEET_NAME);
  DriveApp.getFileById(ss.getId()).moveTo(folder);
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

function saveToSheet_(p, ss, pdfUrl) {
  var sh = ss.getSheetByName('Teachers') || ss.insertSheet('Teachers');
  if (sh.getLastRow() === 0) {
    var headers = [
      'Дата', 'PDF', 'Имя', 'Фамилия', 'Как обращаться', 'Возраст', 'Страна', 'Город', 'Телефон', 'Telegram', 'Email',
      'Native Speaker', 'English level', 'Русский', 'Другие языки', 'Образование', 'Учебное заведение', 'Специальность',
      'Сертификаты', 'Детали сертификатов', 'Англоязычная среда', 'Опыт, лет', 'Аудитории', 'Мин. возраст',
      'Форматы', 'Уровни', 'Где преподавал(а)', 'Клубы / интенсивы', 'Направления', 'Экзамены', 'Другое направление',
      'Акценты', 'Методы', 'Грамматика', 'Работа с ошибками', 'Что отличает занятия', 'Сильные стороны', 'Качества',
      'Своя сильная сторона', 'Хобби', 'Темы', 'Интересный факт', 'Результаты учеников', 'Почему выбрать',
      'Важно учитывать', 'Фото / видео', 'Полная анкета JSON'
    ];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#6d4aff')
      .setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }

  sh.appendRow([
    new Date(), pdfUrl, p.firstName, p.lastName, p.preferredName, p.age, p.country, p.city, p.phone, p.telegram, p.email,
    p.nativeSpeaker, p.englishLevel, p.russianLevel, p.otherLanguages, p.education, p.university, p.specialty,
    join_(p.certificates), p.certificateDetails, p.englishEnvironment, p.yearsTeaching, join_(p.audiences), p.minChildAge,
    join_(p.teachingFormats), join_(p.levels), p.workplaces, p.clubs, join_(p.directions), join_(p.exams), p.otherDirection,
    join_(p.focus), join_(p.methods), p.grammarStyle, p.correctionStyle, p.lessonDifference, join_(p.strengths), join_(p.qualities),
    p.otherStrength, p.hobbies, p.topics, p.funFact, p.studentResults, p.whyMe,
    p.importantNotes, p.photoVideoStatus, JSON.stringify(p)
  ]);
}

function createPdf_(p, folder) {
  var name = [p.firstName, p.lastName].filter(String).join(' ').trim() || 'Преподаватель';
  var safeName = safeFileName_(name);
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Moscow', 'yyyy-MM-dd_HH-mm');
  var pdfName = 'WOW SCHOOL — Анкета преподавателя — ' + safeName + ' — ' + stamp + '.pdf';
  var tempDocName = 'TEMP — ' + pdfName.replace(/\.pdf$/i, '');

  var doc = DocumentApp.create(tempDocName);
  var body = doc.getBody();
  body.setMarginTop(36).setMarginBottom(36).setMarginLeft(42).setMarginRight(42);

  var brand = body.appendParagraph('WOW SCHOOL');
  brand.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  brand.editAsText().setBold(true).setFontSize(18).setForegroundColor('#6d4aff');

  var title = body.appendParagraph('Анкета преподавателя');
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  title.editAsText().setBold(true).setFontSize(22).setForegroundColor('#1d2142');

  var teacher = body.appendParagraph(name);
  teacher.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  teacher.editAsText().setBold(true).setFontSize(15).setForegroundColor('#4f3cb5');

  var meta = body.appendParagraph('Получено: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Moscow', 'dd.MM.yyyy HH:mm'));
  meta.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  meta.editAsText().setFontSize(9).setForegroundColor('#777b95');

  body.appendHorizontalRule();

  addSection_(body, '1. Основная информация', [
    ['Имя и фамилия', name],
    ['Как обращаться', p.preferredName],
    ['Возраст', p.age],
    ['Страна', p.country],
    ['Город / локация', p.city],
    ['Телефон', p.phone],
    ['Telegram', p.telegram],
    ['Email', p.email],
    ['Native Speaker', p.nativeSpeaker],
    ['Уровень английского', p.englishLevel],
    ['Русский язык', p.russianLevel],
    ['Другие языки', p.otherLanguages]
  ]);

  addSection_(body, '2. Образование и языковой опыт', [
    ['Образование', p.education],
    ['Учебное заведение', p.university],
    ['Специальность', p.specialty],
    ['Сертификаты / экзамены', join_(p.certificates)],
    ['Результаты / детали', p.certificateDetails],
    ['Англоязычная среда', p.englishEnvironment]
  ]);

  addSection_(body, '3. Опыт преподавания', [
    ['Опыт, лет', p.yearsTeaching],
    ['С кем работает', join_(p.audiences)],
    ['Минимальный возраст ребёнка', p.minChildAge],
    ['Форматы', join_(p.teachingFormats)],
    ['Уровни учеников', join_(p.levels)],
    ['Где преподавал(а)', p.workplaces],
    ['Клубы / интенсивы / проекты', p.clubs]
  ]);

  addSection_(body, '4. Направления и экзамены', [
    ['Направления', join_(p.directions)],
    ['Экзамены', join_(p.exams)],
    ['Другое направление', p.otherDirection]
  ]);

  addSection_(body, '5. Как проходят занятия', [
    ['Основной акцент', join_(p.focus)],
    ['Что использует', join_(p.methods)],
    ['Как объясняет грамматику', p.grammarStyle],
    ['Как работает с ошибками', p.correctionStyle],
    ['Что отличает занятия', p.lessonDifference]
  ]);

  addSection_(body, '6. Сильные стороны и личность', [
    ['Сильные стороны', join_(p.strengths)],
    ['Качества', join_(p.qualities)],
    ['Своя сильная сторона', p.otherStrength],
    ['Хобби / интересы', p.hobbies],
    ['Темы для общения', p.topics],
    ['Интересный факт', p.funFact]
  ]);

  addSection_(body, '7. Результаты и важные детали', [
    ['Результаты учеников', p.studentResults],
    ['Почему стоит попробовать занятия', p.whyMe],
    ['Что важно учитывать', p.importantNotes],
    ['Фото / видеовизитка', p.photoVideoStatus]
  ]);

  body.appendParagraph('Анкета сформирована автоматически через WOW SCHOOL Teacher Profile Form.')
    .editAsText().setFontSize(8).setForegroundColor('#8b8fa8');

  doc.saveAndClose();
  Utilities.sleep(300);

  var docFile = DriveApp.getFileById(doc.getId());
  docFile.moveTo(folder);
  var pdfBlob = docFile.getAs(MimeType.PDF).setName(pdfName);
  var pdfFile = folder.createFile(pdfBlob);
  docFile.setTrashed(true);

  return { name: pdfName, blob: pdfBlob, file: pdfFile };
}

function addSection_(body, title, rows) {
  var heading = body.appendParagraph(title);
  heading.editAsText().setBold(true).setFontSize(13).setForegroundColor('#6d4aff');

  var cleanRows = rows.filter(function(row) {
    return val_(row[1]) !== '—';
  }).map(function(row) {
    return [String(row[0]), val_(row[1])];
  });

  if (!cleanRows.length) {
    body.appendParagraph('—').editAsText().setForegroundColor('#8b8fa8');
    return;
  }

  var table = body.appendTable(cleanRows);
  table.setBorderColor('#e3def7').setBorderWidth(0.7);
  for (var r = 0; r < table.getNumRows(); r++) {
    var row = table.getRow(r);
    var c0 = row.getCell(0);
    var c1 = row.getCell(1);
    c0.setBackgroundColor('#f5f2ff');
    c0.editAsText().setBold(true).setFontSize(9).setForegroundColor('#3f3f64');
    c1.editAsText().setFontSize(9).setForegroundColor('#333650');
  }
  body.appendParagraph('');
}

function notifyEmail_(p, pdfBlob, pdfUrl) {
  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty('NOTIFY_EMAIL') || WOW_DEFAULT_EMAIL;
  var name = [p.firstName, p.lastName].filter(String).join(' ');
  var summary = p.summary || buildSummary_(p);

  MailApp.sendEmail({
    to: email,
    subject: 'WOW SCHOOL — новая анкета преподавателя: ' + name,
    body: summary + '\n\nPDF в Google Drive: ' + pdfUrl,
    htmlBody: '<div style="font-family:Arial,sans-serif;color:#252846">' +
      '<h2 style="color:#6d4aff">Новая анкета преподавателя — ' + html_(name) + '</h2>' +
      '<p>Готовая PDF-анкета прикреплена к письму и сохранена в Google Drive.</p>' +
      '<p><b>Телефон:</b> ' + html_(p.phone || '—') + '<br>' +
      '<b>Telegram:</b> ' + html_(p.telegram || '—') + '<br>' +
      '<b>Email:</b> ' + html_(p.email || '—') + '</p>' +
      '<p><a href="' + pdfUrl + '">Открыть PDF в Google Drive</a></p>' +
      '</div>',
    attachments: [pdfBlob],
    name: 'WOW SCHOOL'
  });
}

function notifyTelegram_(p, pdfUrl) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_BOT_TOKEN');
  var chatId = props.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return;

  var text = '🟣 НОВАЯ АНКЕТА ПРЕПОДАВАТЕЛЯ\n\n' + (p.summary || buildSummary_(p)) + '\n\nPDF: ' + pdfUrl;
  chunk_(text, 3500).forEach(function(part) {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: chatId, text: part, disable_web_page_preview: true }),
      muteHttpExceptions: true
    });
  });
}

function buildSummary_(p) {
  return [
    'Преподаватель: ' + [p.firstName, p.lastName].filter(String).join(' '),
    'Телефон: ' + (p.phone || '—'),
    'Telegram: ' + (p.telegram || '—'),
    'Email: ' + (p.email || '—'),
    'Страна: ' + (p.country || '—'),
    'Опыт: ' + (p.yearsTeaching || '—') + ' лет',
    'Уровни: ' + join_(p.levels),
    'Направления: ' + join_(p.directions),
    'Экзамены: ' + join_(p.exams),
    'Сильные стороны: ' + join_(p.strengths),
    'Важно учитывать: ' + (p.importantNotes || '—')
  ].join('\n');
}

function safeFileName_(s) {
  return String(s || 'Преподаватель')
    .replace(/[\\\/:*?"<>|#%{}~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function val_(v) {
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  var s = String(v == null ? '' : v).trim();
  return s || '—';
}

function join_(v) {
  if (Array.isArray(v)) return v.join(', ');
  return String(v || '');
}

function html_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function chunk_(text, size) {
  var out = [];
  for (var i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

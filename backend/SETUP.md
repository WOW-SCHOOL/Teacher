# WOW SCHOOL — подключение автоматической отправки анкет

После подключения преподаватель проходит анкету и нажимает **«Отправить анкету»**.
Дальше всё происходит автоматически:

1. создаётся аккуратный PDF `WOW SCHOOL — Анкета преподавателя — Имя Фамилия.pdf`;
2. PDF сохраняется в Google Drive в папку **WOW SCHOOL — Анкеты преподавателей**;
3. все ответы добавляются в Google Sheet **WOW SCHOOL — База преподавателей**;
4. PDF прикрепляется к письму и отправляется на **wow.school.english@gmail.com**.

Папка и таблица уже созданы в Google Drive WOW SCHOOL и их ID уже прописаны в backend. При необходимости backend также умеет создать новые автоматически.

## Подключение — один раз

### 1. Создайте Google Apps Script

Откройте `https://script.google.com` → **New project**.

Удалите стандартный код и вставьте содержимое файла:

`backend/GoogleAppsScript.gs`

Сохраните проект, например под названием `WOW Teacher Form`.

### 2. Разрешите доступ

В выпадающем списке функций выберите:

`setupWOWTeacherForm`

Нажмите **Run** и подтвердите доступ к Google Drive, Google Sheets и отправке email.

После выполнения скрипт проверит доступ к уже подготовленным:

- папке `WOW SCHOOL — Анкеты преподавателей`;
- таблице `WOW SCHOOL — База преподавателей`.

### 3. Опубликуйте Web App

В Apps Script:

**Deploy → New deployment → Web app**

Установите:

- **Execute as:** Me
- **Who has access:** Anyone

Нажмите **Deploy** и скопируйте URL вида:

`https://script.google.com/macros/s/XXXXXXXXXXXX/exec`

### 4. Вставьте URL в модуль

Откройте `config.js` и вставьте URL:

```js
window.WOW_TEACHER_FORM_ENDPOINT = "https://script.google.com/macros/s/XXXXXXXXXXXX/exec";
```

Email уже указан:

```js
window.WOW_TEACHER_FORM_EMAIL = "wow.school.english@gmail.com";
```

### 5. Опубликуйте модуль

Папку можно разместить на GitHub Pages так же, как другие модули WOW SCHOOL.

Готово. После этого анкеты будут автоматически приходить на почту и сохраняться в Google Drive.

---

## Если понадобится другой email

По умолчанию backend отправляет на:

`wow.school.english@gmail.com`

Если когда-нибудь адрес изменится, можно добавить в **Project Settings → Script properties**:

- Property: `NOTIFY_EMAIL`
- Value: новый email

---

## Telegram — опционально

Если захотите одновременно получать короткое уведомление в Telegram, добавьте Script Properties:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Токен Telegram не хранится в коде сайта и остаётся внутри Google Apps Script.

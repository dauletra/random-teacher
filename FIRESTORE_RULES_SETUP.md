# Настройка Firestore Security Rules

## Способ 1: Через Firebase Console (Рекомендуется для начала)

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект `random-teacher`
3. В левом меню выберите **Firestore Database**
4. Перейдите на вкладку **Rules**
5. Скопируйте содержимое файла `firestore.rules` из корня проекта
6. Вставьте в редактор правил
7. Нажмите **Publish**

## Способ 2: Через Firebase CLI (Автоматический деплой)

### Установка Firebase CLI (один раз)

```bash
npm install -g firebase-tools
```

### Инициализация проекта

```bash
firebase login
firebase init firestore
```

При инициализации:
- Выберите существующий проект `random-teacher`
- Firestore Rules file: `firestore.rules` (уже создан)
- Firestore Indexes file: `firestore.indexes.json` (можно оставить по умолчанию)

### Деплой правил

```bash
firebase deploy --only firestore:rules
```

## Что делают эти правила

### Основные принципы:
- ✅ Только авторизованные пользователи могут читать/писать данные
- ✅ Учителя видят только **свои** данные
- ✅ Ученики принадлежат классам, а классы - учителям
- ✅ Все данные защищены от доступа других пользователей

### Защита коллекций:

**Classes** (Классы):
- Учитель может читать/создавать/изменять/удалять только свои классы

**Students** (Ученики):
- Учитель может управлять учениками только в своих классах
- Проверяется владелец класса через teacherId

**Subjects** (Предметы):
- Учитель видит только свои предметы

**Lessons** (Уроки):
- Учитель управляет только своими уроками

**Attendance/Grades** (Посещаемость/Оценки):
- Доступ через урок, который принадлежит учителю

**Randomizer Settings** (Настройки рандомайзера):
- Каждый учитель видит только свои настройки

## Проверка правил

После публикации правил можно протестировать их в Firebase Console:

1. Firestore Database → **Rules**
2. Нажмите **Rules Playground**
3. Выберите операцию (get, list, create, update, delete)
4. Укажите путь к документу
5. Установите `request.auth.uid` (ваш UID)
6. Нажмите **Run**

## Важно!

⚠️ Не забудьте опубликовать правила в Firebase Console, иначе база данных будет в test mode и доступна всем!

## Миграция из test mode в production

Если вы создавали Firestore в **test mode**, правила выглядят так:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 2, 5);
    }
  }
}
```

Замените их на содержимое файла `firestore.rules` из проекта!

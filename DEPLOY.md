# Деплой Random Teacher App на Firebase Hosting

## Предварительные требования

- Node.js установлен
- Firebase CLI установлен (`npm install -g firebase-tools`)
- Есть Firebase проект (тот же, что используется для Firestore)

---

## Шаг 1: Авторизация в Firebase

```bash
firebase login
```

Откроется браузер для авторизации через Google аккаунт.

---

## Шаг 2: Инициализация Firebase Hosting

Если ещё не инициализирован:

```bash
firebase init hosting
```

**Ответы на вопросы:**
1. **Select a default Firebase project** → Выбери свой проект
2. **What do you want to use as your public directory?** → `dist`
3. **Configure as a single-page app?** → `Yes`
4. **Set up automatic builds with GitHub?** → `No` (или Yes, если хочешь CI/CD)
5. **Overwrite dist/index.html?** → `No`

---

## Шаг 3: Сборка проекта

```bash
npm run build
```

Убедись, что сборка прошла успешно и создалась папка `dist/`.

---

## Шаг 4: Деплой

```bash
firebase deploy --only hosting
```

После успешного деплоя увидишь:

```
✔ Deploy complete!

Hosting URL: https://your-project-id.web.app
```

---

## Шаг 5: Настройка домена для Claude артефактов

1. Скопируй URL хостинга (например: `https://random-teacher-app.web.app`)
2. Открой Claude артефакт → **Share** → **Publish**
3. В поле **Allowed domains** добавь:
   ```
   random-teacher-app.web.app
   ```
   (без `https://`)

4. Сохрани настройки артефакта

---

## Полезные команды

### Предпросмотр перед деплоем
```bash
firebase hosting:channel:deploy preview
```
Создаст временный preview URL.

### Локальный тест production сборки
```bash
npm run build && firebase serve --only hosting
```

### Деплой всего (Hosting + Firestore rules)
```bash
npm run build && firebase deploy
```

### Только Firestore rules
```bash
firebase deploy --only firestore:rules
```

---

## Структура firebase.json

Если нужно настроить вручную, вот пример конфигурации:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

---

## Добавление кастомного домена (опционально)

1. Перейди в [Firebase Console](https://console.firebase.google.com)
2. Выбери проект → **Hosting** → **Add custom domain**
3. Следуй инструкциям для настройки DNS

---

## Чеклист перед деплоем

- [ ] `npm run build` проходит без ошибок
- [ ] Проверил `.env` файл (Firebase config)
- [ ] Firestore rules актуальны
- [ ] Добавил свой email в `src/config/adminEmails.ts`

---

## Troubleshooting

### Ошибка "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### Ошибка "Permission denied"
```bash
firebase login --reauth
```

### Белый экран после деплоя
Проверь, что в `firebase.json` настроен rewrite для SPA:
```json
"rewrites": [{ "source": "**", "destination": "/index.html" }]
```

### Артефакты не загружаются в iframe
Убедись, что домен добавлен в **Allowed domains** в настройках публикации артефакта на Claude.

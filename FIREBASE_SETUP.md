# Настройка Firebase для Random Teacher App

## Шаг 1: Создание Firebase проекта

1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Нажмите "Add project" (Добавить проект)
3. Введите название проекта: `random-teacher` (или любое другое)
4. Отключите Google Analytics (не обязательно для этого проекта)
5. Нажмите "Create project"

## Шаг 2: Регистрация Web-приложения

1. В Firebase Console выберите ваш проект
2. Нажмите на иконку Web `</>` (Add app)
3. Введите название приложения: `Random Teacher Web`
4. **НЕ** включайте Firebase Hosting пока (сделаем позже)
5. Нажмите "Register app"
6. Скопируйте конфигурацию Firebase (firebaseConfig)

## Шаг 3: Настройка Firebase Authentication

1. В левом меню выберите **Authentication**
2. Нажмите "Get started"
3. Перейдите на вкладку **Sign-in method**
4. Нажмите на **Google**
5. Включите переключатель "Enable"
6. Введите email для поддержки проекта (ваш email)
7. Нажмите "Save"

## Шаг 4: Настройка Firestore Database

1. В левом меню выберите **Firestore Database**
2. Нажмите "Create database"
3. Выберите режим: **Start in test mode** (для разработки)
   - Позже мы настроим правила безопасности
4. Выберите регион (например, `europe-west1` для Европы)
5. Нажмите "Enable"

## Шаг 5: Создание .env файла

Создайте файл `.env` в корне проекта и добавьте следующие переменные:

```env
VITE_FIREBASE_API_KEY=ваш_api_key
VITE_FIREBASE_AUTH_DOMAIN=ваш_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ваш_project_id
VITE_FIREBASE_STORAGE_BUCKET=ваш_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=ваш_sender_id
VITE_FIREBASE_APP_ID=ваш_app_id
```

### Где найти эти значения:

1. В Firebase Console перейдите в **Project Settings** (Настройки проекта)
   - Иконка шестеренки в левом верхнем углу
2. Прокрутите вниз до раздела **Your apps**
3. Выберите ваше Web-приложение
4. В разделе **SDK setup and configuration** выберите **Config**
5. Скопируйте значения из объекта `firebaseConfig`:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

## Шаг 6: Настройка авторизованных доменов

1. В Firebase Console перейдите в **Authentication**
2. Перейдите на вкладку **Settings**
3. Прокрутите до **Authorized domains**
4. Убедитесь, что `localhost` присутствует в списке
5. Позже добавьте ваш production домен

## Шаг 7: Перезапуск приложения

После создания `.env` файла:

```bash
# Остановите dev сервер (Ctrl+C)
# Перезапустите
npm run dev
```

## Проверка

Откройте `http://localhost:5173` и попробуйте:
1. Нажать "Войти через Google"
2. Выбрать Google аккаунт
3. Должна произойти успешная авторизация
4. Вы должны увидеть Dashboard с вашим именем

## Возможные проблемы

### Ошибка: "auth/configuration-not-found"
- Проверьте, что `.env` файл создан в корне проекта
- Проверьте, что все переменные начинаются с `VITE_`
- Перезапустите dev сервер

### Ошибка: "auth/unauthorized-domain"
- Добавьте `localhost` в Authorized domains в Firebase Console

### Ошибка: "This app is not authorized to use Firebase Authentication"
- Убедитесь, что Google Authentication включен в Firebase Console

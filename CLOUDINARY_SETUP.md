# Настройка Cloudinary для загрузки изображений

## 1. Создание аккаунта Cloudinary

1. Перейдите на https://cloudinary.com/users/register_free
2. Зарегистрируйтесь (бесплатный план включает 25 GB хранилища и 25k трансформаций/месяц)
3. Подтвердите email

## 2. Получение Cloud Name

1. Войдите в Cloudinary Console: https://cloudinary.com/console
2. На главной странице Dashboard вы увидите **Cloud name**
3. Скопируйте его и добавьте в `.env`:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   ```

## 3. Создание Upload Preset (Unsigned)

1. Перейдите в **Settings** (иконка шестеренки) → **Upload**
2. Прокрутите до раздела **Upload presets**
3. Нажмите **Add upload preset**
4. Настройте пресет:
   - **Preset name**: `artifacts_unsigned` (или любое другое имя)
   - **Signing mode**: выберите **Unsigned** ⚠️ (важно!)
   - **Folder**: `artifacts` (опционально)
   - **Allowed formats**: `jpg, png, gif, webp`
   - **Max file size**: `10000000` (10 MB)
   - **Image transformations** (опционально):
     - Width: `1200`
     - Height: `800`
     - Crop: `limit`
     - Quality: `auto:good`
5. Нажмите **Save**
6. Скопируйте имя пресета и добавьте в `.env`:
   ```
   VITE_CLOUDINARY_UPLOAD_PRESET=artifacts_unsigned
   ```

## 4. Настройка Upload Restrictions (опционально)

Для дополнительной безопасности можно настроить ограничения:

1. В настройках Upload preset:
   - **Allowed formats**: только изображения (jpg, png, gif, webp)
   - **Max file size**: 10 MB
   - **Max image dimensions**: 3000x3000 px

2. В **Security** → **Access control**:
   - Можно настроить CORS, если нужно ограничить загрузку только с вашего домена

## 5. Проверка настройки

После настройки `.env` перезапустите dev-сервер:

```bash
npm run dev
```

Проверьте загрузку изображения на странице редактирования артефакта:
- Перетащите изображение
- Загрузите через кнопку "Выбрать файл"
- Вставьте скриншот из буфера обмена (Ctrl+V)

## Ограничения бесплатного плана

- **Хранилище**: 25 GB
- **Bandwidth**: 25 GB/месяц
- **Трансформации**: 25,000/месяц
- **API requests**: 25,000/месяц

Для учебного приложения этого более чем достаточно!

## Troubleshooting

### Ошибка "Invalid upload preset"
- Убедитесь, что preset создан как **Unsigned**
- Проверьте правильность имени пресета в `.env`

### Ошибка "Upload failed"
- Проверьте размер файла (не более 10 MB)
- Убедитесь, что это изображение (jpg, png, gif, webp)

### Изображение не отображается
- Проверьте Cloud name в `.env`
- Убедитесь, что URL начинается с `https://res.cloudinary.com/`

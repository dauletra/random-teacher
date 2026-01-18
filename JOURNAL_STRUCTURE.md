# Структура журналов и групп (v2)

## Обзор архитектуры

Система основана на **правилах деления класса**, которые создаются один раз и переиспользуются:

### Ключевая концепция
1. **Правила деления** создаются для класса (не для предмета!)
2. Каждое правило содержит конфигурацию групп и распределение учеников
3. При создании урока выбирается нужное правило деления
4. Разные предметы могут использовать одно и то же правило

### Преимущества
- ✅ Настраиваем деление учеников **один раз**
- ✅ Переиспользуем правила для разных предметов
- ✅ Легко изменить состав групп в одном месте
- ✅ Гибкость: урок может использовать любое правило деления

## Структура данных Firestore

### 1. Classes (классы)
```
/classes/{classId}
{
  id: string,
  teacherId: string,
  name: string,               // "9А", "10Б"
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. Students (ученики)
```
/students/{studentId}
{
  id: string,
  classId: string,
  firstName: string,
  lastName: string,
  avatarColor: string,
  createdAt: Timestamp
}
```
**Важно:** У ученика больше НЕТ поля `groupType` - группы зависят от предмета!

### 3. Subjects (предметы)
```
/subjects/{subjectId}
{
  id: string,
  teacherId: string,
  name: string,               // "Математика", "Физика"
  color: string,
  createdAt: Timestamp
}
```

### 4. DivisionRules (правила деления класса)
**НОВАЯ КОЛЛЕКЦИЯ** - правила деления, которые создаются для класса и переиспользуются
```
/divisionRules/{divisionRuleId}
{
  id: string,
  classId: string,            // Ссылка на класс
  name: string,               // "Деление на 2 группы", "Деление на 3 группы", "Весь класс"
  description?: string,       // Опциональное описание
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Примеры:**
- "Весь класс вместе"
- "Деление на 2 группы (А и Б)"
- "Деление на 3 группы (по информатике)"
- "Деление по языкам (английский/немецкий)"

### 5. DivisionGroups (группы внутри правила деления)
**НОВАЯ КОЛЛЕКЦИЯ** - конкретные группы с учениками для каждого правила
```
/divisionGroups/{divisionGroupId}
{
  id: string,
  divisionRuleId: string,     // Ссылка на правило деления
  groupNumber: number,        // 1, 2, 3... или 0 для "весь класс"
  name: string,               // "Группа А", "Группа Б", "Английский", "Немецкий"
  studentIds: string[],       // Массив ID учеников в этой группе
  createdAt: Timestamp
}
```

**Пример для правила "Деление на 2 группы":**
```javascript
// Правило
{
  id: "rule1",
  classId: "class9a",
  name: "Деление на 2 группы"
}

// Группы этого правила
[
  {
    id: "group1",
    divisionRuleId: "rule1",
    groupNumber: 1,
    name: "Группа А",
    studentIds: ["stud1", "stud2", ..., "stud15"]
  },
  {
    id: "group2",
    divisionRuleId: "rule1",
    groupNumber: 2,
    name: "Группа Б",
    studentIds: ["stud16", "stud17", ..., "stud30"]
  }
]
```

### 6. Lessons (уроки)
```
/lessons/{lessonId}
{
  id: string,
  teacherId: string,
  subjectId: string,
  classId: string,
  divisionRuleId: string,     // Ссылка на правило деления
  divisionGroupId?: string,   // Ссылка на конкретную группу (если не весь класс)
  date: Timestamp,
  topic?: string,             // Тема урока
  homework?: string,          // Домашнее задание
  notes?: string,             // Заметки учителя
  createdAt: Timestamp
}
```

**Важно:**
- `divisionRuleId` - какое правило деления используется
- `divisionGroupId` - если урок для конкретной группы, иначе null (весь класс)

### 7. Attendance (посещаемость)
```
/attendance/{attendanceId}
{
  id: string,
  lessonId: string,
  studentId: string,
  isPresent: boolean,
  reason?: string,            // Причина отсутствия
  createdAt: Timestamp
}
```

### 8. Grades (оценки)
```
/grades/{gradeId}
{
  id: string,
  lessonId: string,
  studentId: string,
  grade: number,              // 1-10 или другая шкала
  comment?: string,
  createdAt: Timestamp
}
```

## Визуальная схема

```
Класс 9А
├── Правило 1: "Весь класс"
│   └── Группа: Все 30 учеников
│
├── Правило 2: "Деление на 2 группы"
│   ├── Группа А: 15 учеников
│   └── Группа Б: 15 учеников
│
└── Правило 3: "Деление на 3 группы"
    ├── Группа 1: 10 учеников
    ├── Группа 2: 10 учеников
    └── Группа 3: 10 учеников

Предметы используют эти правила:
- Математика → Правило 1 (весь класс)
- Физика → Правило 1 (весь класс)
- Английский → Правило 2 (2 группы)
- Информатика → Правило 3 (3 группы)
- Химия → Правило 2 (2 группы) - переиспользуем!
```

## Запросы и операции

### Создание правила деления (один раз для класса)

```ts
// 1. Создать правило
const ruleId = await createDivisionRule({
  classId: 'class9a',
  name: 'Деление на 2 группы'
});

// 2. Создать группы для правила
await createDivisionGroup({
  divisionRuleId: ruleId,
  groupNumber: 1,
  name: 'Группа А',
  studentIds: ['stud1', 'stud2', ..., 'stud15']
});

await createDivisionGroup({
  divisionRuleId: ruleId,
  groupNumber: 2,
  name: 'Группа Б',
  studentIds: ['stud16', 'stud17', ..., 'stud30']
});
```

### Создание урока

1. Учитель выбирает **класс**, **предмет** и **дату**
2. Система показывает доступные правила деления для этого класса:
   ```ts
   const rules = await getDivisionRules(classId);
   ```
3. Учитель выбирает правило деления
4. Если правило содержит несколько групп, учитель выбирает конкретную группу
5. Создается урок с `divisionRuleId` и `divisionGroupId`

### Отметка посещаемости

```ts
// Получить учеников для этого урока
const lesson = await getLesson(lessonId);

// Если урок для конкретной группы
if (lesson.divisionGroupId) {
  const group = await getDivisionGroup(lesson.divisionGroupId);
  const students = await getStudentsByIds(group.studentIds);
} else {
  // Урок для всего класса - получить всех учеников класса
  const students = await getStudentsByClassId(lesson.classId);
}

// Отметить отсутствующих
await markAttendance(lessonId, studentId, false, "Болезнь");
```

### Выставление оценок

```ts
// Для конкретного урока
await addGrade(lessonId, studentId, 8, "Хороший ответ у доски");
```

### Таблица оценок (журнал)

Получить все оценки ученика по предмету:
```ts
// 1. Получить все уроки по предмету для этого ученика
const lessons = await getLessonsBySubject(subjectId, classId, studentId);

// 2. Для каждого урока получить оценки и посещаемость
const journal = await Promise.all(
  lessons.map(async (lesson) => {
    const grade = await getGrade(lesson.id, studentId);
    const attendance = await getAttendance(lesson.id, studentId);
    return {
      date: lesson.date,
      topic: lesson.topic,
      grade: grade?.grade,
      isPresent: attendance?.isPresent,
    };
  })
);
```

Получить журнал всей группы:
```ts
const group = await getSubjectGroup(subjectGroupId);
const lessons = await getLessonsByGroup(subjectGroupId);

// Создать таблицу: строки - ученики, столбцы - даты
const journalTable = {
  students: group.studentIds,
  dates: lessons.map(l => l.date),
  data: {} // studentId -> date -> { grade, isPresent }
};
```

## Индексы Firestore

Для оптимизации запросов создать композитные индексы:

```
1. subjects: (teacherId, createdAt)
2. divisionRules: (classId, createdAt)
3. divisionGroups: (divisionRuleId, groupNumber)
4. lessons: (subjectId, classId, date)
5. lessons: (divisionRuleId, divisionGroupId, date)
6. lessons: (classId, divisionRuleId, date)
7. attendance: (lessonId, studentId)
8. grades: (lessonId, studentId)
9. grades: (studentId, createdAt)
```

## Примеры использования

### Пример 1: Создание правил для класса 9А

```ts
// Правило 1: Весь класс
const rule1 = await createDivisionRule({
  classId: 'class9a',
  name: 'Весь класс'
});

await createDivisionGroup({
  divisionRuleId: rule1,
  groupNumber: 0,
  name: 'Весь класс',
  studentIds: allStudentIds // все 30 учеников
});

// Правило 2: Деление на 2 группы
const rule2 = await createDivisionRule({
  classId: 'class9a',
  name: 'Деление на 2 группы'
});

await createDivisionGroup({
  divisionRuleId: rule2,
  groupNumber: 1,
  name: 'Группа А',
  studentIds: firstHalf // 15 учеников
});

await createDivisionGroup({
  divisionRuleId: rule2,
  groupNumber: 2,
  name: 'Группа Б',
  studentIds: secondHalf // 15 учеников
});
```

### Пример 2: Создание урока английского (Группа А)

```ts
// Получить правила деления для класса
const rules = await getDivisionRules('class9a');
// Результат: ["Весь класс", "Деление на 2 группы", ...]

// Выбрать правило "Деление на 2 группы"
const selectedRule = rules.find(r => r.name === 'Деление на 2 группы');

// Получить группы этого правила
const groups = await getDivisionGroups(selectedRule.id);
// Результат: ["Группа А", "Группа Б"]

// Выбрать "Группа А"
const groupA = groups[0];

// Создать урок
await createLesson({
  teacherId: userId,
  subjectId: englishId,
  classId: 'class9a',
  divisionRuleId: selectedRule.id,
  divisionGroupId: groupA.id,
  date: Timestamp.now(),
  topic: 'Past Simple'
});
```

## Преимущества новой структуры

✅ **Переиспользование:** настроил деление один раз - используй для разных предметов
✅ **Гибкость:** произвольное количество правил и групп
✅ **Простота:** один источник правды для состава групп
✅ **Удобство:** изменил состав группы в одном месте - применилось везде
✅ **Масштабируемость:** легко добавлять новые правила деления
✅ **Производительность:** эффективные запросы с индексами

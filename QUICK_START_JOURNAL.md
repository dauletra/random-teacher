# Быстрый старт: Система журналов

## Краткая схема работы

```
Класс (9А)
    └── Предметы
            ├── Математика (весь класс) → 1 группа: все 30 учеников
            ├── Английский (2 группы)   → Группа 1: 15 уч., Группа 2: 15 уч.
            └── Информатика (3 группы)  → Группа 1: 10 уч., Группа 2: 10 уч., Группа 3: 10 уч.
                    └── Уроки
                            └── Урок (дата, группа)
                                    ├── Посещаемость (кто был/не был)
                                    └── Оценки (кому и какие)
```

## 5 шагов для работы с журналом

### 1️⃣ Создать предмет и настроить группы

```typescript
import { createSubject } from './services/subjectService';
import { createSubjectGroupsForClass } from './services/subjectGroupService';

// Создать предмет
const subjectId = await createSubject({
  teacherId: userId,
  name: 'Английский',
  color: '#4CAF50',
});

// Настроить деление на группы
const groupIds = await createSubjectGroupsForClass(
  subjectId,
  classId,
  2,           // 0 = весь класс, 1+ = количество групп
  studentIds   // все ID учеников класса
);
```

### 2️⃣ Создать урок

```typescript
import { createLesson } from './services/lessonService';
import { getSubjectGroups } from './services/subjectGroupService';

// Получить группы предмета
const groups = await getSubjectGroups(subjectId, classId);

// Создать урок для первой группы
const lessonId = await createLesson({
  teacherId: userId,
  subjectId,
  classId,
  subjectGroupId: groups[0].id,  // выбрать группу
  date: Timestamp.now(),
  topic: 'Past Simple',
  homework: 'стр. 42'
});
```

### 3️⃣ Отметить посещаемость

```typescript
import { markAttendance } from './services/journalService';

// Отметить всех присутствующих
for (const studentId of group.studentIds) {
  await markAttendance(lessonId, studentId, true);
}

// Отметить отсутствующих
await markAttendance(lessonId, student1Id, false, 'Болезнь');
await markAttendance(lessonId, student2Id, false, 'Уважительная');
```

### 4️⃣ Выставить оценки

```typescript
import { addGrade } from './services/journalService';

await addGrade(lessonId, student1Id, 9, 'Отличный ответ');
await addGrade(lessonId, student2Id, 7);
await addGrade(lessonId, student3Id, 10, 'Превосходно!');
```

### 5️⃣ Посмотреть журнал

```typescript
import {
  getStudentJournal,
  getGroupJournal,
  getStudentAverageGrade,
  getStudentAttendanceStats
} from './services/journalService';

// Журнал одного ученика
const journal = await getStudentJournal(studentId, subjectId);
console.log(journal.entries); // все уроки с оценками

// Средний балл
const avg = await getStudentAverageGrade(studentId, subjectId);
console.log('Средний балл:', avg); // 8.5

// Посещаемость
const stats = await getStudentAttendanceStats(studentId, subjectId);
console.log(`${stats.percentage}% (${stats.present}/${stats.total})`);

// Журнал всей группы (таблица)
const groupJournal = await getGroupJournal(groupId, studentIds);
// Каждая строка = ученик, каждая колонка = дата урока
```

## Полезные функции

### Переместить ученика в другую группу

```typescript
import { moveStudentToGroup } from './services/subjectGroupService';

await moveStudentToGroup(studentId, fromGroupId, toGroupId);
```

### Пересоздать группы

```typescript
import { deleteAllSubjectGroups, createSubjectGroupsForClass }
  from './services/subjectGroupService';

// Удалить старые
await deleteAllSubjectGroups(subjectId, classId);

// Создать новые
await createSubjectGroupsForClass(subjectId, classId, 3, studentIds);
```

### Узнать группу ученика

```typescript
import { getStudentGroup } from './services/subjectGroupService';

const group = await getStudentGroup(studentId, subjectId, classId);
console.log(group.name); // "Группа 1"
```

## Типичные кейсы

### Кейс 1: Физика (весь класс)
```typescript
// numberOfGroups = 0 → создается 1 группа "Весь класс"
await createSubjectGroupsForClass(physicsId, classId, 0, allStudents);
```

### Кейс 2: Английский (2 группы)
```typescript
// numberOfGroups = 2 → ученики делятся пополам
await createSubjectGroupsForClass(englishId, classId, 2, allStudents);
```

### Кейс 3: Информатика (3 группы)
```typescript
// numberOfGroups = 3 → ученики делятся на 3 части
await createSubjectGroupsForClass(csId, classId, 3, allStudents);
```

## Важно помнить

✅ У ученика НЕТ постоянной группы - группа зависит от предмета
✅ Один ученик = одна группа для одного предмета
✅ Посещаемость и оценки привязаны к уроку
✅ Урок привязан к конкретной группе предмета
✅ Группы хранятся в отдельной коллекции `subjectGroups`

## Следующие шаги

1. Прочитайте `JOURNAL_STRUCTURE.md` для понимания архитектуры
2. Изучите `JOURNAL_USAGE_EXAMPLES.md` для детальных примеров
3. Создайте композитные индексы в Firebase Console (см. документацию)
4. Разверните обновленные Firestore Rules из `firestore.rules`

# Примеры использования системы журналов

## Сценарий 1: Создание предмета с делением на группы

```typescript
import { createSubject } from './services/subjectService';
import { createSubjectGroupsForClass } from './services/subjectGroupService';
import { getStudentsByClassId } from './services/studentService';

// 1. Создать предмет
const subjectId = await createSubject({
  teacherId: currentUser.uid,
  name: 'Английский язык',
  color: '#4CAF50',
});

// 2. Получить всех учеников класса
const students = await getStudentsByClassId(classId);
const studentIds = students.map(s => s.id);

// 3. Разделить класс на 2 группы для английского
const groupIds = await createSubjectGroupsForClass(
  subjectId,
  classId,
  2, // 2 группы
  studentIds
);

console.log('Созданы группы:', groupIds);
// Результат: ученики автоматически распределены в 2 группы
```

## Сценарий 2: Создание предмета без деления (весь класс)

```typescript
// Физика - весь класс вместе
const physicsId = await createSubject({
  teacherId: currentUser.uid,
  name: 'Физика',
  color: '#2196F3',
});

// Создать 1 группу "весь класс"
const groupIds = await createSubjectGroupsForClass(
  physicsId,
  classId,
  0, // 0 = не делится, весь класс
  studentIds
);
```

## Сценарий 3: Создание урока и отметка посещаемости

```typescript
import { createLesson } from './services/lessonService';
import { getSubjectGroups } from './services/subjectGroupService';
import { markAttendance } from './services/journalService';

// 1. Получить группы для предмета
const groups = await getSubjectGroups(subjectId, classId);

// 2. Учитель выбирает группу (например, "Группа 1")
const selectedGroup = groups[0];

// 3. Создать урок
const lessonId = await createLesson({
  teacherId: currentUser.uid,
  subjectId,
  classId,
  subjectGroupId: selectedGroup.id,
  date: Timestamp.now(),
  topic: 'Past Simple Tense',
  homework: 'Упражнение 5, стр. 42',
});

// 4. Отметить посещаемость
for (const studentId of selectedGroup.studentIds) {
  // Все присутствуют
  await markAttendance(lessonId, studentId, true);
}

// Отметить конкретного ученика как отсутствующего
await markAttendance(lessonId, absentStudentId, false, 'Болезнь');
```

## Сценарий 4: Выставление оценок

```typescript
import { addGrade } from './services/journalService';

// Выставить оценки нескольким ученикам
await addGrade(lessonId, student1Id, 9, 'Отличный ответ у доски');
await addGrade(lessonId, student2Id, 7, 'Хорошо, но были ошибки');
await addGrade(lessonId, student3Id, 10, 'Превосходно!');
```

## Сценарий 5: Просмотр журнала ученика

```typescript
import {
  getStudentJournal,
  getStudentAttendanceStats,
  getStudentAverageGrade
} from './services/journalService';

// Получить полный журнал ученика по предмету
const journal = await getStudentJournal(studentId, subjectId);

console.log('Уроки и оценки:');
journal.entries.forEach(entry => {
  console.log(`
    Дата: ${entry.date.toDate().toLocaleDateString()}
    Тема: ${entry.topic}
    Оценка: ${entry.grade || '-'}
    Присутствие: ${entry.isPresent ? 'Да' : 'Нет'}
    ${entry.reason ? `Причина: ${entry.reason}` : ''}
  `);
});

// Статистика посещаемости
const stats = await getStudentAttendanceStats(studentId, subjectId);
console.log(`Посещаемость: ${stats.percentage}% (${stats.present}/${stats.total})`);

// Средний балл
const avgGrade = await getStudentAverageGrade(studentId, subjectId);
console.log(`Средний балл: ${avgGrade || 'Нет оценок'}`);
```

## Сценарий 6: Таблица журнала группы (Excel-стиль)

```typescript
import { getGroupJournal } from './services/journalService';
import { getSubjectGroup } from './services/subjectGroupService';
import { getStudentsByIds } from './services/studentService';

// 1. Получить группу
const group = await getSubjectGroup(subjectGroupId);

// 2. Получить данные журнала
const journalRows = await getGroupJournal(group.id, group.studentIds);

// 3. Получить информацию об учениках
const students = await getStudentsByIds(group.studentIds);
const studentsMap = new Map(students.map(s => [s.id, s]));

// 4. Заполнить имена учеников
const tableData = journalRows.map(row => ({
  ...row,
  studentName: `${studentsMap.get(row.studentId)?.lastName} ${studentsMap.get(row.studentId)?.firstName}`,
}));

// 5. Вывести таблицу
console.log('ЖУРНАЛ ГРУППЫ');
console.log('Ученик | 01.09 | 05.09 | 08.09 | ...');
console.log('-------|-------|-------|-------|----');

tableData.forEach(row => {
  const grades = Array.from(row.entries.values())
    .map(e => e.grade?.toString() || (e.isPresent ? '.' : 'н'))
    .join(' | ');

  console.log(`${row.studentName} | ${grades}`);
});
```

## Сценарий 7: Перемещение ученика между группами

```typescript
import { moveStudentToGroup } from './services/subjectGroupService';

// Переместить ученика из группы 1 в группу 2
await moveStudentToGroup(
  studentId,
  group1Id,
  group2Id
);

console.log('Ученик успешно перемещен!');
```

## Сценарий 8: Пересоздание групп (изменение конфигурации)

```typescript
import {
  deleteAllSubjectGroups,
  createSubjectGroupsForClass
} from './services/subjectGroupService';

// 1. Удалить старые группы
await deleteAllSubjectGroups(subjectId, classId);

// 2. Создать новые группы (теперь 3 вместо 2)
const newGroupIds = await createSubjectGroupsForClass(
  subjectId,
  classId,
  3, // Теперь 3 группы
  studentIds
);

console.log('Группы пересозданы!');
```

## Сценарий 9: React компонент для выбора группы при создании урока

```tsx
import { useState, useEffect } from 'react';
import { getSubjectGroups } from '../services/subjectGroupService';

function CreateLessonForm({ subjectId, classId }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  useEffect(() => {
    async function loadGroups() {
      const data = await getSubjectGroups(subjectId, classId);
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroupId(data[0].id);
      }
    }
    loadGroups();
  }, [subjectId, classId]);

  return (
    <div>
      <label>Выберите группу:</label>
      <select
        value={selectedGroupId}
        onChange={(e) => setSelectedGroupId(e.target.value)}
      >
        {groups.map(group => (
          <option key={group.id} value={group.id}>
            {group.name} ({group.studentIds.length} учеников)
          </option>
        ))}
      </select>

      {/* Остальная форма создания урока */}
    </div>
  );
}
```

## Сценарий 10: Экспорт журнала в CSV

```typescript
import { getGroupJournal } from './services/journalService';
import { format } from 'date-fns';

async function exportJournalToCSV(subjectGroupId: string, studentIds: string[]) {
  const journalRows = await getGroupJournal(subjectGroupId, studentIds);

  // Получить все уникальные даты
  const allDates = new Set<string>();
  journalRows.forEach(row => {
    row.entries.forEach((_, dateKey) => allDates.add(dateKey));
  });

  const sortedDates = Array.from(allDates).sort();

  // Создать заголовок CSV
  const header = ['Ученик', ...sortedDates.map(d =>
    format(new Date(d), 'dd.MM.yyyy')
  )].join(',');

  // Создать строки данных
  const rows = journalRows.map(row => {
    const grades = sortedDates.map(dateKey => {
      const entry = row.entries.get(dateKey);
      if (!entry) return '';
      if (entry.grade) return entry.grade.toString();
      return entry.isPresent ? '.' : 'н';
    });

    return [row.studentName, ...grades].join(',');
  });

  // Объединить в CSV
  const csv = [header, ...rows].join('\n');

  // Скачать файл
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'journal.csv';
  link.click();
}
```

## Важные замечания

### Индексы Firestore
Не забудьте создать композитные индексы в Firebase Console:

```
Collection: lessons
Fields: subjectId (Ascending), classId (Ascending), date (Descending)

Collection: lessons
Fields: subjectGroupId (Ascending), date (Ascending)

Collection: subjectGroups
Fields: subjectId (Ascending), classId (Ascending), groupNumber (Ascending)

Collection: attendance
Fields: lessonId (Ascending), studentId (Ascending)

Collection: grades
Fields: lessonId (Ascending), studentId (Ascending)
```

### Оптимизация запросов

Для больших объемов данных используйте пагинацию:

```typescript
import { query, limit, startAfter } from 'firebase/firestore';

// Получить первую страницу уроков
const firstQuery = query(
  collection(db, 'lessons'),
  where('subjectGroupId', '==', groupId),
  orderBy('date', 'desc'),
  limit(25)
);

// Следующая страница
const nextQuery = query(
  collection(db, 'lessons'),
  where('subjectGroupId', '==', groupId),
  orderBy('date', 'desc'),
  startAfter(lastDoc),
  limit(25)
);
```

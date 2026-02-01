import React, { useState, useEffect, useMemo } from 'react';
import { lessonService } from '../../services/lessonService';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import type { Student } from '../../types/student.types';
import type { Lesson, Grade } from '../../types/lesson.types';

interface GradesTabProps {
  journalId: string;
  students: Student[];
}

interface LessonData {
  lesson: Lesson;
  grades: Map<string, Grade>;
  attendance: Map<string, boolean>;
}

interface MonthGroup {
  month: string;
  year: number;
  lessons: Lesson[];
}

interface EditingCell {
  studentId: string;
  lessonId: string;
}

export const GradesTab: React.FC<GradesTabProps> = ({ journalId, students }) => {
  const [loading, setLoading] = useState(true);
  const [lessonsData, setLessonsData] = useState<LessonData[]>([]);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    loadAllData();
  }, [journalId]);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load all lessons
      const lessons = await lessonService.getByJournalId(journalId);

      // Sort lessons from oldest to newest for table display
      const sortedLessons = [...lessons].sort((a, b) =>
        a.date.toMillis() - b.date.toMillis()
      );

      // Load grades and attendance for all lessons in parallel
      const allData = await Promise.all(
        sortedLessons.map(async (lesson) => {
          const [grades, attendance] = await Promise.all([
            lessonService.getGrades(lesson.id),
            lessonService.getAttendance(lesson.id)
          ]);

          // Convert to Maps for quick lookup
          const gradesMap = new Map<string, Grade>();
          grades.forEach(g => gradesMap.set(g.studentId, g));

          const attendanceMap = new Map<string, boolean>();
          attendance.forEach(a => attendanceMap.set(a.studentId, a.isPresent));

          return {
            lesson,
            grades: gradesMap,
            attendance: attendanceMap
          };
        })
      );

      setLessonsData(allData);
    } catch (error) {
      console.error('Error loading grades data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDay = (date: Timestamp): string => {
    return date.toDate().getDate().toString();
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  };

  const getMonthGroups = (): MonthGroup[] => {
    const groups: MonthGroup[] = [];
    let currentMonth = -1;
    let currentYear = -1;
    let currentGroup: MonthGroup | null = null;

    lessonsData.forEach(({ lesson }) => {
      const date = lesson.date.toDate();
      const month = date.getMonth();
      const year = date.getFullYear();

      if (month !== currentMonth || year !== currentYear) {
        currentMonth = month;
        currentYear = year;
        currentGroup = {
          month: formatMonthYear(date),
          year,
          lessons: []
        };
        groups.push(currentGroup);
      }

      if (currentGroup) {
        currentGroup.lessons.push(lesson);
      }
    });

    return groups;
  };

  const getGradeColor = (grade: number): string => {
    if (grade >= 8) return 'bg-green-50 border-green-300 text-green-800';
    if (grade >= 5) return 'bg-indigo-50 border-indigo-300 text-indigo-800';
    return 'bg-yellow-50 border-yellow-300 text-yellow-800';
  };

  const handleCellClick = (studentId: string, lessonId: string, lessonData: LessonData) => {
    const isPresent = lessonData.attendance.get(studentId);
    const grade = lessonData.grades.get(studentId);

    // If student was absent, show 'н' in input
    if (isPresent === false) {
      setEditingCell({ studentId, lessonId });
      setEditValue('н');
      return;
    }

    setEditingCell({ studentId, lessonId });
    setEditValue(grade ? grade.grade.toString() : '');
  };

  const handleEditChange = (value: string) => {
    // Allow empty string
    if (value === '') {
      setEditValue(value);
      return;
    }

    // Allow 'н' (absent marker)
    if (value.toLowerCase() === 'н') {
      setEditValue('н');
      return;
    }

    // Check if value contains only digits
    if (!/^\d+$/.test(value)) {
      return;
    }

    // Parse and validate range 1-10
    const numValue = parseInt(value, 10);
    if (numValue >= 1 && numValue <= 10) {
      setEditValue(value);
    }
  };

  const handleSaveGrade = async (studentId: string, lessonId: string) => {
    if (!editingCell) return;

    const lessonDataIndex = lessonsData.findIndex(ld => ld.lesson.id === lessonId);
    if (lessonDataIndex === -1) return;

    const lessonData = lessonsData[lessonDataIndex];
    const existingGrade = lessonData.grades.get(studentId);

    try {
      // If grade is empty, delete it if it exists
      if (!editValue || editValue.trim() === '') {
        if (existingGrade) {
          await lessonService.deleteGrade(existingGrade.id);

          // Update local state
          const newGrades = new Map(lessonData.grades);
          newGrades.delete(studentId);
          const newLessonsData = [...lessonsData];
          newLessonsData[lessonDataIndex] = {
            ...lessonData,
            grades: newGrades
          };
          setLessonsData(newLessonsData);
          toast.success('Оценка удалена');
        }
      } else if (editValue === 'н') {
        // Mark as absent and remove grade
        await lessonService.markAttendance(lessonId, studentId, false);

        // Delete grade if exists
        if (existingGrade) {
          await lessonService.deleteGrade(existingGrade.id);
        }

        // Update local state
        const newAttendance = new Map(lessonData.attendance);
        newAttendance.set(studentId, false);
        const newGrades = new Map(lessonData.grades);
        newGrades.delete(studentId);
        const newLessonsData = [...lessonsData];
        newLessonsData[lessonDataIndex] = {
          ...lessonData,
          attendance: newAttendance,
          grades: newGrades
        };
        setLessonsData(newLessonsData);
        toast.success('Ученик отмечен отсутствующим');
      } else {
        const grade = parseInt(editValue, 10);
        if (isNaN(grade) || grade < 1 || grade > 10) {
          toast.error('Оценка должна быть от 1 до 10');
          setEditingCell(null);
          setEditValue('');
          return;
        }

        // Mark as present when adding grade
        await lessonService.markAttendance(lessonId, studentId, true);

        if (existingGrade) {
          // Update existing grade
          await lessonService.updateGrade(existingGrade.id, { grade });

          // Update local state
          const newAttendance = new Map(lessonData.attendance);
          newAttendance.set(studentId, true);
          const newGrades = new Map(lessonData.grades);
          newGrades.set(studentId, { ...existingGrade, grade });
          const newLessonsData = [...lessonsData];
          newLessonsData[lessonDataIndex] = {
            ...lessonData,
            attendance: newAttendance,
            grades: newGrades
          };
          setLessonsData(newLessonsData);
          toast.success('Оценка обновлена');
        } else {
          // Add new grade
          const gradeId = await lessonService.addGrade(lessonId, studentId, grade);

          // Update local state
          const newGrade: Grade = {
            id: gradeId,
            lessonId,
            studentId,
            grade
          };
          const newAttendance = new Map(lessonData.attendance);
          newAttendance.set(studentId, true);
          const newGrades = new Map(lessonData.grades);
          newGrades.set(studentId, newGrade);
          const newLessonsData = [...lessonsData];
          newLessonsData[lessonDataIndex] = {
            ...lessonData,
            attendance: newAttendance,
            grades: newGrades
          };
          setLessonsData(newLessonsData);
          toast.success('Оценка добавлена');
        }
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error('Ошибка сохранения оценки');
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, studentId: string, lessonId: string) => {
    if (e.key === 'Enter') {
      handleSaveGrade(studentId, lessonId);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const getCellContent = (studentId: string, lessonData: LessonData) => {
    const grade = lessonData.grades.get(studentId);
    const isPresent = lessonData.attendance.get(studentId);

    // Student was absent
    if (isPresent === false) {
      return {
        content: 'н',
        className: 'bg-red-50 border-red-300 text-red-600 font-medium',
        editable: true
      };
    }

    // Student has a grade
    if (grade) {
      return {
        content: grade.grade.toString(),
        className: getGradeColor(grade.grade) + ' font-bold',
        editable: true
      };
    }

    // Student was present but no grade, or no data (assume present, allow grading)
    return {
      content: '',
      className: 'bg-gray-50 text-gray-400',
      editable: true
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (lessonsData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Нет уроков для отображения</p>
      </div>
    );
  }

  const monthGroups = useMemo(() => getMonthGroups(), [lessonsData]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Все оценки</h3>
        <p className="text-sm text-gray-600 mt-1">
          Всего уроков: {lessonsData.length}
        </p>
      </div>

      <div className="overflow-auto max-h-[calc(100vh-300px)]">
        <table className="border-collapse table-fixed w-auto">
          <thead className="sticky top-0 bg-white z-20 shadow-sm">
            {/* Month row */}
            <tr>
              <th
                className="sticky left-0 bg-white z-30 border-r-2 border-b border-gray-300 px-4 py-2 w-48"
                rowSpan={2}
              >
                <div className="text-left font-semibold text-gray-900">Ученик</div>
              </th>
              {monthGroups.map((group, idx) => (
                <th
                  key={idx}
                  colSpan={group.lessons.length}
                  className="border-b border-l border-gray-300 px-2 py-2 text-center text-sm font-semibold text-gray-700 bg-gray-50"
                >
                  {group.month}
                </th>
              ))}
            </tr>

            {/* Day row */}
            <tr>
              {lessonsData.map(({ lesson }) => (
                <th
                  key={lesson.id}
                  className="border-b border-l border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-600 bg-gray-50 w-14"
                >
                  {formatDay(lesson.date)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="sticky left-0 bg-white z-10 border-r-2 border-b border-gray-200 px-4 py-3 w-48">
                  <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {student.firstName} {student.lastName[0]}.
                  </div>
                </td>
                {lessonsData.map((lessonData) => {
                  const cell = getCellContent(student.id, lessonData);
                  const isEditing = editingCell?.studentId === student.id && editingCell?.lessonId === lessonData.lesson.id;

                  return (
                    <td
                      key={lessonData.lesson.id}
                      className={`border-b border-l border-gray-200 px-1 py-1 text-center text-sm w-14 ${cell.className} ${cell.editable ? 'cursor-pointer hover:shadow-[inset_0_0_0_2px_rgb(165_180_252)]' : ''}`}
                      onClick={() => cell.editable && handleCellClick(student.id, lessonData.lesson.id, lessonData)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => handleEditChange(e.target.value)}
                          onBlur={() => handleSaveGrade(student.id, lessonData.lesson.id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id, lessonData.lesson.id)}
                          autoFocus
                          placeholder="-"
                          className="w-full px-1 py-1 text-sm text-center border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <div className="px-1 py-1">{cell.content}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-50 border border-green-300 rounded"></div>
            <span className="text-gray-600">8-10 баллов</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-50 border border-indigo-300 rounded"></div>
            <span className="text-gray-600">5-7 баллов</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-50 border border-yellow-300 rounded"></div>
            <span className="text-gray-600">1-4 балла</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-50 border border-red-300 rounded flex items-center justify-center text-red-600 font-medium">
              н
            </div>
            <span className="text-gray-600">Отсутствовал</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-50 border border-gray-200 rounded"></div>
            <span className="text-gray-600">Без оценки</span>
          </div>
        </div>
      </div>
    </div>
  );
};

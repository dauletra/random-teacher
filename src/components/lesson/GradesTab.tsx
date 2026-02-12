import React, { useState, useEffect, useMemo, useRef } from 'react';
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

const LESSONS_PER_PAGE = 15;

export const GradesTab: React.FC<GradesTabProps> = ({ journalId, students }) => {
  const [loading, setLoading] = useState(true);
  const [lessonsData, setLessonsData] = useState<LessonData[]>([]);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loadedCount, setLoadedCount] = useState(LESSONS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent re-loading when tab becomes visible again (display:none -> block)
    if (!dataLoadedRef.current) {
      loadAllData();
    }
  }, [journalId]);

  const loadLessonDetails = async (lessons: Lesson[]): Promise<LessonData[]> => {
    if (lessons.length === 0) return [];

    // Load grades and attendance for given lessons in parallel
    const allData = await Promise.all(
      lessons.map(async (lesson) => {
        const [grades, attendance] = await Promise.all([
          lessonService.getGrades(lesson.id),
          lessonService.getAttendance(lesson.id)
        ]);

        const gradesMap = new Map<string, Grade>();
        grades.forEach(g => gradesMap.set(g.studentId, g));

        const attendanceMap = new Map<string, boolean>();
        attendance.forEach(a => attendanceMap.set(a.studentId, a.isPresent));

        return { lesson, grades: gradesMap, attendance: attendanceMap };
      })
    );

    return allData;
  };

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load all lessons (just the lesson list — lightweight)
      const lessons = await lessonService.getByJournalId(journalId);

      // Sort lessons from oldest to newest for table display
      const sortedLessons = [...lessons].sort((a, b) =>
        a.date.toMillis() - b.date.toMillis()
      );

      setAllLessons(sortedLessons);

      // Load details only for the latest N lessons (end of array = most recent)
      const initialSlice = sortedLessons.slice(-LESSONS_PER_PAGE);
      const initialData = await loadLessonDetails(initialSlice);

      setLessonsData(initialData);
      setLoadedCount(LESSONS_PER_PAGE);
      dataLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading grades data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    try {
      setLoadingMore(true);

      const newCount = loadedCount + LESSONS_PER_PAGE;
      // Load the next batch (older lessons)
      const startIdx = Math.max(0, allLessons.length - newCount);
      const endIdx = allLessons.length - loadedCount;
      const nextSlice = allLessons.slice(startIdx, endIdx);

      const moreData = await loadLessonDetails(nextSlice);

      // Prepend older lessons to the beginning
      setLessonsData(prev => [...moreData, ...prev]);
      setLoadedCount(newCount);
    } catch (error) {
      console.error('Error loading more grades:', error);
      toast.error('Қате загрузки данных');
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = allLessons.length > loadedCount;

  const formatDay = (date: Timestamp): string => {
    return date.toDate().getDate().toString();
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('kk-KZ', { month: 'long', year: 'numeric' });
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
          toast.success('Баға жойылдыа');
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
        toast.success('Оқушы отмечен отсутствующим');
      } else {
        const grade = parseInt(editValue, 10);
        if (isNaN(grade) || grade < 1 || grade > 10) {
          toast.error('Баға должна быть от 1 до 10');
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
          toast.success('Баға жаңардыа');
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
          toast.success('Баға қосылдыа');
        }
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error('Қате сохранения оценки');
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

  const monthGroups = useMemo(() => getMonthGroups(), [lessonsData]);

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
        <p className="text-gray-600">Жоқ уроков для отображения</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-3 md:p-4 border-b border-gray-200">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">Барлығы оценки</h3>
        <p className="text-xs md:text-sm text-gray-600 mt-1">
          Показано уроков: {lessonsData.length} из {allLessons.length}
        </p>
      </div>

      {/* Load More button (older lessons) */}
      {hasMore && (
        <div className="px-3 md:px-4 py-2 border-b border-gray-200 bg-gray-50">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                Жүктелуде...
              </span>
            ) : (
              `Загрузить ещё ${Math.min(LESSONS_PER_PAGE, allLessons.length - loadedCount)} уроков`
            )}
          </button>
        </div>
      )}

      <div className="overflow-auto max-h-[calc(100vh-300px)]">
        <table className="border-collapse table-fixed w-auto">
          <thead className="sticky top-0 bg-white z-20 shadow-sm">
            {/* Month row */}
            <tr>
              <th
                className="sticky left-0 bg-white z-30 border-r-2 border-b border-gray-300 px-2 md:px-4 py-2 w-28 md:w-48"
                rowSpan={2}
              >
                <div className="text-left text-xs md:text-sm font-semibold text-gray-900">Оқушы</div>
              </th>
              {monthGroups.map((group, idx) => (
                <th
                  key={idx}
                  colSpan={group.lessons.length}
                  className="border-b border-l border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center text-[10px] md:text-sm font-semibold text-gray-700 bg-gray-50"
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
                  className="border-b border-l border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center text-[10px] md:text-xs font-medium text-gray-600 bg-gray-50 w-9 md:w-14"
                >
                  {formatDay(lesson.date)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="sticky left-0 bg-white z-10 border-r-2 border-b border-gray-200 px-2 md:px-4 py-2 md:py-3 w-28 md:w-48">
                  <div className="text-xs md:text-sm font-medium text-gray-900 whitespace-nowrap truncate">
                    {student.firstName} {student.lastName[0]}.
                  </div>
                </td>
                {lessonsData.map((lessonData) => {
                  const cell = getCellContent(student.id, lessonData);
                  const isEditing = editingCell?.studentId === student.id && editingCell?.lessonId === lessonData.lesson.id;

                  return (
                    <td
                      key={lessonData.lesson.id}
                      className={`border-b border-l border-gray-200 px-0.5 md:px-1 py-0.5 md:py-1 text-center text-xs md:text-sm w-9 md:w-14 ${cell.className} ${cell.editable ? 'cursor-pointer hover:shadow-[inset_0_0_0_2px_rgb(165_180_252)]' : ''}`}
                      onClick={() => cell.editable && handleCellClick(student.id, lessonData.lesson.id, lessonData)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editValue}
                          onChange={(e) => handleEditChange(e.target.value)}
                          onBlur={() => handleSaveGrade(student.id, lessonData.lesson.id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id, lessonData.lesson.id)}
                          autoFocus
                          placeholder="-"
                          className="w-full px-0.5 md:px-1 py-0.5 md:py-1 text-xs md:text-sm text-center border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <div className="px-0.5 md:px-1 py-0.5 md:py-1">{cell.content}</div>
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
      <div className="p-3 md:p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-xs">
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-4 h-4 md:w-6 md:h-6 bg-green-50 border border-green-300 rounded"></div>
            <span className="text-gray-600">8-10</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-4 h-4 md:w-6 md:h-6 bg-indigo-50 border border-indigo-300 rounded"></div>
            <span className="text-gray-600">5-7</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-4 h-4 md:w-6 md:h-6 bg-yellow-50 border border-yellow-300 rounded"></div>
            <span className="text-gray-600">1-4</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-4 h-4 md:w-6 md:h-6 bg-red-50 border border-red-300 rounded flex items-center justify-center text-red-600 font-medium text-[8px] md:text-xs">
              н
            </div>
            <span className="text-gray-600">Отсут.</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-4 h-4 md:w-6 md:h-6 bg-gray-50 border border-gray-200 rounded"></div>
            <span className="text-gray-600">Жоқ оценки</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { journalService } from '../services/journalService';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { lessonService } from '../services/lessonService';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import type { Journal } from '../types/journal.types';
import type { Student } from '../types/student.types';
import type { Lesson, Grade } from '../types/lesson.types';
import { GradesTab } from '../components/lesson/GradesTab';
import { RandomizerTab } from '../components/lesson/RandomizerTab';
import { SeatingTab } from '../components/lesson/SeatingTab';
import { GroupsTab } from '../components/lesson/GroupsTab';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { LessonToolbar } from '../components/lesson/LessonToolbar';

export const JournalPage = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const navigate = useNavigate();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [className, setClassName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  // Lesson data
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [attendance, setAttendance] = useState<Map<string, boolean>>(new Map());
  const [grades, setGrades] = useState<Map<string, Grade>>(new Map());
  const [gradeInputs, setGradeInputs] = useState<Map<string, string>>(new Map());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'randomizer' | 'seating' | 'group' | 'allGrades'>('randomizer');
  const [showLessonMenu, setShowLessonMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadData = React.useCallback(async () => {
    if (!journalId) return;

    // Prevent concurrent calls to loadData
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);

      const journalData = await journalService.getById(journalId);
      if (!journalData) {
        throw new Error('Journal not found');
      }
      setJournal(journalData);

      const classData = await classService.getById(journalData.classId);
      setClassName(classData?.name || '');

      const studentIds = await journalService.getStudentsByJournalId(journalId);
      // Batch load students instead of loading one by one
      const studentsData = await studentService.getByIds(studentIds);
      setStudents(studentsData);

      // Get or create today's lesson first
      const todayLesson = await lessonService.getOrCreateTodayLesson(journalId);
      setCurrentLesson(todayLesson);

      // Load lessons after creating today's lesson to ensure it's included
      const lessons = await lessonService.getByJournalId(journalId);
      setAllLessons(lessons);

      // Find index of current lesson in all lessons
      const todayIndex = lessons.findIndex(l => l.id === todayLesson.id);
      setCurrentLessonIndex(todayIndex !== -1 ? todayIndex : 0);
    } catch (error) {
      console.error('Error loading journal data:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [journalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
      if (showLessonMenu) {
        setShowLessonMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId, showLessonMenu]);

  // Load lesson data (attendance and grades)
  useEffect(() => {
    const loadLessonData = async () => {
      if (!currentLesson) return;

      try {
        const attendanceData = await lessonService.getAttendance(currentLesson.id);
        const attendanceMap = new Map<string, boolean>();
        attendanceData.forEach(a => {
          attendanceMap.set(a.studentId, a.isPresent);
        });
        setAttendance(attendanceMap);

        const gradesData = await lessonService.getGrades(currentLesson.id);
        const gradesMap = new Map<string, Grade>();
        const inputsMap = new Map<string, string>();
        gradesData.forEach(g => {
          gradesMap.set(g.studentId, g);
          inputsMap.set(g.studentId, g.grade.toString());
        });
        setGrades(gradesMap);
        setGradeInputs(inputsMap);
      } catch (error) {
        console.error('Error loading lesson data:', error);
      }
    };

    loadLessonData();
  }, [currentLesson]);

  const isToday = (date: Timestamp): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lessonDate = date.toDate();
    lessonDate.setHours(0, 0, 0, 0);
    return today.getTime() === lessonDate.getTime();
  };

  const formatDate = (date: Timestamp): string => {
    return date.toDate().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const newIndex = currentLessonIndex + 1;
      setCurrentLessonIndex(newIndex);
      setCurrentLesson(allLessons[newIndex]);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex > 0) {
      const newIndex = currentLessonIndex - 1;
      setCurrentLessonIndex(newIndex);
      setCurrentLesson(allLessons[newIndex]);
    }
  };

  const handleDeleteLesson = async () => {
    if (!currentLesson || !journalId) return;

    try {
      // Delete the lesson
      await lessonService.delete(currentLesson.id);
      toast.success('Урок удален');

      // Reload lessons
      const lessons = await lessonService.getByJournalId(journalId);
      setAllLessons(lessons);

      // Navigate to another lesson or create today's lesson if none left
      if (lessons.length === 0) {
        const todayLesson = await lessonService.getOrCreateTodayLesson(journalId);
        setCurrentLesson(todayLesson);
        setAllLessons([todayLesson]);
        setCurrentLessonIndex(0);
      } else {
        // Navigate to the previous lesson if possible, otherwise the next one
        const newIndex = currentLessonIndex > 0 ? currentLessonIndex - 1 : 0;
        setCurrentLessonIndex(newIndex);
        setCurrentLesson(lessons[newIndex]);
      }

      setShowDeleteModal(false);
      setShowLessonMenu(false);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Ошибка удаления урока');
    }
  };

  const handleToggleAttendance = async (studentId: string) => {
    if (!currentLesson) return;

    const currentStatus = attendance.get(studentId) ?? true;
    const newStatus = !currentStatus;

    try {
      await lessonService.markAttendance(currentLesson.id, studentId, newStatus);
      setAttendance(new Map(attendance.set(studentId, newStatus)));
      toast.success(newStatus ? 'Ученик отмечен присутствующим' : 'Ученик отмечен отсутствующим');
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Ошибка обновления посещаемости');
    }
  };

  const handleGradeChange = (studentId: string, value: string) => {
    // Allow empty string
    if (value === '') {
      setGradeInputs(new Map(gradeInputs.set(studentId, value)));
      return;
    }

    // Allow 'н' (absent marker)
    if (value.toLowerCase() === 'н') {
      setGradeInputs(new Map(gradeInputs.set(studentId, 'н')));
      return;
    }

    // Check if value contains only digits
    if (!/^\d+$/.test(value)) {
      return; // Ignore non-digit and non-'н' input
    }

    // Parse and validate range 1-10
    const numValue = parseInt(value, 10);
    if (numValue >= 1 && numValue <= 10) {
      setGradeInputs(new Map(gradeInputs.set(studentId, value)));
    }
    // If value is outside range, ignore it
  };

  const handleSaveGrade = async (studentId: string) => {
    if (!currentLesson) return;

    const gradeValue = gradeInputs.get(studentId);

    // If grade is empty, delete it if it exists
    if (!gradeValue || gradeValue.trim() === '') {
      const existingGrade = grades.get(studentId);
      if (existingGrade) {
        try {
          await lessonService.deleteGrade(existingGrade.id);
          const newGrades = new Map(grades);
          newGrades.delete(studentId);
          setGrades(newGrades);
          const newInputs = new Map(gradeInputs);
          newInputs.delete(studentId);
          setGradeInputs(newInputs);
          toast.success('Оценка удалена');
        } catch (error) {
          console.error('Error deleting grade:', error);
          toast.error('Ошибка удаления оценки');
        }
      }
      return;
    }

    // If grade is 'н', mark as absent and remove grade
    if (gradeValue === 'н') {
      try {
        // Mark as absent
        await lessonService.markAttendance(currentLesson.id, studentId, false);
        setAttendance(new Map(attendance.set(studentId, false)));

        // Delete grade if exists
        const existingGrade = grades.get(studentId);
        if (existingGrade) {
          await lessonService.deleteGrade(existingGrade.id);
          const newGrades = new Map(grades);
          newGrades.delete(studentId);
          setGrades(newGrades);
        }

        const newInputs = new Map(gradeInputs);
        newInputs.delete(studentId);
        setGradeInputs(newInputs);
        toast.success('Ученик отмечен отсутствующим');
      } catch (error) {
        console.error('Error marking absent:', error);
        toast.error('Ошибка сохранения');
      }
      return;
    }

    const grade = parseInt(gradeValue, 10);
    if (isNaN(grade) || grade < 1 || grade > 10) {
      toast.error('Оценка должна быть от 1 до 10');
      return;
    }

    try {
      // Ensure student is marked as present when adding grade
      await lessonService.markAttendance(currentLesson.id, studentId, true);
      setAttendance(new Map(attendance.set(studentId, true)));

      const existingGrade = grades.get(studentId);
      if (existingGrade) {
        await lessonService.updateGrade(existingGrade.id, { grade });
        setGrades(new Map(grades.set(studentId, { ...existingGrade, grade })));
      } else {
        const gradeId = await lessonService.addGrade(currentLesson.id, studentId, grade);
        const newGrade: Grade = {
          id: gradeId,
          lessonId: currentLesson.id,
          studentId,
          grade,
        };
        setGrades(new Map(grades.set(studentId, newGrade)));
      }
      toast.success('Оценка сохранена');
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error('Ошибка сохранения оценки');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Журнал не найден</p>
      </div>
    );
  }

  const isStudentPresent = (studentId: string): boolean => {
    return attendance.get(studentId) ?? true;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b flex gap-2 items-center border-gray-200">
          <div>
            <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{className}</h2>
            <p className="text-sm text-gray-600">{journal.name}</p>
          </div>
        </div>

        <div className="p-4 flex-1">
          <div className="space-y-2">
            {students.map((student) => {
              const isPresent = isStudentPresent(student.id);
              const gradeInput = gradeInputs.get(student.id) || '';
              const currentGrade = grades.get(student.id);

              return (
                <div
                  key={student.id}
                  className={`px-1 py-1 flex items-center gap-2 ${
                    isPresent
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Student Name */}
                  <div className={`flex-1 text-sm font-medium ${
                    isPresent ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {student.firstName} {student.lastName[0]+'.'}
                  </div>

                  {/* Grade Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={gradeInput}
                      onChange={(e) => handleGradeChange(student.id, e.target.value)}
                      onBlur={() => handleSaveGrade(student.id)}
                      disabled={!isPresent}
                      placeholder="-"
                      className={`w-10 px-2 py-1 text-sm text-center border rounded-md transition-colors ${
                        currentGrade
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-gray-300'
                      } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400`}
                    />
                  </div>

                  {/* Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === student.id ? null : student.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                    </button>

                    {openMenuId === student.id && (
                      <div
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            handleToggleAttendance(student.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-lg"
                        >
                          {isPresent ? 'Отсутствует' : 'Присутствует'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => navigate(`/classes/${journal.classId}/settings?journal=${journalId}`)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Настроить журнал</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <LessonToolbar />

        <div className="p-6 flex-1">
          {/* Date Navigation */}
          {currentLesson && (
            <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
              <button
                onClick={handlePrevLesson}
                disabled={currentLessonIndex >= allLessons.length - 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="text-center">
                {isToday(currentLesson.date) && (
                  <p className="text-sm text-indigo-600 font-medium">Сегодня</p>
                )}
                <p className="text-2xl font-bold text-gray-900">
                  {formatDate(currentLesson.date)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleNextLesson}
                  disabled={currentLessonIndex <= 0}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Lesson Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLessonMenu(!showLessonMenu);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {showLessonMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowLessonMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Удалить урок
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('randomizer')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'randomizer'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Рандомайзер
              </button>
              <button
                onClick={() => setActiveTab('seating')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'seating'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Рассадка
              </button>
              <button
                onClick={() => setActiveTab('group')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'group'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Группы
              </button>
              <button
                onClick={() => setActiveTab('allGrades')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'allGrades'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Все оценки
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'randomizer' && journalId && currentLesson && (
              <RandomizerTab
                journalId={journalId}
                lessonId={currentLesson.id}
                students={students}
                attendance={attendance}
              />
            )}

            {activeTab === 'seating' && journalId && currentLesson && (
              <SeatingTab journalId={journalId} lessonId={currentLesson.id} students={students} attendance={attendance} />
            )}

            {activeTab === 'group' && journal && journalId && currentLesson && (
              <GroupsTab
                journalId={journalId}
                lessonId={currentLesson.id}
                classId={journal.classId}
                students={students}
                attendance={attendance}
              />
            )}

            {activeTab === 'allGrades' && journalId && (
              <GradesTab journalId={journalId} students={students} />
            )}
          </div>
        </div>
      </div>

      {/* Delete Lesson Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteLesson}
        onCancel={() => setShowDeleteModal(false)}
        title="Удалить урок?"
        message={`Вы уверены, что хотите удалить урок от ${currentLesson ? formatDate(currentLesson.date) : ''}?`}
        description="Будут удалены все оценки и посещаемость этого урока. Это действие нельзя отменить."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
      />
    </div>
  );
};

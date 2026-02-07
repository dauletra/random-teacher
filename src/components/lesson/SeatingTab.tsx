import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import type { Student } from '../../types/student.types';
import type { Classroom, SeatingDesk } from '../../types/classroom.types';
import { classroomService } from '../../services/classroomService';
import { seatingService } from '../../services/seatingService';
import { SeatingGrid } from '../classroom/SeatingGrid';
import { ClassroomManagementModal } from '../classroom/ClassroomManagementModal';
import { useAuth } from '../../hooks/useAuth';
import { useTabState, type SeatingTabState } from '../../hooks/useTabState';
import { useConflicts } from '../../hooks/useConflicts';
import { usePresentStudents } from '../../hooks/usePresentStudents';

interface SeatingTabProps {
  journalId: string;
  lessonId: string;
  classId: string;
  students: Student[];
  attendance: Map<string, boolean>;
}

export const SeatingTab: React.FC<SeatingTabProps> = ({ journalId, lessonId, classId, students, attendance }) => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManagementModal, setShowManagementModal] = useState(false);

  // Хуки
  const conflicts = useConflicts(classId);
  const presentStudents = usePresentStudents(students, attendance);

  // Сохраняемое состояние вкладки
  const [savedState, setSavedState] = useTabState<SeatingTabState>(
    journalId,
    lessonId,
    'seating',
    {
      selectedClassroomId: '',
      seatingMode: 'pairs',
      desks: [],
    }
  );

  const selectedClassroomId = savedState.selectedClassroomId;
  const setSelectedClassroomId = (id: string) => {
    setSavedState(prev => ({ ...prev, selectedClassroomId: id }));
  };

  const seatingMode = savedState.seatingMode || 'pairs';
  const setSeatingMode = (mode: 'single' | 'pairs') => {
    setSavedState(prev => ({ ...prev, seatingMode: mode }));
  };

  const desks = savedState.desks;
  const setDesks = (newDesks: SeatingDesk[]) => {
    setSavedState(prev => ({ ...prev, desks: newDesks }));
  };

  // Track if data was already loaded (prevent re-fetch when tab becomes visible)
  const dataLoadedRef = useRef(false);

  // Загрузка кабинетов учителя
  useEffect(() => {
    if (!dataLoadedRef.current) {
      loadData();
    }
  }, [journalId, user]);

  // Синхронизация выбранного кабинета с доступными кабинетами
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  // Обновление парт при изменении выбранного кабинета (только если парты пустые)
  useEffect(() => {
    if (selectedClassroomId) {
      const classroom = classrooms.find(c => c.id === selectedClassroomId);
      if (classroom && desks.length === 0) {
        const emptyDesks = createEmptyDesks(classroom);
        setDesks(emptyDesks);
      }
    }
  }, [selectedClassroomId, classrooms]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Загрузить все кабинеты учителя
      const classroomsData = await classroomService.getByTeacherId(user.uid);
      setClassrooms(classroomsData);

      // Выбрать первый доступный кабинет
      if (classroomsData.length > 0) {
        setSelectedClassroomId(classroomsData[0].id);
      }
      dataLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading seating data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const createEmptyDesks = (classroom: Classroom): SeatingDesk[] => {
    const desks: SeatingDesk[] = [];
    classroom.desksPerColumn.forEach((count, columnIndex) => {
      for (let pos = 0; pos < count; pos++) {
        desks.push({ column: columnIndex, position: pos, studentIds: [] });
      }
    });
    return desks;
  };

  const getSelectedClassroom = (): Classroom | null => {
    return classrooms.find(c => c.id === selectedClassroomId) || null;
  };

  const handleClassroomChange = (classroomId: string) => {
    setSelectedClassroomId(classroomId);
  };

  const handleGenerateSeating = () => {
    const classroom = getSelectedClassroom();
    if (!classroom) return;

    const presentStudents = students.filter(s => attendance.get(s.id) ?? true);
    const totalDesks = desks.length;
    const maxCapacity = seatingMode === 'single' ? totalDesks : totalDesks * 2;

    if (presentStudents.length > maxCapacity) {
      const modeText = seatingMode === 'single' ? '1' : '2';
      toast.error(`Слишком много учеников! Учеников: ${presentStudents.length}, максимум мест: ${maxCapacity} (${totalDesks} парт × ${modeText})`);
      return;
    }

    if (presentStudents.length === 0) {
      toast.error('Нет присутствующих учеников для рассадки');
      return;
    }

    const result = seatingService.generateRandomSeating(
      classroom,
      students,
      attendance,
      seatingMode,
      seatingMode === 'pairs' ? conflicts : []
    );
    setDesks(result.desks);

    if (seatingMode === 'pairs' && result.hasUnavoidableConflicts) {
      toast.error('Внимание: не удалось избежать всех конфликтов при рассадке', { duration: 4000 });
    } else if (seatingMode === 'pairs' && conflicts.length > 0) {
      toast.success('Рассадка создана с учетом конфликтов');
    } else {
      toast.success('Рассадка создана');
    }
  };

  const handleClearSeating = () => {
    const emptyDesks = desks.map(d => ({ ...d, studentIds: [] }));
    setDesks(emptyDesks);
    toast.success('Рассадка очищена');
  };

  const handleCreateClassroom = async (name: string, columns: number, desksPerColumn: number[]) => {
    if (!user) return;

    try {
      const id = await classroomService.create(user.uid, name, columns, desksPerColumn);
      toast.success('Кабинет создан');

      // Перезагрузить кабинеты
      const classroomsData = await classroomService.getByTeacherId(user.uid);
      setClassrooms(classroomsData);

      // Выбрать новый кабинет
      setSelectedClassroomId(id);
    } catch (error) {
      console.error('Error creating classroom:', error);
      toast.error('Ошибка создания кабинета');
    }
  };

  const handleUpdateClassroom = async (id: string, name: string, columns: number, desksPerColumn: number[]) => {
    try {
      await classroomService.update(id, { name, columns, desksPerColumn });
      toast.success('Кабинет обновлен');

      // Перезагрузить кабинеты
      if (!user) return;
      const classroomsData = await classroomService.getByTeacherId(user.uid);
      setClassrooms(classroomsData);

      // Если редактируемый кабинет был выбран - обновить парты
      if (selectedClassroomId === id) {
        const updatedClassroom = classroomsData.find(c => c.id === id);
        if (updatedClassroom) {
          const emptyDesks = createEmptyDesks(updatedClassroom);
          setDesks(emptyDesks);
        }
      }
    } catch (error) {
      console.error('Error updating classroom:', error);
      toast.error('Ошибка обновления кабинета');
    }
  };

  const handleDeleteClassroom = async (id: string) => {
    if (!user) return;

    try {
      await classroomService.delete(id);
      toast.success('Кабинет удален');

      // Перезагрузить кабинеты
      const classroomsData = await classroomService.getByTeacherId(user.uid);
      setClassrooms(classroomsData);

      // Если удаленный кабинет был выбран - выбрать первый доступный или очистить
      if (selectedClassroomId === id) {
        if (classroomsData.length > 0) {
          setSelectedClassroomId(classroomsData[0].id);
        } else {
          setSelectedClassroomId('');
          setDesks([]);
        }
      }
    } catch (error) {
      console.error('Error deleting classroom:', error);
      toast.error('Ошибка удаления кабинета');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const selectedClassroom = getSelectedClassroom();

  // Подсчет статистики
  const totalSeated = desks.reduce((sum, desk) => sum + desk.studentIds.length, 0);
  const totalDesks = desks.length;
  const isEmpty = totalSeated === 0;

  // Нет кабинетов - показать empty state
  if (classrooms.length === 0) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет кабинетов</h3>
            <p className="text-gray-600 mb-8">Создайте первый кабинет для начала работы с рассадкой учеников</p>
            <button
              onClick={() => setShowManagementModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Создать первый кабинет
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Компактная панель управления */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 bg-white border-b border-gray-200">
        {/* Выбор кабинета */}
        <select
          value={selectedClassroomId}
          onChange={(e) => handleClassroomChange(e.target.value)}
          className="px-2 md:px-3 py-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {classrooms.map(classroom => (
            <option key={classroom.id} value={classroom.id}>
              {classroom.name}
            </option>
          ))}
        </select>

        {/* Кнопка настроек кабинетов */}
        <button
          onClick={() => setShowManagementModal(true)}
          className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          title="Управление кабинетами"
        >
          ⚙️
        </button>

        <div className="hidden md:block h-6 w-px bg-gray-300" />

        {/* Выбор режима рассадки */}
        <div className="flex rounded-md border border-gray-300 overflow-hidden">
          <button
            onClick={() => setSeatingMode('single')}
            className={`px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium transition-colors ${
              seatingMode === 'single'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="По одному на парту"
          >
            <span className="hidden md:inline">👤 По одному</span>
            <span className="md:hidden">👤</span>
          </button>
          <button
            onClick={() => setSeatingMode('pairs')}
            className={`px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium border-l border-gray-300 transition-colors ${
              seatingMode === 'pairs'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="По двое на парту"
          >
            <span className="hidden md:inline">👥 По двое</span>
            <span className="md:hidden">👥</span>
          </button>
        </div>

        <div className="hidden md:block h-6 w-px bg-gray-300" />

        {/* Главные действия */}
        <button
          onClick={handleGenerateSeating}
          disabled={presentStudents.length === 0 || !selectedClassroom}
          className="px-3 md:px-4 py-1.5 bg-indigo-600 text-white text-xs md:text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">Рассадить</span>
        </button>

        <button
          onClick={handleClearSeating}
          disabled={isEmpty || !selectedClassroom}
          className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">Очистить</span>
          <span className="sm:hidden">✕</span>
        </button>

        {/* Статистика */}
        <div className="ml-auto text-xs md:text-sm text-gray-600">
          <span className={`font-medium ${
            totalSeated === presentStudents.length ? 'text-green-600' :
            totalSeated > 0 ? 'text-amber-600' : 'text-gray-400'
          }`}>
            {totalSeated}
          </span>
          <span className="text-gray-400 mx-1">/</span>
          <span>{presentStudents.length}</span>
          <span className="hidden md:inline text-gray-500 ml-2">({totalDesks} парт)</span>
        </div>
      </div>

      {/* Визуализация парт (основной контент) */}
      <div className="flex-1 overflow-auto p-3 md:p-6 pb-16 md:pb-6">
        {selectedClassroom && desks.length > 0 ? (
          <SeatingGrid classroom={selectedClassroom} desks={desks} students={students} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-lg">Нет рассадки</p>
              <p className="text-gray-400 text-sm mt-2">Нажмите "Рассадить" для создания рассадки</p>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно управления кабинетами */}
      {showManagementModal && (
        <ClassroomManagementModal
          classrooms={classrooms}
          onClose={() => setShowManagementModal(false)}
          onCreateClassroom={handleCreateClassroom}
          onUpdateClassroom={handleUpdateClassroom}
          onDeleteClassroom={handleDeleteClassroom}
        />
      )}
    </div>
  );
};

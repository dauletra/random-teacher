import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import type { Student } from '../../types/student.types';
import { groupingService } from '../../services/groupingService';
import { useTabState, type GroupsTabState } from '../../hooks/useTabState';
import { useConflicts } from '../../hooks/useConflicts';
import { usePresentStudents } from '../../hooks/usePresentStudents';
import { sleep } from '../../utils/async';

interface GroupsTabProps {
  journalId: string;
  lessonId: string;
  classId: string;
  students: Student[];
  attendance: Map<string, boolean>;
}

interface Group {
  id: number;
  name: string;
  studentIds: string[];
  points: number;
}

export const GroupsTab: React.FC<GroupsTabProps> = ({ journalId, lessonId, classId, students, attendance }) => {
  // Сохраняемое состояние вкладки
  const [savedState, setSavedState] = useTabState<GroupsTabState>(
    journalId,
    lessonId,
    'groups',
    {
      divisionMode: 'byGroups',
      groupCount: 3,
      groupSize: 5,
      groups: [],
      selectedInGroup: {},
    }
  );

  // Локальное состояние для UI (не сохраняется)
  const [animatingGroupIndex, setAnimatingGroupIndex] = useState<number | null>(null);
  const [isDividing, setIsDividing] = useState<boolean>(false);

  // Хуки
  const conflicts = useConflicts(classId);
  const presentStudents = usePresentStudents(students, attendance);

  // Вспомогательные функции для работы с сохраненным состоянием
  const divisionMode = savedState.divisionMode;
  const setDivisionMode = (mode: 'byGroups' | 'bySize') => {
    setSavedState(prev => ({ ...prev, divisionMode: mode }));
  };

  const groupCount = savedState.groupCount;
  const setGroupCount = (count: number) => {
    setSavedState(prev => ({ ...prev, groupCount: count }));
  };

  const groupSize = savedState.groupSize;
  const setGroupSize = (size: number) => {
    setSavedState(prev => ({ ...prev, groupSize: size }));
  };

  const groups = savedState.groups;
  const setGroups = (newGroups: Group[] | ((prev: Group[]) => Group[])) => {
    setSavedState(prev => ({
      ...prev,
      groups: typeof newGroups === 'function' ? newGroups(prev.groups) : newGroups
    }));
  };

  const selectedInGroup = useMemo(() => new Map(Object.entries(savedState.selectedInGroup).map(([k, v]) => [Number(k), v])), [savedState.selectedInGroup]);
  const setSelectedInGroup = (newMap: Map<number, string> | ((prev: Map<number, string>) => Map<number, string>)) => {
    const map = typeof newMap === 'function' ? newMap(selectedInGroup) : newMap;
    const obj = Object.fromEntries(Array.from(map.entries()));
    setSavedState(prev => ({ ...prev, selectedInGroup: obj }));
  };

  const declensionGroups = (num: number): string => {
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'групп';
    }

    if (lastDigit === 1) {
      return 'топ';
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'топ ';
    }

    return 'топ';
  };

  const handleDivide = async () => {
    if (presentStudents.length === 0) {
      toast.error('Қатысып отырған оқушы жоқ');
      return;
    }

    setIsDividing(true);
    setSelectedInGroup(new Map());

    // Вычисляем распределение с использованием сервиса
    const result = divisionMode === 'byGroups'
      ? groupingService.divideByGroupCount(presentStudents, groupCount, conflicts)
      : groupingService.divideByGroupSize(presentStudents, groupSize, conflicts);

    const numGroups = result.groups.length;

    // Этап 1: Жасау пустые группы и показать их
    const emptyGroups: Group[] = result.groups.map(g => ({
      ...g,
      points: 0
    }));

    setGroups(emptyGroups.map(g => ({ ...g, studentIds: [] })));
    await sleep(300);

    // Этап 2: Анимированное қосылдыие студентов в группы
    const allStudentIds = result.groups.flatMap(g => g.studentIds);
    const tempGroups = emptyGroups.map(g => ({ ...g, studentIds: [] as string[] }));

    for (let i = 0; i < allStudentIds.length; i++) {
      const studentId = allStudentIds[i];

      // Найти в какую группу должен попасть этот студент
      const targetGroupIndex = result.groups.findIndex(g => g.studentIds.includes(studentId));

      if (targetGroupIndex !== -1) {
        // Қосу студента в временные группы
        tempGroups[targetGroupIndex].studentIds.push(studentId);

        // Обновить состояние для анимации
        setGroups(tempGroups.map(g => ({
          ...g,
          studentIds: [...g.studentIds]
        })));

        await sleep(500);
      }
    }

    setIsDividing(false);

    if (result.hasUnavoidableConflicts) {
      toast.error('⚠️ Байқаңыз: барлық конфликтті ескеру мүмкін болмады. Топтар санын арттырыңыз.', {
        duration: 5000,
      });
    } else if (conflicts.length > 0) {
      toast.success(`Конфликттер ескеріліп ${numGroups} ${declensionGroups(numGroups)} құрылды ✓`);
    } else {
      toast.success(`${numGroups} ${declensionGroups(numGroups)} құрылды`);
    }
  };

  const adjustPoints = (groupIndex: number, delta: number) => {
    setGroups(prev => prev.map((group, idx) => {
      if (idx === groupIndex) {
        const newPoints = Math.max(0, group.points + delta);
        return { ...group, points: newPoints };
      }
      return group;
    }));
  };

  const handleRandomPick = async (groupIndex: number) => {
    const group = groups[groupIndex];

    if (group.studentIds.length === 0) {
      toast.error('Топта оқушы жоқ');
      return;
    }

    setAnimatingGroupIndex(groupIndex);

    // Анимация выбора
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * group.studentIds.length);
      const studentId = group.studentIds[randomIndex];

      setSelectedInGroup(prev => {
        const newMap = new Map(prev);
        newMap.set(groupIndex, studentId);
        return newMap;
      });

      await sleep(100);
    }

    // Финальный выбор
    const finalIndex = Math.floor(Math.random() * group.studentIds.length);
    const finalStudentId = group.studentIds[finalIndex];

    setSelectedInGroup(prev => {
      const newMap = new Map(prev);
      newMap.set(groupIndex, finalStudentId);
      return newMap;
    });

    setAnimatingGroupIndex(null);

    const student = students.find(s => s.id === finalStudentId);
    if (student) {
      toast.success(`${student.firstName} ${student.lastName.charAt(0)} таңдалды.`);
    }
  };

  const handleReset = () => {
    setGroups([]);
    setSelectedInGroup(new Map());
    toast.success('Топтар тазаланды');
  };

  if (presentStudents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Қатысып отырған оқушы жоқ</p>
          <p className="text-gray-400 text-sm mt-2">Оқушыларды қатысып отыр деп белгілеңіз</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Control Panel */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 bg-white border-b border-gray-200">
        {/* Mode buttons */}
        <button
          onClick={() => setDivisionMode('byGroups')}
          disabled={isDividing}
          className={`px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
            divisionMode === 'byGroups'
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${isDividing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Топ саны
        </button>
        <button
          onClick={() => setDivisionMode('bySize')}
          disabled={isDividing}
          className={`px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
            divisionMode === 'bySize'
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${isDividing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Адам саны
        </button>

        <div className="hidden md:block h-6 w-px bg-gray-300"></div>

        {/* Number selector */}
        <select
          value={divisionMode === 'byGroups' ? groupCount : groupSize}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (divisionMode === 'byGroups') {
              setGroupCount(value);
            } else {
              setGroupSize(value);
            }
          }}
          disabled={isDividing}
          className="px-2 md:px-3 py-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {[2, 3, 4, 5, 6, 7, 8].map(num => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>

        {/* Divide button */}
        <button
          onClick={handleDivide}
          disabled={animatingGroupIndex !== null || isDividing}
          className="px-3 md:px-4 py-1.5 bg-indigo-600 text-white text-xs md:text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDividing ? 'Бөліну...' : 'Бөлу'}
        </button>

        <div className="hidden md:block h-6 w-px bg-gray-300"></div>

        {/* Reset button */}
        <button
          onClick={handleReset}
          disabled={animatingGroupIndex !== null || isDividing || groups.length === 0}
          className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Тазалау
        </button>
      </div>

      {/* Groups Grid or Empty State */}
      {groups.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg">Топтар құрылмады</p>
            <p className="text-gray-400 text-sm mt-2">
              Бөліну режиімін таңдап "Бөлу" кнопкасын басыңыз
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-16 md:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {groups.map((group, groupIndex) => (
              <div key={`group-${group.id}`} className="bg-gray-50 rounded-lg border border-gray-300 p-4">
                {/* Group header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                  <span className="text-sm font-medium text-indigo-600">{group.points} б.</span>
                </div>

                {/* Control buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => adjustPoints(groupIndex, 1)}
                    disabled={animatingGroupIndex !== null || isDividing}
                    className="flex-1 px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => adjustPoints(groupIndex, -1)}
                    disabled={animatingGroupIndex !== null || isDividing}
                    className="flex-1 px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    −1
                  </button>
                  <button
                    onClick={() => handleRandomPick(groupIndex)}
                    disabled={animatingGroupIndex !== null || isDividing}
                    className="flex-1 px-2 py-1 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    🎲
                  </button>
                </div>

                {/* Students list */}
                <div className="space-y-2">
                  {group.studentIds.map((studentId, studentIndex) => {
                    const student = students.find(s => s.id === studentId);
                    if (!student) return null;

                    const isSelected = selectedInGroup.get(groupIndex) === studentId;
                    const isAnimating = animatingGroupIndex === groupIndex && isSelected;

                    return (
                      <div
                        key={`${group.id}-${studentId}-${studentIndex}`}
                        className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                          isAnimating
                            ? 'bg-indigo-50 border-indigo-500'
                            : isSelected
                            ? 'bg-green-100 border-green-500 ring-2 ring-green-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {student.firstName} {student.lastName.charAt(0)}.
                          </span>
                          {isSelected && (
                            <span className="text-green-600 font-bold text-lg">✓</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

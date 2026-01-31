import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { Student } from '../../types/student.types';
import { useTabState, type RandomizerTabState } from '../../hooks/useTabState';

interface RandomizerTabProps {
  journalId: string;
  lessonId: string;
  students: Student[];
  attendance: Map<string, boolean>;
}

export const RandomizerTab: React.FC<RandomizerTabProps> = ({ journalId, lessonId, students, attendance }) => {
  // Сохраняемое состояние вкладки
  const [savedState, setSavedState] = useTabState<RandomizerTabState>(
    journalId,
    lessonId,
    'randomizer',
    {
      mode: 'one',
      removeAfterPick: true,
      excludedStudents: [],
      pickedStudents: [],
      selectedStudents: [],
    }
  );

  // Локальное состояние для UI (не сохраняется)
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [_animationStage, setAnimationStage] = useState<'idle' | 'first' | 'pause' | 'second' | 'complete'>('idle');

  // Вспомогательные функции для работы с сохраненным состоянием
  const mode = savedState.mode;
  const setMode = (newMode: 'one' | 'two') => {
    setSavedState(prev => ({ ...prev, mode: newMode }));
  };

  const removeAfterPick = savedState.removeAfterPick;
  const setRemoveAfterPick = (value: boolean) => {
    setSavedState(prev => ({ ...prev, removeAfterPick: value }));
  };

  const excludedStudents = useMemo(() => new Set(savedState.excludedStudents), [savedState.excludedStudents]);
  const setExcludedStudents = (newSet: Set<string>) => {
    setSavedState(prev => ({ ...prev, excludedStudents: Array.from(newSet) }));
  };

  const pickedStudents = useMemo(() => new Set(savedState.pickedStudents), [savedState.pickedStudents]);
  const setPickedStudents = (newSet: Set<string>) => {
    setSavedState(prev => ({ ...prev, pickedStudents: Array.from(newSet) }));
  };

  const selectedStudents = useMemo(() => {
    return savedState.selectedStudents.map(id => students.find(s => s.id === id)).filter(Boolean) as Student[];
  }, [savedState.selectedStudents, students]);

  const setSelectedStudents = (newStudents: Student[]) => {
    setSavedState(prev => ({ ...prev, selectedStudents: newStudents.map(s => s.id) }));
  };

  // Apply "removeAfterPick" to currently selected students when checkbox is toggled on
  useEffect(() => {
    if (removeAfterPick && selectedStudents.length > 0) {
      const newPicked = new Set(pickedStudents);
      selectedStudents.forEach(s => newPicked.add(s.id));
      setPickedStudents(newPicked);
    }
  }, [removeAfterPick]);

  // Get list of present students
  const presentStudents = useMemo(() => {
    return students.filter(student => attendance.get(student.id) ?? true);
  }, [students, attendance]);

  // Get list of available students for randomization
  const getAvailableStudents = (): Student[] => {
    return presentStudents.filter(student => {
      const isNotExcluded = !excludedStudents.has(student.id);
      const isNotPicked = !removeAfterPick || !pickedStudents.has(student.id);
      return isNotExcluded && isNotPicked;
    });
  };

  const availableStudents = useMemo(() => getAvailableStudents(), [
    presentStudents,
    excludedStudents,
    pickedStudents,
    removeAfterPick,
  ]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runSingleAnimation = async () => {
    const available = getAvailableStudents();
    setAnimationStage('first');

    // Constant medium speed animation: ~2 seconds total
    const animationSpeed = 120; // ms - medium constant speed
    const totalIterations = 20; // 20 * 100ms = 2000ms

    for (let i = 0; i < totalIterations; i++) {
      // Random student from available pool
      const randomIndex = Math.floor(Math.random() * available.length);
      setHighlightedId(available[randomIndex].id);
      await sleep(animationSpeed);
    }

    // Final selection - pick winner
    const randomIndex = Math.floor(Math.random() * available.length);
    const selected = available[randomIndex];

    // Show highlighted card first (dramatic pause)
    setHighlightedId(selected.id);
    setAnimationStage('complete');

    await sleep(1000);

    // Now show result in green area
    setSelectedStudents([selected]);
    setHighlightedId(null);
    setIsAnimating(false);

    if (removeAfterPick) {
      const newPicked = new Set(pickedStudents);
      newPicked.add(selected.id);
      setPickedStudents(newPicked);
    }

    toast.success(`Выбран: ${selected.firstName} ${selected.lastName}`);
  };

  const runDoubleAnimation = async () => {
    const available = getAvailableStudents();
    setAnimationStage('first');

    // Constant medium speed for both selections
    const animationSpeed = 120; // ms - constant medium speed
    const iterations = 15; // 15 * 120ms = 1800ms per student

    // Select first student
    for (let i = 0; i < iterations; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      setHighlightedId(available[randomIndex].id);
      await sleep(animationSpeed);
    }

    const firstRandomIndex = Math.floor(Math.random() * available.length);
    const firstSelected = available[firstRandomIndex];

    // Show highlighted card first (dramatic pause)
    setHighlightedId(firstSelected.id);
    setAnimationStage('pause');

    await sleep(1000);

    // Now show first result in green area
    setSelectedStudents([firstSelected]);
    setHighlightedId(null);

    await sleep(500);

    // Select second student
    setAnimationStage('second');
    const remaining = available.filter(s => s.id !== firstSelected.id);

    for (let i = 0; i < iterations; i++) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      setHighlightedId(remaining[randomIndex].id);
      await sleep(animationSpeed);
    }

    const secondRandomIndex = Math.floor(Math.random() * remaining.length);
    const secondSelected = remaining[secondRandomIndex];

    // Show highlighted card first (dramatic pause)
    setHighlightedId(secondSelected.id);
    setAnimationStage('complete');

    await sleep(1000);

    // Now show both results in green area
    setSelectedStudents([firstSelected, secondSelected]);
    setHighlightedId(null);
    setIsAnimating(false);

    if (removeAfterPick) {
      const newPicked = new Set(pickedStudents);
      newPicked.add(firstSelected.id);
      newPicked.add(secondSelected.id);
      setPickedStudents(newPicked);
    }

    toast.success(`Выбраны: ${firstSelected.firstName} ${firstSelected.lastName} и ${secondSelected.firstName} ${secondSelected.lastName}`);
  };

  const handleRandomPick = () => {
    const available = getAvailableStudents();

    if (available.length === 0) {
      toast.error('Нет доступных учеников для выбора');
      return;
    }

    if (mode === 'two' && available.length < 2) {
      toast.error('Недостаточно учеников для выбора двоих');
      return;
    }

    setIsAnimating(true);
    setSelectedStudents([]);
    setAnimationStage('idle');

    if (mode === 'one') {
      runSingleAnimation();
    } else {
      runDoubleAnimation();
    }
  };

  const toggleExcluded = (studentId: string) => {
    if (isAnimating) return;

    const newExcluded = new Set(excludedStudents);
    if (newExcluded.has(studentId)) {
      newExcluded.delete(studentId);
    } else {
      newExcluded.add(studentId);
    }
    setExcludedStudents(newExcluded);
  };

  const handleReset = () => {
    setPickedStudents(new Set());
    setSelectedStudents([]);
    toast.success('Список выбранных сброшен');
  };

  const getStudentStatus = (studentId: string): 'available' | 'excluded' | 'picked' | 'selected' => {
    if (selectedStudents.some(s => s.id === studentId)) return 'selected';
    if (excludedStudents.has(studentId)) return 'excluded';
    if (removeAfterPick && pickedStudents.has(studentId)) return 'picked';
    return 'available';
  };

  if (presentStudents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Нет присутствующих учеников</p>
          <p className="text-gray-400 text-sm mt-2">Отметьте учеников как присутствующих в левом меню</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Compact Control Panel - Single Line */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200">
        {/* Mode Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('one')}
            disabled={isAnimating}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${mode === 'one'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
              ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Один
          </button>
          <button
            onClick={() => setMode('two')}
            disabled={isAnimating}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${mode === 'two'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
              ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Два
          </button>
        </div>

        {/* Remove After Pick Option */}
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={removeAfterPick}
            onChange={(e) => setRemoveAfterPick(e.target.checked)}
            disabled={isAnimating}
            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          Убирать
        </label>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300" />

        {/* Action Buttons */}
        <button
          onClick={handleRandomPick}
          disabled={isAnimating || availableStudents.length === 0}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isAnimating ? 'Выбираю...' : 'Выбрать'}
        </button>

        <button
          onClick={handleReset}
          disabled={isAnimating || pickedStudents.size === 0}
          className="px-4 py-1.5 text-sm font-medium text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Сброс
        </button>

        {/* Statistics */}
        <div className="ml-auto text-sm text-gray-600">
          <span className="font-medium">{availableStudents.length}</span>
          <span className="text-gray-400 mx-1">/</span>
          <span>{presentStudents.length}</span>
        </div>
      </div>

      {/* Result Display Area */}
      {selectedStudents.length > 0 && (
        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
          <div className="flex items-center justify-center gap-8">
            {selectedStudents.length === 1 ? (
              <div className="text-center">
                <p className="text-sm text-green-700 font-medium mb-1">Выбран ученик:</p>
                <p className="text-4xl font-bold text-green-900">
                  {selectedStudents[0].firstName} {selectedStudents[0].lastName[0]}.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-sm text-green-700 font-medium mb-1">Ученик 1:</p>
                  <p className="text-3xl font-bold text-green-900">
                    {selectedStudents[0].firstName} {selectedStudents[0].lastName[0]}.
                  </p>
                </div>
                <div className="text-5xl font-bold text-green-400">VS</div>
                <div className="text-center">
                  <p className="text-sm text-green-700 font-medium mb-1">Ученик 2:</p>
                  <p className="text-3xl font-bold text-green-900">
                    {selectedStudents[1].firstName} {selectedStudents[1].lastName[0]}.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Student Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="grid grid-cols-4 xl:grid-cols-5 gap-3">
          {presentStudents.map(student => {
            const status = getStudentStatus(student.id);
            const isExcluded = excludedStudents.has(student.id);
            const isHighlighted = highlightedId === student.id;
            const isSelected = selectedStudents.some(s => s.id === student.id);

            return (
              <div
                key={student.id}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200
                  ${isHighlighted
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-4 ring-indigo-200 scale-105'
                    : status === 'selected'
                    ? 'border-green-500 bg-green-100 ring-4 ring-green-200 shadow-xl'
                    : status === 'picked'
                    ? 'border-gray-400 bg-gray-100'
                    : status === 'excluded'
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                  }
                `}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={!isExcluded}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleExcluded(student.id);
                  }}
                  disabled={isAnimating}
                  className="absolute top-2 left-2 h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                />

                {/* Student Name */}
                <div className="text-center pt-4">
                  <p className={`font-bold text-lg whitespace-nowrap truncate ${
                    status === 'excluded' ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {student.firstName} {student.lastName[0]}.
                  </p>
                </div>

                {/* Status Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 text-green-600 font-bold text-2xl">
                    ✓
                  </div>
                )}

                {status === 'picked' && !isSelected && (
                  <div className="absolute top-2 right-2 text-gray-500 font-bold text-lg">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import type { Student } from '../../types/student.types';
import type { Grade } from '../../types/lesson.types';

interface StudentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  attendance: Map<string, boolean>;
  grades: Map<string, Grade>;
  gradeInputs: Map<string, string>;
  onToggleAttendance: (studentId: string) => void;
  onGradeChange: (studentId: string, value: string) => void;
  onSaveGrade: (studentId: string) => void;
}

export const StudentBottomSheet: React.FC<StudentBottomSheetProps> = ({
  isOpen,
  onClose,
  students,
  attendance,
  grades,
  gradeInputs,
  onToggleAttendance,
  onGradeChange,
  onSaveGrade,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;
    if (diff > 100) {
      onClose();
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    startY.current = 0;
    currentY.current = 0;
  };

  const isPresent = (studentId: string): boolean => {
    return attendance.get(studentId) ?? true;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Ученики ({students.length})
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Student List */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          <div className="divide-y divide-gray-100">
            {students.map((student, index) => {
              const present = isPresent(student.id);
              const gradeInput = gradeInputs.get(student.id) || '';
              const currentGrade = grades.get(student.id);

              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    !present ? 'bg-gray-50' : ''
                  }`}
                >
                  {/* Number */}
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">
                    {index + 1}
                  </span>

                  {/* Attendance Toggle */}
                  <button
                    onClick={() => onToggleAttendance(student.id)}
                    className={`w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      present
                        ? 'border-green-400 bg-green-50 active:bg-green-100'
                        : 'border-red-400 bg-red-50 active:bg-red-100'
                    }`}
                  >
                    {present ? (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>

                  {/* Name */}
                  <div className={`flex-1 min-w-0 ${
                    present ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    <p className={`text-sm font-medium truncate ${!present ? 'line-through' : ''}`}>
                      {student.firstName} {student.lastName}
                    </p>
                  </div>

                  {/* Grade Input */}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={gradeInput}
                    onChange={(e) => onGradeChange(student.id, e.target.value)}
                    onBlur={() => onSaveGrade(student.id)}
                    disabled={!present}
                    placeholder="-"
                    className={`w-12 h-10 px-2 text-base text-center border rounded-lg transition-colors ${
                      currentGrade
                        ? 'border-indigo-300 bg-indigo-50 font-bold'
                        : 'border-gray-300'
                    } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

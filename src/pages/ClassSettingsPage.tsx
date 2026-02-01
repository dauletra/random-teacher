import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useClass } from '../hooks/useClass';
import { useClasses } from '../hooks/useClasses';
import { useJournals } from '../hooks/useJournals';
import { useStudents } from '../hooks/useStudents';
import { classService } from '../services/classService';
import { journalService } from '../services/journalService';
import { studentService } from '../services/studentService';
import { ConflictsTab } from '../components/settings/ConflictsTab';
import toast from 'react-hot-toast';

export const ClassSettingsPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { classes } = useClasses();
  const { classData, loading: classLoading } = useClass(classId || '');
  const { journals, loading: journalsLoading, createJournal } = useJournals(classId || '');
  const { students, loading: studentsLoading } = useStudents(classId || '');
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [journalStudents, setJournalStudents] = useState<string[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newJournalName, setNewJournalName] = useState('');
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [isEditingClassName, setIsEditingClassName] = useState(false);
  const [editedClassName, setEditedClassName] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editedStudentName, setEditedStudentName] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'conflicts'>('students');

  const defaultJournal = journals.find(j => j.isDefault);

  const loadJournalStudents = React.useCallback(async (journalId: string) => {
    try {
      const studentIds = await journalService.getStudentsByJournalId(journalId);
      setJournalStudents(studentIds);
    } catch (error) {
      console.error('Error loading journal students:', error);
    }
  }, []);

  useEffect(() => {
    if (journals.length > 0 && !selectedJournalId) {
      const journalFromQuery = searchParams.get('journal');

      if (journalFromQuery && journals.some(j => j.id === journalFromQuery)) {
        setSelectedJournalId(journalFromQuery);
      } else {
        setSelectedJournalId(defaultJournal?.id || journals[0].id);
      }
    }
  }, [journals, selectedJournalId, defaultJournal, searchParams]);

  useEffect(() => {
    if (selectedJournalId) {
      loadJournalStudents(selectedJournalId);
    }
  }, [selectedJournalId, loadJournalStudents]);

  useEffect(() => {
    if (classData) {
      setEditedClassName(classData.name);
    }
  }, [classData]);

  const handleAddStudent = async () => {
    if (!classId || !newStudentName.trim()) return;

    const [lastName, firstName] = newStudentName.trim().split(' ');
    if (!firstName || !lastName) {
      toast.error('Введите Фамилию и Имя через пробел');
      return;
    }

    try {
      const studentId = await studentService.create(classId, firstName, lastName);

      if (defaultJournal) {
        await journalService.addStudent(defaultJournal.id, studentId);
      }

      setNewStudentName('');
      toast.success('Ученик добавлен');
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Ошибка добавления ученика');
    }
  };

  const handleToggleStudentInJournal = async (studentId: string) => {
    if (!selectedJournalId) return;

    try {
      if (journalStudents.includes(studentId)) {
        await journalService.removeStudent(selectedJournalId, studentId);
        setJournalStudents(journalStudents.filter(id => id !== studentId));
        toast.success('Ученик удален из журнала');
      } else {
        await journalService.addStudent(selectedJournalId, studentId);
        setJournalStudents([...journalStudents, studentId]);
        toast.success('Ученик добавлен в журнал');
      }
    } catch (error) {
      console.error('Error toggling student:', error);
      toast.error('Ошибка');
    }
  };

  const handleCreateJournal = async () => {
    if (!newJournalName.trim()) return;

    try {
      await createJournal(newJournalName, false);
      setNewJournalName('');
      setShowAddJournal(false);
      toast.success('Журнал создан');
    } catch (error) {
      console.error('Error creating journal:', error);
      toast.error('Ошибка создания журнала');
    }
  };

  const handleDeleteJournal = async (journalId: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error('Нельзя удалить основной журнал');
      return;
    }

    if (!window.confirm('Удалить журнал? Это удалит всех учеников из этого журнала.')) {
      return;
    }

    try {
      await journalService.delete(journalId);
      toast.success('Журнал удален');
      if (selectedJournalId === journalId) {
        setSelectedJournalId(defaultJournal?.id || null);
      }
    } catch (error) {
      console.error('Error deleting journal:', error);
      toast.error('Ошибка удаления журнала');
    }
  };

  const handleUpdateClassName = async () => {
    if (!classId || !editedClassName.trim()) return;

    try {
      await classService.update(classId, { name: editedClassName });
      setIsEditingClassName(false);
      toast.success('Название класса обновлено');
    } catch (error) {
      console.error('Error updating class name:', error);
      toast.error('Ошибка обновления названия');
    }
  };

  const handleEditStudent = (studentId: string, lastName: string, firstName: string) => {
    setEditingStudentId(studentId);
    setEditedStudentName(`${lastName} ${firstName}`);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudentId || !editedStudentName.trim()) return;

    const [lastName, firstName] = editedStudentName.trim().split(' ');
    if (!firstName || !lastName) {
      toast.error('Введите Фамилию и Имя через пробел');
      return;
    }

    try {
      await studentService.update(editingStudentId, { firstName, lastName });
      setEditingStudentId(null);
      setEditedStudentName('');
      toast.success('Ученик обновлен');
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Ошибка обновления ученика');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Удалить ученика из класса? Это удалит его из всех журналов.')) {
      return;
    }

    try {
      await studentService.delete(studentId);
      toast.success('Ученик удален');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Ошибка удаления ученика');
    }
  };

  const handleDeleteClass = async () => {
    if (!classId) return;

    if (!window.confirm('Удалить класс? Это удалит все журналы и учеников этого класса. Это действие необратимо!')) {
      return;
    }

    try {
      await classService.delete(classId);
      toast.success('Класс удален');
      navigate('/');
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Ошибка удаления класса');
    }
  };

  if (journalsLoading || studentsLoading || classLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const selectedJournal = journals.find(j => j.id === selectedJournalId);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Карточки классов */}
      {classes.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => navigate(`/classes/${cls.id}/settings`)}
                className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
                  cls.id === classId
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <div className="text-lg">{cls.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {isEditingClassName ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editedClassName}
                  onChange={(e) => setEditedClassName(e.target.value)}
                  className="text-3xl font-bold text-gray-900 border-b-2 border-indigo-500 focus:outline-none flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleUpdateClassName()}
                  autoFocus
                />
                <button
                  onClick={handleUpdateClassName}
                  className="text-green-600 hover:text-green-700 p-2"
                  title="Сохранить"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setIsEditingClassName(false);
                    setEditedClassName(classData?.name || '');
                  }}
                  className="text-gray-600 hover:text-gray-700 p-2"
                  title="Отмена"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">{classData?.name}</h1>
                <button
                  onClick={() => setIsEditingClassName(true)}
                  className="text-gray-400 hover:text-indigo-600 p-2"
                  title="Изменить название"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <button
            onClick={handleDeleteClass}
            className="ml-4 px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            Удалить класс
          </button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="mb-6 bg-white rounded-lg shadow">
        <nav className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ученики и Журналы
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'conflicts'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⚠️ Конфликты
          </button>
        </nav>
      </div>

      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Журналы</h2>
              <button
                onClick={() => setShowAddJournal(!showAddJournal)}
                className="text-indigo-600 hover:text-indigo-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {showAddJournal && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <input
                  type="text"
                  value={newJournalName}
                  onChange={(e) => setNewJournalName(e.target.value)}
                  placeholder="Название журнала"
                  className="w-full px-3 py-2 border rounded-md mb-2"
                />
                <button
                  onClick={handleCreateJournal}
                  className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
                >
                  Создать
                </button>
              </div>
            )}

            <div className="space-y-2">
              {journals
                .sort((a, b) => {
                  // Общий журнал всегда первый
                  if (a.isDefault) return -1;
                  if (b.isDefault) return 1;
                  return 0;
                })
                .map((journal) => (
                <div
                  key={journal.id}
                  className={`flex items-center gap-2 px-4 py-3 rounded-md transition-colors ${
                    selectedJournalId === journal.id
                      ? 'bg-indigo-50 border-2 border-indigo-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={() => setSelectedJournalId(journal.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium">{journal.name}</div>
                    {journal.isDefault && (
                      <div className="text-xs text-gray-500 mt-1">Общий журнал класса</div>
                    )}
                  </button>
                  {!journal.isDefault && (
                    <button
                      onClick={() => handleDeleteJournal(journal.id, journal.isDefault)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Удалить журнал"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedJournal?.name || 'Журнал'}
            </h2>

            {selectedJournal?.isDefault && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Добавить ученика</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Фамилия Имя"
                    className="flex-1 px-3 py-2 border rounded-md"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddStudent()}
                  />
                  <button
                    onClick={handleAddStudent}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Добавить
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Новые ученики автоматически добавляются в общий журнал
                </p>
              </div>
            )}

            <div>
              {selectedJournal?.isDefault ? (
                // Общий журнал - один список со всеми учениками
                <>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Список учеников ({students.length})
                  </h3>
                  <div className="space-y-2">
                    {students.map((student, index) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        {editingStudentId === student.id ? (
                          <>
                            <input
                              type="text"
                              value={editedStudentName}
                              onChange={(e) => setEditedStudentName(e.target.value)}
                              className="flex-1 px-3 py-1 border border-indigo-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Фамилия Имя"
                              onKeyPress={(e) => e.key === 'Enter' && handleUpdateStudent()}
                              autoFocus
                            />
                            <div className="flex items-center gap-2 ml-2">
                              <button
                                onClick={handleUpdateStudent}
                                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                title="Сохранить"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStudentId(null);
                                  setEditedStudentName('');
                                }}
                                className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
                                title="Отмена"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="font-medium flex-1">
                              <span className="text-gray-400 mr-2">{index + 1}.</span>
                              {student.lastName} {student.firstName}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditStudent(student.id, student.lastName, student.firstName)}
                                className="p-1 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Редактировать ученика"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Удалить ученика из класса"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // Дополнительный журнал - два списка
                <>
                  {/* Ученики в журнале */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Ученики в журнале ({students.filter(s => journalStudents.includes(s.id)).length})
                    </h3>
                    <div className="space-y-2">
                      {students.filter(s => journalStudents.includes(s.id)).length === 0 ? (
                        <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-md">
                          Нет учеников в журнале
                        </p>
                      ) : (
                        students
                          .filter(s => journalStudents.includes(s.id))
                          .map((student, index) => (
                            <div
                              key={student.id}
                              className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-md"
                            >
                              <span className="font-medium">
                                <span className="text-gray-400 mr-2">{index + 1}.</span>
                                {student.lastName} {student.firstName}
                              </span>
                              <button
                                onClick={() => handleToggleStudentInJournal(student.id)}
                                className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-md"
                              >
                                Убрать
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Доступные ученики для добавления */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Доступные ученики ({students.filter(s => !journalStudents.includes(s.id)).length})
                    </h3>
                    <div className="space-y-2">
                      {students.filter(s => !journalStudents.includes(s.id)).length === 0 ? (
                        <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-md">
                          Все ученики добавлены в журнал
                        </p>
                      ) : (
                        students
                          .filter(s => !journalStudents.includes(s.id))
                          .map((student, index) => (
                            <div
                              key={student.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                            >
                              <span className="font-medium">
                                <span className="text-gray-400 mr-2">{index + 1}.</span>
                                {student.lastName} {student.firstName}
                              </span>
                              <button
                                onClick={() => handleToggleStudentInJournal(student.id)}
                                className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md"
                              >
                                Добавить
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'conflicts' && classId && (
        <ConflictsTab classId={classId} students={students} />
      )}
    </div>
  );
};

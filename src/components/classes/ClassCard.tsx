import { useNavigate } from 'react-router-dom';
import type { Class } from '../../types/class.types';
import type { Journal } from '../../types/journal.types';

interface ClassCardProps {
  class: Class;
  journals: Journal[];
}

export const ClassCard = ({ class: classData, journals }: ClassCardProps) => {
  const navigate = useNavigate();

  const handleOpenJournal = (journalId: string) => {
    navigate(`/journals/${journalId}`);
  };

  const handleSettings = () => {
    navigate(`/classes/${classData.id}/settings`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-3 bg-linear-to-r from-indigo-500 to-purple-500" />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{classData.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Жасалды: {classData.createdAt?.toDate?.().toLocaleDateString('kk-KZ') || 'Күні белгісіз'}
            </p>
          </div>
          <button
            onClick={handleSettings}
            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-gray-100"
            title="Сынып баптаулары"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Қолжетімді журналдар:</p>
          {journals.length > 0 ? (
            <div className="space-y-2">
              {journals
                .sort((a, b) => {
                  // Общий журнал всегда первый
                  if (a.isDefault) return -1;
                  if (b.isDefault) return 1;
                  return 0;
                })
                .map((journal) => (
                <button
                  key={journal.id}
                  onClick={() => handleOpenJournal(journal.id)}
                  className="w-full text-left px-3 py-2 bg-gray-50 rounded-md hover:bg-indigo-50 transition-colors text-sm"
                >
                  <span className="font-medium text-gray-900">{journal.name}</span>
                  {journal.isDefault && (
                    <span className="ml-2 text-xs text-gray-500">(негізгі)</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Журналдар жоқ</div>
          )}
        </div>
      </div>
    </div>
  );
};

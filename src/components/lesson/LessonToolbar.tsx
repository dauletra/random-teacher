import React, { useState } from 'react';
import { Clock } from '../common/Clock';
import { Timer } from '../common/Timer';

export const LessonToolbar: React.FC = () => {
  const [timerMode, setTimerMode] = useState<'collapsed' | 'setup' | 'running' | 'paused' | 'completed'>('collapsed');

  const isSticky = timerMode === 'running' || timerMode === 'paused';

  return (
    <div className={`${isSticky ? 'sticky top-0' : ''} z-20 bg-white border-b border-gray-200 shadow-sm`}>
      <div className="px-6 py-3 flex items-center justify-between">
        <Clock />
        <Timer onModeChange={setTimerMode} />
      </div>
    </div>
  );
};

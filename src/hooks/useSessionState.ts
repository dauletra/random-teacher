import { useState, useEffect, useCallback, useRef } from 'react';
import { saveToSession, loadFromSession } from '../utils/sessionStorage';

/**
 * Хук для работы с sessionStorage, аналогичный useState
 * Автоматически сохраняет и восстанавливает состояние из sessionStorage
 *
 * @param key - ключ для хранения в sessionStorage
 * @param defaultValue - значение по умолчанию
 * @param debounceMs - задержка перед сохранением (для оптимизации частых изменений)
 * @returns [state, setState] - кортеж состояния и функции для его изменения
 */
export const useSessionState = <T>(
  key: string,
  defaultValue: T,
  debounceMs: number = 0
): [T, (value: T | ((prev: T) => T)) => void] => {
  // Загружаем начальное значение из sessionStorage или используем defaultValue
  const [state, setState] = useState<T>(() => {
    return loadFromSession(key, defaultValue);
  });

  // Ref для debounce таймера
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Функция для сохранения в sessionStorage с debounce
  const saveState = useCallback((newState: T) => {
    if (debounceMs > 0) {
      // Очищаем предыдущий таймер
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Устанавливаем новый таймер
      debounceTimerRef.current = setTimeout(() => {
        saveToSession(key, newState);
        debounceTimerRef.current = null;
      }, debounceMs);
    } else {
      // Сохраняем сразу без debounce
      saveToSession(key, newState);
    }
  }, [key, debounceMs]);

  // Сохраняем при изменении состояния
  useEffect(() => {
    saveState(state);

    // Cleanup: сохраняем финальное состояние при размонтировании
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        saveToSession(key, state);
      }
    };
  }, [state, key, saveState]);

  // Обёртка для setState, чтобы поддержать функциональные обновления
  const setStateWrapper = useCallback((value: T | ((prev: T) => T)) => {
    setState(value);
  }, []);

  return [state, setStateWrapper];
};

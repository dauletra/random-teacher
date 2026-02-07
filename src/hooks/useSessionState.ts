import { useState, useEffect, useCallback, useRef } from 'react';
import { saveToSession, loadFromSession } from '../utils/sessionStorage';

/**
 * Хук для работы с sessionStorage, аналогичный useState
 * Сохраняет состояние в sessionStorage при размонтировании компонента
 * и с debounce при изменении (по умолчанию 500ms)
 *
 * @param key - ключ для хранения в sessionStorage
 * @param defaultValue - значение по умолчанию
 * @param debounceMs - задержка перед сохранением (для оптимизации частых изменений)
 * @returns [state, setState] - кортеж состояния и функции для его изменения
 */
export const useSessionState = <T>(
  key: string,
  defaultValue: T,
  debounceMs: number = 500
): [T, (value: T | ((prev: T) => T)) => void] => {
  // Загружаем начальное значение из sessionStorage или используем defaultValue
  const [state, setState] = useState<T>(() => {
    return loadFromSession(key, defaultValue);
  });

  // Ref для актуального state (для сохранения при unmount без зависимостей)
  const stateRef = useRef(state);
  stateRef.current = state;

  // Ref для ключа
  const keyRef = useRef(key);
  keyRef.current = key;

  // Ref для debounce таймера
  const debounceTimerRef = useRef<number | null>(null);

  // Сохранение с debounce при изменении state
  useEffect(() => {
    if (debounceMs > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveToSession(keyRef.current, stateRef.current);
        debounceTimerRef.current = null;
      }, debounceMs);
    }
    // НЕ сохраняем синхронно — только через debounce или при unmount
  }, [state, debounceMs]);

  // Cleanup: сохранить финальное состояние при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Гарантированно сохраняем при unmount
      saveToSession(keyRef.current, stateRef.current);
    };
  }, []); // Пустые зависимости — только при unmount

  // Обёртка для setState
  const setStateWrapper = useCallback((value: T | ((prev: T) => T)) => {
    setState(value);
  }, []);

  return [state, setStateWrapper];
};

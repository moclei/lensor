import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { connect, ConfigItem, DerivedState } from 'crann';
import { LensorStateConfig } from '../state-config';

export function createCrannStateHook<
  TConfig extends Record<string, ConfigItem<any>>
>(config: TConfig) {
  return function useCrannState(context?: string) {
    const [useCrann, get, set, subscribe] = useMemo(() => {
      const instance = connect(config);
      return instance;
    }, [context]);

    const useStateItem = useCallback(
      <K extends keyof DerivedState<TConfig>>(key: K) => {
        const [value, setValue] = useState<DerivedState<TConfig>[K]>(
          get()[key]
        );
        const valueRef = useRef(value);

        useEffect(() => {
          valueRef.current = value;
        }, [value]);

        useEffect(() => {
          setValue(get()[key]);
          const unsubscribe = subscribe(
            (changes: DerivedState<TConfig>[K]) => {
              if (key in changes) {
                const newValue = changes[key] as DerivedState<TConfig>[K];
                setValue(changes[key] as DerivedState<TConfig>[K]);
              }
            },
            [key]
          );
          return unsubscribe;
        }, [key]);

        const updateValue = useCallback(
          (newValue: DerivedState<TConfig>[K]) => {
            set({ [key]: newValue } as Partial<DerivedState<TConfig>>);
          },
          [key]
        );

        return [value, updateValue] as const;
      },
      [get, set, subscribe]
    );

    const getState = useCallback(() => get(), [get]);

    const setState = useCallback(
      (newState: Partial<DerivedState<TConfig>>) => {
        set(newState);
      },
      [set]
    );

    return {
      useStateItem,
      getState,
      setState,
      useCrann
    };
  };
}

export const useLensorState = createCrannStateHook(LensorStateConfig);

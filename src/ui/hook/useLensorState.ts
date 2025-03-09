import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { connect, connected, ConfigItem, DerivedState } from 'crann';
import { LensorStateConfig } from '../../weirwood/state-config';

export function createCrannStateHook<
  TConfig extends Record<string, ConfigItem<any>>
>(config: TConfig) {
  return function useCrannState(context?: string) {
    // console.log('useLensorState: useCrannState, context ', context);
    const [useCrann, get, set, subscribe] = useMemo(() => {
      // console.log(
      //   'useLensorState: Connecting to Crann with context : ',
      //   context
      // );
      const instance = connect(config, context);
      return instance;
    }, [context]);

    const useStateItem = useCallback(
      <K extends keyof DerivedState<TConfig>>(key: K) => {
        const [value, setValue] = useState<DerivedState<TConfig>[K]>(
          get()[key]
        );
        const valueRef = useRef(value);
        //console.log("useLensorState, useStateItem, key, initialValue ", key, value);
        useEffect(() => {
          valueRef.current = value;
        }, [value]);

        useEffect(() => {
          setValue(get()[key]);
          const unsubscribe = subscribe(
            (changes) => {
              // console.log('useLensorState: Changes received: ', changes);
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

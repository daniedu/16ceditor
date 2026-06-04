"use client";

import { useRef, useCallback, useState } from "react";

export function useUndoRedo<T>() {
  const stacks = useRef(new Map<string, { past: T[]; future: T[] }>());
  const [state, setState] = useState({ canUndo: false, canRedo: false });

  const push = useCallback((key: string, current: T) => {
    let stack = stacks.current.get(key);
    if (!stack) {
      stack = { past: [], future: [] };
      stacks.current.set(key, stack);
    }
    stack.past.push(current);
    if (stack.past.length > 50) stack.past.shift();
    stack.future = [];
    setState({ canUndo: true, canRedo: false });
  }, []);

  const undo = useCallback((key: string, current: T): T | undefined => {
    const stack = stacks.current.get(key);
    if (!stack || stack.past.length === 0) return;
    const prev = stack.past.pop()!;
    stack.future.push(current);
    setState({ canUndo: stack.past.length > 0, canRedo: true });
    return prev;
  }, []);

  const redo = useCallback((key: string, current: T): T | undefined => {
    const stack = stacks.current.get(key);
    if (!stack || stack.future.length === 0) return;
    const next = stack.future.pop()!;
    stack.past.push(current);
    setState({ canUndo: true, canRedo: stack.future.length > 0 });
    return next;
  }, []);

  const check = useCallback((key: string) => {
    const stack = stacks.current.get(key);
    setState({
      canUndo: stack ? stack.past.length > 0 : false,
      canRedo: stack ? stack.future.length > 0 : false,
    });
  }, []);

  return { ...state, push, undo, redo, check };
}

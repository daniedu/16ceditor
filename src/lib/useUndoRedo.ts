"use client";

import { useRef, useCallback, useState } from "react";

type Entry = { key: string; prev: string; next: string };
type Stack = { past: Entry[]; future: Entry[] };
type Stacks = Map<string, Stack>;

export function useUndoRedo() {
  const stacks = useRef<Stacks>(new Map());
  const [state, setState] = useState({ canUndo: false, canRedo: false });

  const push = useCallback((slug: string, key: string, prevValue: string, nextValue: string) => {
    let stack = stacks.current.get(slug);
    if (!stack) {
      stack = { past: [], future: [] };
      stacks.current.set(slug, stack);
    }
    stack.past.push({ key, prev: prevValue, next: nextValue });
    if (stack.past.length > 50) stack.past.shift();
    stack.future = [];
    setState({ canUndo: true, canRedo: false });
  }, []);

  const undo = useCallback((slug: string): Entry | undefined => {
    const stack = stacks.current.get(slug);
    if (!stack || stack.past.length === 0) return;
    const entry = stack.past.pop()!;
    stack.future.push({ key: entry.key, prev: entry.next, next: entry.prev });
    setState({ canUndo: stack.past.length > 0, canRedo: true });
    return entry;
  }, []);

  const redo = useCallback((slug: string): Entry | undefined => {
    const stack = stacks.current.get(slug);
    if (!stack || stack.future.length === 0) return;
    const entry = stack.future.pop()!;
    stack.past.push({ key: entry.key, prev: entry.next, next: entry.prev });
    setState({ canUndo: true, canRedo: stack.future.length > 0 });
    return entry;
  }, []);

  const check = useCallback((slug: string) => {
    const stack = stacks.current.get(slug);
    setState({
      canUndo: stack ? stack.past.length > 0 : false,
      canRedo: stack ? stack.future.length > 0 : false,
    });
  }, []);

  return { ...state, push, undo, redo, check };
}

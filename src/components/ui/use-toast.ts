import { useEffect, useReducer, useRef } from "react";
import { reducer, TOAST_REMOVE_DELAY, toastTimeouts } from "./toast/toast-reducer";
import type { ToastProps, ToastActionElement } from "./toast/toast-types";

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type Toast = Omit<ToastProps, "id">;

function dispatch(action: any) {
  console.log("Dispatching toast action:", action);
}

function useToast() {
  const [state, innerDispatch] = useReducer(reducer, {
    toasts: [],
  });

  useEffect(() => {
    dispatch = innerDispatch;
  }, [innerDispatch]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      innerDispatch({
        type: "DISMISS_TOAST",
        toastId,
      });
    },
  };
}

function toast(props: Toast) {
  const id = generateId();

  const update = (props: ToastProps) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: props,
      id,
    });

  const dismiss = () =>
    dispatch({
      type: "DISMISS_TOAST",
      toastId: id,
    });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

export { useToast, toast };
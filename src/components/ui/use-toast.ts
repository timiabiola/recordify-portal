import { useEffect, useReducer, useRef } from "react";
import { createToastReducer, TOAST_REMOVE_DELAY, toastTimeouts } from "./toast/toast-reducer";
import type { ToastProps, ToastActionElement, Action } from "./toast/toast-types";

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

let dispatchToast: ((action: Action) => void) | null = null;

function useToast() {
  const reducer = useRef(createToastReducer((action) => {
    if (dispatchToast) dispatchToast(action);
  })).current;

  const [state, dispatch] = useReducer(reducer, {
    toasts: [],
  });

  useEffect(() => {
    dispatchToast = dispatch;
    return () => {
      dispatchToast = null;
    };
  }, [dispatch]);

  const toast = (props: Toast) => {
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
  };

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, type Toast };
export const toast = (props: Toast) => {
  if (dispatchToast) {
    const id = generateId();
    dispatchToast({
      type: "ADD_TOAST",
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open && dispatchToast) {
            dispatchToast({ type: "DISMISS_TOAST", toastId: id });
          }
        },
      },
    });
    return {
      id,
      dismiss: () => dispatchToast?.({ type: "DISMISS_TOAST", toastId: id }),
      update: (props: ToastProps) =>
        dispatchToast?.({
          type: "UPDATE_TOAST",
          toast: props,
          id,
        }),
    };
  }
  return {
    id: "",
    dismiss: () => {},
    update: () => {},
  };
};
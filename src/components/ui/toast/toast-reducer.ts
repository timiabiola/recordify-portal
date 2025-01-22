import { Action, State } from "./toast-types";

export const TOAST_LIMIT = 3;
export const TOAST_REMOVE_DELAY = 3000;

export const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const createToastReducer = (dispatch: (action: Action) => void) => {
  const addToRemoveQueue = (toastId: string) => {
    if (toastTimeouts.has(toastId)) {
      return;
    }

    const timeout = setTimeout(() => {
      toastTimeouts.delete(toastId);
      dispatch({
        type: "REMOVE_TOAST",
        toastId: toastId,
      });
    }, TOAST_REMOVE_DELAY);

    toastTimeouts.set(toastId, timeout);
  };

  return (state: State, action: Action): State => {
    switch (action.type) {
      case "ADD_TOAST":
        return {
          ...state,
          toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
        };

      case "UPDATE_TOAST":
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === action.id ? { ...t, ...action.toast } : t
          ),
        };

      case "DISMISS_TOAST": {
        const { toastId } = action;

        if (toastId) {
          addToRemoveQueue(toastId);
        } else {
          state.toasts.forEach((toast) => {
            addToRemoveQueue(toast.id);
          });
        }

        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId || toastId === undefined
              ? {
                  ...t,
                  open: false,
                }
              : t
          ),
        };
      }

      case "REMOVE_TOAST":
        if (action.toastId === undefined) {
          return {
            ...state,
            toasts: [],
          };
        }
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== action.toastId),
        };
    }
  };
};
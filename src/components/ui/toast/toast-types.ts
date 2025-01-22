export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type ToastActionElement = React.ReactElement<{
  altText: string;
  onClick: () => void;
}>;

export type State = {
  toasts: ToastProps[];
};

export type Action =
  | {
      type: "ADD_TOAST";
      toast: ToastProps;
    }
  | {
      type: "UPDATE_TOAST";
      toast: Partial<ToastProps>;
      id: string;
    }
  | {
      type: "DISMISS_TOAST";
      toastId?: string;
    }
  | {
      type: "REMOVE_TOAST";
      toastId?: string;
    };
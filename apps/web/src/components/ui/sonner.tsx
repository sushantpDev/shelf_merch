import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      expand={false}
      visibleToasts={4}
      duration={5000}
      gap={12}
      offset={24}
      className="sm-sonner"
      icons={{
        success: <CheckCircle2 size={20} strokeWidth={2} aria-hidden />,
        error: <AlertCircle size={20} strokeWidth={2} aria-hidden />,
        info: <Info size={20} strokeWidth={2} aria-hidden />,
        warning: <AlertTriangle size={20} strokeWidth={2} aria-hidden />,
        loading: <Loader2 size={20} strokeWidth={2} className="sm-sonner-spin" aria-hidden />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "sm-toast",
          title: "sm-toast-title",
          description: "sm-toast-desc",
          success: "sm-toast--success",
          error: "sm-toast--error",
          info: "sm-toast--info",
          warning: "sm-toast--warning",
          closeButton: "sm-toast-close",
          icon: "sm-toast-icon",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

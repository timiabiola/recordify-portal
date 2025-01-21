import { ReactNode } from 'react';

interface AuthContainerProps {
  children: ReactNode;
}

const AuthContainer = ({ children }: AuthContainerProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        {children}
      </div>
    </div>
  );
};

export default AuthContainer;
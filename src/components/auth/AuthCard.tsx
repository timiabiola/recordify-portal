import { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
}

const AuthCard = ({ children }: AuthCardProps) => {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm">
      {children}
    </div>
  );
};

export default AuthCard;
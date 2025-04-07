import React from 'react';
import { LoginForm } from "@/components/login-form"; // Assuming login-01 created this

const LoginPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <LoginForm />
    </div>
  );
};

export default LoginPage; 
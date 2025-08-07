
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2000); // 2-second delay
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex-grow flex items-center justify-center bg-background">
      <div className="text-center animate-pulse">
        <Logo className="justify-center" />
      </div>
    </div>
  );
};

export default SplashScreen;

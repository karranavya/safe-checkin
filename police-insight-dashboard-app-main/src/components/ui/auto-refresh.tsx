import { useEffect } from 'react';

interface AutoRefreshProps {
  intervalMinutes?: number;
}

export const AutoRefresh: React.FC<AutoRefreshProps> = ({ intervalMinutes = 5 }) => {
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [intervalMinutes]);

  return null;
};
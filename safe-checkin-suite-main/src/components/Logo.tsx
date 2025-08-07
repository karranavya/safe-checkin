
import React from 'react';

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img src="/lovable-uploads/c346193f-d1f3-4bb4-b73d-dc5f56dec59a.png" alt="Safe CheckIn Logo" className="h-9" />
    </div>
  );
};

export default Logo;

import React from 'react';
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <div className="main-content">{children}</div>;
}

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Main Studio component wrapper using arrow function
export default function Studio() {
  return <Outlet />;
}

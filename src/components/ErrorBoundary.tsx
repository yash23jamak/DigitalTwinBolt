import React, { useState, useEffect } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { notificationService } from '../services/notificationService';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback,
  onError
}) => {
  const handleError = (error: Error, info: React.ErrorInfo) => {
    console.error('Error caught by ErrorBoundary:', error, info);

    // Notify the user
    notificationService.error(
      'Component Error',
      'An error occurred in the application. Please try refreshing the page.'
    );

    // Call the optional onError callback
    if (onError) {
      onError(error, info);
    }
  };

  const DefaultFallback = ({ error, resetErrorBoundary }: {
    error: Error;
    resetErrorBoundary: () => void
  }) => (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
      <p className="text-red-600 mb-4">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        onClick={resetErrorBoundary}
      >
        Try again
      </button>
    </div>
  );

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback ? () => <>{fallback}</> : DefaultFallback}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
};

import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="text-center py-2">
      {message}
    </div>
  );
};

export default LoadingSpinner;

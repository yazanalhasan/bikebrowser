function LoadingSpinner({ size = 'large' }) {
  const sizeClass = size === 'large' ? 'w-16 h-16' : 'w-8 h-8';
  
  return (
    <div className="flex justify-center items-center">
      <div className={`spinner ${sizeClass}`}></div>
    </div>
  );
}

export default LoadingSpinner;

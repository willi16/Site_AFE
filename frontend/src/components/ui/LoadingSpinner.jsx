function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} border-3 border-surface-200 border-t-primary-500 rounded-full animate-spin`} />
    </div>
  );
}

export default LoadingSpinner;

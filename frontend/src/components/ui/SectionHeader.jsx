function SectionHeader({ subtitle, title, description, center = true, light = false }) {
  return (
    <div className={`mb-12 ${center ? 'text-center' : ''}`}>
      {subtitle && (
        <span className={`inline-block text-sm font-bold uppercase tracking-widest mb-3 ${light ? 'text-accent-400' : 'text-accent-500'}`}>
          {subtitle}
        </span>
      )}
      <h2 className={`text-3xl md:text-4xl font-bold font-[var(--font-display)] mb-4 ${light ? 'text-white' : 'text-surface-900'}`}>
        {title}
      </h2>
      {description && (
        <p className={`text-lg max-w-2xl ${center ? 'mx-auto' : ''} ${light ? 'text-surface-300' : 'text-surface-500'}`}>
          {description}
        </p>
      )}
    </div>
  );
}

export default SectionHeader;

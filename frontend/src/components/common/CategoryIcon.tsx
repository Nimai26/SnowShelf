interface CategoryIconProps {
  icon: string;
  iconType?: 'emoji' | 'url';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
};

export default function CategoryIcon({ icon, iconType, size = 'md', className = '' }: CategoryIconProps) {
  if (iconType === 'url') {
    return (
      <img
        src={icon}
        alt=""
        className={`${sizeClasses[size]} rounded object-cover ${className}`}
      />
    );
  }
  return <span className={className}>{icon}</span>;
}

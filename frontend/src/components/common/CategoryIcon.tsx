interface CategoryIconProps {
  icon: string;
  iconType?: 'emoji' | 'url';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const imageSizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-9 w-9',
  xl: 'h-11 w-11',
};

const emojiSizeClasses = {
  sm: 'text-base leading-none',
  md: 'text-lg leading-none',
  lg: 'text-2xl leading-none',
  xl: 'text-3xl leading-none',
};

export default function CategoryIcon({ icon, iconType, size = 'md', className = '' }: CategoryIconProps) {
  if (iconType === 'url') {
    return (
      <img
        src={icon}
        alt=""
        className={`${imageSizeClasses[size]} shrink-0 rounded object-contain ${className}`}
      />
    );
  }
  return <span className={`${emojiSizeClasses[size]} ${className}`}>{icon}</span>;
}

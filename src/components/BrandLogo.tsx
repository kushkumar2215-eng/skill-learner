import React from 'react';

export const SKILL_LEARNER_LOGO_URL =
  '/assets/aistudio/image_0b1e47ad.png';

export const COLLABORATIVE_LEARNING_IMAGE_URL =
  '/assets/aistudio/collaborative-learning-teamwork-concept-diverse-hands-joining-together-emphasizing-innovation-knowledge-sharing-458018111_d745b137.webp';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showText = true }) => {
  const dimensions =
    size === 'sm'
      ? 'w-8 h-8'
      : size === 'lg'
      ? 'w-11 h-11'
      : size === 'xl'
      ? 'w-16 h-16'
      : 'w-9 h-9';
  const textSize =
    size === 'sm'
      ? 'text-base'
      : size === 'lg'
      ? 'text-xl'
      : size === 'xl'
      ? 'text-2xl'
      : 'text-lg';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <img
        src={SKILL_LEARNER_LOGO_URL}
        alt="Skill Learner Logo"
        className={`${dimensions} shrink-0 rounded-lg object-contain bg-white border border-slate-200/80 p-0.5 shadow-2xs`}
      />
      {showText && (
        <span className={`font-display font-bold tracking-tight text-slate-900 ${textSize}`}>
          Skill Learner
        </span>
      )}
    </span>
  );
};

interface UserAvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const COLOR_MAP: Record<string, string> = {
  teal: 'bg-teal-700 text-white',
  indigo: 'bg-indigo-700 text-white',
  amber: 'bg-amber-700 text-white',
  emerald: 'bg-emerald-700 text-white',
  slate: 'bg-slate-800 text-white',
  rose: 'bg-rose-700 text-white',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  color = 'teal',
  size = 'md',
}) => {
  const cleanName = name.replace(/\(Sample Profile\)/i, '').trim() || 'Member';
  const initials = cleanName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const sizeClasses =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
      ? 'w-12 h-12 text-base'
      : size === 'xl'
      ? 'w-16 h-16 text-xl'
      : 'w-10 h-10 text-sm';

  const bgClass = COLOR_MAP[color] || COLOR_MAP.teal;

  return (
    <div
      className={`${sizeClasses} ${bgClass} rounded-xl font-display font-semibold flex items-center justify-center shrink-0 select-none shadow-xs`}
      aria-label={`Avatar for ${cleanName}`}
    >
      {initials || 'SL'}
    </div>
  );
};

import type { AgendaDentistColumn } from '@/lib/clinical/dentistDisplay';

type Props = {
  dentist: Pick<AgendaDentistColumn, 'fullName' | 'photoUrl' | 'initials' | 'agendaColor'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const sizes = {
  sm: 'agd-doc-avatar--sm',
  md: 'agd-doc-avatar--md',
  lg: 'agd-doc-avatar--lg',
  xl: 'agd-doc-avatar--xl'
} as const;

export function AgendaDoctorAvatar({ dentist, size = 'md', className = '' }: Props) {
  const tone = dentist.agendaColor ?? '#14b8a6';
  return (
    <span
      className={`agd-doc-avatar ${sizes[size]}${className ? ` ${className}` : ''}`}
      style={{ ['--agd-doc-color' as string]: tone }}
      title={dentist.fullName}
    >
      {dentist.photoUrl ? (
        <img src={dentist.photoUrl} alt="" width={48} height={48} />
      ) : (
        <span aria-hidden>{dentist.initials}</span>
      )}
    </span>
  );
}

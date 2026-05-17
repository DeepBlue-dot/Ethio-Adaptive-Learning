interface AIFeatureCardProps {
  icon: string;
  title: string;
  iconColor: 'secondary' | 'success-emerald' | 'warning-gold' | 'error' | 'primary';
}

export default function AIFeatureCard({ icon, title, iconColor }: AIFeatureCardProps) {
  const colorMap = {
    secondary: 'bg-secondary/10 text-secondary',
    'success-emerald': 'bg-success-emerald/10 text-success-emerald',
    'warning-gold': 'bg-warning-gold/10 text-warning-gold',
    error: 'bg-error/10 text-error',
    primary: 'bg-primary-container/20 text-primary',
  };

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container shadow-lg shadow-slate-200/30 dark:shadow-black/30 rounded-xl p-4 border border-outline-variant/30 dark:border-outline-variant/50 w-48 text-center flex flex-col items-center transform transition-transform hover:scale-105 hover:border-primary/50 dark:hover:border-primary/60 group">
      <div className={`w-10 h-10 rounded-full ${colorMap[iconColor]} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h4 className="font-label-md text-sm font-bold text-on-surface dark:text-on-surface">{title}</h4>
    </div>
  );
}

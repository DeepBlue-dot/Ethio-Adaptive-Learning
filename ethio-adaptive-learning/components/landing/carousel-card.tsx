interface CarouselCardProps {
  icon: string;
  title: string;
  description: string;
  accentColor: 'primary' | 'success-emerald' | 'error' | 'primary-container' | 'secondary' | 'warning-gold';
  content: React.ReactNode;
}

export default function CarouselCard({
  icon,
  title,
  description,
  accentColor,
  content,
}: CarouselCardProps) {
  const colorMap = {
    'primary': { bg: 'bg-primary/10', gradient: 'from-primary to-indigo-600', shadow: 'shadow-primary/10' },
    'success-emerald': { bg: 'bg-success-emerald/10', gradient: 'from-success-emerald to-emerald-600', shadow: 'shadow-success-emerald/10' },
    'error': { bg: 'bg-error/10', gradient: 'from-error to-red-600', shadow: 'shadow-error/10' },
    'primary-container': { bg: 'bg-primary-container/20', gradient: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-500/20' },
    'secondary': { bg: 'bg-secondary/10', gradient: 'from-secondary to-green-600', shadow: 'shadow-secondary/20' },
    'warning-gold': { bg: 'bg-warning-gold/10', gradient: 'from-warning-gold to-orange-500', shadow: 'shadow-warning-gold/20' },
  };

  const colors = colorMap[accentColor];

  return (
    <div className={`w-[85vw] md:w-[45vw] lg:w-[calc(31%)] shrink-0 snap-start bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-outline-variant/30 rounded-2xl p-6 relative overflow-hidden group/card hover:shadow-xl hover:${colors.shadow} hover:-translate-y-1 transition-all duration-300 flex flex-col`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover/card:scale-150`}></div>
      
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg ${colors.shadow} mb-6 relative z-10`}>
        <span className="material-symbols-outlined text-white text-2xl">{icon}</span>
      </div>
      
      <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2 relative z-10">{title}</h3>
      
      <p className="font-body-md text-on-surface-variant mb-6 flex-grow relative z-10">{description}</p>
      
      <div className="bg-surface-variant/40 rounded-xl p-4 border border-outline-variant/20 relative z-10">
        {content}
      </div>
    </div>
  );
}

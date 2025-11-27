/**
 * 헤더 컴포넌트
 */

export default function Header({ title, description, actions }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-white text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-slate-400 text-base">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}








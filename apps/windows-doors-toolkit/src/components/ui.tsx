import type { CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Money({ n }: { n: number }) {
  return (
    <span>
      {new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(n || 0)}
    </span>
  );
}

export function Num({ n, d = 2 }: { n: number; d?: number }) {
  return (
    <span>
      {(n || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: d,
      })}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      {badge ? <span className="badge">{badge}</span> : null}
    </header>
  );
}

export function Card({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="card">
      {(title || actions) && (
        <div className="card-head">
          {title ? <h2>{title}</h2> : <span />}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {hint ? <div className="kpi-hint">{hint}</div> : null}
    </div>
  );
}

type Tone = 'in' | 'link' | 'calc';

export function Field({
  label,
  tone = 'in',
  children,
  hint,
}: {
  label: string;
  tone?: Tone;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className={`field tone-${tone}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement> & { tone?: Tone }) {
  const { tone = 'in', className, ...rest } = props;
  return <input className={`input tone-${tone} ${className ?? ''}`} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { tone?: Tone }) {
  const { tone = 'in', className, children, ...rest } = props;
  return (
    <select className={`input tone-${tone} ${className ?? ''}`} {...rest}>
      {children}
    </select>
  );
}

export function CalcBox({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="calc-box" style={style}>
      <div className="calc-label">{label}</div>
      <div className="calc-value">{children}</div>
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>;
}

export function Btn({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button type={type} className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Legend() {
  return (
    <div className="legend">
      <span>
        <i className="swatch yellow" /> Type / edit
      </span>
      <span>
        <i className="swatch blue" /> Linked from Settings / other tool
      </span>
      <span>
        <i className="swatch white" /> Calculated
      </span>
    </div>
  );
}

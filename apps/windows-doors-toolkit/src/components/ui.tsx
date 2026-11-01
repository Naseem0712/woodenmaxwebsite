import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

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

function formatNumDraft(value: number | string | readonly string[] | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'string') return value;
  return '';
}

function isPartialNumber(t: string): boolean {
  return t === '' || /^-?\d*\.?\d*$/.test(t);
}

function isCompleteNumber(t: string): boolean {
  if (t === '' || t === '-' || t === '.' || t === '-.') return false;
  if (t.endsWith('.')) return false;
  return !Number.isNaN(Number(t));
}

/**
 * Draft-string numeric input: clearing / mid-edit never forces 0 into state.
 * Commits on blur (empty → previous value). Compatible with existing
 * onChange={(e) => set(Number(e.target.value))} call sites via Input type="number".
 */
export function NumberInput({
  value,
  onCommit,
  onChange,
  tone = 'in',
  className,
  emptyAs = 'previous',
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: number | string | null | undefined;
  /** Preferred API — called with parsed number (or null if emptyAs='null') */
  onCommit?: (n: number | null) => void;
  /** Legacy — synthetic change with numeric string, only when value is complete */
  onChange?: InputHTMLAttributes<HTMLInputElement>['onChange'];
  tone?: Tone;
  emptyAs?: 'previous' | 'null' | 'zero';
}) {
  const numericValue =
    typeof value === 'number' ? value : value === '' || value == null ? null : Number(value);
  const prevRef = useRef<number | null>(
    numericValue != null && Number.isFinite(numericValue) ? numericValue : null,
  );
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatNumDraft(value as number | string | undefined));

  useEffect(() => {
    if (!focused) {
      setDraft(formatNumDraft(value as number | string | undefined));
      if (numericValue != null && Number.isFinite(numericValue)) prevRef.current = numericValue;
    }
  }, [value, focused, numericValue]);

  const commit = (raw: string) => {
    if (raw.trim() === '' || raw === '-' || raw === '.' || raw === '-.') {
      if (emptyAs === 'null') {
        onCommit?.(null);
        return;
      }
      if (emptyAs === 'zero') {
        onCommit?.(0);
        onChange?.({
          target: { value: '0' },
        } as React.ChangeEvent<HTMLInputElement>);
        setDraft('0');
        prevRef.current = 0;
        return;
      }
      // previous
      const prev = prevRef.current;
      const restore = prev != null && Number.isFinite(prev) ? prev : 0;
      setDraft(String(restore));
      onCommit?.(restore);
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) {
      const prev = prevRef.current ?? 0;
      setDraft(String(prev));
      onCommit?.(prev);
      return;
    }
    prevRef.current = n;
    setDraft(String(n));
    onCommit?.(n);
    onChange?.({
      target: { value: String(n) },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      className={`input tone-${tone} ${className ?? ''}`}
      value={focused ? draft : formatNumDraft(value as number | string | undefined)}
      onFocus={(e) => {
        setFocused(true);
        setDraft(formatNumDraft(value as number | string | undefined));
        rest.onFocus?.(e);
      }}
      onChange={(e) => {
        const t = e.target.value;
        if (!isPartialNumber(t)) return;
        setDraft(t);
        if (isCompleteNumber(t)) {
          const n = Number(t);
          prevRef.current = n;
          onCommit?.(n);
          onChange?.({
            ...e,
            target: { ...e.target, value: String(n) },
          });
        }
      }}
      onBlur={(e) => {
        setFocused(false);
        commit(draft);
        rest.onBlur?.(e);
      }}
    />
  );
}

export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & {
    tone?: Tone;
    emptyAs?: 'previous' | 'null' | 'zero';
  },
) {
  const { tone = 'in', className, type, emptyAs, ...rest } = props;
  if (type === 'number') {
    const { value, onChange, ...numRest } = rest;
    return (
      <NumberInput
        tone={tone}
        className={className}
        emptyAs={emptyAs}
        value={value as number | string | undefined}
        onChange={onChange}
        {...numRest}
      />
    );
  }
  return <input type={type} className={`input tone-${tone} ${className ?? ''}`} {...rest} />;
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
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
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

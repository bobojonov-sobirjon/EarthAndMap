import Select from 'react-select'

function findSelectedOption(options, value) {
  for (const opt of options) {
    if (opt.options) {
      const nested = opt.options.find((o) => o.value === value)
      if (nested) return nested
    } else if (opt.value === value) {
      return opt
    }
  }
  return null
}

function buildStyles(variant) {
  const light = variant === 'light' || variant === 'toolbar'
  const toolbar = variant === 'toolbar'
  return {
    control: (base, state) => ({
      ...base,
      minHeight: toolbar ? 34 : (light ? 38 : 42),
      background: state.isDisabled
        ? (light ? '#f1f5f9' : '#0a1018')
        : (light ? '#fff' : '#0b1220'),
      borderColor: state.isFocused
        ? (light ? '#1867D2' : '#38bdf8')
        : (light ? '#dbeafe' : 'rgba(125,211,252,0.22)'),
      borderRadius: toolbar ? 9 : 8,
      boxShadow: state.isFocused
        ? (light ? '0 0 0 2px rgba(24,103,210,0.12)' : '0 0 0 3px rgba(56,189,248,0.18)')
        : 'none',
      opacity: state.isDisabled ? 0.55 : 1,
      cursor: 'pointer',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      ':hover': {
        borderColor: state.isDisabled
          ? (light ? '#e2e8f0' : 'rgba(125,211,252,0.22)')
          : (light ? '#93c5fd' : '#38bdf8'),
      },
    }),
    valueContainer: (base) => ({ ...base, padding: toolbar ? '0 6px' : (light ? '1px 8px' : '2px 10px') }),
    singleValue: (base) => ({
      ...base,
      color: light ? '#1e293b' : '#e8edf4',
      fontSize: toolbar ? '0.8rem' : (light ? '0.82rem' : base.fontSize),
      fontWeight: toolbar ? 600 : base.fontWeight,
    }),
    placeholder: (base) => ({
      ...base,
      color: light ? '#64748b' : '#6b7d94',
      fontSize: toolbar ? '0.8rem' : (light ? '0.82rem' : base.fontSize),
      fontWeight: toolbar ? 600 : base.fontWeight,
    }),
    input: (base) => ({ ...base, color: light ? '#1e293b' : '#e8edf4' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({
      ...base,
      color: light ? '#64748b' : '#7dd3fc',
      padding: light ? 6 : base.padding,
      ':hover': { color: light ? '#1867D2' : '#e8edf4' },
    }),
    menu: (base) => ({
      ...base,
      background: light ? '#fff' : '#121a28',
      border: light ? '1px solid #e2e8f0' : '1px solid rgba(125,211,252,0.22)',
      borderRadius: 10,
      boxShadow: light ? '0 8px 28px rgba(15,23,42,0.14)' : '0 12px 32px rgba(0,0,0,0.35)',
      overflow: 'hidden',
      zIndex: 40,
    }),
    menuList: (base) => ({
      ...base,
      padding: 6,
      maxHeight: 260,
    }),
    option: (base, state) => ({
      ...base,
      borderRadius: 6,
      fontSize: light ? '0.82rem' : base.fontSize,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      paddingTop: toolbar ? 8 : base.paddingTop,
      paddingBottom: toolbar ? 8 : base.paddingBottom,
      background: state.isSelected
        ? '#1867D2'
        : state.isFocused
          ? (light ? 'rgba(24,103,210,0.08)' : 'rgba(56,189,248,0.16)')
          : 'transparent',
      color: state.isSelected ? '#fff' : (light ? '#334155' : '#e8edf4'),
      cursor: 'pointer',
      ':active': { background: '#1867D2', color: '#fff' },
    }),
    groupHeading: (base) => ({
      ...base,
      fontSize: light ? '0.72rem' : base.fontSize,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      color: light ? '#64748b' : '#93a4bb',
      padding: '8px 10px 4px',
      margin: 0,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 5000 }),
  }
}

export default function PrettySelect({
  value,
  onChange,
  options,
  placeholder = 'Выберите',
  noOptionsMessage = 'Ничего не найдено',
  isSearchable = true,
  isDisabled = false,
  variant = 'dark',
  menuPlacement = 'auto',
  className = '',
  formatOptionLabel,
}) {
  const styles = buildStyles(variant)
  const selected = findSelectedOption(options, value) || null
  return (
    <Select
      className={`pretty-select${variant === 'light' ? ' pretty-select--light' : ''}${variant === 'toolbar' ? ' pretty-select--toolbar' : ''}${className ? ` ${className}` : ''}`}
      classNamePrefix="pretty-select"
      styles={styles}
      options={options}
      value={selected}
      onChange={(opt) => onChange(opt?.value ?? '')}
      placeholder={placeholder}
      isSearchable={isSearchable}
      isDisabled={isDisabled}
      isClearable={false}
      formatOptionLabel={formatOptionLabel}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      menuPlacement={menuPlacement}
      noOptionsMessage={() => noOptionsMessage}
    />
  )
}

import Select from 'react-select'

const styles = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    background: state.isDisabled ? '#0a1018' : '#0b1220',
    borderColor: state.isFocused ? '#38bdf8' : 'rgba(125,211,252,0.22)',
    borderRadius: 8,
    boxShadow: state.isFocused ? '0 0 0 3px rgba(56,189,248,0.18)' : 'none',
    opacity: state.isDisabled ? 0.55 : 1,
    ':hover': { borderColor: state.isDisabled ? 'rgba(125,211,252,0.22)' : '#38bdf8' },
  }),
  valueContainer: (base) => ({ ...base, padding: '2px 10px' }),
  singleValue: (base) => ({ ...base, color: '#e8edf4' }),
  placeholder: (base) => ({ ...base, color: '#6b7d94' }),
  input: (base) => ({ ...base, color: '#e8edf4' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({ ...base, color: '#7dd3fc', ':hover': { color: '#e8edf4' } }),
  menu: (base) => ({
    ...base,
    background: '#121a28',
    border: '1px solid rgba(125,211,252,0.22)',
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 40,
  }),
  menuList: (base) => ({
    ...base,
    padding: 6,
    maxHeight: 240,
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: 6,
    background: state.isSelected ? '#1867d2' : state.isFocused ? 'rgba(56,189,248,0.16)' : 'transparent',
    color: '#e8edf4',
    cursor: 'pointer',
    ':active': { background: '#1867d2' },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 4000 }),
}

export default function PrettySelect({
  value,
  onChange,
  options,
  placeholder = 'Выберите',
  noOptionsMessage = 'Ничего не найдено',
  isSearchable = true,
  isDisabled = false,
}) {
  const selected = options.find((o) => o.value === value) || null
  return (
    <Select
      classNamePrefix="pretty-select"
      styles={styles}
      options={options}
      value={selected}
      onChange={(opt) => onChange(opt?.value ?? '')}
      placeholder={placeholder}
      isSearchable={isSearchable}
      isDisabled={isDisabled}
      isClearable={false}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      noOptionsMessage={() => noOptionsMessage}
    />
  )
}

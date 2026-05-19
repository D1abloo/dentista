import { Search } from 'lucide-react';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…'
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-input">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input__field"
      />
    </label>
  );
}

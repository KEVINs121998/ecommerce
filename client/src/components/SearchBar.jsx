function SearchBar({ value, onChange, inputRef }) {
  return (
    <label className="form-label w-100">
      <span className="visually-hidden">Search products</span>
      <input
        ref={inputRef}
        className="form-control"
        type="search"
        placeholder="Search products…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export default SearchBar

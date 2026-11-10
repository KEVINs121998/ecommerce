function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Product pages">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button className="page-link" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
            Previous
          </button>
        </li>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <li className={`page-item ${page === currentPage ? 'active' : ''}`} key={page}>
            <button className="page-link" onClick={() => onPageChange(page)} aria-current={page === currentPage ? 'page' : undefined}>
              {page}
            </button>
          </li>
        ))}
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button className="page-link" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
            Next
          </button>
        </li>
      </ul>
    </nav>
  )
}

export default Pagination

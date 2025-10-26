export default function Pagination({ page, pageSize, total, onPageChange }){
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center gap-2">
      <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={page<=1} onClick={()=>onPageChange(page-1)}>Prev</button>
      <span className="text-sm">Page {page} / {totalPages}</span>
      <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={page>=totalPages} onClick={()=>onPageChange(page+1)}>Next</button>
    </div>
  )
}

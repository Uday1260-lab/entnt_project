export default function ErrorBanner({ message }){
  return <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded">{message || 'Something went wrong'}</div>
}

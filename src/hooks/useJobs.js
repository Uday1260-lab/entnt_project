import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiSend } from '../api/client'

export function useJobsList(params){
  return useQuery({ queryKey: ['jobs', params], queryFn: () => apiGet('/jobs', params), keepPreviousData: true })
}

export function useCreateJob(){
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => apiSend('POST','/jobs', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useUpdateJob(){
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }) => apiSend('PATCH',`/jobs/${id}`, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useReorderJob(){
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, fromOrder, toOrder }) => apiSend('PATCH',`/jobs/${id}/reorder`, { fromOrder, toOrder }),
    onMutate: async (vars) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ['jobs'] })
      const keys = qc.getQueriesData({ queryKey: ['jobs'] })
      const prev = keys.map(([key, data]) => [key, data])
      keys.forEach(([key, data]) => {
        if (!data) return
        const items = [...data.items]
        const fromIdx = items.findIndex(j => j.order === vars.fromOrder)
        const [moved] = items.splice(fromIdx, 1)
        items.splice(vars.toOrder-1, 0, moved)
        items.forEach((j,i)=> j.order = (data.page-1)*data.pageSize + i + 1)
        qc.setQueryData(key, { ...data, items })
      })
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      // Rollback
      if (ctx?.prev) ctx.prev.forEach(([key, data]) => data && qc.setQueryData(key, data))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

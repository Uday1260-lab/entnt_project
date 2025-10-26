import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiSend } from '../api/client'

export function useCandidatesList(params){
  return useQuery({ queryKey: ['candidates', params], queryFn: () => apiGet('/candidates', params), keepPreviousData: true })
}

export function useCandidateTimeline(id){
  return useQuery({ queryKey: ['candidateTimeline', id], queryFn: () => apiGet(`/candidates/${id}/timeline`) })
}

export function useCreateCandidate(){
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => apiSend('POST','/candidates', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })
}

export function useUpdateCandidate(){
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }) => apiSend('PATCH',`/candidates/${id}`, updates),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['candidateTimeline', vars.id] })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiSend } from '../api/client'

export function useAssessment(jobId){
  return useQuery({ queryKey: ['assessment', jobId], queryFn: () => apiGet(`/assessments/${jobId}`), enabled: !!jobId })
}

export function useSaveAssessment(){
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, data }) => apiSend('PUT', `/assessments/${jobId}`, data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['assessment', vars.jobId] }),
  })
}

export function useSubmitAssessment(){
  return useMutation({
    mutationFn: ({ jobId, candidateId, answers }) => apiSend('POST', `/assessments/${jobId}/submit`, { candidateId, answers })
  })
}

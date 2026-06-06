import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { consultationsApi } from '@/api/consultations'
import toast from 'react-hot-toast'
import type { CreateConsultationPayload } from '@/types'

interface Props {
  patients: any[]
  onSuccess: () => void
  initialData?: any
  /** When true: pre-fills patient+type from a previous consultation, creates a new one */
  isReconsult?: boolean
}

const CONSULTATION_TYPES = ['General Consultation', 'Follow-up', 'Emergency', 'Specialist Referral', 'Preventive Care', 'Mental Health', 'Pediatric', 'Geriatric']

export default function ConsultationForm({ patients, onSuccess, initialData, isReconsult }: Props) {
  const isEdit = !!initialData && !isReconsult
  const { register, handleSubmit, formState: { errors } } = useForm<CreateConsultationPayload>({
    defaultValues: initialData ? {
      ...initialData,
      // For reconsult: keep patient + type but clear chief_complaint and scheduled_at
      chief_complaint: isReconsult ? '' : initialData.chief_complaint,
      scheduled_at: (!isReconsult && initialData.scheduled_at)
        ? new Date(initialData.scheduled_at).toISOString().slice(0, 16)
        : ''
    } : {}
  })

  const mut = useMutation({
    mutationFn: (d: any) =>
      isEdit
        ? consultationsApi.update(initialData.consultation_id, d)
        : consultationsApi.create(d),
    onSuccess: () => {
      toast.success(
        isReconsult ? 'Follow-up consultation created' :
        isEdit ? 'Consultation updated' : 'Consultation scheduled'
      )
      onSuccess()
    },
    onError: (e: any) => {
      console.error('Consultation Action Error:', e)
      toast.error(e.response?.data?.detail || e.message || 'Action failed')
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => {
      const payload = { ...d }
      if (!payload.scheduled_at) {
        delete payload.scheduled_at
      } else {
        try {
          payload.scheduled_at = new Date(payload.scheduled_at).toISOString()
        } catch (e) {
          delete payload.scheduled_at
        }
      }
      mut.mutate(payload)
    })}>
      {isReconsult && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 8, padding: '10px 14px', marginBottom: 14,
          fontSize: 12, color: '#166534'
        }}>
          Creating a new consultation for the same patient. Patient and type are pre-filled — update the chief complaint below.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
            <span>Patient <span style={{ color: '#e74c3c' }}>*</span></span>
            {!isEdit && !isReconsult && <a href="/patients" style={{ color: 'var(--teal)', fontSize: 11, textDecoration: 'none' }}>+ Add New Patient</a>}
          </label>
          <select {...register('patient_id', { required: 'Patient is required' })} className="form-control" disabled={isEdit || isReconsult}>
            <option value="">Select patient…</option>
            {patients.map((p: any) => (
              <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name} — {p.medical_id}</option>
            ))}
          </select>
          {errors.patient_id && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors.patient_id.message}</span>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Consultation Type <span style={{ color: '#e74c3c' }}>*</span></label>
          <select {...register('consultation_type', { required: 'Type is required' })} className="form-control">
            <option value="">Select type…</option>
            {CONSULTATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.consultation_type && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors.consultation_type.message}</span>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Chief Complaint <span style={{ color: '#e74c3c' }}>*</span></label>
          <textarea {...register('chief_complaint', { required: 'Chief complaint is required' })} className="form-control" rows={3} placeholder="Describe the primary reason for consultation…" />
          {errors.chief_complaint && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors.chief_complaint.message}</span>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Scheduled Time</label>
          <input type="datetime-local" {...register('scheduled_at')} className="form-control" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button type="submit" disabled={mut.isPending} style={{
          padding: '9px 22px', background: 'var(--teal)', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: mut.isPending ? 'not-allowed' : 'pointer', opacity: mut.isPending ? 0.7 : 1,
        }}>
          {mut.isPending ? 'Saving…' : isReconsult ? 'Create Follow-up' : isEdit ? 'Update Consultation' : 'Create Consultation'}
        </button>
      </div>
    </form>
  )
}

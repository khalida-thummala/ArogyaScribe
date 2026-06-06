import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { patientsApi } from '@/api/patients'
import toast from 'react-hot-toast'
import type { Patient, CreatePatientPayload } from '@/types'

interface Props {
  initial?: Patient | null
  onSuccess: () => void
}

export default function PatientForm({ initial, onSuccess }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreatePatientPayload>({
    mode: 'onChange',
    defaultValues: initial ? {
      first_name: initial.first_name,
      last_name: initial.last_name,
      date_of_birth: initial.date_of_birth,
      gender: initial.gender,
      medical_id: initial.medical_id,
      email: initial.email,
      phone: initial.phone,
      address_line1: initial.address_line1,
      address_line2: initial.address_line2,
      city: initial.city,
      state_province: initial.state_province,
      postal_code: initial.postal_code,
      country: initial.country,
      emergency_contact_name: initial.emergency_contact_name,
      emergency_contact_phone: initial.emergency_contact_phone,
      medical_history: initial.medical_history,
      allergies: initial.allergies,
      current_medications: initial.current_medications,
      insurance_provider: initial.insurance_provider,
      insurance_policy: initial.insurance_policy,
      blood_type: initial.blood_type,
      height_cm: initial.height_cm,
      weight_kg: initial.weight_kg,
      insurance_verified: initial.insurance_verified,
    } : {
      gender: 'other',
      blood_type: '',
      insurance_verified: false,
    },
  })

  const createMut = useMutation({

  mutationFn: patientsApi.create,

  onSuccess: () => {

    toast.success('Patient registered')

    onSuccess()
  },

  onError: (e: any) => {

    console.error(e)

  const detail =
    e.response?.data?.detail

  if (Array.isArray(detail)) {

    toast.error(
      detail[0]?.msg ||
      'Validation error'
    )

    } else if (
      typeof detail === 'string'
    ) {

      toast.error(detail)

    } else {

      toast.error(
        'Failed to create patient'
      )
    }
  },
})


  const updateMut = useMutation({

    mutationFn: (
      data: Partial<Patient>
    ) =>
      patientsApi.update(
        initial!.patient_id,
        data
      ),

    onSuccess: () => {

      toast.success(
        'Patient updated'
      )

      onSuccess()
    },

    onError: (e: any) => {

      console.error(e)

      const detail =
        e.response?.data?.detail

      if (Array.isArray(detail)) {

        toast.error(
          detail[0]?.msg ||
          'Validation error'
        )

      } else if (
        typeof detail === 'string'
      ) {

        toast.error(detail)

      } else {

        toast.error(
          'Failed to update patient'
        )
      }
    },
  })
  const onSubmit = (data: CreatePatientPayload) => {
    // Convert numeric fields
    const payload = {
      ...data,
      height_cm: data.height_cm ? Number(data.height_cm) : undefined,
      weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
    }
    if (initial) updateMut.mutate(payload as Partial<Patient>)
    else createMut.mutate(payload)
  }

  const isPending = createMut.isPending || updateMut.isPending

  const field = (label: string, name: keyof CreatePatientPayload, type = 'text', required = false) => (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {label}{required && <span style={{ color: '#e74c3c' }}> *</span>}
      </label>
      <input
        type={type}
        {...register(name, { 
          required: required ? `${label} is required` : false,
          ...(type === 'number' ? { min: { value: 0.01, message: 'Invalid' } } : {}),
          ...(type === 'tel' ? { pattern: { value: /^\d{10}$/, message: 'Must be 10 digits' } } : {})
        })}
        className="form-control"
        style={{ marginBottom: 0, height: 38, fontSize: 13 }}
      />
      {errors[name] && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors[name]?.message as string}</span>}
    </div>
  )

  const sectionTitle = (title: string) => (
    <div className="col-span-full" style={{ 
      paddingBottom: 8, 
      marginBottom: 8, 
      borderBottom: '1px solid var(--border)',
      marginTop: 16,
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--teal)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {title}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 10 }}>
      <div className="patient-form-grid" style={{ display: 'grid', gap: 16 }}>
        {sectionTitle('Demographics')}
        {field('First Name', 'first_name', 'text', true)}
        {field('Last Name', 'last_name', 'text', true)}
        {field('Date of Birth', 'date_of_birth', 'date', true)}
        
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Gender <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <select {...register('gender', { required: 'Gender is required' })} className="form-control" style={{ height: 38, fontSize: 13 }}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        {field('Medical ID', 'medical_id', 'text', true)}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Blood Type
          </label>
          <select {...register('blood_type')} className="form-control" style={{ height: 38, fontSize: 13 }}>
            <option value="">Unknown</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
        {field('Height (cm)', 'height_cm', 'number')}
        {field('Weight (kg)', 'weight_kg', 'number')}

        {sectionTitle('Contact Information')}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Email
          </label>
          <input
            type="email"
            {...register('email', { 
              pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Please enter a valid email address' }
            })}
            className="form-control"
            style={{ marginBottom: 0, height: 38, fontSize: 13 }}
          />
          {errors.email && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors.email.message as string}</span>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Phone <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <input
            type="tel"
            {...register('phone', { 
              required: 'Phone Number is required',
              pattern: { value: /^\d{10}$/, message: 'Phone number must contain 10 digits' }
            })}
            className="form-control"
            style={{ marginBottom: 0, height: 38, fontSize: 13 }}
          />
          {errors.phone && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors.phone.message as string}</span>}
        </div>
        <div style={{ gridColumn: 'span 1' }}></div>

        {field('Address Line 1', 'address_line1')}
        {field('Address Line 2', 'address_line2')}
        {field('City', 'city')}
        {field('State/Province', 'state_province')}
        {field('Postal Code', 'postal_code')}
        {field('Country', 'country')}

        {sectionTitle('Emergency Contact')}
        {field('Contact Name', 'emergency_contact_name')}
        {field('Contact Phone', 'emergency_contact_phone', 'tel')}
        <div style={{ gridColumn: 'span 1' }}></div>

        {sectionTitle('Medical History')}
        <div className="col-span-full">
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Medical History</label>
          <textarea {...register('medical_history')} className="form-control" rows={2} style={{ fontSize: 13 }} placeholder="Previous diagnoses, surgeries, etc." />
        </div>
        <div className="col-span-full">
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Allergies</label>
          <textarea {...register('allergies')} className="form-control" rows={2} style={{ fontSize: 13 }} placeholder="List known allergies…" />
        </div>
        <div className="col-span-full">
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Current Medications</label>
          <textarea {...register('current_medications')} className="form-control" rows={2} style={{ fontSize: 13 }} placeholder="List current medications and dosages…" />
        </div>

        {sectionTitle('Insurance')}
        {field('Provider', 'insurance_provider')}
        {field('Policy Number', 'insurance_policy')}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
          <input type="checkbox" {...register('insurance_verified')} id="insurance_verified" />
          <label htmlFor="insurance_verified" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Verified</label>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingBottom: 10 }}>
        <button type="submit" disabled={isPending} className="btn btn-primary" style={{
          padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600,
        }}>
          {isPending ? 'Saving…' : initial ? 'Update Patient' : 'Register Patient'}
        </button>
      </div>
    </form>
  )
}


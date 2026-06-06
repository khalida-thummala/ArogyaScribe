import { Navigate } from 'react-router-dom'

// Registration is handled via the Login page's register tab
// This route redirects to /login so users land on the correct UI
export default function RegisterPage() {
  return <Navigate to="/login" replace />
}

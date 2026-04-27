import { Navigate } from 'react-router-dom'

export default function PostFoundItemPage() {
  return <Navigate replace to="/found-items?compose=1" />
}

import { useNavigate } from 'react-router-dom'
import type { TaskType } from '../configs/app'
import { getSettings } from './storage/settings'

/** Opens a task, or Settings first when no API key is saved yet. */
export function useStartTask() {
  const navigate = useNavigate()
  return (task: TaskType) => {
    if (getSettings().apiKey) navigate(`/${task}`)
    else navigate('/settings', { state: { next: `/${task}` } })
  }
}

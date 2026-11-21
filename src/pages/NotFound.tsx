import { ButtonLink, PageTitle } from '../components/ui'

export default function NotFound() {
  return (
    <div className="py-10 text-center">
      <PageTitle title="Page not found" subtitle="The page you were looking for does not exist." />
      <ButtonLink to="/">Go home</ButtonLink>
    </div>
  )
}

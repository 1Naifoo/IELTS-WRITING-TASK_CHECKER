import { Card, ExternalLink, PageTitle } from '../components/ui'
import { AUTHOR, DISCLAIMER, LINKS, REPO_URL } from '../configs/app'

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageTitle title="About this project" subtitle={`Made by ${AUTHOR}`} />

      <Card>
        <h2 className="text-lg font-semibold text-accent-800">The story</h2>
        {/* TODO(1Naifoo): replace this with your own story. */}
        <div className="mt-2 space-y-3 text-slate-700">
          <p>
            Preparing for IELTS Writing is hard when you have no one to check your work. Good feedback from a teacher
            costs money and takes time, and most online checkers only give you a number.
          </p>
          <p>
            This project started as a simple idea: a free tool that reads your answer the way an examiner would, shows
            you exactly where the mistakes are, explains why, and shows you a better way to say it. No accounts, no
            paywall, and nothing stored on a server.
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-accent-800">How it works</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-slate-700">
          <li>You add your own free Gemini API key in Settings.</li>
          <li>You paste the question and your answer (and upload the chart for Task 1).</li>
          <li>For Task 1, you check the chart data Gemini read from the image, and fix anything it got wrong.</li>
          <li>
            Gemini scores the four criteria. The app checks that every quoted mistake really is in your text, and
            calculates the overall band itself.
          </li>
          <li>Your result is saved in this browser, so you can come back to it later.</li>
        </ol>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-accent-800">Privacy</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-700">
          <li>There is no server, no account and no tracking. The app runs on your own computer.</li>
          <li>Your key, essays and results are stored only in this browser.</li>
          <li>Your writing is sent directly to Google's Gemini API, under Google's own terms.</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-accent-800">Important</h2>
        <p className="mt-2 text-slate-700">
          <strong>{DISCLAIMER.title}</strong> {DISCLAIMER.full}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          For the official band descriptors, visit the <ExternalLink href={LINKS.ielts}>official IELTS website</ExternalLink>.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-accent-800">Open source</h2>
        <p className="mt-2 text-slate-700">
          The code is free under the MIT license. Bug reports and ideas are welcome on{' '}
          <ExternalLink href={REPO_URL}>GitHub</ExternalLink>.
        </p>
      </Card>
    </div>
  )
}

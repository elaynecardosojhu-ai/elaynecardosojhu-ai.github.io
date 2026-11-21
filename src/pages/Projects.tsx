import PageLayout from './PageLayout'

export default function Projects() {
  return (
    <PageLayout title="Projects &amp; Research">
      <div className="project-card">
        <h3>AI Persuasion &amp; Scalable Oversight — Experimental Case Study</h3>
        <p>
          A small research pipeline testing whether Claude treats a reported third-party social
          consensus as a sycophancy signal, plus an exploratory study on AI-mediated cross-scholar
          idea synthesis and confidentiality boundaries.
        </p>
        <a href="https://github.com/elaynecardosojhu-ai/scalable-oversight" target="_blank" rel="noreferrer">
          View the repo →
        </a>
      </div>
      <p>More projects coming soon.</p>
    </PageLayout>
  )
}

// The backend commit public/openapi.json was copied from, as `pnpm spec` recorded it.
import source from '../../../public/openapi.source.json'

export function SpecSource() {
  if (!source.commit) return <>a working copy of the backend, at no recorded commit</>
  return (
    <>
      the backend at commit <code>{source.commit.slice(0, 7)}</code>, of {source.committed_at.slice(0, 10)}
    </>
  )
}

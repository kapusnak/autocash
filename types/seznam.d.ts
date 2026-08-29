export {}

declare global {
  interface Window {
    sznIVA?: {
      IS?: {
        updateIdentities: (identities: { eid?: string | null }) => void
      }
    }
    rc?: {
      retargetingHit: (conf: { rtgId: number; consent: 0 | 1 }) => void
    }
  }
}

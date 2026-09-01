/** The five SY0-701 exam objectives, with the weight CompTIA publishes for each. */
export const DOMAINS = [
  { id: '1.0 General Security Concepts', short: 'General Concepts', weight: 12, accent: '#22d3ee' },
  { id: '2.0 Threats, Vulnerabilities & Mitigations', short: 'Threats & Vulns', weight: 22, accent: '#f472b6' },
  { id: '3.0 Security Architecture', short: 'Architecture', weight: 18, accent: '#a78bfa' },
  { id: '4.0 Security Operations', short: 'Operations', weight: 28, accent: '#34d399' },
  { id: '5.0 Security Program Management & Oversight', short: 'Program Mgmt', weight: 20, accent: '#fbbf24' },
] as const

export type DomainId = (typeof DOMAINS)[number]['id']

const BY_ID = new Map(DOMAINS.map((d) => [d.id as string, d]))

export function domainMeta(id: string) {
  return BY_ID.get(id) ?? { id, short: id, weight: 0, accent: '#94a3b8' }
}

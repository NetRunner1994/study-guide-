import type { Question } from './types'

export interface DomainMeta {
  id: string
  short: string
  accent: string
  /** Official CompTIA exam weight, where it is published and known. */
  weight?: number
}

export interface Exam {
  id: string
  /** Exam code, e.g. SY0-701. */
  code: string
  /** Certification family, so related exams group together in the picker. */
  family: string
  /** Distinguishes exams inside a family, e.g. "Core 1". */
  part?: string
  name: string
  tagline: string
  icon: string
  accent: string
  domains: DomainMeta[]
  load: () => Promise<Question[]>
}

/** Objective colours are assigned by position so every exam reads consistently. */
const DOMAIN_ACCENTS = ['#22d3ee', '#f472b6', '#a78bfa', '#34d399', '#fbbf24']

function domains(entries: [string, string, number?][]): DomainMeta[] {
  return entries.map(([id, short, weight], i) => ({
    id,
    short,
    weight,
    accent: DOMAIN_ACCENTS[i % DOMAIN_ACCENTS.length],
  }))
}

export const EXAMS: Exam[] = [
  {
    id: 'sy0-701',
    code: 'SY0-701',
    family: 'CompTIA Security+',
    name: 'Security+',
    tagline: 'Core security concepts, threats, architecture and operations',
    icon: '🛡️',
    accent: '#22d3ee',
    domains: domains([
      ['1.0 General Security Concepts', 'General Concepts', 12],
      ['2.0 Threats, Vulnerabilities & Mitigations', 'Threats & Vulns', 22],
      ['3.0 Security Architecture', 'Architecture', 18],
      ['4.0 Security Operations', 'Operations', 28],
      ['5.0 Security Program Management & Oversight', 'Program Mgmt', 20],
    ]),
    load: () => import('../data/sy0-701.json').then((m) => m.default as unknown as Question[]),
  },
  {
    id: '220-1201',
    code: '220-1201',
    family: 'CompTIA A+',
    part: 'Core 1',
    name: 'A+ Core 1',
    tagline: 'Mobile devices, networking, hardware, virtualization and troubleshooting',
    icon: '🧰',
    accent: '#34d399',
    domains: domains([
      ['1.0 Mobile Devices', 'Mobile Devices'],
      ['2.0 Networking', 'Networking'],
      ['3.0 Hardware', 'Hardware'],
      ['4.0 Virtualization and Cloud Computing', 'Virtualization'],
      ['5.0 Hardware and Network Troubleshooting', 'Troubleshooting'],
    ]),
    load: () => import('../data/220-1201.json').then((m) => m.default as unknown as Question[]),
  },
  {
    id: '220-1202',
    code: '220-1202',
    family: 'CompTIA A+',
    part: 'Core 2',
    name: 'A+ Core 2',
    tagline: 'Operating systems, security, software troubleshooting and procedures',
    icon: '💻',
    accent: '#a78bfa',
    domains: domains([
      ['1.0 Operating Systems', 'Operating Systems'],
      ['2.0 Security', 'Security'],
      ['3.0 Software Troubleshooting', 'Software Troubleshooting'],
      ['4.0 Operational Procedures', 'Operational Procedures'],
    ]),
    load: () => import('../data/220-1202.json').then((m) => m.default as unknown as Question[]),
  },
]

export const DEFAULT_EXAM_ID = EXAMS[0].id

const BY_ID = new Map(EXAMS.map((exam) => [exam.id, exam]))

export function getExam(id: string): Exam {
  return BY_ID.get(id) ?? EXAMS[0]
}

/** Exams grouped by certification family, preserving catalog order. */
export function examFamilies(): { family: string; exams: Exam[] }[] {
  const groups: { family: string; exams: Exam[] }[] = []
  for (const exam of EXAMS) {
    const existing = groups.find((g) => g.family === exam.family)
    if (existing) existing.exams.push(exam)
    else groups.push({ family: exam.family, exams: [exam] })
  }
  return groups
}

export function domainMeta(exam: Exam, domainId: string): DomainMeta {
  return (
    exam.domains.find((d) => d.id === domainId) ?? {
      id: domainId,
      short: domainId,
      accent: '#94a3b8',
    }
  )
}

export type UserRole = "student" | "graduate" | "company" | "admin"

export type OpportunityType = "internship" | "graduation-project" | "job"

export type OpportunityStatus = "pending" | "approved" | "rejected" | "active" | "inactive"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export interface Opportunity {
  id: string
  title: string
  description: string
  company: string
  companyId: string
  location: string
  type: OpportunityType
  status: OpportunityStatus
  requirements?: string[]
  salary?: string
  postedAt: string
  expiresAt?: string
}

export interface Company {
  id: string
  name: string
  email: string
  description?: string
  website?: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

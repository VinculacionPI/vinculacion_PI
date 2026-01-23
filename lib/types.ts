export type UserRole = "student" | "graduate" | "company" | "admin"

export type OpportunityType = "internship" | "graduation-project" | "job"

export type OpportunityStatus = "pending" | "approved" | "rejected" | "active" | "inactive"

export interface User {
  id: string
  email: string
  role: UserRole
  status: string  
  created_at: string  
  name: string
  cedula: string  // Nuevo campo
  phone: string  // Nuevo campo
  personalEmail?: string | null  // Nuevo campo
  carnet?: string  // Nuevo campo
  semester?: string  // Nuevo campo
  address?: string  // Nuevo campo
  // Otros campos opcionales
  password?: string
  confirmPassw?: string
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

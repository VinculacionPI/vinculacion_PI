import { NextResponse } from "next/server"

export async function GET() {
  try {
    // TODO: Replace with actual database queries
    // Fetch real statistics from the database

    const stats = {
      totalCompanies: 24,
      pendingCompanies: 5,
      totalOpportunities: 42,
      pendingOpportunities: 8,
      totalUsers: 156,
      activeOpportunities: 34,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Error fetching admin stats:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

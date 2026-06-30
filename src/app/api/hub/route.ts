import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categories = searchParams.get("category");
  
  try {
    // For now, we'll return mock data since this would require authentication
    // In a real implementation, you would need to authenticate and fetch from database
    const mockDocuments = [
      { id: "1", title: "Document paie 2025", description: "Fiche de paie janvier 2025", url: "https://example.com/payroll.pdf", category: "paie", sortOrder: 1 },
      { id: "2", title: "Mutuelle santé", description: "Liste des mutuelles disponibles", url: null, category: "mutuelle", sortOrder: 2 },
      { id: "3", title: "Planning des congés", description: "Calendrier des congés 2025", url: "https://example.com/planning.pdf", category: "planning", sortOrder: 3 },
      { id: "4", title: "Document RH", description: "Guide pour les nouvelles embauches", url: null, category: "document", sortOrder: 4 },
    ];
    
    // Filter by category if specified
    const filteredDocuments = categories 
      ? mockDocuments.filter(doc => categories.split(",").includes(doc.category))
      : mockDocuments;
    
    // Return data without the wrapper for now to maintain compatibility
    return NextResponse.json(filteredDocuments);
  } catch (error) {
    console.error("Erreur lors de la récupération des documents:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des documents" }, { status: 500 });
  }
}

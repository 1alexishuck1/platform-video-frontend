import { Navbar } from "@/components/layout/Navbar";
import { TalentCard } from "@/components/talents/TalentCard";
import { CATEGORIES } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { TalentProfile } from "@/types";

async function getTalents(): Promise<TalentProfile[]> {
  try {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/talents", { 
      next: { revalidate: 60 } 
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.talents || [];
  } catch (err) {
    return [];
  }
}

export default async function TalentsPage() {
  const talents = await getTalents();
  return (
    <div className="min-h-screen animated-bg pb-20">
      <Navbar />
      
      <main className="pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Descubrí talentos</h1>
            <p className="text-muted-foreground mt-2">Encontrá a la persona perfecta para tu próxima videollamada.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre..." 
              className="pl-10 input-dark h-12 md:h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Categories (Mock filters) */}
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors border ${
                i === 0 
                  ? "bg-violet-500/20 border-violet-500/30 text-violet-300" 
                  : "glass border-white/5 hover:border-white/20 text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {talents.map((talent) => (
            <TalentCard key={talent.id} talent={talent} />
          ))}
        </div>
      </main>
    </div>
  );
}

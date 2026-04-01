import { Navbar } from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64 rounded-xl" />
            <Skeleton className="h-4 w-80 rounded-full" />
          </div>
          <Skeleton className="h-12 w-80 rounded-xl" />
        </div>

        <div className="flex gap-2 mb-12 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
          ))}
        </div>

        <div className="space-y-16 mt-12">
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="w-2 h-8 rounded-full" />
              <Skeleton className="h-8 w-40 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-80 w-full rounded-[2.5rem]" />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-8 text-neutral-400">
               <Skeleton className="w-2 h-8 rounded-full opacity-50" />
               <Skeleton className="h-8 w-56 rounded-lg opacity-50" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-80 w-full rounded-[2.5rem] opacity-50" />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

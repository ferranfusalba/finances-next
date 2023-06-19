import WelcomeHeader from "@/components/WelcomeHeader/WelcomeHeader";
import WelcomeHeaderSkeleton from "@/components/WelcomeHeader/WelcomeHeaderSkeleton";
import TaskCard from "@/components/TaskCard";
import { Suspense } from "react";

export default async function Page() {
  return (
    <div className="h-full overflow-y-auto pr-6 w-full">
      <div className=" h-full items-stretch justify-center min-h-[content]">
        <div className="flex-1 grow flex">
          <Suspense fallback={<WelcomeHeaderSkeleton />}>
            <WelcomeHeader />
          </Suspense>
        </div>
        <div className="mt-6 flex-2 grow w-full flex">
          <div className="w-full">
            <TaskCard />
          </div>
        </div>
      </div>
    </div>
  );
}

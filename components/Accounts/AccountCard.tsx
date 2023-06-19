import { FC } from "react";
import { Prisma } from "@prisma/client";
import Card from "@/components/Card";
import clsx from "clsx";

const projectWithTasks = Prisma.validator<Prisma.ProjectArgs>()({
  include: { tasks: true },
});

type ProjectWithTasks = Prisma.ProjectGetPayload<typeof projectWithTasks>;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-us", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const AccountCard: FC<{ project: ProjectWithTasks }> = ({ project }) => {
  const completedCount = project.tasks.filter(
    (t) => t.status === "COMPLETED"
  ).length;
  const progress = Math.ceil((completedCount / project.tasks.length) * 100);

  // TODO: Finish applying status (complete / ...), progress, etc.
  return (
    <div className="account-button">
      {/* <div>
        <span className="text-sm text-gray-300">
          {formatDate(project.createdAt)}
        </span>
      </div> */}
      <span>{project.name}</span>
      {/* <div className="mb-2">
        <span className="text-gray-400">
          {completedCount}/{project.tasks.length} completed
        </span>
      </div> */}
      {/* <div>
        <div className="w-full h-2 bg-blue-200 rounded-full mb-2">
          <div
            className={clsx(
              "h-full text-center text-xs text-white bg-blue-600 rounded-full"
            )}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-600 font-semibold">
            {progress}%
          </span>
        </div>
      </div> */}
    </div>
  );
};

export default AccountCard;

import Layout02b from "@/components/layouts/Layout02b";
import { PlaygroundToastButtons } from "./PlaygroundToastButtons";

const PlaygroundServerPage = async () => {
  return (
    <Layout02b>
      {/* Toast Notifications */}
      <div className="m-2 flex flex-wrap gap-2">
        <PlaygroundToastButtons />
      </div>
    </Layout02b>
  );
};

export default PlaygroundServerPage;

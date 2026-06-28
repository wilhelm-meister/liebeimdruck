import TopNav from "@/components/TopNav";
import Configurator from "@/components/Configurator";

export default function Home() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopNav />
      <Configurator />
    </div>
  );
}

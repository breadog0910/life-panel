import AddToHomeCard from "@/components/add-to-home-card";
import BackToSettings from "@/components/back-to-settings";

export default function HomeScreenSettingsPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <BackToSettings />
      <AddToHomeCard />
    </div>
  );
}

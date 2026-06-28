import GreetingBar from "@/components/greeting-bar";
import MorningBriefing from "@/components/morning-briefing";
import ScheduleCard from "@/components/schedule-card";
import AddToHomeCard from "@/components/add-to-home-card";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <GreetingBar />
      <MorningBriefing />
      <ScheduleCard />
      <AddToHomeCard />
    </div>
  );
}

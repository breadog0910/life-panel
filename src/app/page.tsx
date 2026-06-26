import GreetingBar from "@/components/greeting-bar";
import PomodoroCard from "@/components/pomodoro-card";
import QuickReflection from "@/components/quick-reflection";
import ScheduleCard from "@/components/schedule-card";
import DesktopReflections from "@/components/desktop-reflections";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <GreetingBar />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PomodoroCard />
        <QuickReflection />
        <ScheduleCard />
        <DesktopReflections />
      </div>
    </div>
  );
}

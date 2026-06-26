import CompanionShell from "./companion-shell";

export const metadata = {
  title: "悬浮伙伴",
};

export default function CompanionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Detect Electron BEFORE hydration to avoid white flash */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try { if (window.electronAPI) { document.documentElement.classList.add('electron-mode'); } } catch(e) {}`,
        }}
      />
      <CompanionShell>{children}</CompanionShell>
    </>
  );
}

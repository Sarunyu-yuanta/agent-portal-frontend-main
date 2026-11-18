import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
/**
 * Shared chrome for the login / forgot-password / reset-password screens: the
 * full-bleed background with one centred white card on top.
 *
 * Login used to widen this into a split layout with an illustration panel on
 * the left; that panel is gone, so all three screens now share the single
 * card width.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main
        className="flex-1 flex items-center justify-center bg-cover bg-center px-4 py-10"
        style={{ backgroundImage: "url(/auth/login-bg.webp)" }}
      >
        <div className="flex w-full max-w-[495px] bg-white rounded-3xl p-2 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="relative flex-1 flex flex-col justify-center gap-[18px] px-6 sm:px-12 lg:px-20 py-12">
            {/* Before sign-in is the first place a non-Thai reader needs it. */}
            <LanguageSwitcher className="absolute right-4 top-4" />
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

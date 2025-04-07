import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LanguageSwitcher } from "./language-switcher"

export function SiteHeader() {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      <div className="flex items-center">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-base font-medium">Garage Dashboard</h1>
      </div>

      <div className="flex-1"></div>

      <div className="flex items-center space-x-4">
        <LanguageSwitcher />
      </div>
    </header>
  )
}


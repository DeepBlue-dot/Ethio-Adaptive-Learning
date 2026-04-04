import { SignOutButton } from "@/components/shared/sign-out-button"

type UserMenuProps = {
  username: string
  role: string
}

export function UserMenu({ username, role }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-foreground">{username}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-teal-700">{role}</p>
      </div>
      <SignOutButton />
    </div>
  )
}

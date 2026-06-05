---
applyTo: "apps/web/**"
---

# shadcn Sidebar + mobile-first shell

## Add the component

```bash
pnpm dlx shadcn@latest add sidebar --overwrite
```

Add `tooltip` if prompted. Wrap the app root with `TooltipProvider` (sidebar menu buttons can show tooltips in icon mode).

## Layout structure

- **`SidebarProvider`** at the outer shell (often wraps both sidebar and main).
- **`Sidebar`** with `collapsible="icon"` and `variant="inset"` for a collapsible rail and inset main area.
- **`SidebarHeader` / `SidebarContent` / `SidebarFooter`** for branding, nav, actions (e.g. Sign out).
- **`SidebarInset`** wraps **page chrome + scrollable content** — use **`SidebarTrigger`** in a **sticky** top bar so the menu stays reachable on mobile (sheet overlay) and desktop (rail).

## Public marketing vs app shell

If `/` is a **public landing**, put the authenticated app under routes like `/dashboard` so the shadcn Sidebar layout only wraps signed-in routes.

## Navigation

- Use **`SidebarMenu` → `SidebarMenuItem` → `SidebarMenuButton`** with **`asChild`** + **router `Link`** (`react-router` / Next `Link`).
- Set **`isActive`** from the current pathname (including nested routes where needed).
- Add **`tooltip="Label"`** on `SidebarMenuButton` so icon-only mode stays understandable.

## Mobile-first UX

- Touch targets: **`min-h-11`** on primary nav actions and form controls on small screens; tighten on **`sm:`** if desired.
- Content: **`px-4 py-*` → `sm:px-6`**, readable line length with **`max-w-* mx-auto`** inside the inset body when needed (not on the whole shell).
- Avoid horizontal overflow: **`min-w-0`**, **`truncate`** on titles in the top bar.

## Theming

Ensure `index.css` / Tailwind theme defines **`--sidebar-*`** tokens (shadcn's sidebar preset does). Dark mode follows your existing `class="dark"` / theme setup.

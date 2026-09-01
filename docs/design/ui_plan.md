# UI Design Plan: TradeInDRC

## Design Philosophy
**"Structured Authority"**
The UI will prioritize structure and readability, utilizing the "sharp corners" constraint to create a look that feels architecturally solid and dependable—traits desired in a government trade interface.

## Visual Hierarchy & Layout

### 1. Global Navigation (Navbar)
- **Style**: Sticky, backdrop-blur white (`bg-background/95`).
- **Elements**: 
  - Left: Official Coat of Arms / TradeInDRC Logo (Sharp SVG).
  - Center: Main links (Home, Search, Verified Companies).
  - Right: Language Switcher (Dropdown), User Profile/Sign In (Square buttons).
- **Border**: Thin bottom border `#E2E8F0`.

### 2. Search Experience (The Core)
- **Hero Search**: 
  - Large, centralized input field with 0px radius.
  - prominent "Search" button in Primary Blue.
  - Quick filters below search: "Agriculture", "Mining", "Services".
- **Result Cards**:
  - **Layout**: Grid (Desktop) / List (Mobile).
  - **Card Style**: White background, 1px border, 0px radius. Hover effect: slight lift + shadow.
  - **Trust Signs**: "Verified" badge (Yellow) prominent on top-right of card.

### 3. Company Profile Page
- **Header**: Banner image with overlay logo (Square).
- **Tabs**: "Overview", "Products", "Certifications", "Contact".
- **Data Display**: Definition lists with clear labels. Use icons from `lucide-react` for readability.
- **Trust Indicators**: Verified Badge, "Member since [Year]", "Export Ready" tag.

### 4. Admin Dashboard
- **Sidebar**: Dark mode (`bg-slate-900` text-white) to distinguish from public portal.
- **Data Tables**: High density, sortable headers, row actions (Approve/Reject).
- **Status Chips**: 
  - Pending: Grey background.
  - Approved: Green/Blue background.
  - Rejected: Red background.

## Component Styling (Shadcn Customization)

### Buttons
- **Primary**: Solid Blue (`bg-primary`), White text, 0px radius, uppercase label (optional for authority).
- **Secondary**: Outline (`border-input`), Black text, 0px radius.
- **Danger**: Solid Red (`bg-destructive`), White text.

### Inputs & Forms
- **Fields**: Square, 1px border. Focus state: 2px Blue ring (sharp).
- **Validation**: Inline error messages in Red.

### Feedback (Toasts/Alerts)
- **Toasts**: Square, white background, colored border strip indicating type (Success=Green, Error=Red).

## Responsive Strategy
- **Mobile First**: All grids collapse to Single Column.
- **Touch Targets**: Min 44px for all interactive elements.
- **Navigation**: Hamburger menu on mobile (Sheet component).

---
*Created: 2026-01-15*

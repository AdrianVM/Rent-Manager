# View Property Page - Product Specification

**Project:** Rent-Manager Property Management
**Date:** November 6, 2025
**Version:** 1.0

---

## Overview

This document describes the new **Property View Page** - a dedicated page that displays comprehensive property information and related functions (contracts, tenant info, maintenance, payments).

### Purpose

Create a centralized location for property owners and admins to:
- View all property details at once
- Manage contracts and documents
- See tenant and lease information
- Access maintenance requests (Phase 2)
- View payment history (Phase 2)

---

## Page Structure

### Route & Navigation

**URL:** `/properties/:id/view`

**Navigation:**
- Click "View Property" button in Properties grid → Navigate to this page
- Browser back button or "Back to Properties" link → Return to grid
- Edit button on page → Open PropertyForm modal

---

## Layout Sections

### 1. Header Section

```
[← Back to Properties]                     [Edit Property] [Delete Property]
```

**Features:**
- Back button for easy navigation
- Edit button (opens modal)
- Delete button with confirmation

---

### 2. Property Overview Card

**Contents:**
- Large property icon (🏢 🏠 🏘️ 🏪 🅿️ based on type)
- Property name (large gradient heading)
- Full address with location icon 📍
- Property type badge

**Purpose:** Immediate visual identification of the property

---

### 3. Property Details Grid

**Dynamic content based on property type:**

**All Properties:**
- 💰 Monthly Rent (formatted currency)

**Residential (apartment, house, condo):**
- 🛏️ Bedrooms
- 🚿 Bathrooms

**Commercial:**
- 📏 Square Footage

**Parking Spaces:**
- 🚗 Parking Type (outdoor, covered, garage, underground)
- 🔢 Space Number

**Layout:** Responsive grid that adapts to 1-2 columns based on screen size

---

### 4. Description Section

**Conditional:** Only displays if property has a description

**Contents:**
- Section heading
- Full property description text

---

### 5. Lease & Tenant Information

**Conditional:** Only displays if property has a current tenant

**Contents:**
- Tenant name (handles both person and company types)
- Lease start date
- Lease end date
- Tenant status badge (Active/Inactive)
- Link to tenant details page (future)

**Layout:** Grid showing key lease information

---

### 6. Location Map Section

**Purpose:** Display property location on an interactive map

**Contents:**
- Interactive OpenStreetMap using Leaflet/react-leaflet
- Property marker at location
- Address overlay with location icon
- Map popup showing property name and address
- Zoom controls and scroll support

**Features:**
- 400px height on desktop, 300px on mobile
- Glassmorphism address overlay at bottom
- Responsive design
- Dark mode support
- Click on marker to see property details popup

**Implementation Note:**
- ✅ Uses Nominatim API (OpenStreetMap's free geocoding service)
- Automatically converts property addresses to real coordinates
- Shows loading state while geocoding
- Shows error message if address cannot be geocoded
- Same implementation as PropertyDetails (tenant view)

**User Experience:**
- Users can see property location visually
- Helps understand neighborhood context
- Useful for property owners managing multiple locations
- No scroll zoom to prevent accidental map interaction

---

### 7. Contracts Section

**Primary Feature:** This is the main function moved from the Properties grid

**Header:**
- "Contracts" title with count badge
- [Upload New Contract] button (prominent, primary style)

**Contract List Items:**
Each contract displays:
- 📄 File name (truncated on mobile with tooltip)
- Tenant name (if applicable)
- Status badge (Draft/Pending/Signed) with color coding
- Upload date
- Notes (if provided)
- Action buttons:
  - 👁️ View (opens contract viewer modal)
  - ⬇️ Download
  - 🗑️ Delete (with confirmation)

**Empty State:**
When no contracts exist:
- Empty icon 📄
- Message: "No contracts uploaded for this property"
- [Upload Your First Contract] button

---

### 8. Maintenance Requests Section (Phase 2)

**Planned Features:**
- List of recent maintenance requests
- Status breakdown (Pending/In Progress/Completed)
- Quick stats: Total requests, Pending count
- [View All Maintenance] link to filtered maintenance page

---

### 9. Payment History Section (Phase 2)

**Planned Features:**
- Recent payment transactions
- Monthly revenue chart
- Payment status breakdown
- [View Full History] link

---

## Component Architecture

### File Structure

```
frontend/src/pages/PropertyView/
├── index.js                          # Export PropertyView
├── PropertyView.jsx                  # Main component (400-500 lines)
├── PropertyView.css                  # Styles
└── components/
    ├── PropertyOverviewCard.jsx      # Overview section
    ├── PropertyDetailsGrid.jsx       # Details grid
    ├── PropertyLeaseInfo.jsx         # Tenant/lease info
    ├── PropertyLocationMap.jsx       # Interactive map
    └── PropertyContracts.jsx         # Contracts management
```

### Main Component: PropertyView.jsx

**Key Features:**
- Uses React Router's `useParams` to get property ID
- Loads data in parallel using `Promise.all`:
  - Property details
  - Contracts list
  - Tenant information
- Loading states per section
- Error handling with user-friendly messages
- Refresh functionality after contract upload/delete

**State Management:**
```javascript
const [property, setProperty] = useState(null);
const [contracts, setContracts] = useState([]);
const [tenant, setTenant] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

**API Calls:**
- `apiService.getProperty(id)` - Fetch property details
- `apiService.getContractsByProperty(id)` - Fetch contracts
- `apiService.getTenants()` - Fetch all tenants, filter for this property
- `apiService.deleteProperty(id)` - Delete property
- `apiService.deleteContract(id)` - Delete contract
- `apiService.downloadContract(id)` - Download contract file

---

## Sub-Components

### PropertyOverviewCard

**Purpose:** Display property name, address, and type prominently

**Features:**
- Dynamic icon based on property type
- Gradient heading following design system
- Type badge with proper formatting
- Responsive layout (horizontal on desktop, vertical on mobile)

---

### PropertyDetailsGrid

**Purpose:** Display key property metrics in an organized grid

**Features:**
- Conditional rendering based on property type
- Currency formatting for rent
- Icon-based cards for visual appeal
- Responsive grid (2 columns on desktop, 1 on mobile)

---

### PropertyLeaseInfo

**Purpose:** Show current tenant and lease information

**Features:**
- Handles both person and company tenant types
- Date formatting (e.g., "January 1, 2025")
- Status badges with color coding
- Grid layout for key information

---

### PropertyLocationMap

**Purpose:** Display property location on an interactive map

**Features:**
- Uses react-leaflet and OpenStreetMap tiles
- Interactive map with zoom controls
- Property marker with popup
- Glassmorphism address overlay
- Responsive height (400px desktop, 300px mobile)
- Dark mode support
- Scroll wheel zoom disabled for better UX
- Custom marker icon from Leaflet

**Implementation:**
- Leverages existing Leaflet dependencies
- ✅ Real geocoding using Nominatim API
- Fetches coordinates automatically when component mounts
- Loading and error states for better UX
- Styled with backdrop-filter for modern overlay effect
- z-index management for proper layering

---

### PropertyContracts

**Purpose:** Main contracts management interface

**Features:**
- Upload new contract button
- Contract list with full details
- Status badges (Draft, Pending, Signed)
- View/Download/Delete actions per contract
- Empty state for properties with no contracts
- Modal integration for upload and viewing
- Refresh callback after modifications

---

## Responsive Design

### Desktop (>768px)

- Two-column layout for details grid
- Side-by-side action buttons
- Full contract list visible
- Horizontal overview card layout

### Mobile (<768px)

- Single-column stacked layout
- Full-width buttons
- Vertical overview card layout
- Truncated file names with ellipsis + tooltip
- Sticky header with back button
- Touch-friendly spacing (44px minimum tap targets)

---

## User Flows

### Flow 1: View Property Details

```
1. User clicks "View Property" from grid
2. System navigates to /properties/:id/view
3. Page loads with loading spinner
4. Data loads in parallel (property, contracts, tenant)
5. All sections display:
   - Overview card
   - Details grid
   - Description (if exists)
   - Lease info (if tenant exists)
   - Contracts section
6. User can:
   - Edit property (modal)
   - Delete property (confirmation)
   - Upload/manage contracts
   - Navigate back to grid
```

### Flow 2: Upload Contract

```
1. User on Property View page
2. Scrolls to Contracts section
3. Clicks "Upload New Contract" button
4. Contract upload modal opens
5. User selects file and fills details
6. Submits upload
7. Modal closes
8. Contracts list refreshes automatically
9. New contract appears in list
```

### Flow 3: Manage Existing Contracts

```
1. User scrolls to Contracts section
2. Sees list of existing contracts
3. Can perform actions:
   - View: Opens contract in viewer modal
   - Download: Downloads file to device
   - Delete: Shows confirmation, removes contract
4. List updates automatically after each action
```

### Flow 4: Edit Property

```
1. User clicks "Edit Property" in header
2. PropertyForm modal opens (existing component)
3. User makes changes
4. Saves changes
5. Modal closes
6. Property View page refreshes with new data
```

---

## Visual Design

### Color Scheme

Follows existing Rent-Manager design system:
- Gradient headings: Royal Blue → Teal
- Primary buttons: Royal Blue
- Secondary buttons: Gray
- Danger buttons: Red
- Status badges:
  - Draft: Yellow/Amber
  - Pending: Blue
  - Signed: Green
  - Active: Green
  - Inactive: Gray

### Typography

- Property name: 36px (desktop), 28px (mobile)
- Section titles: 24px
- Card labels: 12px uppercase
- Card values: 20px bold
- Body text: 16px

### Spacing

- Page padding: `var(--space-lg)`
- Section margins: `var(--space-lg)` between sections
- Card padding: `var(--space-xl)`
- Grid gaps: `var(--space-md)`

### Dark Mode Support

All components support dark mode via `[data-theme="dark"]` CSS selectors:
- Adjusted gradients for better visibility
- Appropriate contrast ratios
- Border and background color adjustments

---

## Benefits of the View Page

### 1. Context Preservation

Users see all property information while performing actions:
- Property details visible while managing contracts
- Tenant info visible for reference
- No modal-within-modal complexity

### 2. Scalability

Easy to add new sections:
- Maintenance requests section (Phase 2)
- Payment history section (Phase 2)
- Document management (future)
- Activity timeline (future)
- Photo gallery (future)

### 3. Mobile Optimization

- Natural scrolling experience
- Larger touch targets
- Better information hierarchy
- No cramped button layouts

### 4. Professional UX

Follows industry-standard patterns:
- List → Detail page navigation
- Comprehensive detail views
- Contextual actions within sections
- Clear information architecture

---

## Performance Considerations

### Optimization Strategies

1. **Parallel API Calls:** Use `Promise.all` to load data simultaneously
2. **Loading States:** Show per-section loading instead of blocking entire page
3. **Lazy Loading:** Future sections can be loaded on demand
4. **Caching:** Property data can be cached from grid navigation
5. **Pagination:** Contracts list paginated if > 20 contracts (edge case)

### Monitoring

Track the following metrics:
- Page load time (target: <2 seconds)
- Time to interactive (target: <3 seconds)
- API response times
- User session duration on page
- Navigation patterns (View → Edit vs direct Edit)

---

## Testing Checklist

### Functional Tests

- [ ] Page loads correctly with valid property ID
- [ ] All sections render with proper data
- [ ] Back button navigates to properties grid
- [ ] Edit button opens PropertyForm modal
- [ ] Delete button shows confirmation and works
- [ ] Upload contract button opens modal
- [ ] View contract opens viewer
- [ ] Download contract downloads file
- [ ] Delete contract removes from list with confirmation
- [ ] Invalid property ID shows error state
- [ ] API failures show appropriate error messages

### Property Type Tests

- [ ] Residential property shows bedrooms/bathrooms
- [ ] Commercial property shows square footage
- [ ] Parking space shows parking type and space number
- [ ] Properties without description hide description section
- [ ] Properties without tenant hide lease section

### Responsive Tests

- [ ] Desktop layout displays correctly
- [ ] Mobile layout stacks properly
- [ ] Buttons are full-width on mobile
- [ ] Contract file names truncate on mobile
- [ ] Touch targets meet 44px minimum
- [ ] Sticky header works on mobile

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Phase 2 Enhancements

### Maintenance Requests Integration

**Timeline:** 2 weeks after Phase 1

**Features:**
- Display recent maintenance requests for property
- Status indicators (Pending, In Progress, Completed)
- Quick stats dashboard
- Link to full maintenance page filtered by property

### Payment History Integration

**Timeline:** 4 weeks after Phase 1

**Features:**
- Recent payment transactions
- Monthly revenue chart (bar or line graph)
- Payment status breakdown
- Year-to-date revenue summary
- Link to full payment history

### Document Management

**Timeline:** Phase 3 (TBD)

**Features:**
- General documents section (separate from contracts)
- Drag-and-drop file upload
- File categorization (tax documents, photos, inspection reports)
- Version history for documents

### Property Photos

**Timeline:** Phase 3 (TBD)

**Features:**
- Photo gallery
- Primary photo display in overview card
- Drag-and-drop photo upload
- Photo captions and metadata

---

## Success Metrics

### Adoption Metrics (4 weeks post-launch)

- 70% of property detail views use View page (not Edit)
- <5% increase in contract task completion time
- 80%+ positive user feedback
- 20% increase in mobile engagement

### Performance Metrics

- Page load time: <2 seconds (p95)
- Time to interactive: <3 seconds (p95)
- API response time: <500ms (p95)

### User Satisfaction

- Post-deployment survey: 80%+ rating "helpful" or "very helpful"
- Support ticket reduction: <5% increase (ideally decrease)
- NPS score improvement after deployment

---

## Future Considerations

### Features Currently Out of Scope

**v1.0 Exclusions:**
1. Inline property editing (remains modal)
2. Property photo uploads
3. Financial analytics dashboard
4. General document management
5. Activity timeline
6. Map integration
7. Custom property fields
8. Bulk operations
9. Property comparison tool

### API Considerations for Future Features

**Potential new endpoints:**
- `GET /api/properties/:id/maintenance` - Maintenance requests
- `GET /api/properties/:id/payments` - Payment history
- `GET /api/properties/:id/documents` - General documents
- `POST /api/properties/:id/photos` - Photo uploads
- `GET /api/properties/:id/activity` - Activity timeline

---

## Questions & Answers

**Q: Why a separate page instead of expanding the modal?**
**A:** Modals are best for focused tasks. A dedicated page provides:
- More space for content
- Better mobile experience
- Room for multiple sections
- Clearer information hierarchy

**Q: Will this slow down common tasks?**
**A:** Quick edits remain one click (Edit button on grid). Contract management adds one click but provides better context and enables future features.

**Q: Can users bookmark the View page?**
**A:** Yes, the URL `/properties/:id/view` is bookmarkable and shareable.

**Q: What happens if a property is deleted while viewing?**
**A:** The delete action redirects to the properties grid. If a user tries to access a deleted property's URL directly, they'll see an error state with a back button.

---

## Related Documents

- **Property-Grid-Restructure.md** - Changes to the Properties grid
- **PRD-Property-View-Page-Restructure.md** - Complete original PRD
- **Property-View-Implementation-Guide.md** - Developer implementation guide

---

**Document Location:** `/home/adrian/IT Projects/Rent-Manager/product/View-Property-Page.md`
**Status:** Approved for Development
**Next Steps:** Begin Phase 1 implementation

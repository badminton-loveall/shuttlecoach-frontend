# Coach Profile Integration Guide

## Overview
The new Coach Profile system provides a comprehensive tabbed interface for managing coach information, assigned students, and payment records.

## New Components Created

### 1. **CoachProfile.tsx** (Main Component)
- Displays coach header with avatar, stats (batches, students, specialization)
- Tab navigation (Profile, Students, Payments)
- Manages active tab state
- Props:
  - `coach: User | null` - Selected coach data
  - `students: Student[]` - All students
  - `batches: Batch[]` - All batches
  - `fees: FeeRecord[]` - All fee records
  - `onUpdateCoach: (coachData: Partial<User>) => Promise<void>` - Update handler

### 2. **CoachProfileTab.tsx** (Profile Tab)
- Displays coach information in read-only mode
- Edit button to toggle edit mode
- Form with validation for:
  - Name (required)
  - Username (required, min 3 chars)
  - Email (optional, validated)
  - Specialization (optional)
  - Profile Photo URL (optional)
- Shows last active timestamp and role badge

### 3. **CoachStudentsTab.tsx** (Students Tab)
- Displays all students assigned to the coach
- Groups students by skill level (Beginner, Intermediate, Advanced, Professional)
- Shows student cards with:
  - Avatar
  - Name, Email
  - Batch assignment
  - Age
  - Contact phone
- Grid layout responsive to screen size

### 4. **CoachPaymentsTab.tsx** (Payments Tab)
- Displays payment statistics:
  - Total amount
  - Paid amount
  - Pending amount
  - Overdue amount
- Payment table showing:
  - Student name
  - Month/Year
  - Amount
  - Due date
  - Status (with color-coded badges)
  - Paid date
- Filters fees to only show students assigned to this coach

## Integration Steps

### Step 1: Update CoachesPage.tsx

```typescript
import CoachProfile from '../components/CoachProfile';

// In CoachesPage component, add:

// After Coach List Table, add Coach Profile section:
{!loading && !error && selectedCoach && (
  <div className="mb-6">
    <CoachProfile
      coach={selectedCoach}
      students={students}
      batches={batches}
      fees={fees}
      onUpdateCoach={handleUpdateCoach}
    />
  </div>
)}

// Add handler for updating coach:
const handleUpdateCoach = async (coachData: Partial<User>) => {
  try {
    // Update coach in coaches array
    const updatedCoaches = coaches.map((c) =>
      c.id === selectedCoach?.id
        ? { ...c, ...coachData, updatedAt: new Date() }
        : c
    );

    setCoaches(updatedCoaches);
    
    // Save to localStorage
    localStorage.setItem('coaches', JSON.stringify(updatedCoaches));
    
    // Update selectedCoach if it was modified
    if (selectedCoach) {
      setSelectedCoach({ ...selectedCoach, ...coachData });
    }
  } catch (err) {
    console.error('Error updating coach:', err);
    throw new Error('Failed to update coach. Please try again.');
  }
};

// Also need to load fees data:
import feesData from '../data/fees.json';

// In useEffect, add:
const [fees, setFees] = useState<FeeRecord[]>([]);

// Load fees:
const feesResponse = await fetch('/src/data/fees.json');
const feesData = (await feesResponse.json()) as FeeRecord[];
const parsedFees = feesData.map((fee) => ({
  ...fee,
  dueDate: new Date(fee.dueDate),
  paidDate: fee.paidDate ? new Date(fee.paidDate) : undefined,
  createdAt: new Date(fee.createdAt),
  updatedAt: new Date(fee.updatedAt),
}));
setFees(parsedFees);
```

### Step 2: Import FeeRecord Type

```typescript
import type { User, Student, Batch, FeeRecord } from '../types';
```

## Features

### Profile Tab
✅ Display coach information in clean card layout  
✅ Edit button to toggle edit mode  
✅ Form validation with error messages  
✅ Save changes to coach profile  
✅ Show role and last active time  

### Students Tab
✅ List all students assigned to this coach  
✅ Group students by skill level  
✅ Display student details (age, contact, batch)  
✅ Student avatars with fallback  
✅ Responsive grid layout  

### Payments Tab
✅ Show payment statistics at a glance  
✅ Color-coded stat cards (success, warning, danger)  
✅ Complete payment table  
✅ Filter fees to assigned students only  
✅ Status badges with appropriate colors  
✅ Fully responsive table  

## Styling

All components use CSS variables from the design system:
- Colors from design-system.css
- Typography using font size variables
- Spacing using space variables
- Responsive breakpoints at 768px and 1024px
- Full dark mode support

## User Experience

1. **Coach Selection**: Click on a coach in the table to view their profile
2. **Tab Navigation**: Click tabs to switch between Profile, Students, and Payments
3. **Edit Profile**: Click "Edit Profile" button to modify coach information
4. **View Students**: See all assigned students grouped by skill level
5. **Payment Tracking**: Monitor student payments assigned to this coach

## Accessibility

✅ Semantic HTML structure  
✅ Proper form labels with associated inputs  
✅ Tab navigation with keyboard support  
✅ Color-coded information supplemented with text labels  
✅ Proper heading hierarchy  
✅ Dark mode support for reduced eye strain  

## Performance Considerations

- Components use `useMemo` to memoize expensive calculations
- Students grouped by skill level once on tab switch
- Fees filtered once on render
- Responsive images with proper aspect ratios
- Lazy loading of tabs (content only renders when tab is active)

## Future Enhancements

- Add sorting/filtering to students list
- Export payment records to PDF
- Monthly revenue reports
- Student performance trends by coach
- Assign/unassign students directly from tab
- Payment reminders

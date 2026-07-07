# Fee Management Enhancement Plan

## ✅ COMPLETED: Phase 1 - Additional Filters

### What was added:
1. **Month/Year Filter** (Dropdown)
   - Shows all unique months from fees data
   - Sorted by newest first (descending)
   - Format: YYYY-MM

2. **Batch Filter** (Dropdown)
   - Shows all batches from students
   - Sorted alphabetically
   - Format: "Batch 001", "Batch 002", etc.

3. **Enhanced Filter Logic**
   - Combines Month + Batch + Status + Search filters with AND logic
   - Real-time filtering as user changes any filter
   - Shows results count: "X of Y fees"

### Filter Panel Layout (Desktop):
```
[Search Bar] | [Month ▼] [Batch ▼] | [Paid] [Pending] [Overdue] [Waived] | X of Y
```

---

## 📋 PROPOSED: Phase 2 - Fee Management Features

### 1. **Create New Fee**
**Location**: Action button in page header (next to title)

**Form Fields**:
- Student selector (searchable dropdown)
- Amount (₹ 0.01 - 999,999.99)
- Month/Year (YYYY-MM)
- Due Date (day 1-31, auto-adjusted for month)
- Notes (optional, max 500 chars)

**Validation**:
- Check if fee already exists for student + month/year
- Prevent duplicate fees

**After Create**: Add to table immediately, show success toast

---

### 2. **Edit Existing Fee**
**Location**: "Edit" action button in Actions column

**Conditions**:
- Only show for PENDING and OVERDUE fees
- Hide for PAID and WAIVED fees

**Editable Fields**:
- Amount
- Due Date
- Notes

**Read-Only Fields**:
- Student Name
- Month/Year

**Change Tracking**: Show which fields changed before save

---

### 3. **Delete Fee**
**Location**: "Delete" action button in Actions column

**Conditions**:
- Only show for PENDING status
- Hide for PAID, OVERDUE, WAIVED

**Confirmation Dialog**:
- "Are you sure you want to delete this fee?"
- Show student name, amount, month

**After Delete**: Remove from table, show success toast

---

### 4. **Bulk Fee Creation (Batch)**
**Location**: "Create Batch Fees" button in header

**Workflow**:
1. Select Batch (dropdown)
2. Select Month/Year (input)
3. Enter Amount (all students in batch get same amount)
4. Enter Due Date
5. Preview: "Will create X fees"
6. Confirm to create

**Smart Features**:
- Skip students who already have fee for that month
- Show "Already exists: 2 fees skipped"
- Allow user to choose: Skip or Override

**After Bulk Create**: Show success toast with count created

---

### 5. **Fee Templates**
**Location**: Gear icon in header → "Manage Templates"

**Template Management Features**:

**Create Template**:
- Template Name (e.g., "Standard Monthly", "Junior Batch")
- Select Batch
- Set Amount
- Set Due Day (e.g., 10th of each month)
- Is Recurring? (Yes/No)

**Use Template**:
- Select template from dropdown
- Select starting Month/Year
- Select number of months to generate
- Preview and confirm
- Auto-creates all fees

**Edit Template**:
- Update amount, due day
- Change associated batch
- Delete template

**Template List**:
- Show all templates
- Last modified date
- Associated batch
- Recurring status

---

## 🎯 Implementation Roadmap

### Phase 2A (High Priority - Create Fee Modal)
- [ ] Create `CreateFeeModal.tsx` component
- [ ] Form validation logic
- [ ] Duplicate checking
- [ ] API integration

### Phase 2B (Edit & Delete Actions)
- [ ] Add Edit button logic to table
- [ ] Create `EditFeeModal.tsx` component
- [ ] Add Delete confirmation dialog
- [ ] Conditional button visibility

### Phase 2C (Bulk Operations)
- [ ] Create `BulkFeeModal.tsx` component
- [ ] Batch selection logic
- [ ] Duplicate detection & skip logic
- [ ] Bulk create API call

### Phase 2D (Templates)
- [ ] Create `TemplateManager.tsx` modal
- [ ] Template CRUD operations
- [ ] Template selection & auto-generation
- [ ] Recurring fee logic

---

## 💾 Data Flow

### Fee Record (Current)
```typescript
{
  id: string;
  studentId: string;
  amount: number;
  monthYear: string; // "2026-01"
  dueDate: Date;
  paidDate?: Date;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'WAIVED';
  paymentMethod?: string;
  transactionRef?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Fee Template (New)
```typescript
{
  id: string;
  batchId: string;
  templateName: string;
  amount: number;
  dueDay: number; // 1-31
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
}
```

---

## 🔧 API Endpoints Needed

### Already Exist
- `POST /api/fees` - Create fee
- `PUT /api/fees/:id` - Update fee
- `DELETE /api/fees/:id` - Delete fee

### To Create
- `POST /api/fees/batch` - Bulk create fees
- `POST /api/fee-templates` - Create template
- `GET /api/fee-templates` - List templates
- `PUT /api/fee-templates/:id` - Update template
- `DELETE /api/fee-templates/:id` - Delete template
- `POST /api/fee-templates/:id/generate` - Generate fees from template

---

## 👤 User Roles & Permissions

### HEAD_COACH: Full Access
- View all fees
- Create/Edit/Delete individual fees
- Bulk create for batches
- Create/Edit/Delete templates
- All filters available

### ASSISTANT_COACH: Limited
- View fees for assigned batches only
- Create fees (only for assigned batches)
- Edit/Delete only if created by them
- Cannot manage templates
- Cannot bulk create

### STUDENT: Read-Only
- View own fees
- See payment status
- View due dates
- No create/edit/delete

---

## 🎨 UI Components Needed

### Modals (New)
1. `CreateFeeModal` - Individual fee creation
2. `EditFeeModal` - Edit existing fee
3. `BulkFeeModal` - Batch fee creation
4. `TemplateManager` - Manage fee templates
5. `DeleteConfirmDialog` - Confirm fee deletion

### Buttons (New)
- "Create Fee" (header)
- "Create Batch Fees" (header)
- "Manage Templates" (header gear icon)
- "Edit" (actions column)
- "Delete" (actions column)

### Filters (✅ Completed)
- Month/Year dropdown
- Batch dropdown
- Status badges (already done)
- Search bar (already done)

---

## ⏱️ Estimated Effort

- **Phase 2A (Create Fee)**: 2-3 hours
- **Phase 2B (Edit/Delete)**: 1-2 hours
- **Phase 2C (Bulk Create)**: 2-3 hours
- **Phase 2D (Templates)**: 3-4 hours
- **Total**: ~10-12 hours

---

## 📝 Next Steps

1. Review and approve fee management feature set
2. Prioritize phases (recommend: 2A → 2B → 2C → 2D)
3. Create API endpoints in backend
4. Implement frontend modals one phase at a time
5. Add comprehensive error handling
6. Test role-based access

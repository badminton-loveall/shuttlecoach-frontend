# Student Features - Usage Guide

## Feature 1: Managing Student Fees (Fees Tab)

### How to Access
1. Navigate to **Students** page
2. Click on any student card to open their profile
3. Click the **Fees** tab (4th tab)

### What You See
**Fee Statistics at the top:**
- Total Fees - Sum of all fee amounts for the student
- Paid - Amount already paid
- Pending - Amount awaiting payment
- Overdue - Count of overdue fees (if any)

**Fee Records Table:**
- Month/Year of the fee
- Amount in rupees
- Due date
- Current status (Paid/Pending/Overdue/Waived)
- Action buttons

### Creating a Fee
1. Click the **"Add Fee"** button (top right of Fees tab)
2. Modal appears with form:
   - Student: Pre-filled with current student (read-only)
   - Amount: Enter fee amount (₹0.01 - ₹999,999.99)
   - Month/Year: Select month and year
   - Due Date: Pick a date (auto-suggests 10th of month)
   - Notes: Optional comments (max 500 characters)
3. Click **"Create Fee"** button
4. Fee appears in the table immediately

### Editing a Fee
1. Click **"Edit"** button next to a PENDING or OVERDUE fee
2. Modal opens with:
   - Student Name: Read-only
   - Month/Year: Read-only
   - Amount: Editable
   - Due Date: Editable
   - Notes: Editable
   - Change indicator (✎) shows which fields you modified
3. Modify any editable field
4. Click **"Save Changes"** (only enabled if changes made)
5. Changes update immediately

### Deleting a Fee
1. Click **"Delete"** button next to a PENDING fee only
2. Confirmation dialog appears showing:
   - Student name
   - Amount
   - Month/Year
   - Status
3. Click **"Delete Fee"** to confirm
4. Fee is removed from the table

### Fee Status Meanings
- **Paid** (Green) - Payment received
- **Pending** (Orange) - Awaiting payment
- **Overdue** (Red) - Past due date, not paid
- **Waived** (Blue) - Fee forgiven/waived

---

## Feature 2: Enrolling New Students

### How to Access
1. Navigate to **All Students** page
2. Look for **"Enroll New Student"** button (top right, blue)
3. Click the button to open enrollment form

### Enrollment Form Sections

#### Basic Information
- **Full Name** * - Student's complete name
- **Date of Birth** * - Must be at least 5 years old
- **Gender** * - Select: Male, Female, or Other
- **BAID Number** - Optional badminton registration ID

#### Contact Information  
- **Student Phone** * - 10-digit phone number
- **Email** - Optional, must be valid format

#### Guardian Information
- **Guardian Name** * - Parent/guardian name
- **Guardian Phone** * - Guardian's 10-digit phone number

#### Academy Information
- **Batch** * - Select from available batches (e.g., Batch 1, Batch 2)
- **Initial Skill Level** * - Choose: Beginner, Intermediate, Advanced, Professional
- **Assign Coach** * - Select from available coaches

### Validation Rules
✓ Phone numbers must be exactly 10 digits
✓ Email must be valid format (xxx@xxx.xxx)
✓ Date of birth must make student at least 5 years old
✓ All fields marked with * are required
✓ Batch and Coach selection is mandatory

### Submission Process
1. Fill all required fields (marked with *)
2. Fill optional fields as needed
3. Click **"Enroll Student"** button
4. Form shows "Enrolling..." while processing
5. On success:
   - Modal closes automatically
   - New student appears in the student grid
   - Can search/filter for the new student immediately

### What Happens After Enrollment
- New student is added to the students list
- Student can be found using search/filters
- Click to view their profile (empty tabs initially)
- Can start managing fees immediately
- Can assign training logs and curriculum

### Error Handling
If submission fails:
- Red error banner appears at top of form
- Message explains what went wrong
- Can correct and retry
- Form data remains intact

---

## Tips & Best Practices

### For Fee Management
1. **Set Due Dates Strategically**
   - Suggest 10th of month for monthly fees
   - Give enough advance notice (2-3 weeks before due date)

2. **Use Notes Effectively**
   - Mention payment terms (cash, check, bank transfer)
   - Add scholarship details if applicable
   - Note any special arrangements

3. **Monitor Overdue Fees**
   - Check Overdue count regularly
   - Follow up with students/guardians
   - Consider waiving fees if needed

4. **Track Changes**
   - The edit modal shows what you changed
   - Useful for audit trail
   - Only save if you actually made changes

### For Student Enrollment
1. **Verify Information Before Enrolling**
   - Double-check phone numbers (contact student if unsure)
   - Confirm batch assignment
   - Verify coach availability

2. **Use Consistent Naming**
   - Use full legal names
   - Include middle name if available
   - Helps with identification and records

3. **Set Appropriate Skill Level**
   - Be realistic with initial assessment
   - Can be updated later based on performance
   - Helps with batching and curriculum

4. **Assign to Available Coaches**
   - Check coach availability before assigning
   - Consider coach specialization
   - Balance student load across coaches

---

## Keyboard Shortcuts
- **Escape** - Close modal without saving
- **Tab** - Navigate between form fields
- **Enter** - Submit form (when button is focused)

---

## Common Issues & Solutions

### "Student not found" when accessing profile
- Verify URL contains correct student ID
- Try navigating from Students grid instead

### Fee amount validation errors
- Check that amount is between ₹0.01 and ₹999,999.99
- Don't include currency symbol in input
- Use decimal for paise (e.g., 100.50)

### Cannot edit/delete a fee
- Only PENDING and OVERDUE fees can be edited
- Only PENDING fees can be deleted
- Try changing fee status first (Mark Paid/Waive)

### Cannot select batch in enrollment form
- Ensure at least one batch exists
- Check batch data in system
- Contact admin if batches missing

### Phone number validation fails
- Remove hyphens, spaces, parentheses
- Enter exactly 10 digits
- No country code needed (assumed India)

---

## Need Help?
- Check the "Fees" and "All Students" page headers for hints
- Form labels explain what each field is for
- Error messages appear directly under invalid fields
- Color indicators help identify fee status quickly

Enjoy the new features! 🎾

# Feedback Assurance Email - Testing Guide

## 🧪 Pre-Deployment Testing

### Environment Setup
1. Ensure backend server is running on configured port
2. Verify MongoDB/MySQL connection is active
3. Check Gmail SMTP credentials in `.env`:
   ```
   GMAIL_EMAIL=your-email@gmail.com
   GMAIL_PASSWORD=your-app-password (NOT regular password)
   ```
4. Frontend dev server should be running

---

## ✅ Test Cases

### Test 1: Basic Flow - Send Assurance Email
**Steps:**
1. Log in as Admin
2. Navigate to Feedback Management page
3. Find a feedback entry
4. Click the "Assure" button

**Expected Result:**
- ✅ Confirmation dialog opens
- ✅ Dialog shows customer name and feedback message
- ✅ Dialog displays informative message about next steps

**Next Steps (if passed):**
5. Click "Send Assurance" button
6. Button should show "Sending..." with spinner

**Expected Result:**
- ✅ Button becomes loading state
- ✅ Toast notification appears at top-right
- ✅ Toast shows "Success" status with message
- ✅ Email arrives in customer's inbox (check within 1-2 minutes)
- ✅ Dialog closes automatically

---

### Test 2: Cancel Confirmation
**Steps:**
1. Click "Assure" button on any feedback
2. Dialog opens

**Expected Result:**
- ✅ Dialog is visible

**Next Steps:**
3. Click "Cancel" button

**Expected Result:**
- ✅ Dialog closes without sending
- ✅ No email is sent
- ✅ No toast notification appears
- ✅ List remains unchanged

---

### Test 3: Per-Feedback Loading State
**Steps:**
1. Have multiple feedbacks visible
2. Click "Assure" on first feedback
3. Dialog opens, click "Send Assurance"
4. Immediately try clicking "Assure" on another feedback

**Expected Result:**
- ✅ First feedback button shows loading state
- ✅ Second feedback button is disabled (grayed out)
- ✅ Cannot click second button while first is sending
- ✅ Other page elements remain interactive

---

### Test 4: Error Handling - Invalid Email
**Steps:**
1. Manually corrupt the email in database (set to empty or invalid)
2. Click "Assure" on that feedback
3. Click "Send Assurance"

**Expected Result:**
- ✅ Button shows loading state briefly
- ✅ Toast appears with error message
- ✅ Error message is user-friendly: "Recipient email not available"
- ✅ Button returns to normal state
- ✅ Dialog closes

---

### Test 5: Error Handling - Network Error
**Steps:**
1. Temporarily stop the backend server
2. Click "Assure" on any feedback
3. Click "Send Assurance"

**Expected Result:**
- ✅ Button shows loading state
- ✅ After timeout, error toast appears
- ✅ Error message is descriptive
- ✅ Button returns to normal state
- ✅ Can retry after server is back online

---

### Test 6: Error Handling - Gmail SMTP Error
**Steps:**
1. Provide invalid Gmail credentials in `.env`
2. Restart backend server
3. Click "Assure" on any feedback
4. Click "Send Assurance"

**Expected Result:**
- ✅ Button shows loading state
- ✅ Toast appears with error message
- ✅ Error mentions Gmail/SMTP issue
- ✅ Button returns to normal state

**Fix:**
- Restore valid Gmail credentials
- Restart backend server

---

### Test 7: List Refresh After Success
**Steps:**
1. Note the exact state of feedbacks before sending
2. Click "Assure" and send assurance email
3. Watch the feedback list during/after success

**Expected Result:**
- ✅ Success toast appears
- ✅ Feedback list refreshes automatically
- ✅ No page reload required
- ✅ Same page/sort order maintained

---

### Test 8: Multiple Sequential Sends
**Steps:**
1. Send assurance to first feedback
2. Wait for success toast and dialog to close
3. Immediately click "Assure" on another feedback
4. Send assurance to second feedback

**Expected Result:**
- ✅ First email sends successfully
- ✅ Dialog closes properly
- ✅ Can immediately open dialog for second feedback
- ✅ Second email sends successfully
- ✅ Both customers receive emails
- ✅ No conflicts or errors

---

### Test 9: Email Template Visual Verification
**Steps:**
1. Send assurance email successfully
2. Check customer email inbox
3. Open the received email

**Expected Result:**
- ✅ Email has professional gradient header
- ✅ Personalized greeting with customer name
- ✅ Clear message about feedback acknowledgment
- ✅ "What happens next?" section is visible
- ✅ Company branding is visible
- ✅ Email is readable on mobile devices
- ✅ All text is properly formatted
- ✅ No typos or formatting issues

---

### Test 10: Browser Compatibility
**Steps:**
- Test on Chrome/Edge
- Test on Firefox
- Test on Safari
- Test on Mobile browser (iOS Safari, Chrome Mobile)

**Expected Result (All Browsers):**
- ✅ Confirmation dialog appears properly
- ✅ Button loading state works
- ✅ Toast notifications are visible
- ✅ Email is sent successfully
- ✅ No console errors

---

## 🐛 Debugging Tips

### Common Issues & Solutions:

#### Issue: Toast notification doesn't appear
**Solution:**
1. Check browser console for errors
2. Verify `useToast` hook is properly imported
3. Check network tab to see if API call succeeded

#### Issue: Dialog doesn't open
**Solution:**
1. Verify `useDisclosure` is properly initialized
2. Check console for React errors
3. Ensure button onClick is calling `openConfirmation(f)`

#### Issue: Button stuck in loading state
**Solution:**
1. Check backend logs for errors
2. Verify API endpoint is accessible
3. Try refreshing page and resending

#### Issue: Email not received
**Solution:**
1. Check spam/junk folder in customer email
2. Verify Gmail credentials are correct and have app password
3. Check backend logs for email service errors
4. Verify recipient email exists and is correct in database

#### Issue: Database shows wrong case for firstname
**Solution:**
1. Verify database column name is `firstname` (lowercase)
2. Check that the fix `feedback.firstname` is in place
3. Restart backend server

---

## 📊 Test Report Template

Create a file `FEEDBACK_ASSURANCE_TEST_RESULTS.txt`:

```
Testing Date: ___________
Tester Name: ___________
Environment: Development / Staging / Production

Test Case 1: Basic Flow
Status: ☐ PASS ☐ FAIL ☐ N/A
Notes: ___________________________________

Test Case 2: Cancel Confirmation
Status: ☐ PASS ☐ FAIL ☐ N/A
Notes: ___________________________________

Test Case 3: Per-Feedback Loading State
Status: ☐ PASS ☐ FAIL ☐ N/A
Notes: ___________________________________

[Continue for all test cases...]

Overall Status: ☐ ALL PASS ☐ SOME FAILED ☐ BLOCKED

Issues Found:
1. ___________________________________
2. ___________________________________

Recommendation: ☐ DEPLOY ☐ FIX & RETEST ☐ HOLD
```

---

## 🚀 Post-Deployment Verification

After deploying to production:

1. **Day 1:** Monitor error logs for the first 24 hours
2. **Week 1:** 
   - Verify 5+ feedback assurance emails sent successfully
   - Check for any error patterns in logs
   - Gather user feedback on new UX
3. **Week 2+:** 
   - Monitor performance metrics
   - Track email delivery success rate
   - Collect user feedback

---

## 📞 Rollback Plan

If critical issues are found:

1. **Quick Fix:** Update email template or messages (no deploy needed)
2. **Code Revert:** Revert to previous version:
   ```bash
   git revert <commit-hash>
   npm run build
   Deploy again
   ```
3. **Disable Feature:** If needed, comment out button in Feedbacks.jsx temporarily

---

## ✨ Success Metrics

Track these after deployment:

- **Email Delivery Rate:** Target 95%+ success rate
- **Customer Satisfaction:** Monitor feedback responses
- **Error Rate:** Should be <5% of all send attempts
- **Page Load Time:** Should not increase (currently ~0-100ms delay)
- **Support Tickets:** Should not increase related to assurance emails

---

## 📋 Checklist Before Production

- [ ] All test cases passed
- [ ] No console errors in browser
- [ ] Gmail SMTP credentials verified
- [ ] Database connections working
- [ ] Email template displays correctly
- [ ] Loading states work smoothly
- [ ] Error messages are user-friendly
- [ ] Toast notifications appear correctly
- [ ] Dialog opens/closes properly
- [ ] Button disabling works as expected
- [ ] Backend logs show no errors
- [ ] Team lead approval obtained
- [ ] Deployment plan documented

---

**Ready for Production:** ☐ YES ☐ NO

**Approved By:** _________________ **Date:** _________

**Sign Off:** _________________ **Date:** _________

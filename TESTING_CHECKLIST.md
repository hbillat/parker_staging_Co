# Lead Scraper Feature - Testing Checklist

## ✅ Automated Tests Completed

### Code Quality
- ✅ **TypeScript Compilation**: No errors (`npx tsc --noEmit`)
- ✅ **Linting**: No errors in app, components, and lib directories
- ✅ **Server Startup**: Development server starts successfully
- ✅ **Build Check**: No build errors

### Code Review
- ✅ **Google Places API Integration**: Properly configured with rate limiting
- ✅ **Duplicate Detection Logic**: Business name + address combination check
- ✅ **Database Schema**: All tables, indexes, and RLS policies in place
- ✅ **API Routes**: All three endpoints created with proper authentication
- ✅ **Type Safety**: Full TypeScript types for all database models
- ✅ **Error Handling**: Try-catch blocks in all async operations

### Security
- ✅ **Row Level Security**: Enabled on all tables
- ✅ **User Isolation**: Users can only access their own projects
- ✅ **Environment Variables**: API keys properly stored in `.env.local`
- ✅ **Authentication**: All routes check user authentication

## 🧪 Manual Testing Required

### 1. Navigation & UI
- [ ] Dashboard shows "Lead Scraper" card with project count
- [ ] Click "Lead Scraper" navigates to `/dashboard/projects`
- [ ] Projects page shows correct header and branding
- [ ] "Create New Project" button is visible

### 2. Create Project Flow
- [ ] Click "Create New Project" opens modal
- [ ] Enter project name (e.g., "Test Project")
- [ ] Add search term (e.g., "home staging san francisco")
- [ ] Click "+ Add Term" adds new input field
- [ ] Can remove search terms (if more than one)
- [ ] Click "Create Project" button
- [ ] Modal closes and redirects to project details page

### 3. Project Details Page
- [ ] Project name displays correctly
- [ ] Status shows "Draft"
- [ ] Stats cards show: Total Leads (0), Duplicates Removed (0), Search Terms (count)
- [ ] Search terms list shows all added terms
- [ ] "Start Scraping" button is visible and enabled

### 4. Scraping Process
- [ ] Click "Start Scraping"
- [ ] Status changes to "Scraping..."
- [ ] Search terms show status badges ("scraping", "completed")
- [ ] Progress messages update (check every 10 seconds)
- [ ] Total leads counter increases
- [ ] Duplicates removed counter updates (if any duplicates)
- [ ] When complete, status changes to "Completed"

### 5. Leads Display
- [ ] Leads table appears after scraping starts
- [ ] Table shows: Business Name, Address, Phone, Website, Rating, Reviews
- [ ] "View on Google" links work (open in new tab)
- [ ] "Visit" website links work (open in new tab)
- [ ] Phone numbers are clickable (tel: links)
- [ ] Star ratings display correctly
- [ ] Review counts show proper formatting

### 6. Real-Time Updates
- [ ] While scraping, page updates every ~10 seconds
- [ ] No need to manually refresh
- [ ] Progress messages change in real-time
- [ ] Lead count updates automatically
- [ ] Search term statuses update

### 7. Multiple Projects
- [ ] Return to projects list (`/dashboard/projects`)
- [ ] Previous project shows in list with status badge
- [ ] Create another project
- [ ] Both projects show in list
- [ ] Click on each project to view details

### 8. Error Handling
- [ ] Try creating project with empty name (should show error)
- [ ] Try creating project with no search terms (should show error)
- [ ] If API fails, appropriate error message displays

### 9. Edge Cases
- [ ] Very long project names display correctly
- [ ] Many search terms (10+) all process
- [ ] Search term with no results doesn't crash
- [ ] Duplicate businesses are detected and counted

## 📊 Expected Results

### For Test Search Term: "home staging san francisco"
- Should find 50-200+ businesses (depends on Google results)
- Should include: business names, addresses, ratings
- Some will have websites, some won't
- Some will have phone numbers, some won't
- Duplicates should be minimal (same business listed multiple times)

### Performance
- Project creation: < 1 second
- Start scraping response: < 1 second
- Full scrape (1 search term): 2-5 minutes
- Status update polling: Every 10 seconds
- UI should remain responsive during scraping

## 🐛 Known Limitations (Expected Behavior)

1. **Email Addresses**: Google Places API doesn't provide emails (will always be null)
2. **Scraping Time**: Takes 2-5 minutes per search term due to rate limiting
3. **Pagination**: Limited to 10 pages (Google API restriction)
4. **API Costs**: Uses Google Places API credits (~$0.05 per search term)
5. **Background Jobs**: Scraping happens in background, don't close browser

## ✅ Pre-Flight Checks Completed

- ✅ Database tables created in Supabase
- ✅ Google Places API key added to `.env.local`
- ✅ Google Places API enabled in Google Cloud
- ✅ Supabase RLS policies active
- ✅ All dependencies installed
- ✅ Development server running
- ✅ No TypeScript errors
- ✅ No linting errors

## 🚀 Ready for Testing

The feature has passed all automated checks and code review. It's ready for manual testing!

**Next Steps:**
1. Follow the manual testing checklist above
2. Test with a real search term
3. Verify leads are collected correctly
4. Check that real-time updates work
5. Test the full end-to-end flow

## 📝 Test Data Suggestions

### Good Test Search Terms
- "home staging san francisco" (should find many results)
- "interior design los angeles" (should find many results)
- "real estate photography new york" (should find many results)
- "furniture rental seattle" (moderate results)

### Edge Case Test Terms
- "asdfqwerzxcv" (no results - should handle gracefully)
- "coffee shop" (too broad - will max out at 10 pages)
- "very specific business name that doesnt exist" (no results)

## 🎯 Success Criteria

The feature is working correctly if:
1. ✅ Projects can be created with multiple search terms
2. ✅ Scraping starts and completes successfully
3. ✅ Leads are collected and displayed in table
4. ✅ Real-time updates work every 10 seconds
5. ✅ Duplicate detection removes duplicates
6. ✅ Stats (total leads, duplicates) are accurate
7. ✅ UI is responsive and doesn't crash
8. ✅ Links to Google listings and websites work

---

**Last Updated**: November 12, 2024
**Status**: ✅ Ready for Manual Testing


# i18n Contract — Customer Batch 2026-06-04

Six new namespaces were merged into all five locale files
(`src/config/messages/{en,fr,tr,zh,es}.json`) without clobbering existing
namespaces. All locales have identical key structure (209 keys each).

Use these EXACT key paths. English values shown below for reference.
Access in client via `useTranslations('Namespace')`, in server via
`getTranslations('Namespace')`. For nested groups call e.g.
`useTranslations('Request.intents')`. Array entries (e.g. plan features) are
accessed with `t.raw('plans.free.features')` or indexed `t('...0')` per next-intl.

ICU note: `HomeSearch.signedIn.greeting` and `Request` toasts that take a name
use `{name}` interpolation.

---

## HomeSearch

```
HomeSearch.title                              = "Tell Us What You Are Looking For"
HomeSearch.subtitle                           = "Search the marketplace to connect with credible partners, investment opportunities, and market intelligence across the Democratic Republic of Congo."
HomeSearch.placeholder                        = "Search companies, products, or opportunities..."
HomeSearch.tabs.all                           = "All"
HomeSearch.tabs.companies                     = "Companies"
HomeSearch.tabs.products                      = "Products"
HomeSearch.tabs.opportunities                 = "Opportunities"
HomeSearch.submitCta                          = "Search the Marketplace"
HomeSearch.signedIn.greeting                  = "Welcome back, {name}"
HomeSearch.signedIn.quickActions.myCompanies  = "My Companies"
HomeSearch.signedIn.quickActions.submitRequest= "Submit a Request"
HomeSearch.signedIn.quickActions.myRequests   = "My Requests"
HomeSearch.signedIn.quickActions.inbox        = "Inbox"
HomeSearch.signedIn.quickActions.getPremium   = "Get Premium"
```

## Request

```
Request.hero.title        = "Tell Us What You Are Looking For"
Request.hero.subtitle     = "Connect with credible partners, investment opportunities, and market intelligence in the Democratic Republic of Congo."
Request.hero.submitCta    = "Submit Business Request"
Request.hero.exploreCta   = "Explore Options"

Request.intents.heading   = "What brings you to the DRC?"
# Each intent enum value has .title + .description:
Request.intents.find_partner.title           = "Find a Local Partner"
Request.intents.find_partner.description      = "Connect with trusted companies and suppliers in the DRC."
Request.intents.invest.title                  = "Invest in the DRC"
Request.intents.invest.description            = "Discover investment opportunities across key sectors."
Request.intents.sell.title                    = "Sell Products in the DRC"
Request.intents.sell.description              = "Explore distribution channels and grow your presence in the DRC market."
Request.intents.buy.title                     = "Buy from the DRC"
Request.intents.buy.description               = "Source quality products and services from Congolese suppliers."
Request.intents.publish_opportunity.title     = "Publish an Opportunity"
Request.intents.publish_opportunity.description = "Share your business opportunities and reach qualified partners."
Request.intents.register_company.title        = "Register My Company"
Request.intents.register_company.description  = "Get guidance to register your company and operate in the DRC."
Request.intents.market_report.title           = "Request a Market Report"
Request.intents.market_report.description     = "Access reliable market intelligence and sector insights."
Request.intents.business_mission.title        = "Organize a Business Mission"
Request.intents.business_mission.description  = "Plan your business trip and connect with the right stakeholders."
Request.intents.partner_search.title          = "Partner Search"
Request.intents.partner_search.description    = "Identify relevant local or international partners aligned with your objectives."
Request.intents.market_entry.title            = "Market Entry Support"
Request.intents.market_entry.description      = "Receive local guidance and strategy support to enter the DRC market with clarity."
Request.intents.business_verification.title   = "Business Verification"
Request.intents.business_verification.description = "Reduce uncertainty by checking the credibility and profile of potential partners."
Request.intents.b2b_meeting.title             = "B2B Meeting Facilitation"
Request.intents.b2b_meeting.description       = "Connect with suppliers, investors, institutions, and decision-makers through structured meetings."
Request.intents.local_representation.title    = "Local Representation"
Request.intents.local_representation.description = "Build a credible local presence through business facilitation and representation support."
Request.intents.delegation.title              = "Delegation"
Request.intents.delegation.description        = "Organize business missions, conferences, visits, and partnership programs."
Request.intents.other.title                   = "Something Else"
Request.intents.other.description             = "Tell us about your specific need and we will route it to the right team."

Request.form.heading           = "Submit Your Business Request"
Request.form.subheading        = "Please provide your details so we can connect you with the right opportunities."
Request.form.fullName          = "Full Name"
Request.form.company           = "Company"
Request.form.country           = "Country"
Request.form.email             = "Email"
Request.form.phone             = "WhatsApp / Phone"
Request.form.sector            = "Sector of Interest"
Request.form.intent            = "I am looking for"
Request.form.preferredLocation = "Preferred Location in the DRC"
Request.form.timeline          = "Expected Timeline"
Request.form.message           = "Detailed Message"
Request.form.submit            = "Submit Business Request"
Request.form.securityNote      = "Your information is secure and will only be used to connect you with relevant opportunities."
Request.form.selectPlaceholder = "Select an option"

Request.whoIsThisFor.heading                          = "Who Is This For?"
Request.whoIsThisFor.intlCompanies.title              = "International Companies"
Request.whoIsThisFor.intlCompanies.description        = "Looking to expand, source, or partner in the DRC."
Request.whoIsThisFor.congoleseCompanies.title         = "Congolese Companies"
Request.whoIsThisFor.congoleseCompanies.description    = "Seeking partnerships, market access, and growth opportunities."
Request.whoIsThisFor.investors.title                  = "Investors"
Request.whoIsThisFor.investors.description            = "Exploring viable projects and high-potential sectors."
Request.whoIsThisFor.institutions.title               = "Institutions"
Request.whoIsThisFor.institutions.description         = "Supporting trade, investment, and economic development."

Request.howItWorks.heading        = "How It Works"
Request.howItWorks.step1.title    = "Submit Your Interest"
Request.howItWorks.step1.description = "Tell us what you are looking for through our form."
Request.howItWorks.step2.title    = "Request Review"
Request.howItWorks.step2.description = "Our team reviews and analyzes your needs."
Request.howItWorks.step3.title    = "Business Connection"
Request.howItWorks.step3.description = "We connect you with trusted partners and opportunities."
Request.howItWorks.step4.title    = "Partnership Development"
Request.howItWorks.step4.description = "Build lasting relationships and grow your business."

Request.signInRequired.title     = "Sign in to submit a request"
Request.signInRequired.body      = "Create a free account or sign in to send your business request and track its progress."
Request.signInRequired.signInCta = "Sign In to Continue"

Request.successToast = "Your request has been submitted. Our team will be in touch soon."
Request.errorToast   = "We couldn't submit your request. Please try again."
Request.kindBusiness = "Business Request"
Request.kindService  = "Service Request"
```

## Pricing

```
Pricing.hero.title           = "Choose the Right Profile for Your Business"
Pricing.hero.subtitle        = "Start with free registration or upgrade to boost your marketplace visibility, attract qualified partners, and unlock more business opportunities in the DRC."
Pricing.hero.registerFreeCta = "Register Free"
Pricing.hero.getPremiumCta   = "Get Premium"
Pricing.recommendedBadge     = "Recommended"

Pricing.plans.free.name      = "Free Registration"
Pricing.plans.free.price     = "Free"
Pricing.plans.free.tagline   = "A basic entry point for companies joining the marketplace."
Pricing.plans.free.features  = [ "Basic company listing", "Company name, sector and country", "Limited directory visibility", "Public contact display", "Access to public opportunities" ]   # 5 items
Pricing.plans.free.cta       = "Start Free"

Pricing.plans.premiumCongolese.name     = "Premium Profile — Congolese Companies"
Pricing.plans.premiumCongolese.price    = "$3,000"
Pricing.plans.premiumCongolese.per      = "/year"
Pricing.plans.premiumCongolese.tagline  = "Designed for local businesses seeking stronger visibility and partnerships."
Pricing.plans.premiumCongolese.features = [ "Verified premium badge", "Priority search and sector placement", "Enhanced company profile page", "Showcase products and services", "Direct inquiry / lead form", "Opportunity publishing access", "Newsletter and featured visibility", "B2B introduction support" ]   # 8 items
Pricing.plans.premiumCongolese.cta      = "Choose Congolese Premium"

Pricing.plans.premiumInternational.name     = "Premium Profile — International Companies"
Pricing.plans.premiumInternational.price    = "$3,600"
Pricing.plans.premiumInternational.per      = "/year"
Pricing.plans.premiumInternational.tagline  = "Built for foreign companies targeting market access and business connections in the DRC."
Pricing.plans.premiumInternational.features = [ "Verified premium international badge", "Priority directory placement", "Enhanced profile and company presentation", "Market-entry visibility to DRC partners", "Direct lead capture form", "Publish opportunities and offers", "Featured business exposure", "B2B introduction support" ]   # 8 items
Pricing.plans.premiumInternational.cta      = "Choose International Premium"

Pricing.whyPremium.heading  = "Why Go Premium?"
Pricing.whyPremium.items    = [ {title,description} x6 ]   # array of objects:
  [0] "Stronger Marketplace Visibility" / "Stand out in the directory and reach more potential partners."
  [1] "Higher Trust Through Verification" / "Earn a verified badge that builds confidence with buyers and investors."
  [2] "Better Positioning in Search" / "Rank higher in search and sector results across the platform."
  [3] "Qualified Lead Generation" / "Receive direct inquiries from serious, qualified prospects."
  [4] "Richer Company Presentation" / "Showcase your products, services, and capabilities in full."
  [5] "Access to Enhanced Promotion" / "Get featured in newsletters and promotional placements."

Pricing.customPackage.heading = "Need a Custom Package?"
Pricing.customPackage.body    = "We offer tailored solutions for institutions, sponsors, and strategic partners. Contact our team to design a plan that fits your goals."
Pricing.customPackage.cta     = "Contact Our Team"

Pricing.signInRequired.title  = "Sign in to choose a plan"
Pricing.signInRequired.body   = "Create a free account or sign in to register your company and request a Premium profile."
Pricing.signInRequired.cta    = "Sign In to Continue"

Pricing.selectCompany.title       = "Select a company"
Pricing.selectCompany.body        = "Choose which of your companies should receive this Premium plan."
Pricing.selectCompany.placeholder = "Select a company"
Pricing.selectCompany.confirmCta  = "Request Premium"

Pricing.requestSentToast = "Your Premium request has been sent. Our team will review it shortly."
Pricing.alreadyPremium   = "This company already has an active Premium profile."
Pricing.pendingRequest   = "A Premium request for this company is already pending review."
```

## AdminRequests

```
AdminRequests.title        = "Received Requests"
AdminRequests.subtitle     = "Track leads, needs, assigned managers and request progress in real time."
AdminRequests.newRequestCta= "New Request"

AdminRequests.filters.search  = "Search..."
AdminRequests.filters.sector  = "Sector"
AdminRequests.filters.country = "Country"
AdminRequests.filters.status  = "Status"
AdminRequests.filters.owner   = "Owner"
AdminRequests.filters.date    = "Date"
AdminRequests.filters.all     = "All"

AdminRequests.stats.total        = "Total Requests"
AdminRequests.stats.new          = "New"
AdminRequests.stats.inProgress   = "In Progress"
AdminRequests.stats.converted    = "Converted"
AdminRequests.stats.pending      = "Pending"
AdminRequests.stats.responseRate = "Response Rate"

AdminRequests.table.name          = "Name"
AdminRequests.table.company       = "Company"
AdminRequests.table.country       = "Country"
AdminRequests.table.sector        = "Sector"
AdminRequests.table.need          = "Need"
AdminRequests.table.status        = "Status"
AdminRequests.table.date          = "Date"
AdminRequests.table.followUpOwner = "Follow-up Owner"
AdminRequests.table.actions       = "Actions"

AdminRequests.statusLabels.new         = "New"
AdminRequests.statusLabels.in_progress = "In Progress"
AdminRequests.statusLabels.converted   = "Converted"
AdminRequests.statusLabels.pending     = "Pending"
AdminRequests.statusLabels.closed      = "Closed"
AdminRequests.statusLabels.rejected    = "Rejected"

AdminRequests.kindLabels.business = "Business"
AdminRequests.kindLabels.service  = "Service"

AdminRequests.assignOwner      = "Assign Owner"
AdminRequests.ownerPlaceholder = "Select an owner"
AdminRequests.addNote          = "Add a note"
AdminRequests.save             = "Save"
AdminRequests.empty            = "No requests match your filters yet."

AdminRequests.howItWorks.heading      = "How It Works"
AdminRequests.howItWorks.step1.title  = "Request Intake"
AdminRequests.howItWorks.step1.description = "The request is received through the portal or by email."
AdminRequests.howItWorks.step2.title  = "Qualification"
AdminRequests.howItWorks.step2.description = "Needs analysis, verification and prioritization."
AdminRequests.howItWorks.step3.title  = "Owner Assignment"
AdminRequests.howItWorks.step3.description = "The request is assigned to the appropriate owner."
AdminRequests.howItWorks.step4.title  = "Follow-up & Conversion"
AdminRequests.howItWorks.step4.description = "Operational follow-up until conversion or closure."

AdminRequests.detail.submittedBy = "Submitted By"
AdminRequests.detail.submittedAt = "Submitted At"
AdminRequests.detail.contact     = "Contact"
AdminRequests.detail.message     = "Message"
AdminRequests.detail.intent      = "Intent"
```

## AdminPremium

```
AdminPremium.title    = "Premium Requests"
AdminPremium.subtitle = "Review and approve Premium profile requests from companies."

AdminPremium.table.company     = "Company"
AdminPremium.table.requestedBy = "Requested By"
AdminPremium.table.plan        = "Plan"
AdminPremium.table.amount      = "Amount"
AdminPremium.table.status      = "Status"
AdminPremium.table.date        = "Date"
AdminPremium.table.actions     = "Actions"

AdminPremium.planCongolese     = "Congolese Premium"
AdminPremium.planInternational = "International Premium"

AdminPremium.statusLabels.pending   = "Pending"
AdminPremium.statusLabels.approved  = "Approved"
AdminPremium.statusLabels.rejected  = "Rejected"
AdminPremium.statusLabels.cancelled = "Cancelled"

AdminPremium.approve        = "Approve"
AdminPremium.reject         = "Reject"
AdminPremium.approveConfirm = "Approve this Premium request and activate the profile?"
AdminPremium.rejectConfirm  = "Reject this Premium request?"
AdminPremium.notes          = "Admin notes"
AdminPremium.empty          = "No Premium requests yet."
AdminPremium.approvedToast  = "Premium request approved and profile activated."
AdminPremium.rejectedToast  = "Premium request rejected."
```

## DashboardPremium

```
DashboardPremium.cardTitle        = "Premium Profile"
DashboardPremium.statusFree       = "Free Plan"
DashboardPremium.statusPending    = "Premium Pending Review"
DashboardPremium.statusPremium    = "Premium Active"
DashboardPremium.planLabel        = "Plan"
DashboardPremium.expiresLabel     = "Expires"
DashboardPremium.upgradeCta       = "Upgrade to Premium"
DashboardPremium.cancelPendingCta = "Cancel Pending Request"
```

---

## Notes for feature agents

- **Intent enum mapping**: `business_requests.intent` enum values map 1:1 to
  `Request.intents.<value>.title` / `.description`. To render a request's need
  label in admin, use `AdminRequests` table + look up `Request.intents.<intent>.title`.
- **Status enum mapping**: `business_requests.status` →
  `AdminRequests.statusLabels.<status>`. `premium_requests.status` →
  `AdminPremium.statusLabels.<status>`.
- **Kind mapping**: `business_requests.kind` ('business'|'service') →
  `Request.kindBusiness`/`Request.kindService` (public) or
  `AdminRequests.kindLabels.<kind>` (admin table).
- **Plan mapping**: `premium_requests.plan` ('congolese'|'international') →
  `Pricing.plans.premiumCongolese`/`premiumInternational` (public) or
  `AdminPremium.planCongolese`/`planInternational` (admin).
- **Pricing**: Congolese = $3,000/year, International = $3,600/year. Prices are
  baked into `Pricing.plans.*.price` + `.per` as display strings; FR/ES/ZH use
  locale-formatted numerals (e.g. FR "3 000 $", ES "3.000 $").
- **Arrays** (`Pricing.plans.*.features`, `Pricing.whyPremium.items`): read with
  `t.raw(key)` to get the array/object array, then map in the component.
- All five locales (`en`, `fr`, `tr`, `zh`, `es`) carry the complete tree —
  verified 209 identical keys per locale, zero missing/extra.

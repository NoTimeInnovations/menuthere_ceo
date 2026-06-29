# Menuthere Onboarding — Phases, Tasks & Details

The exact flow used by the **Phase** column in the CRM table view. 8 phases.
🔀 = a decision that reveals the matching task group.

---

## Phase 1 — Onboarding & Basic Details
🔀 **Is the restaurant using Petpooja?** → Yes (Petpooja) / No (Manual menu)

1. **Conduct onboarding call & explain the full process**
   - Call the customer after they subscribe.
   - Explain the complete implementation: Menu, Payment, WhatsApp, Delivery, Marketing, Go Live.
   - Set expectations and approximate timelines; tell them you'll stay in touch throughout.
2. **Collect Restaurant Name & Owner Name**
   - Record the exact Restaurant Name.
   - Record the Owner Name.

---

## Phase 2 — Menu Setup
*Tasks depend on the Petpooja decision from Phase 1.*

### ▸ Petpooja Integration (if Yes)
1. **Collect Petpooja ID, email, Maps, tax type & menu type**
   - Collect Petpooja Restaurant ID and registered email.
   - Collect the Google Maps location.
   - Tax Type — Backward (price already includes GST, no extra tax) or Forward (GST added separately at billing).
   - Menu Type — Online or Offline (most restaurants use Offline).
2. **Super Admin → Create Petpooja Partner → submit**
   - In Super Admin, open Create Petpooja Partner.
   - Enter the collected details and Submit.
   - Email + website are created automatically.
3. **Wait for Petpooja approval (track in Excel)**
   - Petpooja team reviews the request.
   - Track in Excel: Restaurant Name, Petpooja ID, Email Sent Date, Approval Status, Menu Sync Status, Remarks.
   - Contact the Petpooja point-of-contact to speed it up.
4. **Verify synced menu — items, prices, tax, images**
   - Once approved, Petpooja pushes the menu to Menuza.
   - Verify Categories, Items, Variants, Prices, Tax, Availability and Images all synced correctly.
5. **Customer verifies & rearranges menu (top sellers on top)**
   - Customer verifies Prices, Names, Categories, Availability, Taxes and Spellings.
   - Ask the customer to rearrange the menu — top-selling, profitable, chef picks and signature dishes on top.
6. **Send credentials & partner app links**
   - After menu approval, send the login credentials.
   - Send the partner app links (Play Store / App Store).

### ▸ Manual Menu (if No)
1. **Collect menu (PDF/photos/Excel), logo & Maps location**
   - Collect the menu as PDF, photos or Excel.
   - Collect the logo and the Google Maps location.
2. **menuthere.com → enter name, upload menu & logo, create**
   - Go to menuthere.com and enter the restaurant name.
   - Upload the menu and logo, then Create.
3. **Generate food images from Menu Management**
   - Generate food images from Menu Management.
   - Upload optimized images if the customer asks.
4. **Customer verifies & rearranges menu → approved**
   - Customer checks Names, Descriptions, Pricing, Categories and Availability.
   - Rearrange menu; apply corrections → menu approved.
5. **Send credentials & partner app links**
   - Send login credentials and partner app links after approval.

---

## Phase 3 — Payment & WhatsApp
*These two sections run in parallel.*
🔀 **Does the customer need online payment (Cashfree)?** → Yes / No (skip Cashfree)

### ▸ Cashfree (Payment) (if Yes)
1. **Collect email & phone; set website**
   - Collect Email and Phone Number.
   - Website is set as menuthere.com/user/home.
2. **Create Cashfree merchant (partner.cashfree.com)**
   - Login at partner.cashfree.com.
   - Create Merchant, fill the details and Save.
3. **Send KYC link & collect docs (GST, cheque, Aadhaar, PAN)**
   - Send the KYC link to the customer.
   - Required docs: GST, Shop Establishment, Cancelled Cheque/Passbook, Aadhaar, PAN.
4. **Monitor KYC until approved**
   - Approved → continue.
   - Rejected → fix the documents and resubmit.
   - Email Cashfree to speed up if needed.

### ▸ WhatsApp Business (always)
1. **Ensure FB Account, Page & Business Portfolio are ready**
   - Required before connecting WhatsApp Business.
   - Scenario A — all ready → proceed.
   - Scenario B (FB account only) — tutorial video; create Page & Portfolio, profile pic, business info, 3 posts, wait 24h.
   - Scenario C (no FB account) — create Account, Page & Portfolio, upload info, publish posts daily, wait ~3 days.
2. **Login on laptop → Dashboard → Settings → Select Own WhatsApp**
   - Login to menuthere.com with credentials on a laptop (never mobile).
   - Dashboard → Settings → Delivery App → Select Own WhatsApp.
   - Click Connect WhatsApp Business Account (Meta signup opens).
3. **Meta signup → enter business details → scan QR**
   - Enter Business Name, Timezone, WhatsApp Phone, Display Name → Continue.
   - Facebook Business messages your connected WhatsApp number.
   - Click Connect → QR code appears → scan the QR.
4. **Verify WhatsApp connected (green status, no errors)**
   - Finish → redirect back to Menuthere.
   - Verify: WhatsApp Connected (Green status), no errors.

---

## Phase 4 — Enable Flows
1. **Enable every toggle in WhatsApp → Flows**
   - After WhatsApp connection, go to WhatsApp → Flows.
   - Enable every toggle — all flows & automations for smooth order processing.

---

## Phase 5 — Delivery Settings
1. **Set radius, min order, charges & acceptance rules**
   - Set Delivery Radius.
   - Set Minimum Order Amount.
   - Set Delivery Charges.
   - Set Order Acceptance Rules (ask customer name, location detail).
2. **Verify all delivery settings**
   - Verify all delivery settings are correct.

---

## Phase 6 — Delivery Configuration
🔀 **Which delivery model?** → V1 (Own riders) / V2 (Own + community) / Third party

### ▸ V1 — Own Riders (if V1)
1. **Confirm flow: Order → Accept → Dispatch → Rider → Delivered**
   - Restaurant uses its own riders.
   - Flow: Order → Accept → Dispatch → Manager assigns rider → Rider accepts → Delivered.
2. **Create delivery boys in Petpooja & same in Menuthere**
   - Send the tutorial video.
   - Customer creates delivery boys in Petpooja.
   - Create the same delivery boys in Menuthere.
3. **Verify delivery boy Name & Phone match exactly**
   - Verify Name & Phone Number match exactly in both systems.
   - If they don't match, orders won't route to riders.

### ▸ V2 — Own + Community (if V2)
1. **Riders self-register; nearby riders (5 KM) get notified**
   - Riders self-register.
   - Nearby riders within 5 KM get notified of the order.
2. **Interested riders accept → delivery starts**
   - Interested riders accept the order; delivery starts.

### ▸ Third Party (if V3)
1. **Enable Porter & Rapido (Dev Admin configures)**
   - Enable Porter & Rapido; Dev Admin configures the integration.
2. **Connect account · recharge · verify integration**
   - Connect the provider account.
   - Recharge the account and verify the integration works.

---

## Phase 7 — Marketing & Testing

### ▸ Marketing Materials
1. **Generate WhatsApp QR code**
   - QR opens wa.me/PhoneNumber?text=Hi.
   - Scanning opens WhatsApp with 'Hi' prefilled; sending returns the ordering link.
2. **Create QR stand & restaurant poster**
   - Create the QR stand and the restaurant poster.

### ▸ Testing
1. **Place test order — check menu, tax & payment**
   - Place a test order; confirm menu, tax and payment are correct end to end.
2. **Verify delivery radius, charges & delivery success**
   - Order inside radius → accepted; outside → blocked.
   - Delivery charge at checkout matches the configured charge.
   - Confirm the delivery completes successfully.

---

## Phase 8 — Go Live
1. **Final QA — confirm everything is tested & working**
   - Website, Menu, Images, Petpooja Sync, Cashfree, WhatsApp, Flows.
   - Delivery working, Riders working, QR working, Poster delivered.
   - Test order placed, Payment success, Delivery success.
2. **Restaurant approved**
   - Confirm the restaurant is approved and ready to go live.
3. **🚀 Go Live — restaurant is officially live**
   - Restaurant is officially live.
   - Can receive & accept orders, take payments, dispatch deliveries, get WhatsApp & QR orders, run daily operations.

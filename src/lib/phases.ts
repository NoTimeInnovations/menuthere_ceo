// Onboarding phases for the table-view "Phase" column, built from
// Menuthere_Onboarding_SOP.pdf. Kept deliberately simple — a few clear tasks per
// phase — but each task carries detailed `details` bullets so a worker can expand
// it and read exactly what to do.

export interface PTask {
  id: string;
  label: string;
  details?: string[]; // expandable step-by-step detail
}
export interface PChoice {
  key: string; // e.g. "petpooja"
  question: string;
  options: { value: string; label: string }[];
}
export interface PGroup {
  id: string;
  label?: string; // section heading (used when a phase has 2+ sections)
  note?: string;
  showWhen?: { key: string; value: string }; // only show when this decision matches
  tasks: PTask[];
}
export interface Phase {
  id: string;
  label: string; // short badge text, e.g. "Phase 1"
  title: string; // full title
  intro?: string;
  parallel?: boolean; // render the groups side-by-side
  choices?: PChoice[];
  groups: PGroup[];
}

export const PHASES: Phase[] = [
  {
    id: "p1",
    label: "Phase 1",
    title: "Onboarding & Basic Details",
    intro: "Welcome the customer, then decide the menu path.",
    choices: [
      {
        key: "petpooja",
        question: "Is the restaurant using Petpooja?",
        options: [
          { value: "yes", label: "Yes — Petpooja" },
          { value: "no", label: "No — Manual menu" },
        ],
      },
    ],
    groups: [
      {
        id: "g_p1",
        tasks: [
          {
            id: "p1_call",
            label: "Conduct onboarding call & explain the full process",
            details: [
              "Call the customer after they subscribe.",
              "Explain the complete implementation: Menu, Payment, WhatsApp, Delivery, Marketing, Go Live.",
              "Set expectations and approximate timelines; tell them you'll stay in touch throughout.",
            ],
          },
          {
            id: "p1_basic",
            label: "Collect Restaurant Name & Owner Name",
            details: [
              "Record the exact Restaurant Name.",
              "Record the Owner Name.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "p23",
    label: "Phase 2",
    title: "Menu Setup",
    intro: "Tasks depend on the Petpooja decision from Phase 1.",
    groups: [
      {
        id: "g_petpooja",
        label: "Petpooja Integration",
        showWhen: { key: "petpooja", value: "yes" },
        tasks: [
          {
            id: "pp_details",
            label: "Collect Petpooja ID, email, Maps, tax type & menu type",
            details: [
              "Collect Petpooja Restaurant ID and registered email.",
              "Collect the Google Maps location.",
              "Tax Type — Backward (price already includes GST, no extra tax) or Forward (GST added separately at billing).",
              "Menu Type — Online or Offline (most restaurants use Offline).",
            ],
          },
          {
            id: "pp_create",
            label: "Super Admin → Create Petpooja Partner → submit",
            details: [
              "In Super Admin, open Create Petpooja Partner.",
              "Enter the collected details and Submit.",
              "Email + website are created automatically.",
            ],
          },
          {
            id: "pp_approval",
            label: "Wait for Petpooja approval (track in Excel)",
            details: [
              "Petpooja team reviews the request.",
              "Track in Excel: Restaurant Name, Petpooja ID, Email Sent Date, Approval Status, Menu Sync Status, Remarks.",
              "Contact the Petpooja point-of-contact to speed it up.",
            ],
          },
          {
            id: "pp_sync",
            label: "Verify synced menu — items, prices, tax, images",
            details: [
              "Once approved, Petpooja pushes the menu to Menuza.",
              "Verify Categories, Items, Variants, Prices, Tax, Availability and Images all synced correctly.",
            ],
          },
          {
            id: "pp_verify",
            label: "Customer verifies & rearranges menu (top sellers on top)",
            details: [
              "Customer verifies Prices, Names, Categories, Availability, Taxes and Spellings.",
              "Ask the customer to rearrange the menu — top-selling, profitable, chef picks and signature dishes on top.",
            ],
          },
          {
            id: "pp_creds",
            label: "Send credentials & partner app links",
            details: [
              "After menu approval, send the login credentials.",
              "Send the partner app links (Play Store / App Store).",
            ],
          },
        ],
      },
      {
        id: "g_manual",
        label: "Manual Menu",
        showWhen: { key: "petpooja", value: "no" },
        tasks: [
          {
            id: "mn_details",
            label: "Collect menu (PDF/photos/Excel), logo & Maps location",
            details: [
              "Collect the menu as PDF, photos or Excel.",
              "Collect the logo and the Google Maps location.",
            ],
          },
          {
            id: "mn_create",
            label: "menuthere.com → enter name, upload menu & logo, create",
            details: [
              "Go to menuthere.com and enter the restaurant name.",
              "Upload the menu and logo, then Create.",
            ],
          },
          {
            id: "mn_images",
            label: "Generate food images from Menu Management",
            details: [
              "Generate food images from Menu Management.",
              "Upload optimized images if the customer asks.",
            ],
          },
          {
            id: "mn_verify",
            label: "Customer verifies & rearranges menu → approved",
            details: [
              "Customer checks Names, Descriptions, Pricing, Categories and Availability.",
              "Rearrange menu; apply corrections → menu approved.",
            ],
          },
          {
            id: "mn_creds",
            label: "Send credentials & partner app links",
            details: ["Send login credentials and partner app links after approval."],
          },
        ],
      },
    ],
  },
  {
    id: "p45",
    label: "Phase 3",
    title: "Payment & WhatsApp",
    intro: "These two run in parallel.",
    parallel: true,
    choices: [
      {
        key: "payment",
        question: "Does the customer need online payment (Cashfree)?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No — skip Cashfree" },
        ],
      },
    ],
    groups: [
      {
        id: "g_cashfree",
        label: "Cashfree (Payment)",
        showWhen: { key: "payment", value: "yes" },
        tasks: [
          {
            id: "cf_details",
            label: "Collect email & phone; set website",
            details: [
              "Collect Email and Phone Number.",
              "Website is set as menuthere.com/user/home.",
            ],
          },
          {
            id: "cf_create",
            label: "Create Cashfree merchant (partner.cashfree.com)",
            details: [
              "Login at partner.cashfree.com.",
              "Create Merchant, fill the details and Save.",
            ],
          },
          {
            id: "cf_kyc",
            label: "Send KYC link & collect docs (GST, cheque, Aadhaar, PAN)",
            details: [
              "Send the KYC link to the customer.",
              "Required docs: GST, Shop Establishment, Cancelled Cheque/Passbook, Aadhaar, PAN.",
            ],
          },
          {
            id: "cf_monitor",
            label: "Monitor KYC until approved",
            details: [
              "Approved → continue.",
              "Rejected → fix the documents and resubmit.",
              "Email Cashfree to speed up if needed.",
            ],
          },
        ],
      },
      {
        id: "g_whatsapp",
        label: "WhatsApp Business",
        tasks: [
          {
            id: "wa_prereq",
            label: "Ensure FB Account, Page & Business Portfolio are ready",
            details: [
              "Required before connecting WhatsApp Business.",
              "Scenario A — all ready → proceed.",
              "Scenario B (FB account only) — tutorial video; create Page & Portfolio, profile pic, business info, 3 posts, wait 24h.",
              "Scenario C (no FB account) — create Account, Page & Portfolio, upload info, publish posts daily, wait ~3 days.",
            ],
          },
          {
            id: "wa_connect",
            label: "Login on laptop → Dashboard → Settings → Select Own WhatsApp",
            details: [
              "Login to menuthere.com with credentials on a laptop (never mobile).",
              "Dashboard → Settings → Delivery App → Select Own WhatsApp.",
              "Click Connect WhatsApp Business Account (Meta signup opens).",
            ],
          },
          {
            id: "wa_qr",
            label: "Meta signup → enter business details → scan QR",
            details: [
              "Enter Business Name, Timezone, WhatsApp Phone, Display Name → Continue.",
              "Facebook Business messages your connected WhatsApp number.",
              "Click Connect → QR code appears → scan the QR.",
            ],
          },
          {
            id: "wa_verify",
            label: "Verify WhatsApp connected (green status, no errors)",
            details: [
              "Finish → redirect back to Menuthere.",
              "Verify: WhatsApp Connected (Green status), no errors.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "p7",
    label: "Phase 4",
    title: "Enable Flows",
    groups: [
      {
        id: "g_flows",
        tasks: [
          {
            id: "fl_enable",
            label: "Enable every toggle in WhatsApp → Flows",
            details: [
              "After WhatsApp connection, go to WhatsApp → Flows.",
              "Enable every toggle — all flows & automations for smooth order processing.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "p9",
    label: "Phase 5",
    title: "Delivery Settings",
    groups: [
      {
        id: "g_settings",
        label: "Delivery Settings",
        tasks: [
          {
            id: "ds_settings",
            label: "Set radius, min order, charges & acceptance rules",
            details: [
              "Set Delivery Radius.",
              "Set Minimum Order Amount.",
              "Set Delivery Charges.",
              "Set Order Acceptance Rules (ask customer name, location detail).",
            ],
          },
          {
            id: "ds_verify",
            label: "Verify all delivery settings",
            details: ["Verify all delivery settings are correct."],
          },
        ],
      },
    ],
  },
  {
    id: "p8",
    label: "Phase 6",
    title: "Delivery Configuration",
    intro: "Choose the delivery model — tasks appear based on the choice.",
    choices: [
      {
        key: "delivery",
        question: "Which delivery model?",
        options: [
          { value: "v1", label: "V1 — Own riders" },
          { value: "v2", label: "V2 — Own + community" },
          { value: "v3", label: "Third party (Porter/Rapido)" },
        ],
      },
    ],
    groups: [
      {
        id: "g_v1",
        label: "V1 — Own Riders",
        showWhen: { key: "delivery", value: "v1" },
        tasks: [
          {
            id: "v1_flow",
            label: "Confirm flow: Order → Accept → Dispatch → Rider → Delivered",
            details: [
              "Restaurant uses its own riders.",
              "Flow: Order → Accept → Dispatch → Manager assigns rider → Rider accepts → Delivered.",
            ],
          },
          {
            id: "db_create",
            label: "Create delivery boys in Petpooja & same in Menuthere",
            details: [
              "Send the tutorial video.",
              "Customer creates delivery boys in Petpooja.",
              "Create the same delivery boys in Menuthere.",
            ],
          },
          {
            id: "db_match",
            label: "Verify delivery boy Name & Phone match exactly",
            details: [
              "Verify Name & Phone Number match exactly in both systems.",
              "If they don't match, orders won't route to riders.",
            ],
          },
        ],
      },
      {
        id: "g_v2",
        label: "V2 — Own + Community",
        showWhen: { key: "delivery", value: "v2" },
        tasks: [
          {
            id: "v2_register",
            label: "Riders self-register; nearby riders (5 KM) get notified",
            details: [
              "Riders self-register.",
              "Nearby riders within 5 KM get notified of the order.",
            ],
          },
          {
            id: "v2_accept",
            label: "Interested riders accept → delivery starts",
            details: ["Interested riders accept the order; delivery starts."],
          },
        ],
      },
      {
        id: "g_v3",
        label: "Third Party",
        showWhen: { key: "delivery", value: "v3" },
        tasks: [
          {
            id: "v3_enable",
            label: "Enable Porter & Rapido (Dev Admin configures)",
            details: ["Enable Porter & Rapido; Dev Admin configures the integration."],
          },
          {
            id: "v3_connect",
            label: "Connect account · recharge · verify integration",
            details: [
              "Connect the provider account.",
              "Recharge the account and verify the integration works.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "p11",
    label: "Phase 7",
    title: "Marketing & Testing",
    groups: [
      {
        id: "g_marketing",
        label: "Marketing Materials",
        tasks: [
          {
            id: "mk_qr",
            label: "Generate WhatsApp QR code",
            details: [
              "QR opens wa.me/PhoneNumber?text=Hi.",
              "Scanning opens WhatsApp with 'Hi' prefilled; sending returns the ordering link.",
            ],
          },
          {
            id: "mk_print",
            label: "Create QR stand & restaurant poster",
            details: ["Create the QR stand and the restaurant poster."],
          },
        ],
      },
      {
        id: "g_testing",
        label: "Testing",
        tasks: [
          {
            id: "test_order",
            label: "Place test order — check menu, tax & payment",
            details: ["Place a test order; confirm menu, tax and payment are correct end to end."],
          },
          {
            id: "test_delivery",
            label: "Verify delivery radius, charges & delivery success",
            details: [
              "Order inside radius → accepted; outside → blocked.",
              "Delivery charge at checkout matches the configured charge.",
              "Confirm the delivery completes successfully.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "p13",
    label: "Phase 8",
    title: "Go Live",
    groups: [
      {
        id: "g_golive",
        tasks: [
          {
            id: "qa_check",
            label: "Final QA — confirm everything is tested & working",
            details: [
              "Website, Menu, Images, Petpooja Sync, Cashfree, WhatsApp, Flows.",
              "Delivery working, Riders working, QR working, Poster delivered.",
              "Test order placed, Payment success, Delivery success.",
            ],
          },
          {
            id: "qa_approve",
            label: "Restaurant approved",
            details: ["Confirm the restaurant is approved and ready to go live."],
          },
          {
            id: "go_live",
            label: "🚀 Go Live — restaurant is officially live",
            details: [
              "Restaurant is officially live.",
              "Can receive & accept orders, take payments, dispatch deliveries, get WhatsApp & QR orders, run daily operations.",
            ],
          },
        ],
      },
    ],
  },
];

export const PHASE_BY_ID = new Map(PHASES.map((p) => [p.id, p]));

export function phaseIndex(phaseId: string | undefined): number {
  if (!phaseId) return 0;
  const i = PHASES.findIndex((p) => p.id === phaseId);
  return i < 0 ? 0 : i;
}

export function currentPhase(phaseId: string | undefined): Phase {
  return PHASES[phaseIndex(phaseId)];
}

// "key:value" decision tokens ------------------------------------------------
export function getChoice(choices: string[], key: string): string | undefined {
  const pre = key + ":";
  const found = choices.find((c) => c.startsWith(pre));
  return found ? found.slice(pre.length) : undefined;
}
export function setChoiceTokens(choices: string[], key: string, value: string): string[] {
  const pre = key + ":";
  return [...choices.filter((c) => !c.startsWith(pre)), pre + value];
}

// Which groups are visible for the current decisions.
export function visibleGroups(phase: Phase, choices: string[]): PGroup[] {
  return phase.groups.filter(
    (g) => !g.showWhen || getChoice(choices, g.showWhen.key) === g.showWhen.value,
  );
}
export function visibleTasks(phase: Phase, choices: string[]): PTask[] {
  return visibleGroups(phase, choices).flatMap((g) => g.tasks);
}

// A phase is complete when every required decision is answered and every visible
// task is checked.
export function phaseComplete(
  phase: Phase,
  choices: string[],
  done: Set<string>,
): boolean {
  const choicesAnswered = (phase.choices ?? []).every(
    (c) => getChoice(choices, c.key) !== undefined,
  );
  if (!choicesAnswered) return false;
  const tasks = visibleTasks(phase, choices);
  return tasks.every((t) => done.has(t.id));
}

export function phaseTaskCounts(
  phase: Phase,
  choices: string[],
  done: Set<string>,
): { done: number; total: number } {
  const tasks = visibleTasks(phase, choices);
  return { done: tasks.filter((t) => done.has(t.id)).length, total: tasks.length };
}

// All task ids defined in a phase (across every group, regardless of visibility).
export function phaseTaskIds(phase: Phase): string[] {
  return phase.groups.flatMap((g) => g.tasks.map((t) => t.id));
}
// All decision keys that belong to a phase.
export function phaseChoiceKeys(phase: Phase): string[] {
  return (phase.choices ?? []).map((c) => c.key);
}

const reviews = [
  { id: "RAI-2041", registryId: "AIR-0138", name: "Customer propensity model", owner: "Growth Analytics", lifecycle: "Deployment", status: "Evidence requested", tone: "evidence", updated: "Due Aug 29", progress: 62, risk: "Medium" },
  { id: "RAI-2038", registryId: "AIR-0132", name: "Claims document assistant", owner: "Insurance Operations", lifecycle: "Deployment", status: "In assessment", tone: "review", updated: "Updated 3h ago", progress: 45, risk: "High" },
  { id: "RAI-2029", registryId: "AIR-0127", name: "Employee mobility matcher", owner: "People Intelligence", lifecycle: "POC", status: "Auditor review", tone: "review", updated: "Assigned yesterday", progress: 18, risk: "Low" },
];

const approvedPocs = [
  { id: "RAI-1984", name: "Customer propensity model", owner: "Growth Analytics", approved: "Jun 12", controls: 86 },
  { id: "RAI-1962", name: "Claims document assistant", owner: "Insurance Operations", approved: "May 27", controls: 92 },
];

const queue = [
  { id: "RAI-2047", registryId: "AIR-0142", name: "Transaction anomaly model", org: "Payments", lifecycle: "Deployment", risk: "High", stage: "Auditor review", sla: "8h left", tags: ["urgent"] },
  { id: "RAI-2041", registryId: "AIR-0138", name: "Customer propensity model", org: "Growth Analytics", lifecycle: "Deployment", risk: "Medium", stage: "Evidence", sla: "19h left", tags: ["urgent", "evidence"] },
  { id: "RAI-2038", registryId: "AIR-0132", name: "Claims document assistant", org: "Insurance Operations", lifecycle: "Deployment", risk: "High", stage: "Assessment", sla: "2d left", tags: [] },
  { id: "RAI-2033", registryId: "AIR-0129", name: "Support response copilot", org: "Customer Care", lifecycle: "POC", risk: "Medium", stage: "Evidence", sla: "3d left", tags: ["evidence"] },
  { id: "RAI-2029", registryId: "AIR-0127", name: "Employee mobility matcher", org: "People Intelligence", lifecycle: "POC", risk: "Low", stage: "Auditor review", sla: "4d left", tags: [] },
];

const notifications = [
  { id: "N-A1", roles: ["auditor"], reviewId: "RAI-2038", auditorId: "priya", kind: "assignment", icon: "↗", title: "Deployment review assigned", message: "Claims document assistant is ready for your assessment.", time: "4 min ago", unread: true },
  { id: "N-A2", roles: ["auditor"], reviewId: "RAI-2041", kind: "evidence", icon: "?", title: "Evidence response pending", message: "Growth Analytics is preparing the requested drift threshold and investigation example.", time: "38 min ago", unread: true },
  { id: "N-A3", roles: ["auditor"], reviewId: "RAI-2038", kind: "deadline", icon: "!", title: "Review is approaching its SLA", message: "Claims document assistant has used 80% of the configured auditor review timeline.", time: "2 h ago", unread: false },
  { id: "N-U1", roles: ["user"], reviewId: "RAI-2041", kind: "evidence", icon: "?", title: "Additional evidence requested", message: "Priya needs the current drift threshold and a triggered investigation example.", time: "12 min ago", unread: true },
  { id: "N-U2", roles: ["user"], reviewId: "RAI-2029", kind: "assignment", icon: "↗", title: "Auditor review started", message: "Employee mobility matcher is now assigned to the responsible AI audit team.", time: "Yesterday", unread: false },
  { id: "N-U3", roles: ["user"], reviewId: "RAI-1984", kind: "decision", icon: "✓", title: "POC review approved", message: "Customer propensity model can now be continued as a deployment review.", time: "Jun 12", unread: false },
  { id: "N-M1", roles: ["admin"], reviewId: "RAI-2047", kind: "deadline", icon: "!", title: "Two reviews are at breach risk", message: "The Lead Auditor has visibility of the reviews approaching their service deadline.", time: "8 min ago", unread: true },
  { id: "N-M2", roles: ["admin"], kind: "assignment", icon: "↗", title: "Team lead designated", message: "Priya Shah manages assignment for Responsible AI Assurance.", time: "1 h ago", unread: false },
];

const roleProfiles = {
  user: { label: "Submitter", eyebrow: "SUBMITTER WORKSPACE", title: "Your AI reviews", name: "Aarav Mehta", role: "Submitter", avatar: "AM", health: "92%", groups: ["All groups", "R&D"] },
  auditor: { label: "Auditor", eyebrow: "AUDITOR WORKSPACE", title: "Review operations", name: "Priya Shah", role: "Lead Auditor", avatar: "PS", health: "88%", groups: ["All groups", "Responsible AI Auditors"] },
  admin: { label: "Admin", eyebrow: "ADMIN CONSOLE", title: "Workflow configuration", name: "Maya Nair", role: "Platform admin", avatar: "MN", health: "95%", groups: ["All groups", "All managed audiences"] },
};

let processStages = [
  { id: "intake", name: "Intake & classification", detail: "Validate submission and determine risk tier", owner: "Responsible AI Office", role: "TRIAGE", days: 1 },
  { id: "business", name: "Business owner review", detail: "Confirm purpose, impact, and accountable owner", owner: "Submitting group", role: "APPROVE", days: 2 },
  { id: "assessment", name: "Responsible AI assessment", detail: "Assess controls and annotate the workbook", owner: "Responsible AI Auditors", role: "ASSESS", days: 5 },
  { id: "evidence", name: "Evidence response", detail: "Provide additional answers and supporting files", owner: "Submitting group", role: "RESPOND", days: 5 },
  { id: "decision", name: "Decision & sign-off", detail: "Record outcome, conditions, and final evidence", owner: "Responsible AI Office", role: "DECIDE", days: 2 },
];

let registryFieldDefinitions = [
  { key: "name", label: "AI use case name", type: "text", required: true, core: true, help: "The recognizable name used across reviews." },
  { key: "brief", label: "Simple brief", type: "textarea", required: true, help: "A short description of purpose and intended users." },
  { key: "techOwner", label: "Technical owner", type: "person", required: true, help: "Accountable for implementation and operation." },
  { key: "businessOwner", label: "Business owner", type: "person", required: true, help: "Accountable for business purpose and outcomes." },
  { key: "lifecycle", label: "Lifecycle", type: "select", required: true, options: ["Ideation", "Proof of concept", "Pilot", "Pre-production", "Production", "Retired"], help: "Current maturity of the AI use case." },
];

let registryEntries = [
  { id: "AIR-0142", name: "Transaction anomaly model", brief: "Flags unusual payment activity for investigation by fraud operations.", techOwner: "Priya Nandan", businessOwner: "Marcus Webb", lifecycle: "Production", group: "Payments", updated: "Aug 26", values: {} },
  { id: "AIR-0138", name: "Customer propensity model", brief: "Predicts likely product interest to support relevant customer outreach.", techOwner: "Rohan Iyer", businessOwner: "Aarav Mehta", lifecycle: "Production", group: "R&D", updated: "Aug 24", values: {} },
  { id: "AIR-0132", name: "Claims document assistant", brief: "Summarizes submitted claims documents for operations reviewers.", techOwner: "Lina Chen", businessOwner: "Marcus Webb", lifecycle: "Pre-production", group: "Commercial", updated: "Aug 21", values: {} },
  { id: "AIR-0129", name: "Support response copilot", brief: "Drafts customer support responses using approved service knowledge.", techOwner: "Jon Lee", businessOwner: "Maya Nair", lifecycle: "Pilot", group: "Commercial", updated: "Aug 19", values: {} },
  { id: "AIR-0127", name: "Employee mobility matcher", brief: "Suggests internal opportunities based on skills and stated career interests.", techOwner: "Neha Rao", businessOwner: "Aarav Mehta", lifecycle: "Proof of concept", group: "R&D", updated: "Aug 18", values: {} },
];

let adminNews = [
  { id: 1, title: "New deployment evidence standard", summary: "Updated evidence requirements take effect on September 15.", audience: "All groups", status: "published", timing: "Published Aug 24", attachments: ["deployment-standard.pdf"] },
  { id: 2, title: "Responsible AI office hours", summary: "Weekly review clinic for teams preparing a POC submission.", audience: "R&D · Commercial", status: "published", timing: "Published Aug 20", attachments: ["office-hours-banner.png"] },
  { id: 3, title: "Q3 policy refresh", summary: "Draft notice for owners of high-risk model reviews.", audience: "Model owners", status: "draft", timing: "Edited 2h ago", attachments: [] },
  { id: 4, title: "Auditor calibration: evidence sufficiency", summary: "Use the updated calibration examples for assessments starting this week.", audience: "Responsible AI Auditors", status: "published", timing: "Published Aug 26", attachments: ["evidence-calibration-examples.pdf"] },
];

let libraryResources = [
  { id: 1, title: "Responsible AI policy", file: "PDF · v3.2", collection: "Policy", audience: ["All groups"], owner: "RAI Office", review: "Oct 12" },
  { id: 2, title: "Assessment workbook", file: "XLSX · v4.1", collection: "Template", audience: ["R&D", "Commercial"], owner: "Model Risk", review: "Sep 03" },
  { id: 3, title: "Evidence quality guide", file: "PDF · v2.0", collection: "Guidance", audience: ["R&D"], owner: "RAI Office", review: "Nov 18" },
  { id: 4, title: "Deployment sign-off checklist", file: "DOCX · v1.6", collection: "Template", audience: ["Commercial"], owner: "Governance", review: "Sep 19" },
  { id: 5, title: "Auditor decision guide", file: "PDF · v2.3", collection: "Guidance", audience: ["Responsible AI Auditors"], owner: "RAI Office", review: "Dec 04" },
];

let directoryGroups = [
  { id: 1, name: "RAI-Admins", externalId: "Entra security group", role: "Admin", scope: "Entire organization", members: 6, sync: "6 min ago" },
  { id: 2, name: "RAI-Auditors", externalId: "Entra security group", role: "Auditor", scope: "Assigned reviews and team responsibilities", members: 5, sync: "6 min ago" },
  { id: 3, name: "RAI-Submitters", externalId: "Entra security group", role: "Submitter", scope: "Owned and shared submissions", members: 115, sync: "7 min ago" },
];

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
let submissionLifecycle = "poc";
let deploymentPath = "reuse";
let currentWorkspacePage = "overview";
let registerFilter = "all";
let notificationFilter = "all";
let adminNewsFilter = "all";
let activeAdminModal = null;
let draggedStageId = null;
let libraryReaderFilter = "all";
let activeRegistryRecord = null;
let registryModalReadOnly = false;
let registryOpenedFromReview = false;

function closeThemedSelects(except = null) {
  $$(".themed-select.open").forEach((wrapper) => {
    if (wrapper === except) return;
    wrapper.classList.remove("open", "open-up");
    $(".themed-select-menu", wrapper).hidden = true;
    $(".themed-select-trigger", wrapper).setAttribute("aria-expanded", "false");
  });
}

function buildThemedSelectMenu(select) {
  const wrapper = select.closest(".themed-select");
  if (!wrapper) return;
  const menu = $(".themed-select-menu", wrapper);
  menu.innerHTML = [...select.options].map((option, index) => `
    <button type="button" class="themed-select-option ${option.selected ? "selected" : ""}" role="option" aria-selected="${option.selected}" data-option-index="${index}" ${option.disabled ? "disabled" : ""}>
      <span>${escapeHtml(option.textContent)}</span><i aria-hidden="true">✓</i>
    </button>`).join("");
  const selected = select.selectedOptions[0];
  const trigger = $(".themed-select-trigger", wrapper);
  $(".themed-select-value", trigger).textContent = selected?.textContent || "Select an option";
  trigger.classList.toggle("placeholder", !select.value);
  trigger.disabled = select.disabled;
  trigger.setAttribute("aria-invalid", String(select.required && !select.value));
}

function refreshThemedSelect(select) {
  if (!select.dataset.themeEnhanced) enhanceSelect(select);
  else buildThemedSelectMenu(select);
}

function enhanceSelect(select) {
  if (select.multiple || select.dataset.themeEnhanced) return;
  select.dataset.themeEnhanced = "true";
  select.classList.add("themed-select-native");
  const wrapper = document.createElement("div");
  wrapper.className = "themed-select";
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "themed-select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.innerHTML = '<span class="themed-select-value"></span><i class="themed-select-chevron" aria-hidden="true"></i>';
  wrapper.appendChild(trigger);

  const menu = document.createElement("div");
  menu.className = "themed-select-menu";
  menu.setAttribute("role", "listbox");
  menu.hidden = true;
  wrapper.appendChild(menu);

  trigger.addEventListener("click", () => {
    const opening = !wrapper.classList.contains("open");
    closeThemedSelects(opening ? wrapper : null);
    wrapper.classList.toggle("open", opening);
    const spaceBelow = window.innerHeight - wrapper.getBoundingClientRect().bottom;
    wrapper.classList.toggle("open-up", opening && spaceBelow < 230);
    menu.hidden = !opening;
    trigger.setAttribute("aria-expanded", String(opening));
    if (opening) setTimeout(() => $(".themed-select-option.selected", menu)?.focus(), 0);
  });
  trigger.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (!wrapper.classList.contains("open")) trigger.click();
  });
  menu.addEventListener("click", (event) => {
    const optionButton = event.target.closest("[data-option-index]");
    if (!optionButton || optionButton.disabled) return;
    select.selectedIndex = Number(optionButton.dataset.optionIndex);
    select.dispatchEvent(new Event("change", { bubbles: true }));
    buildThemedSelectMenu(select);
    closeThemedSelects();
    trigger.focus();
  });
  menu.addEventListener("keydown", (event) => {
    const options = $$(".themed-select-option:not(:disabled)", menu);
    const index = options.indexOf(document.activeElement);
    if (event.key === "Escape") { closeThemedSelects(); trigger.focus(); }
    if (event.key === "ArrowDown") { event.preventDefault(); options[(index + 1) % options.length]?.focus(); }
    if (event.key === "ArrowUp") { event.preventDefault(); options[(index - 1 + options.length) % options.length]?.focus(); }
  });
  select.addEventListener("change", () => buildThemedSelectMenu(select));
  select.addEventListener("focus", () => trigger.focus());
  select.addEventListener("invalid", () => {
    trigger.setAttribute("aria-invalid", "true");
    trigger.focus();
  });
  buildThemedSelectMenu(select);
}

function enhanceAllSelects(scope = document) {
  $$("select:not([multiple])", scope).forEach(enhanceSelect);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(name) {
  return (name.split(".").pop() || "FILE").toUpperCase();
}

function renderSelectedFiles(input) {
  const preview = $("#adminAttachmentPreview");
  if (!preview) return;
  const files = [...input.files];
  const maxBytes = input.id === "resourceFileInput" ? 50 * 1024 * 1024 : 25 * 1024 * 1024;
  const oversized = files.find((file) => file.size > maxBytes);
  if (oversized) {
    input.value = "";
    preview.hidden = true;
    showToast("File is too large", `${oversized.name} exceeds the ${input.id === "resourceFileInput" ? "50" : "25"} MB limit.`, "!");
    return;
  }
  preview.innerHTML = files.map((file) => `
    <div class="selected-file">
      <span class="selected-file-icon ${file.type.startsWith("image/") ? "image" : ""}">${file.type.startsWith("image/") ? "IMG" : escapeHtml(fileKind(file.name))}</span>
      <span><strong>${escapeHtml(file.name)}</strong><small>${formatFileSize(file.size)} · Ready to attach</small></span>
      <b>✓</b>
    </div>`).join("");
  preview.hidden = files.length === 0;
  const uploader = input.closest(".file-upload-control");
  if (uploader) uploader.classList.toggle("has-files", files.length > 0);
}

function markAdminChanged(message = "Unpublished changes") {
  const state = $("#adminDraftState");
  state.textContent = message;
  state.classList.add("changed");
}

function updateCycleDays() {
  $("#cycleDays").textContent = `${processStages.reduce((sum, stage) => sum + (Number(stage.days) || 0), 0)} days`;
}

function renderProcessStages() {
  $("#timelineBuilder").innerHTML = processStages.map((stage, index) => `
    <div class="timeline-stage" data-stage-id="${stage.id}" draggable="true">
      <span class="stage-drag" title="Drag to reorder">⠿</span>
      <span class="stage-index">${String(index + 1).padStart(2, "0")}</span>
      <div class="stage-copy"><strong>${escapeHtml(stage.name)}</strong><small>${escapeHtml(stage.detail)}</small></div>
      <div class="stage-owner"><strong>${escapeHtml(stage.owner)}</strong><small>Owner group</small></div>
      <span class="stage-rule">${escapeHtml(stage.role)}</span>
      <label><input class="stage-days" type="number" min="1" max="30" value="${stage.days}" aria-label="Days for ${escapeHtml(stage.name)}" /><span>days</span></label>
      <button class="stage-menu" data-edit-stage="${stage.id}" aria-label="Edit ${escapeHtml(stage.name)}">•••</button>
    </div>${index < processStages.length - 1 ? '<div class="timeline-connector"><i></i></div>' : ""}
  `).join("");
  updateCycleDays();
}

function renderAdminNews() {
  const query = $("#newsSearch")?.value.trim().toLowerCase() || "";
  const items = adminNews.filter((item) => (adminNewsFilter === "all" || item.status === adminNewsFilter) && (!query || `${item.title} ${item.summary} ${item.audience}`.toLowerCase().includes(query)));
  $("#newsAdminList").innerHTML = items.length ? items.map((item) => `
    <div class="content-card">
      <span class="content-symbol">N</span>
      <div class="content-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.summary)}</small>${item.attachments?.length ? `<span class="attachment-note">⌁ ${item.attachments.length} attachment${item.attachments.length > 1 ? "s" : ""}</span>` : ""}</div>
      <div class="content-meta"><strong>${escapeHtml(item.audience)}</strong><small>Audience</small></div>
      <div><span class="publish-state ${item.status}">${item.status === "published" ? "Published" : "Draft"}</span><div class="content-meta"><small>${escapeHtml(item.timing)}</small></div></div>
      <button class="row-menu" data-edit-news="${item.id}" aria-label="Edit ${escapeHtml(item.title)}">•••</button>
    </div>`).join("") : '<div class="empty-admin">No news matches this view.</div>';
  $("#newsTabCount").textContent = adminNews.length;
}

function renderLibrary() {
  const query = $("#librarySearch")?.value.trim().toLowerCase() || "";
  const collection = $("#libraryCollectionFilter")?.value || "all";
  const items = libraryResources.filter((item) => (collection === "all" || item.collection === collection) && (!query || `${item.title} ${item.collection} ${item.owner}`.toLowerCase().includes(query)));
  $("#libraryAdminList").innerHTML = items.length ? items.map((item) => `
    <div class="library-row">
      <div class="resource-title"><span class="resource-icon">${escapeHtml(item.file.split(" ")[0])}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.file)}</small></span></div>
      <span class="collection-pill">${escapeHtml(item.collection)}</span>
      <div class="audience-tags">${item.audience.map((group) => `<span>${escapeHtml(group)}</span>`).join("")}</div>
      <div class="cell-detail"><strong>${escapeHtml(item.owner)}</strong><small>Review ${escapeHtml(item.review)}</small></div>
      <button class="row-menu" data-edit-resource="${item.id}" aria-label="Edit ${escapeHtml(item.title)}">•••</button>
    </div>`).join("") : '<div class="empty-admin">No library resources match this view.</div>';
  $("#libraryTabCount").textContent = libraryResources.length;
}

function renderGroups() {
  $("#groupAdminList").innerHTML = directoryGroups.map((group) => `
    <div class="group-row">
      <div class="group-name"><span class="group-glyph">◎</span><span><strong>${escapeHtml(group.name)}</strong><small>${escapeHtml(group.externalId)}</small></span></div>
      <span class="role-chip ${group.role.toLowerCase()}">${escapeHtml(group.role)}</span>
      <span>${escapeHtml(group.scope)}</span>
      <strong>${group.members}</strong>
      <span class="sync-time">✓ ${escapeHtml(group.sync)}</span>
      <button class="row-menu" data-edit-group="${group.id}" aria-label="Edit ${escapeHtml(group.name)} mapping">•••</button>
    </div>`).join("");
  $("#groupTabCount").textContent = directoryGroups.length;
}

function registryValue(entry, field) {
  return entry[field.key] ?? entry.values?.[field.key] ?? "";
}

function registryEntryReady(entry) {
  return registryFieldDefinitions.filter((field) => field.required).every((field) => String(registryValue(entry, field)).trim());
}

function visibleRegistryEntries() {
  const role = document.body.dataset.role;
  if (role !== "user") return registryEntries;
  return registryEntries.filter((entry) => entry.group === "R&D" || entry.businessOwner === roleProfiles.user.name);
}

function registryTypeLabel(type) {
  return ({ text: "Short text", textarea: "Long text", person: "People picker", select: "Select", date: "Date" })[type] || type;
}

function renderRegistryFieldsAdmin() {
  $("#registryFieldAdminList").innerHTML = registryFieldDefinitions.map((field) => `
    <div class="registry-field-row" data-registry-field="${field.key}">
      <div class="registry-field-name"><span>${field.type === "person" ? "ID" : field.type === "select" ? "⌄" : "Aa"}</span><div><strong>${escapeHtml(field.label)}</strong><small>${escapeHtml(field.help || "Custom registry field")}</small></div></div>
      <span class="field-type-chip">${escapeHtml(registryTypeLabel(field.type))}</span>
      <span class="field-options-copy">${field.type === "select" ? escapeHtml((field.options || []).join(" · ")) : field.type === "person" ? "Synced directory people" : "Free-form value"}</span>
      <span class="required-chip ${field.required ? "" : "optional"}">${field.required ? "Required" : "Optional"}</span>
      <div class="registry-field-actions"><button data-edit-registry-field="${field.key}" aria-label="Edit ${escapeHtml(field.label)}">•••</button><button class="remove" data-remove-registry-field="${field.key}" ${field.core ? "disabled" : ""} aria-label="Remove ${escapeHtml(field.label)}">×</button></div>
    </div>`).join("");
  $("#registryFieldTabCount").textContent = registryFieldDefinitions.length;
  $("#requiredRegistryFieldCount").textContent = registryFieldDefinitions.filter((field) => field.required).length;
}

function renderRegistryRecords() {
  const query = $("#registrySearch").value.trim().toLowerCase();
  const visible = visibleRegistryEntries();
  const items = visible.filter((entry) => !query || `${entry.id} ${entry.name} ${entry.techOwner} ${entry.businessOwner} ${entry.lifecycle}`.toLowerCase().includes(query));
  const ready = visible.filter(registryEntryReady);
  $("#registryCount").textContent = visible.length;
  $("#registryReadyCount").textContent = ready.length;
  $("#registryTotalMetric").textContent = visible.length;
  $("#registryTechOwnerMetric").textContent = new Set(visible.map((entry) => entry.techOwner)).size;
  $("#registryLifecycleMetric").textContent = new Set(visible.map((entry) => entry.lifecycle)).size;
  $("#registryRoleNote").textContent = document.body.dataset.role === "auditor" ? "Read-only view across registered AI use cases" : "Showing use cases available to your directory groups";
  $("#registryRecordList").innerHTML = items.length ? items.map((entry) => {
    const readyState = registryEntryReady(entry);
    return `<div class="registry-record-row">
      <div class="registry-record-title"><strong>${escapeHtml(entry.name)}</strong><small>${entry.id} · ${escapeHtml(entry.brief)}</small></div>
      <span class="registry-lifecycle">${escapeHtml(entry.lifecycle)}</span>
      <div class="registry-owner"><strong>${escapeHtml(entry.techOwner)}</strong><small>Technical</small></div>
      <div class="registry-owner"><strong>${escapeHtml(entry.businessOwner)}</strong><small>Business</small></div>
      <span class="registry-ready ${readyState ? "" : "incomplete"}">${readyState ? "Ready" : "Incomplete"}</span>
      <button class="registry-record-action" data-open-registry="${entry.id}">${document.body.dataset.role === "auditor" ? "View" : "Edit"}</button>
    </div>`;
  }).join("") : '<div class="empty-admin">No registry records match your search.</div>';
}

function registryFieldControl(field, entry, readOnly) {
  const value = registryValue(entry || {}, field);
  const required = field.required ? "required" : "";
  const disabled = readOnly ? "disabled" : "";
  const label = `${escapeHtml(field.label)}${field.required ? ' <span>*</span>' : ""}`;
  if (field.type === "textarea") return `<label class="registry-form-field wide">${label}<textarea name="${field.key}" ${required} ${disabled} placeholder="${escapeHtml(field.help || "Add details")}">${escapeHtml(value)}</textarea></label>`;
  if (field.type === "select") return `<label class="registry-form-field">${label}<select name="${field.key}" ${required} ${disabled}><option value="">Select an option</option>${(field.options || []).map((option) => `<option ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></label>`;
  if (field.type === "person") {
    const people = ["Aarav Mehta", "Rohan Iyer", "Priya Shah", "Lina Chen", "Neha Rao", "Marcus Webb"];
    if (value && !people.includes(value)) people.unshift(value);
    return `<label class="registry-form-field">${label}<select name="${field.key}" ${required} ${disabled}><option value="">Choose from directory</option>${people.map((person) => `<option ${person === value ? "selected" : ""}>${escapeHtml(person)}</option>`).join("")}</select></label>`;
  }
  return `<label class="registry-form-field ${field.key === "name" ? "wide" : ""}">${label}<input name="${field.key}" type="${field.type === "date" ? "date" : "text"}" value="${escapeHtml(value)}" ${required} ${disabled} placeholder="${escapeHtml(field.help || "Enter value")}" /></label>`;
}

function openRegistryModal(entry = null, readOnly = false, fromReview = false) {
  activeRegistryRecord = entry;
  registryModalReadOnly = readOnly;
  registryOpenedFromReview = fromReview;
  $("#registryModalTitle").textContent = readOnly ? "AI Registry record" : entry ? "Update AI use case" : "Register AI use case";
  $("#registryModalIntro").textContent = readOnly ? "Review the registered identity, ownership, and current lifecycle for this AI use case." : "Create or update the accountability record required before a responsible AI review can begin.";
  $("#registryFormIdentity").hidden = !entry;
  if (entry) $("#registryFormId").textContent = entry.id;
  $("#registryDynamicForm").innerHTML = registryFieldDefinitions.map((field) => registryFieldControl(field, entry, readOnly)).join("");
  enhanceAllSelects($("#registryDynamicForm"));
  $("#registryModalSubmit").hidden = readOnly;
  $("#registryModalSubmit").textContent = entry ? "Save registry record" : "Register use case";
  $("#registryModalCancel").textContent = readOnly ? "Close" : "Cancel";
  $("#registryModal").classList.add("open");
  $("#registryModal").setAttribute("aria-hidden", "false");
  setTimeout(() => $("input, select, textarea", $("#registryDynamicForm"))?.focus(), 50);
}

function closeRegistryModal() {
  $("#registryModal").classList.remove("open");
  $("#registryModal").setAttribute("aria-hidden", "true");
  activeRegistryRecord = null;
  registryModalReadOnly = false;
  registryOpenedFromReview = false;
}

function nextRegistryId() {
  const highest = Math.max(...registryEntries.map((entry) => Number(entry.id.split("-")[1]) || 0), 0);
  return `AIR-${String(highest + 1).padStart(4, "0")}`;
}

function syncReviewRegistryOptions(preferredId = "") {
  const select = $("#reviewRegistrySelect");
  const previous = preferredId || select.value;
  const entries = visibleRegistryEntries().filter(registryEntryReady);
  select.innerHTML = `<option value="">Select a registered use case</option>${entries.map((entry) => `<option value="${entry.id}">${escapeHtml(entry.name)} · ${entry.id}</option>`).join("")}`;
  if (entries.some((entry) => entry.id === previous)) select.value = previous;
  refreshThemedSelect(select);
  syncRegistrySelectionDetail();
}

function selectedRegistryRecord() {
  return registryEntries.find((entry) => entry.id === $("#reviewRegistrySelect").value);
}

function syncRegistrySelectionDetail() {
  const entry = selectedRegistryRecord();
  const detail = $("#registrySelectionDetail");
  detail.hidden = !entry;
  detail.innerHTML = entry ? `<span><strong>${entry.id}</strong> · ${escapeHtml(entry.lifecycle)}</span><span>Tech: ${escapeHtml(entry.techOwner)} · Business: ${escapeHtml(entry.businessOwner)}</span>` : "";
  updateReviewSubmissionAvailability();
}

function updateReviewSubmissionAvailability() {
  const workbookReady = !$("#fileReady").hidden;
  $("#continueButton").disabled = !(workbookReady && selectedRegistryRecord());
}

function currentAudienceGroups() {
  return roleProfiles[document.body.dataset.role]?.groups || ["All groups"];
}

function audienceMatches(audience) {
  if (document.body.dataset.role === "admin") return true;
  const targets = Array.isArray(audience) ? audience : String(audience).split("·").map((item) => item.trim());
  return targets.includes("All groups") || targets.some((target) => currentAudienceGroups().includes(target));
}

function visibleWorkspaceNews() {
  return adminNews
    .filter((item) => item.status === "published" && audienceMatches(item.audience))
    .sort((a, b) => Number(a.audience === "All groups") - Number(b.audience === "All groups"));
}

function renderWorkspaceNews() {
  const query = $("#workspaceNewsSearch").value.trim().toLowerCase();
  const visible = visibleWorkspaceNews();
  const feature = visible[0];
  $("#workspaceNewsCount").textContent = visible.length;
  $("#newsAudienceView").textContent = `Showing: ${currentAudienceGroups().join(" + ")}`;
  $("#newsChannelList").innerHTML = currentAudienceGroups().map((group) => `<div class="channel-item"><span>${escapeHtml(group.charAt(0))}</span><div><strong>${escapeHtml(group)}</strong><small>From directory access</small></div></div>`).join("");
  if (feature) {
    const attachment = feature.attachments?.[0];
    $("#newsFeature").innerHTML = `
      <div class="feature-copy"><p class="eyebrow">FEATURED UPDATE</p><h3>${escapeHtml(feature.title)}</h3><p>${escapeHtml(feature.summary)}</p><div class="feature-meta"><span>${escapeHtml(feature.audience)}</span><small>${escapeHtml(feature.timing)}</small></div></div>
      <div class="feature-attachment"><div class="feature-document"><b>${attachment ? escapeHtml(fileKind(attachment)) : "NEWS"}</b><i></i><i></i></div><strong>${escapeHtml(attachment || "Workspace announcement")}</strong><small>${attachment ? "Supporting document · Controlled attachment" : "No attachment"}</small><button data-preview-news="${feature.id}">Preview update →</button></div>`;
  } else {
    $("#newsFeature").innerHTML = '<div class="feature-copy"><p class="eyebrow">NO PUBLISHED UPDATES</p><h3>Your channel is clear.</h3><p>New announcements for your directory groups will appear here.</p></div>';
  }
  const items = visible.filter((item) => !query || `${item.title} ${item.summary} ${item.audience}`.toLowerCase().includes(query));
  $("#workspaceNewsList").innerHTML = items.length ? items.map((item, index) => `
    <div class="news-feed-row">
      <div class="news-feed-date"><strong>${String(27 - index).padStart(2, "0")}</strong><small>AUG</small></div>
      <div class="news-feed-copy"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.summary)}</p><small>${escapeHtml(item.audience)}${item.attachments?.length ? ` · ${item.attachments.length} attachment${item.attachments.length > 1 ? "s" : ""}` : ""}</small></div>
      <button data-preview-news="${item.id}">Read update</button>
    </div>`).join("") : '<div class="empty-admin">No published updates match your search.</div>';
}

function visibleLibraryResources() {
  return libraryResources.filter((item) => audienceMatches(item.audience));
}

function resourceDescription(item) {
  return ({
    Policy: "The current requirements and organizational standard for responsible AI work.",
    Template: "An approved working file designed for consistent review evidence.",
    Guidance: "Practical interpretation and examples for applying responsible AI controls.",
  })[item.collection] || "A governed resource maintained by the Responsible AI Office.";
}

function renderWorkspaceLibrary() {
  const query = $("#workspaceLibrarySearch").value.trim().toLowerCase();
  const allVisible = visibleLibraryResources();
  const items = allVisible.filter((item) => (libraryReaderFilter === "all" || item.collection === libraryReaderFilter) && (!query || `${item.title} ${item.collection} ${item.owner}`.toLowerCase().includes(query)));
  const collections = ["Policy", "Template", "Guidance"];
  $("#libraryShelves").innerHTML = collections.map((collection) => {
    const count = allVisible.filter((item) => item.collection === collection).length;
    const names = { Policy: ["Policies", "Rules and standards"], Template: ["Templates", "Approved working files"], Guidance: ["Implementation guidance", "How-to references"] }[collection];
    return `<div class="library-shelf"><span class="shelf-icon">${collection.slice(0, 3).toUpperCase()}</span><span><strong>${names[0]}</strong><small>${names[1]}</small></span><b>${count}</b></div>`;
  }).join("");
  $("#libraryResultCount").textContent = `${items.length} resource${items.length === 1 ? "" : "s"}`;
  $("#workspaceLibraryList").innerHTML = items.length ? items.map((item) => `
    <article class="library-reader-card">
      <div class="reader-resource-top"><span class="reader-file-icon">${escapeHtml(item.file.split(" ")[0])}</span><span class="reader-collection">${escapeHtml(item.collection)}</span></div>
      <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(resourceDescription(item))}</p>
      <div class="reader-resource-bottom"><span>${escapeHtml(item.owner)} · Review ${escapeHtml(item.review)}</span><button data-preview-resource="${item.id}">Preview →</button></div>
    </article>`).join("") : '<div class="empty-admin">No accessible resources match this view.</div>';
}

function openContentPreview(kind, item) {
  const drawer = $("#contentPreviewDrawer");
  const isNews = kind === "news";
  const attachment = isNews ? item.attachments?.[0] : item.file;
  $("#contentPreviewType").textContent = isNews ? "NEWS PREVIEW" : `${item.collection.toUpperCase()} PREVIEW`;
  $("#contentPreviewTitle").textContent = item.title;
  $("#contentPreviewVisual span").textContent = isNews ? fileKind(attachment || "news") : item.file.split(" ")[0];
  $("#contentPreviewDescription").textContent = isNews ? item.summary : resourceDescription(item);
  $("#contentPreviewAudience").textContent = Array.isArray(item.audience) ? item.audience.join(" · ") : item.audience;
  $("#contentPreviewMetadata").innerHTML = isNews
    ? `<div><span>Status</span><strong>Published</strong></div><div><span>Published</span><strong>${escapeHtml(item.timing.replace("Published ", ""))}</strong></div><div><span>Attachments</span><strong>${item.attachments?.length || 0}</strong></div>`
    : `<div><span>Collection</span><strong>${escapeHtml(item.collection)}</strong></div><div><span>Owner</span><strong>${escapeHtml(item.owner)}</strong></div><div><span>Review</span><strong>${escapeHtml(item.review)}</strong></div>`;
  $("#previewOpenButton").textContent = isNews ? (attachment ? "Open attachment ↗" : "Read update") : "Open resource ↗";
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeContentPreview() {
  $("#contentPreviewDrawer").classList.remove("open");
  $("#contentPreviewDrawer").setAttribute("aria-hidden", "true");
}

function renderAdminControlPlane() {
  renderProcessStages();
  renderRegistryFieldsAdmin();
  renderAdminNews();
  renderLibrary();
  renderGroups();
}

function setAdminTab(tab) {
  $$(".admin-tab").forEach((button) => button.classList.toggle("active", button.dataset.adminTab === tab));
  $$(".admin-pane").forEach((pane) => pane.classList.toggle("active", pane.dataset.adminPane === tab));
}

function openAdminModal(type, item = null) {
  activeAdminModal = { type, item };
  const modal = $("#adminModal");
  const fields = $("#adminModalFields");
  const configs = {
    stage: { eyebrow: "PROCESS GOVERNANCE", title: item ? "Edit lifecycle stage" : "Add lifecycle stage", intro: "Set responsibility, decision rights, and the service window for this process step.", action: item ? "Save stage" : "Add stage" },
    registryField: { eyebrow: "REGISTRY GOVERNANCE", title: item ? "Edit registry field" : "Add registry field", intro: "Define the information captured incrementally on every AI use case record.", action: item ? "Save field" : "Add field" },
    news: { eyebrow: "COMMUNICATIONS", title: item ? "Edit news" : "Create news", intro: "Target an operational announcement to the groups that need it.", action: item ? "Save news" : "Create draft" },
    resource: { eyebrow: "KNOWLEDGE GOVERNANCE", title: item ? "Edit library resource" : "Add library resource", intro: "Give every controlled resource an audience, owner, and review date.", action: item ? "Save resource" : "Add resource" },
    group: { eyebrow: "IDENTITY & ACCESS", title: item ? "Edit group mapping" : "Map directory group", intro: "Map an identity-provider group to platform permissions. Membership stays read-only.", action: item ? "Save mapping" : "Map group" },
  };
  const config = configs[type];
  $("#adminModalEyebrow").textContent = config.eyebrow;
  $("#adminModalTitle").textContent = config.title;
  $("#adminModalIntro").textContent = config.intro;
  $("#adminModalSubmit").textContent = config.action;
  if (type === "stage") fields.innerHTML = `
    <label>Stage name<input name="name" required value="${escapeHtml(item?.name || "")}" placeholder="e.g. Legal review" /></label>
    <label>Description<input name="detail" required value="${escapeHtml(item?.detail || "")}" placeholder="What must happen in this stage" /></label>
    <label>Owner group<select name="owner"><option>Responsible AI Office</option><option>Responsible AI Auditors</option><option>Submitting group</option><option>Legal & Compliance</option></select></label>
    <label>Decision right<select name="role"><option>REVIEW</option><option>APPROVE</option><option>ASSESS</option><option>DECIDE</option></select></label>
    <label>Service window (days)<input name="days" type="number" min="1" max="30" required value="${item?.days || 3}" /></label>`;
  if (type === "registryField") fields.innerHTML = `
    <label>Field label<input name="label" required value="${escapeHtml(item?.label || "")}" placeholder="e.g. Data classification" /></label>
    <label>Input type<select name="type"><option value="text">Short text</option><option value="textarea">Long text</option><option value="person">People picker</option><option value="select">Select options</option><option value="date">Date</option></select></label>
    <label>Guidance<input name="help" value="${escapeHtml(item?.help || "")}" placeholder="Help people enter the right value" /></label>
    <label>Options <small class="optional-label">For Select fields, one per line</small><textarea name="options" placeholder="Option one&#10;Option two">${escapeHtml((item?.options || []).join("\n"))}</textarea></label>
    <label class="admin-checkbox-field"><input name="required" type="checkbox" ${item?.required !== false ? "checked" : ""} /><span><strong>Required before review submission</strong><small>Incomplete records cannot start a review</small></span></label>`;
  if (type === "news") fields.innerHTML = `
    <label>Headline<input name="title" required value="${escapeHtml(item?.title || "")}" placeholder="What changed?" /></label>
    <label>Summary<textarea name="summary" required placeholder="Explain what people need to know">${escapeHtml(item?.summary || "")}</textarea></label>
    <label>Audience<select name="audience"><option>All groups</option><option>R&D</option><option>Commercial</option><option>R&D · Commercial</option><option>Responsible AI Auditors</option><option>Model owners</option></select></label>
    <div class="attachment-field">
      <span class="form-field-title">Images and documents <small>Optional</small></span>
      <label class="file-upload-control">
        <input id="newsAttachmentInput" type="file" name="attachments" accept="image/png,image/jpeg,image/webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" multiple hidden />
        <span class="upload-glyph">↑</span><span><strong>Add images or documents</strong><small>PNG, JPG, WEBP, PDF, Office files · 25 MB each</small></span><b>Choose files</b>
      </label>
      ${item?.attachments?.length ? `<div class="existing-attachments"><span>Currently attached</span>${item.attachments.map((name) => `<b>⌁ ${escapeHtml(name)}</b>`).join("")}</div>` : ""}
      <div class="attachment-preview" id="adminAttachmentPreview" hidden></div>
    </div>
    <label>Publishing state<select name="status"><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label>`;
  if (type === "resource") fields.innerHTML = `
    <label>Resource title<input name="title" required value="${escapeHtml(item?.title || "")}" placeholder="e.g. Model card template" /></label>
    <div class="attachment-field">
      <span class="form-field-title">Resource file <small>${item ? "Replace existing file" : "Upload a new file"}</small></span>
      <label class="file-upload-control">
        <input id="resourceFileInput" type="file" name="resourceFile" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.zip" hidden />
        <span class="upload-glyph">↑</span><span><strong>${item ? "Choose a replacement file" : "Choose a file to upload"}</strong><small>PDF, Office, CSV, text, or ZIP · up to 50 MB</small></span><b>Choose file</b>
      </label>
      ${item ? `<div class="existing-attachments"><span>Current resource</span><b>⌁ ${escapeHtml(item.file)}</b></div>` : ""}
      <div class="attachment-preview" id="adminAttachmentPreview" hidden></div>
    </div>
    <div class="field-divider"><span>or link to a governed source</span></div>
    <label>External resource URL <small class="optional-label">Optional</small><input name="url" type="url" value="${escapeHtml(item?.url || "")}" placeholder="https://intranet.example/policy" /></label>
    <label>Collection<select name="collection"><option>Policy</option><option>Template</option><option>Guidance</option></select></label>
    <label>Audience<select name="audience"><option>All groups</option><option>R&D</option><option>Commercial</option><option>R&D, Commercial</option><option>Responsible AI Auditors</option></select></label>
    <label>Content owner<select name="owner"><option>RAI Office</option><option>Model Risk</option><option>Governance</option><option>Legal & Compliance</option></select></label>
    <label>Next review date<input name="review" type="date" required value="2026-10-01" /></label>`;
  if (type === "group") fields.innerHTML = `
    <label>Directory group<select name="name">${item ? `<option>${escapeHtml(item.name)}</option>` : ""}<option>RND-AI-Owners</option><option>Commercial-Risk-Champions</option><option>Legal-AI-Reviewers</option></select></label>
    <label>Platform role<select name="role"><option>Submitter</option><option>Auditor</option><option>Admin</option></select></label>
    <label>Workspace scope<select name="scope"><option>R&D</option><option>Commercial</option><option>Entire organization</option><option>Assigned review queues</option><option>Assigned reviews and team responsibilities</option><option>Owned and shared submissions</option></select></label>`;
  if (item) {
    $$("select", fields).forEach((select) => {
      const desired = Array.isArray(item[select.name]) ? item[select.name].join(", ") : item[select.name];
      if ([...select.options].some((option) => option.value === desired || option.textContent === desired)) select.value = desired;
    });
  }
  enhanceAllSelects(fields);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => $("input, select", fields)?.focus(), 50);
}

function closeAdminModal() {
  $("#adminModal").classList.remove("open");
  $("#adminModal").setAttribute("aria-hidden", "true");
  activeAdminModal = null;
}

function renderUserReviews() {
  if (window.ProoflineUX) return window.ProoflineUX.renderUserReviews();
  $("#userReviewList").innerHTML = reviews.map((review) => `
    <div class="review-row">
      <button class="review-title" data-open-review="${review.id}">
        <strong>${review.name}</strong><small>${review.id} · ${review.registryId || "Unregistered"} · ${review.lifecycle || "POC"} · ${review.owner}</small>
      </button>
      <span class="status-pill ${review.tone}">${review.status}</span>
      <div class="progress-cell"><i><b style="width:${review.progress}%"></b></i><span>${review.progress}%</span></div>
      <div class="cell-stack"><strong>${review.updated}</strong><small>${review.risk} risk</small></div>
      <button class="row-arrow" data-open-review="${review.id}" aria-label="Open ${review.id}">→</button>
    </div>
  `).join("");
}

function renderQueue(filter = "all") {
  if (window.ProoflineUX) return window.ProoflineUX.renderQueue();
  const filtered = filter === "all" ? queue : queue.filter((item) => item.tags.includes(filter));
  $("#auditorQueue").innerHTML = filtered.map((item) => `
    <div class="queue-row">
      <div class="queue-title"><strong>${item.name}</strong><small>${item.id} · ${item.registryId || "Unregistered"} · ${item.org}</small></div>
      <span class="lifecycle-badge ${(item.lifecycle || "POC").toLowerCase()}">${item.lifecycle || "POC"}</span>
      <span class="risk-badge ${item.risk.toLowerCase()}">${item.risk}</span>
      <span>${item.stage}</span>
      <span class="sla-cell ${item.tags.includes("urgent") ? "urgent" : ""}">${item.sla}</span>
      <button class="queue-open" data-open-review="${item.id}" aria-label="Open ${item.id}">↗</button>
    </div>
  `).join("");
}

function registerItemsForRole() {
  const role = document.body.dataset.role;
  if (role === "user") return reviews.map((item) => ({ ...item, org: item.owner, stage: item.status, timing: item.updated }));
  return (role === "auditor" && window.ProoflineUX ? window.ProoflineUX.personalQueue() : queue).map((item) => ({ ...item, status: item.stage, tone: item.stage.toLowerCase().includes("evidence") ? "evidence" : "review", timing: item.sla }));
}

function renderReviewRegister() {
  const role = document.body.dataset.role;
  const allItems = registerItemsForRole();
  const query = $("#reviewSearch").value.trim().toLowerCase();
  const filtered = allItems.filter((item) => {
    const lifecycleMatch = registerFilter === "all" || (item.lifecycle || "POC").toLowerCase() === registerFilter;
    const searchMatch = !query || `${item.name} ${item.id} ${item.org || ""}`.toLowerCase().includes(query);
    return lifecycleMatch && searchMatch;
  });
  $("#registerOpenCount").textContent = allItems.length;
  $("#registerDeploymentCount").textContent = allItems.filter((item) => item.lifecycle === "Deployment").length;
  $("#registerPocCount").textContent = allItems.filter((item) => (item.lifecycle || "POC") === "POC").length;
  $("#registerHeading").textContent = role === "auditor" ? "Your assigned audit register" : role === "admin" ? "Reviews across the workspace" : "Every review, one evidence trail";
  $("#registerNote").textContent = role === "auditor"
    ? "Prioritize work by lifecycle, risk, and configured SLA."
    : "Search, filter, and open a review without losing its lifecycle context.";
  $("#reviewRegisterList").innerHTML = filtered.map((item) => {
    const lifecycle = item.lifecycle || "POC";
    const status = item.status || item.stage || "Auditor review";
    const tone = item.tone || (status.toLowerCase().includes("evidence") ? "evidence" : "review");
    const risk = item.risk || "Pending";
    return `
      <div class="register-row">
        <div class="register-review"><strong>${item.name}</strong><small>${item.id} · ${item.org || item.owner}</small></div>
        <span class="lifecycle-badge ${lifecycle.toLowerCase()}">${lifecycle}</span>
        <span class="register-status ${tone}">${status}</span>
        <span class="risk-badge ${risk.toLowerCase()}">${risk}</span>
        <div class="register-timing"><strong>${item.timing || item.updated || item.sla}</strong><small>${role === "user" ? "Latest update" : "Review SLA"}</small></div>
        <button class="register-open" data-open-review="${item.id}" aria-label="Open ${item.id}">↗</button>
      </div>`;
  }).join("");
  $("#registerEmpty").hidden = filtered.length > 0;
}

function roleNotifications() {
  const role = document.body.dataset.role;
  return notifications.filter((item) => item.roles.includes(role) && (role !== "auditor" || !window.ProoflineUX || !item.reviewId || (window.ProoflineUX.notificationVisible(item) && window.ProoflineUX.personalQueue().some((review) => review.id === item.reviewId))));
}

function syncNotificationIndicator() {
  const unread = roleNotifications().filter((item) => item.unread).length;
  $(".status-dot").classList.toggle("read", unread === 0);
  $("#notificationButton i").style.display = unread ? "block" : "none";
}

function renderNotifications() {
  const items = roleNotifications().filter((item) => notificationFilter === "all" || item.unread);
  $("#notificationList").innerHTML = items.map((item) => `
    <button class="notification-row ${item.unread ? "unread" : ""}" data-notification-id="${item.id}" ${item.reviewId ? `data-open-review="${item.reviewId}"` : ""}>
      <span class="notification-symbol ${item.kind}">${item.icon}</span>
      <span class="notification-copy"><strong>${item.title}</strong><span>${item.message}</span><small>${item.time}${item.unread ? " · UNREAD" : ""}</small></span>
      <span class="notification-action">${item.reviewId ? "Open review →" : item.unread ? "Mark read" : "Read"}</span>
    </button>
  `).join("");
  $("#notificationEmpty").hidden = items.length > 0;
  syncNotificationIndicator();
}

function navigateWorkspace(page) {
  const role = document.body.dataset.role;
  closeReview();
  closeContentPreview();
  currentWorkspacePage = page;
  $$(".role-view, .workspace-view").forEach((view) => view.classList.remove("active"));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.nav === page));
  const profile = roleProfiles[role];
  if (page === "reviews") {
    $("#reviewsView").classList.add("active");
    $("#roleEyebrow").textContent = `${profile.label.toUpperCase()} WORKSPACE`;
    $("#pageTitle").textContent = role === "auditor" ? "Assigned reviews" : "All AI reviews";
    renderReviewRegister();
  } else if (page === "registry") {
    $("#registryView").classList.add("active");
    $("#roleEyebrow").textContent = `${profile.label.toUpperCase()} WORKSPACE`;
    $("#pageTitle").textContent = "AI Registry";
    renderRegistryRecords();
  } else if (page === "notifications") {
    $("#notificationsView").classList.add("active");
    $("#roleEyebrow").textContent = `${profile.label.toUpperCase()} WORKSPACE`;
    $("#pageTitle").textContent = "Notifications";
    renderNotifications();
  } else if (page === "news") {
    $("#newsView").classList.add("active");
    $("#roleEyebrow").textContent = `${profile.label.toUpperCase()} WORKSPACE`;
    $("#pageTitle").textContent = "News";
    renderWorkspaceNews();
  } else if (page === "library") {
    $("#libraryView").classList.add("active");
    $("#roleEyebrow").textContent = `${profile.label.toUpperCase()} WORKSPACE`;
    $("#pageTitle").textContent = "Library";
    renderWorkspaceLibrary();
  } else {
    $(`#${role}View`).classList.add("active");
    $("#roleEyebrow").textContent = profile.eyebrow;
    $("#pageTitle").textContent = profile.title;
    const activeNav = page === "configuration" && role === "admin" ? "configuration" : "overview";
    $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.nav === activeNav));
  }
  $("#newReviewButton").style.display = role === "user" && ["overview", "reviews"].includes(page) ? "block" : "none";
  window.ProoflineUX?.navigate(page);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setRoleMenu(open) {
  $("#roleSwitcher").classList.toggle("open", open);
  $("#roleTrigger").setAttribute("aria-expanded", String(open));
  $("#roleMenu").hidden = !open;
}

function switchRole(role) {
  document.body.dataset.role = role;
  const profile = roleProfiles[role];
  $("#profileName").textContent = profile.name;
  $("#profileRole").textContent = profile.role;
  $("#profileAvatar").textContent = profile.avatar;
  $("#healthScore").textContent = profile.health;
  $("#reviewCount").textContent = registerItemsForRole().length;
  $("#registryCount").textContent = visibleRegistryEntries().length;
  $("#workspaceNewsCount").textContent = visibleWorkspaceNews().length;
  $("#roleTriggerLabel").textContent = profile.label;
  $$('[data-role-option]').forEach((option) => {
    const selected = option.dataset.roleOption === role;
    option.classList.toggle("active", selected);
    option.setAttribute("aria-selected", String(selected));
  });
  setRoleMenu(false);
  syncNotificationIndicator();
  navigateWorkspace("overview");
}

function openUpload(initialLifecycle = "poc") {
  setSubmissionLifecycle(initialLifecycle);
  syncReviewRegistryOptions();
  const modal = $("#uploadModal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => $("#reviewRegistrySelect").focus(), 100);
}

function setSubmissionLifecycle(lifecycle) {
  submissionLifecycle = lifecycle;
  $$(".lifecycle-option").forEach((button) => button.classList.toggle("active", button.dataset.lifecycle === lifecycle));
  const isDeployment = lifecycle === "deployment";
  $("#deploymentSection").hidden = !isDeployment;
  $("#workbookStepNumber").textContent = isDeployment ? "4" : "3";
  $("#workbookStepTitle").textContent = isDeployment ? "Upload the deployment workbook" : "Add the POC workbook";
  $("#workbookStepNote").textContent = isDeployment
    ? (deploymentPath === "reuse" ? "Upload the approved POC workbook after updating it for deployment." : "Upload a new deployment assessment workbook.")
    : "Upload the assessment prepared for this use case.";
  $("#dropZoneTitle").textContent = isDeployment ? "Drop your deployment workbook here" : "Drop your POC workbook here";
  $("#continueButton").textContent = isDeployment ? "Start deployment review" : "Start POC review";
  resetFile();
}

function setDeploymentPath(path) {
  deploymentPath = path;
  $$(".deployment-path").forEach((button) => button.classList.toggle("active", button.dataset.deploymentPath === path));
  $("#pocReuseCard").hidden = path !== "reuse";
  $("#workbookStepNote").textContent = path === "reuse"
    ? "Upload the approved POC workbook after updating it for deployment."
    : "Upload a new deployment assessment workbook.";
  resetFile();
}

function selectedApprovedPoc() {
  return approvedPocs.find((poc) => poc.id === $("#approvedPocSelect").value) || approvedPocs[0];
}

function syncApprovedPoc() {
  const poc = selectedApprovedPoc();
  $("#baselineWorkbookName").textContent = `${poc.id}-poc-workbook.xls`;
  const meta = $("#pocReuseCard .baseline-workbook small");
  meta.textContent = `Approved ${poc.approved} · ${poc.controls} controls · Evidence retained`;
}

function downloadPocWorkbook() {
  const poc = selectedApprovedPoc();
  const workbook = [
    "Responsible AI POC Workbook",
    `Review ID\t${poc.id}`,
    `Use case\t${poc.name}`,
    `Approved\t${poc.approved}`,
    "",
    "Control\tPOC evidence\tDeployment update\tOwner",
    "Governance\tApproved\t\t",
    "Data quality\tApproved\t\t",
    "Model performance\tApproved\t\t",
    "Human oversight\tApproved\t\t",
  ].join("\n");
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${poc.id}-poc-workbook.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("POC workbook downloaded", "Update this baseline for deployment, then upload it below.", "↓");
}

function closeUpload() {
  const modal = $("#uploadModal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function resetFile() {
  $("#fileInput").value = "";
  $("#dropZone").hidden = false;
  $("#validationState").hidden = true;
  $("#fileReady").hidden = true;
  $("#continueButton").disabled = true;
}

function validateFile(file) {
  if (!file) return;
  const allowed = ["xlsx", "xls", "csv"];
  const extension = file.name.split(".").pop().toLowerCase();
  if (!allowed.includes(extension)) {
    showToast("Unsupported file", "Choose an .xlsx, .xls or .csv workbook.", "!");
    return;
  }
  $("#dropZone").hidden = true;
  $("#validationState").hidden = false;
  const details = ["Checking sheet structure…", "Reading control inventory…", "Verifying required fields…"];
  let index = 0;
  $("#validationDetail").textContent = details[index];
  const progress = setInterval(() => {
    index += 1;
    if (index < details.length) $("#validationDetail").textContent = details[index];
  }, 550);
  setTimeout(() => {
    clearInterval(progress);
    $("#validationState").hidden = true;
    $("#fileReady").hidden = false;
    $("#readyFileName").textContent = file.name;
    $("#fileReadyMeta").textContent = submissionLifecycle === "deployment"
      ? (deploymentPath === "reuse" ? "Deployment update linked to the approved POC · evidence retained" : "New deployment workbook is ready for auditor review")
      : "POC workbook is ready · 4 sheets · 86 controls";
    updateReviewSubmissionAvailability();
  }, 1800);
}

function showToast(title, message, icon = "✓") {
  const toast = $("#toast");
  $("span", toast).textContent = icon;
  $("strong", toast).textContent = title;
  $("small", toast).textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function openReview(id) {
  if (window.ProoflineUX && !window.ProoflineUX.canOpen(id)) return;
  const match = reviews.find((item) => item.id === id) || queue.find((item) => item.id === id);
  $("#drawerTitle").textContent = id;
  if (match) $("#drawerSystem").textContent = match.name;
  if (match) $("#drawerRegistryId").textContent = match.registryId || "Unregistered";
  if (match) $("#drawerOwner").textContent = match.owner || match.org || "Workspace owner";
  if (match) $("#drawerStatus").textContent = match.status || match.stage;
  if (match) {
    const lifecycle = match.lifecycle || "POC";
    $("#drawerLifecycle").textContent = lifecycle;
    $("#drawerLifecycle").className = `lifecycle-badge ${lifecycle.toLowerCase()}`;
  }
  $("#downloadWorkbookName").textContent = `${id}-assessment.xls`;
  resetAuditorDecision();
  $("#reviewDrawer").classList.add("open");
  $("#reviewDrawer").setAttribute("aria-hidden", "false");
  window.ProoflineUX?.drawer(id);
}

function resetAuditorDecision() {
  $("#auditorFileInput").value = "";
  $("#auditorUploadTitle").textContent = "Upload reviewed workbook";
  $("#auditorUploadDetail").textContent = "Required before a decision";
  $("#auditorUploadLabel").classList.remove("ready");
  $("#decisionPanel").classList.remove("ready");
  $("#decisionPanel").setAttribute("aria-disabled", "true");
  $("#evidenceQuestion").value = "";
  $("#evidenceQuestion").disabled = true;
  $("#requestEvidenceButton").disabled = true;
  $("#signOffButton").disabled = true;
}

function downloadWorkbook() {
  const id = $("#drawerTitle").textContent;
  const system = $("#drawerSystem").textContent;
  const workbook = [
    "Responsible AI Review Workbook",
    `Review ID\t${id}`,
    `System\t${system}`,
    `Lifecycle\t${$("#drawerLifecycle").textContent}`,
    "",
    "Control\tAuditor assessment\tEvidence reference\tFinding",
    "Governance\t\t\t",
    "Data quality\t\t\t",
    "Model performance\t\t\t",
    "Human oversight\t\t\t",
  ].join("\n");
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${id}-assessment.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Workbook downloaded", `${id} is ready for offline review.`, "↓");
}

function acceptAuditorWorkbook(file) {
  if (window.ProoflineUX && !window.ProoflineUX.canReview($("#drawerTitle").textContent)) return;
  if (!file) return;
  const allowed = ["xlsx", "xls", "csv"];
  const extension = file.name.split(".").pop().toLowerCase();
  if (!allowed.includes(extension)) {
    showToast("Unsupported file", "Upload an .xlsx, .xls or .csv workbook.", "!");
    return;
  }
  $("#auditorUploadTitle").textContent = "Reviewed workbook ready";
  $("#auditorUploadDetail").textContent = file.name;
  $("#auditorUploadLabel").classList.add("ready");
  $("#decisionPanel").classList.add("ready");
  $("#decisionPanel").setAttribute("aria-disabled", "false");
  $("#evidenceQuestion").disabled = false;
  $("#requestEvidenceButton").disabled = false;
  $("#signOffButton").disabled = false;
  window.ProoflineUX?.afterWorkbook();
  showToast("Workbook uploaded", "Choose an evidence request or sign-off.", "↑");
}

function requestEvidence() {
  if (window.ProoflineUX && !window.ProoflineUX.canReview($("#drawerTitle").textContent)) return;
  const id = $("#drawerTitle").textContent;
  const question = $("#evidenceQuestion").value.trim();
  if (!question) {
    $("#evidenceQuestion").focus();
    showToast("Add a question", "Tell the user what additional evidence is required.", "!");
    return;
  }
  const review = reviews.find((item) => item.id === id);
  if (review) {
    review.status = "Evidence requested";
    review.tone = "evidence";
    review.updated = "Requested just now";
    review.progress = Math.max(review.progress, 55);
    renderUserReviews();
  }
  closeReview();
  window.ProoflineUX?.evidenceRequested(id, question);
  showToast("Evidence requested", `${id} is waiting for the user’s response.`, "?");
}

function signOffReview() {
  if (window.ProoflineUX && !window.ProoflineUX.canReview($("#drawerTitle").textContent, true)) return;
  const id = $("#drawerTitle").textContent;
  const review = reviews.find((item) => item.id === id);
  if (review) {
    review.status = "Approved";
    review.tone = "closed";
    review.updated = "Completed just now";
    review.progress = 100;
    renderUserReviews();
  }
  const queueIndex = queue.findIndex((item) => item.id === id);
  if (queueIndex >= 0) queue.splice(queueIndex, 1);
  const activeFilter = $(".filter-chip.active")?.dataset.filter || "all";
  renderQueue(activeFilter);
  closeReview();
  window.ProoflineUX?.decisionRecorded(id);
  showToast("Audit complete", `${id} was approved and signed off.`, "✓");
}

function closeReview() {
  $("#reviewDrawer").classList.remove("open");
  $("#reviewDrawer").setAttribute("aria-hidden", "true");
  window.ProoflineUX?.drawerClosed();
}

renderUserReviews();
renderQueue();
renderAdminControlPlane();
enhanceAllSelects();
const initialParams = new URLSearchParams(window.location.search);
const initialRole = initialParams.get("role");
switchRole(roleProfiles[initialRole] ? initialRole : "user");
if (["overview", "reviews", "registry", "notifications", "news", "library", "configuration"].includes(initialParams.get("page"))) navigateWorkspace(initialParams.get("page"));
if (document.body.dataset.role === "admin" && ["process", "registry", "news", "library", "groups"].includes(initialParams.get("adminTab"))) setAdminTab(initialParams.get("adminTab"));

$("#roleTrigger").addEventListener("click", () => setRoleMenu($("#roleMenu").hidden));
$$('[data-role-option]').forEach((option) => option.addEventListener("click", () => {
  switchRole(option.dataset.roleOption);
  $("#roleTrigger").focus();
}));
document.addEventListener("click", (event) => {
  if (!event.target.closest("#roleSwitcher")) setRoleMenu(false);
  if (!event.target.closest(".themed-select")) closeThemedSelects();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("#roleMenu").hidden) {
    setRoleMenu(false);
    $("#roleTrigger").focus();
  }
});
$("#newReviewButton").addEventListener("click", () => openUpload("poc"));
$("#heroUploadButton").addEventListener("click", () => openUpload("poc"));
$("#continuePocButton").addEventListener("click", () => openUpload("deployment"));
$$(".lifecycle-option").forEach((button) => button.addEventListener("click", () => setSubmissionLifecycle(button.dataset.lifecycle)));
$$(".deployment-path").forEach((button) => button.addEventListener("click", () => setDeploymentPath(button.dataset.deploymentPath)));
$("#approvedPocSelect").addEventListener("change", syncApprovedPoc);
$("#downloadPocButton").addEventListener("click", downloadPocWorkbook);
$$('[data-close-modal]').forEach((button) => button.addEventListener("click", closeUpload));
$("#uploadModal").addEventListener("click", (event) => { if (event.target.id === "uploadModal") closeUpload(); });
$("#browseButton").addEventListener("click", () => $("#fileInput").click());
$("#fileInput").addEventListener("change", (event) => validateFile(event.target.files[0]));
$("#removeFileButton").addEventListener("click", resetFile);

const dropZone = $("#dropZone");
["dragenter", "dragover"].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); dropZone.classList.add("dragover"); }));
["dragleave", "drop"].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); dropZone.classList.remove("dragover"); }));
dropZone.addEventListener("drop", (event) => validateFile(event.dataTransfer.files[0]));
dropZone.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") $("#fileInput").click(); });

$("#continueButton").addEventListener("click", () => {
  const registryRecord = selectedRegistryRecord();
  if (!registryRecord) {
    $("#reviewRegistrySelect").focus();
    showToast("Choose a registered use case", "Register the AI use case or select an active registry ID before submitting.", "!");
    return;
  }
  const sourcePoc = submissionLifecycle === "deployment" && deploymentPath === "reuse" ? selectedApprovedPoc() : null;
  const newItem = {
    id: `RAI-${2050 + reviews.length}`,
    registryId: registryRecord.id,
    name: registryRecord.name,
    owner: registryRecord.businessOwner,
    lifecycle: submissionLifecycle === "deployment" ? "Deployment" : "POC",
    sourcePoc: sourcePoc?.id,
    status: "Auditor review",
    tone: "review",
    updated: sourcePoc ? `Continued from ${sourcePoc.id}` : "Awaiting assignment",
    progress: sourcePoc ? 28 : 12,
    risk: "Pending",
  };
  reviews.unshift(newItem);
  queue.unshift({
    id: newItem.id,
    registryId: registryRecord.id,
    name: newItem.name,
    org: newItem.owner,
    lifecycle: newItem.lifecycle,
    sourcePoc: newItem.sourcePoc,
    risk: "Medium",
    stage: "Auditor review",
    sla: "5d left",
    tags: [],
  });
  renderUserReviews();
  renderQueue($(".filter-chip.active")?.dataset.filter || "all");
  if (currentWorkspacePage === "reviews") renderReviewRegister();
  $("#reviewCount").textContent = reviews.length;
  $("#openReviewMetric").textContent = reviews.length;
  window.ProoflineUX?.refresh();
  closeUpload();
  resetFile();
  showToast(
    sourcePoc ? "Deployment review started" : `${newItem.lifecycle} review started`,
    sourcePoc ? `${sourcePoc.id} evidence was carried into ${newItem.id} for ${registryRecord.id}.` : `${newItem.id} is linked to ${registryRecord.id} and is ready for assignment by the team lead.`
  );
});

document.addEventListener("click", (event) => {
  const reviewButton = event.target.closest("[data-open-review]");
  if (reviewButton) openReview(reviewButton.dataset.openReview);
});
$("#drawerClose").addEventListener("click", closeReview);
$("#respondButton").addEventListener("click", () => window.ProoflineUX?.evidenceDialog());
$("#downloadWorkbookButton").addEventListener("click", downloadWorkbook);
$("#auditorFileInput").addEventListener("change", (event) => acceptAuditorWorkbook(event.target.files[0]));
$("#requestEvidenceButton").addEventListener("click", requestEvidence);
$("#signOffButton").addEventListener("click", signOffReview);

$$('.filter-chip').forEach((button) => button.addEventListener("click", () => {
  $$('.filter-chip').forEach((chip) => chip.classList.remove("active"));
  button.classList.add("active");
  renderQueue(button.dataset.filter);
}));

$("#timelineBuilder").addEventListener("input", (event) => {
  const input = event.target.closest(".stage-days");
  if (!input) return;
  const stage = processStages.find((item) => item.id === input.closest("[data-stage-id]").dataset.stageId);
  if (stage) stage.days = Number(input.value) || 0;
  updateCycleDays();
  markAdminChanged("1 process change not published");
});
$("#timelineBuilder").addEventListener("dragstart", (event) => {
  const row = event.target.closest("[data-stage-id]");
  if (!row) return;
  draggedStageId = row.dataset.stageId;
  row.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
});
$("#timelineBuilder").addEventListener("dragover", (event) => {
  const row = event.target.closest("[data-stage-id]");
  if (!row || row.dataset.stageId === draggedStageId) return;
  event.preventDefault();
  $$(".timeline-stage.drag-target", $("#timelineBuilder")).forEach((item) => item.classList.remove("drag-target"));
  row.classList.add("drag-target");
});
$("#timelineBuilder").addEventListener("drop", (event) => {
  const target = event.target.closest("[data-stage-id]");
  if (!target || !draggedStageId || target.dataset.stageId === draggedStageId) return;
  event.preventDefault();
  const fromIndex = processStages.findIndex((stage) => stage.id === draggedStageId);
  const targetIndex = processStages.findIndex((stage) => stage.id === target.dataset.stageId);
  const [moved] = processStages.splice(fromIndex, 1);
  processStages.splice(targetIndex, 0, moved);
  renderProcessStages();
  markAdminChanged("Process order not published");
});
$("#timelineBuilder").addEventListener("dragend", () => {
  draggedStageId = null;
  $$(".timeline-stage", $("#timelineBuilder")).forEach((item) => item.classList.remove("dragging", "drag-target"));
});

$("#saveConfigButton").addEventListener("click", () => {
  $("#adminDraftState").textContent = "No unpublished changes";
  $("#adminDraftState").classList.remove("changed");
  showToast("Changes published", "A new configuration version is active and recorded in the audit log.");
});
$$('.admin-tab').forEach((button) => button.addEventListener("click", () => setAdminTab(button.dataset.adminTab)));
$$('[data-admin-tab-jump]').forEach((button) => button.addEventListener("click", () => setAdminTab(button.dataset.adminTabJump)));
$("#addStageButton").addEventListener("click", () => openAdminModal("stage"));
$("#addStageInlineButton").addEventListener("click", () => openAdminModal("stage"));
$("#createNewsButton").addEventListener("click", () => openAdminModal("news"));
$("#addLibraryButton").addEventListener("click", () => openAdminModal("resource"));
$("#mapGroupButton").addEventListener("click", () => openAdminModal("group"));
$("#addRegistryFieldButton").addEventListener("click", () => openAdminModal("registryField"));
$("#addRegistryFieldInlineButton").addEventListener("click", () => openAdminModal("registryField"));
$("#newsSearch").addEventListener("input", renderAdminNews);
$("#librarySearch").addEventListener("input", renderLibrary);
$("#libraryCollectionFilter").addEventListener("change", renderLibrary);
$$('[data-news-filter]').forEach((button) => button.addEventListener("click", () => {
  adminNewsFilter = button.dataset.newsFilter;
  $$('[data-news-filter]').forEach((item) => item.classList.toggle("active", item === button));
  renderAdminNews();
}));

$("#adminView").addEventListener("change", (event) => {
  if (event.target.matches(".toggle-row input, .field-label select, #lifecycleSelect")) markAdminChanged();
});

$("#adminView").addEventListener("click", (event) => {
  const stageButton = event.target.closest("[data-edit-stage]");
  const newsButton = event.target.closest("[data-edit-news]");
  const resourceButton = event.target.closest("[data-edit-resource]");
  const groupButton = event.target.closest("[data-edit-group]");
  const registryFieldButton = event.target.closest("[data-edit-registry-field]");
  const removeRegistryFieldButton = event.target.closest("[data-remove-registry-field]");
  if (stageButton) openAdminModal("stage", processStages.find((item) => item.id === stageButton.dataset.editStage));
  if (newsButton) openAdminModal("news", adminNews.find((item) => item.id === Number(newsButton.dataset.editNews)));
  if (resourceButton) openAdminModal("resource", libraryResources.find((item) => item.id === Number(resourceButton.dataset.editResource)));
  if (groupButton) openAdminModal("group", directoryGroups.find((item) => item.id === Number(groupButton.dataset.editGroup)));
  if (registryFieldButton) openAdminModal("registryField", registryFieldDefinitions.find((field) => field.key === registryFieldButton.dataset.editRegistryField));
  if (removeRegistryFieldButton && !removeRegistryFieldButton.disabled) {
    registryFieldDefinitions = registryFieldDefinitions.filter((field) => field.key !== removeRegistryFieldButton.dataset.removeRegistryField);
    renderRegistryFieldsAdmin();
    markAdminChanged("Registry schema change not published");
    showToast("Registry field removed", "Existing record values are retained for audit history.", "×");
  }
});

$("#syncGroupsButton").addEventListener("click", () => {
  const button = $("#syncGroupsButton");
  button.disabled = true;
  button.textContent = "↻ Syncing…";
  setTimeout(() => {
    directoryGroups.forEach((group) => { group.sync = "Just now"; });
    renderGroups();
    button.disabled = false;
    button.textContent = "↻ Sync now";
    showToast("Directory synced", "4 group mappings refreshed; membership remains managed in Entra ID.", "↻");
  }, 900);
});

$("#adminModalClose").addEventListener("click", closeAdminModal);
$("#adminModalCancel").addEventListener("click", closeAdminModal);
$("#adminModal").addEventListener("click", (event) => { if (event.target.id === "adminModal") closeAdminModal(); });
$("#adminModalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!activeAdminModal) return;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const { type, item } = activeAdminModal;
  if (type === "stage") {
    const value = { id: item?.id || `stage-${Date.now()}`, name: data.name, detail: data.detail, owner: data.owner, role: data.role, days: Number(data.days) };
    if (item) Object.assign(item, value); else processStages.push(value);
    renderProcessStages();
  }
  if (type === "registryField") {
    const keyBase = data.label.trim().toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, character) => character.toUpperCase()).replace(/[^a-z0-9]/g, "") || `field${Date.now()}`;
    const options = data.options.split(/\r?\n/).map((option) => option.trim()).filter(Boolean);
    if (data.type === "select" && options.length < 2) {
      showToast("Add at least two options", "Select fields need two or more choices.", "!");
      return;
    }
    let key = item?.key || keyBase;
    if (!item) {
      let suffix = 2;
      while (registryFieldDefinitions.some((field) => field.key === key)) key = `${keyBase}${suffix++}`;
    }
    const value = { key, label: data.label, type: data.type, required: data.required === "on", options: data.type === "select" ? options : [], help: data.help, core: item?.core || false };
    if (item) Object.assign(item, value); else registryFieldDefinitions.push(value);
    renderRegistryFieldsAdmin();
  }
  if (type === "news") {
    const selectedAttachments = [...($("#newsAttachmentInput")?.files || [])].map((file) => file.name);
    const value = { id: item?.id || Date.now(), title: data.title, summary: data.summary, audience: data.audience, status: data.status, timing: data.status === "published" ? "Published just now" : "Edited just now", attachments: selectedAttachments.length ? selectedAttachments : (item?.attachments || []) };
    if (item) Object.assign(item, value); else adminNews.unshift(value);
    renderAdminNews();
  }
  if (type === "resource") {
    const uploadedFile = $("#resourceFileInput")?.files?.[0];
    if (!uploadedFile && !data.url && !item) {
      showToast("Add the resource content", "Upload a file or provide a governed external URL.", "!");
      $('input[name="url"]', $("#adminModalFields")).focus();
      return;
    }
    const fileLabel = uploadedFile ? `${fileKind(uploadedFile.name)} · ${uploadedFile.name}` : (item?.file || (data.url ? "LINK · External source" : "FILE · Pending upload"));
    const value = { id: item?.id || Date.now(), title: data.title, file: fileLabel, url: data.url, collection: data.collection, audience: data.audience.split(",").map((group) => group.trim()), owner: data.owner, review: new Date(`${data.review}T00:00:00`).toLocaleDateString("en", { month: "short", day: "2-digit" }) };
    if (item) Object.assign(item, value); else libraryResources.unshift(value);
    renderLibrary();
  }
  if (type === "group") {
    const value = { id: item?.id || Date.now(), name: data.name, externalId: "Entra security group", role: data.role, scope: data.scope, members: item?.members || 0, sync: "Pending first sync" };
    if (item) Object.assign(item, value); else directoryGroups.push(value);
    renderGroups();
  }
  closeAdminModal();
  markAdminChanged();
  showToast(item ? "Configuration updated" : "Configuration added", "Publish changes when you are ready to make them active.", "+");
});
$("#adminModalFields").addEventListener("change", (event) => {
  if (event.target.matches('input[type="file"]')) renderSelectedFiles(event.target);
});
$("#registerUseCaseButton").addEventListener("click", () => openRegistryModal());
$("#registerFromReviewButton").addEventListener("click", () => openRegistryModal(null, false, true));
$("#reviewRegistrySelect").addEventListener("change", syncRegistrySelectionDetail);
$("#registrySearch").addEventListener("input", renderRegistryRecords);
$("#registryModalClose").addEventListener("click", closeRegistryModal);
$("#registryModalCancel").addEventListener("click", closeRegistryModal);
$("#registryModal").addEventListener("click", (event) => { if (event.target.id === "registryModal") closeRegistryModal(); });
$("#registryModalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (registryModalReadOnly) { closeRegistryModal(); return; }
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const wasFromReview = registryOpenedFromReview;
  const wasEditing = Boolean(activeRegistryRecord);
  const record = activeRegistryRecord || { id: nextRegistryId(), group: "R&D", values: {} };
  record.values ||= {};
  registryFieldDefinitions.forEach((field) => {
    const value = data[field.key] || "";
    if (["name", "brief", "techOwner", "businessOwner", "lifecycle"].includes(field.key)) record[field.key] = value;
    else record.values[field.key] = value;
  });
  record.updated = "Just now";
  if (!activeRegistryRecord) registryEntries.unshift(record);
  closeRegistryModal();
  renderRegistryRecords();
  renderRegistryFieldsAdmin();
  $("#registryCount").textContent = visibleRegistryEntries().length;
  if (wasFromReview) syncReviewRegistryOptions(record.id);
  showToast(wasEditing ? "Registry record updated" : "AI use case registered", `${record.id} is ready to link to a review.`, "◇");
});
$("#notificationButton").addEventListener("click", () => navigateWorkspace("notifications"));
$("#workspaceNewsSearch").addEventListener("input", renderWorkspaceNews);
$("#workspaceLibrarySearch").addEventListener("input", renderWorkspaceLibrary);
$$('[data-library-reader-filter]').forEach((button) => button.addEventListener("click", () => {
  libraryReaderFilter = button.dataset.libraryReaderFilter;
  $$('[data-library-reader-filter]').forEach((item) => item.classList.toggle("active", item === button));
  renderWorkspaceLibrary();
}));
$("#contentPreviewClose").addEventListener("click", closeContentPreview);
$("#previewCopyLinkButton").addEventListener("click", () => showToast("Link copied", "A shareable workspace link is ready.", "⌁"));
$("#previewOpenButton").addEventListener("click", () => showToast("Resource ready", "The controlled attachment would open from cloud storage.", "↗"));
$("#libraryHelpButton").addEventListener("click", () => showToast("Request started", "The Responsible AI Office contact route is ready for backend integration.", "?"));

document.addEventListener("click", (event) => {
  const newsButton = event.target.closest("[data-preview-news]");
  const resourceButton = event.target.closest("[data-preview-resource]");
  const adminSectionButton = event.target.closest("[data-open-admin-section]");
  const registryButton = event.target.closest("[data-open-registry]");
  if (newsButton) openContentPreview("news", adminNews.find((item) => item.id === Number(newsButton.dataset.previewNews)));
  if (resourceButton) openContentPreview("resource", libraryResources.find((item) => item.id === Number(resourceButton.dataset.previewResource)));
  if (registryButton) openRegistryModal(registryEntries.find((entry) => entry.id === registryButton.dataset.openRegistry), document.body.dataset.role === "auditor");
  if (adminSectionButton) {
    navigateWorkspace("configuration");
    setAdminTab(adminSectionButton.dataset.openAdminSection);
  }
});

$("#reviewSearch").addEventListener("input", renderReviewRegister);
$$('[data-register-filter]').forEach((button) => button.addEventListener("click", () => {
  registerFilter = button.dataset.registerFilter;
  $$('[data-register-filter]').forEach((item) => item.classList.toggle("active", item === button));
  renderReviewRegister();
}));

$$('[data-notification-filter]').forEach((button) => button.addEventListener("click", () => {
  notificationFilter = button.dataset.notificationFilter;
  $$('[data-notification-filter]').forEach((item) => item.classList.toggle("active", item === button));
  renderNotifications();
}));

$("#markAllReadButton").addEventListener("click", () => {
  roleNotifications().forEach((item) => { item.unread = false; });
  renderNotifications();
  showToast("Notifications cleared", "All visible events are marked as read.", "✓");
});

$("#notificationList").addEventListener("click", (event) => {
  const row = event.target.closest("[data-notification-id]");
  if (!row) return;
  const notification = notifications.find((item) => item.id === row.dataset.notificationId);
  if (notification) notification.unread = false;
  syncNotificationIndicator();
});

$$('.nav-item').forEach((item) => item.addEventListener("click", () => {
  if (item.dataset.nav === "configuration" && document.body.dataset.role !== "admin") switchRole("admin");
  else navigateWorkspace(item.dataset.nav);
}));

$$('[data-nav-jump]').forEach((button) => button.addEventListener("click", () => navigateWorkspace(button.dataset.navJump)));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { closeUpload(); closeReview(); closeAdminModal(); closeContentPreview(); closeRegistryModal(); }
});

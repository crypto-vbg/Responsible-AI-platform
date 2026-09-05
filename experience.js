/* Local persona experience. State is intentionally in memory; production access belongs in the API. */
(() => {
  "use strict";
  const team = [
    { id: "priya", name: "Priya Shah", initials: "PS", specialty: "Model risk", canDecide: true },
    { id: "jon", name: "Jon Lee", initials: "JL", specialty: "Data & privacy", canDecide: true },
    { id: "lina", name: "Lina Chen", initials: "LC", specialty: "Language models", canDecide: false },
    { id: "neha", name: "Neha Rao", initials: "NR", specialty: "Fairness & impact", canDecide: false },
    { id: "omar", name: "Omar Hassan", initials: "OH", specialty: "Model assurance", canDecide: false }
  ];
  const assignments = { "RAI-2047": null, "RAI-2041": "jon", "RAI-2038": "priya", "RAI-2033": "lina", "RAI-2029": "neha" };
  let leadId = "priya", personId = "priya", scope = "mine", filter = "all", search = "";
  let dialogContext = null, returnFocus = null, drawerFocus = null;
  const history = [];
  const evidence = { "RAI-2041": { question: "Provide the current drift threshold and one example of a triggered investigation." } };
  const el = (s) => document.querySelector(s);
  const esc = escapeHtml;
  const role = () => document.body.dataset.role;
  const person = () => team.find((p) => p.id === personId);
  const lead = () => team.find((p) => p.id === leadId);
  const isLead = () => role() === "auditor" && personId === leadId;
  const personalQueue = () => queue.filter((r) => assignments[r.id] === personId);
  const unassigned = () => queue.filter((r) => !assignments[r.id]);
  const owner = (id) => team.find((p) => p.id === assignments[id]);
  const isClosed = (r) => /approved|closed|rejected/i.test(r?.status || r?.stage || "");
  const button = (action, label, cls = "secondary-button", extra = "") => '<button type="button" class="' + cls + '" data-ux="' + action + '" ' + extra + '>' + label + '</button>';
  const initials = (p) => '<span class="ux-avatar" aria-hidden="true">' + p.initials + '</span>';
  const pill = (text, tone = "") => '<span class="ux-pill ' + tone + '">' + esc(text) + '</span>';
  function log(title, detail) {
    history.unshift({ title, detail, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
  }
  function notify(reviewId, recipientRole, title, message) {
    notifications.unshift({ id: "N-" + Date.now() + "-" + notifications.length, roles: [recipientRole], reviewId,
      auditorId: recipientRole === "auditor" ? assignments[reviewId] : undefined,
      kind: "assignment", icon: "↗", title, message, time: "Just now", unread: true });
  }
  function stageIndex(r) {
    if (isClosed(r)) return 3;
    if (/evidence/i.test(r.status || r.stage)) return 2;
    return assignments[r.id] ? 1 : 0;
  }
  function rail(r) {
    const current = stageIndex(r);
    return '<ol class="ux-handoff" aria-label="Review progress">' + ["Submitted", "Assessment", "Evidence", "Decision"].map((name, i) =>
      '<li class="' + (i < current ? "passed" : i === current ? "current" : "") + '"' + (i === current ? ' aria-current="step"' : "") + '><i>' + (i < current ? "✓" : i + 1) + '</i><span>' + name + '</span></li>'
    ).join("") + '</ol>';
  }
  function metric(label, count, note) {
    return '<div class="ux-metric"><span>' + label + '</span><strong>' + count + '</strong><small>' + note + '</small></div>';
  }
  function mount() {
    document.body.classList.add("ux-enabled");
    el(".main-stage").insertAdjacentHTML("afterbegin", '<div class="ux-preview"><span><i></i> Local design preview <small>Sample data · changes reset on refresh</small></span><label id="auditorPreviewLabel" hidden>Preview auditor <select id="auditorPreview">' + team.map((p) => '<option value="' + p.id + '">' + p.name + '</option>').join("") + '</select></label></div>');
    el("#userView").insertAdjacentHTML("afterbegin", '<div id="submitterFocus"></div>');
    el("#auditorView").innerHTML = '<div id="auditorFocus"></div><section class="panel ux-queue"><div class="ux-section-head"><div><p class="eyebrow">AUDIT WORKSPACE</p><h2>Review queue</h2></div><span id="queueScopeLabel" class="ux-subtle"></span></div><div class="ux-queue-controls"><div id="queueTabs" class="ux-tabs" role="group" aria-label="Review scope"></div><label class="ux-search"><span aria-hidden="true">⌕</span><input id="auditSearch" type="search" placeholder="Search review, ID or team" aria-label="Search audit queue"></label></div><div class="ux-filter-line"><div class="ux-filters" role="group" aria-label="Filter reviews">' + [["all", "All priorities"], ["urgent", "Due within 24h"], ["evidence", "Evidence"]].map(([id, label]) => button("filter", label, "ux-filter", 'data-value="' + id + '"')).join("") + '</div><span id="queueResultCount" class="ux-subtle" role="status"></span></div><div id="auditorQueue" class="ux-queue-list"></div></section><div id="auditorLower" class="ux-two-column"></div>';
    el("#adminView").insertAdjacentHTML("beforebegin", '<section id="adminHome" class="role-view"></section>');
    el(".admin-rail .directory-mini").insertAdjacentHTML("beforebegin", '<button class="admin-tab" data-admin-tab="teams" data-ux="teams"><span class="admin-tab-icon">↗</span><span><strong>Audit team</strong><small>People & lead responsibility</small></span><b>5</b></button>');
    el(".admin-workspace").insertAdjacentHTML("beforeend", '<section class="admin-pane" data-admin-pane="teams" id="teamSettings"></section>');
    document.body.insertAdjacentHTML("beforeend", '<dialog id="experienceDialog" class="ux-dialog" aria-labelledby="uxDialogTitle"><form id="experienceForm"><div class="ux-dialog-head"><p class="eyebrow" id="uxDialogEyebrow"></p><button type="button" class="ux-close" data-ux="close-dialog" aria-label="Close dialog">×</button></div><h2 id="uxDialogTitle"></h2><div id="uxDialogBody"></div><p id="uxDialogError" class="ux-form-error" role="alert" hidden></p><div class="ux-dialog-actions">' + button("close-dialog", "Cancel") + '<button type="submit" id="uxDialogSave" class="primary-button">Save</button></div></form></dialog>');
    el("#reviewDrawer .drawer-section").insertAdjacentHTML("afterend", '<div id="reviewNextAction"></div>');
    el("#reviewDrawer").setAttribute("role", "region");
    el("#reviewDrawer").setAttribute("aria-label", "Review details");
    el("#toast").setAttribute("role", "status");
    el(".signal-card").innerHTML = '<div class="signal-head"><span>RESPONSIBLE AI</span><span class="live-dot">Preview</span></div><p class="ux-sidebar-note">Every review.<br>Clear accountability.</p><small>One connected evidence trail</small><strong id="healthScore" hidden></strong>';
    el("#auditorPreview").addEventListener("change", (e) => {
      personId = e.target.value; scope = "mine"; closeReview(); refresh();
      if (currentWorkspacePage === "reviews") renderReviewRegister();
      if (currentWorkspacePage === "notifications") renderNotifications();
      showToast("Previewing " + person().name, personId === leadId ? "Lead Auditor · assignment controls available" : "Auditor · assigned reviews only");
    });
    el("#auditSearch").addEventListener("input", (e) => { search = e.target.value; renderAuditQueue(); });
    document.addEventListener("click", handleClick);
    el("#experienceForm").addEventListener("submit", saveDialog);
    el("#experienceDialog").addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const controls = [...el("#experienceDialog").querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    el("#experienceDialog").addEventListener("close", () => { dialogContext = null; returnFocus?.focus(); });
    el("#experienceDialog").addEventListener("click", (e) => { if (e.target === el("#experienceDialog")) closeDialog(); });
    el(".submitter-workbench .secondary-button").addEventListener("click", downloadWorkbook);
    el(".role-switcher-label").textContent = "Preview as";
    el(".brand").addEventListener("click", (e) => { e.preventDefault(); navigateWorkspace("overview"); });
    refresh();
    navigate(currentWorkspacePage);
    if (role() === "admin" && new URLSearchParams(location.search).get("adminTab") === "teams") { navigateWorkspace("configuration"); setAdminTab("teams"); }
  }
  function syncProfile() {
    if (role() !== "auditor") return;
    const p = person();
    roleProfiles.auditor.name = p.name;
    roleProfiles.auditor.role = p.id === leadId ? "Lead Auditor" : "Auditor";
    roleProfiles.auditor.avatar = p.initials;
    el("#profileName").textContent = p.name;
    el("#profileRole").textContent = roleProfiles.auditor.role;
    el("#profileAvatar").textContent = p.initials;
  }
  function renderSubmitter() {
    const open = reviews.filter((r) => !isClosed(r));
    const needed = open.filter((r) => /evidence requested/i.test(r.status));
    const focus = needed[0] || open[0];
    const title = needed.length ? "Your evidence moves this forward." : open.length ? "Know where every review stands." : "Start with a registered AI use case.";
    const detail = needed.length ? evidence[focus.id]?.question || "Your auditor has requested supporting evidence." : "Track the current owner, see the next step, and keep your review moving.";
    el("#submitterFocus").innerHTML = '<div class="ux-page-intro"><div><p class="eyebrow">YOUR WORK, AT A GLANCE</p><h2>Make the next step clear.</h2><p>From your first submission to the final decision.</p></div>' + pill("Submitter workspace") + '</div><div class="ux-focus-grid"><article class="ux-focus"><div class="ux-focus-top"><span class="ux-label">' + (needed.length ? "ACTION REQUIRED" : "REVIEW JOURNEY") + '</span>' + pill(needed.length ? "Your turn" : "In progress") + '</div><h3>' + title + '</h3><p>' + esc(detail) + '</p>' + (focus ? '<div class="ux-focus-record"><span>' + focus.id + '</span><strong>' + esc(focus.name) + '</strong></div>' + rail(focus) : "") + '<div class="ux-focus-actions">' + (focus ? button("open-review", needed.length ? "Respond to request →" : "View review →", "inverse-button", 'data-id="' + focus.id + '"') : button("registry", "Register a use case →", "inverse-button")) + button("continue-poc", "Continue approved POC ↗", "ux-light-button") + '</div></article><aside class="ux-metric-stack">' + metric("Needs your response", needed.length, needed.length ? "Evidence requested by your auditor" : "You are up to date") + metric("Reviews in progress", open.length, "Across POC and deployment") + metric("Ready to register?", "AI Registry", "Keep owners and use case details together") + button("registry", "Open AI Registry →", "text-button") + '</aside></div>';
    renderUserList();
  }
  function renderUserList() {
    el("#userReviewList").innerHTML = reviews.map((r) => {
      const needs = /evidence requested/i.test(r.status);
      const p = owner(r.id);
      return '<article class="ux-review-card"><div class="ux-review-main"><span class="ux-id">' + r.id + ' / ' + esc(r.lifecycle || "POC") + '</span><button class="ux-title-button" data-open-review="' + r.id + '">' + esc(r.name) + '</button><span class="ux-subtle">' + esc(r.registryId || "") + ' · ' + esc(r.owner) + '</span></div><div>' + pill(r.status, needs ? "amber" : isClosed(r) ? "green" : "") + '<p class="ux-next-label">' + (needs ? "Next: provide supporting evidence" : isClosed(r) ? "Decision recorded" : p ? "Next: assessment by " + p.name : "Next: lead assigns an auditor") + '</p></div><div class="ux-card-owner"><small>CURRENT OWNER</small><strong>' + (needs ? "You" : isClosed(r) ? "Complete" : p ? p.name : "Lead Auditor") + '</strong><span>' + esc(r.updated) + '</span></div>' + button("open-review", needs ? "Respond →" : "View →", "secondary-button", 'data-id="' + r.id + '"') + '</article>';
    }).join("");
  }
  function renderAuditor() {
    const mine = personalQueue(), urgent = mine.filter((r) => r.tags.includes("urgent"));
    el("#auditorFocus").innerHTML = '<div class="ux-page-intro"><div><p class="eyebrow">' + (isLead() ? "TEAM LEAD / RESPONSIBLE AI ASSURANCE" : "RESPONSIBLE AI ASSURANCE") + '</p><h2>' + (isLead() ? "Good judgment starts with clear ownership." : "Your next review, in focus.") + '</h2><p>' + (isLead() ? "Keep work moving. Assign with context and balance the team’s workload." : "Your assigned reviews, ordered by urgency. Evidence and decisions stay together.") + '</p></div>' + pill(isLead() ? "Lead Auditor" : "Auditor", "green") + '</div><div class="ux-audit-brief"><div class="ux-brief-message"><span class="ux-pulse" aria-hidden="true">↗</span><div><strong>' + (isLead() ? unassigned().length + (unassigned().length === 1 ? " review needs an owner" : " reviews need an owner") : mine.length ? "Start with the earliest service deadline" : "Your queue is clear") + '</strong><p>' + (isLead() ? "Choose an auditor based on expertise and current workload." : mine.length ? "Your team lead manages assignments. Open a review to begin." : "New assignments will appear here when your lead assigns them.") + '</p></div>' + (isLead() ? button("scope", "View unassigned →", "secondary-button", 'data-value="unassigned"') : "") + '</div><div class="ux-brief-metrics">' + metric("My reviews", mine.length, "Assigned to you") + metric("Due within 24h", urgent.length, "Your priority work") + (isLead() ? metric("Auditors", team.length, "One shared audit team") : metric("Evidence", mine.filter((r) => r.tags.includes("evidence")).length, "Awaiting response")) + '</div></div>';
    renderAuditQueue();
    el("#auditorLower").innerHTML = (isLead() ? workload() : '<section class="panel ux-guidance"><p class="eyebrow">REVIEW CHECKLIST</p><h2>A consistent assessment</h2><ol><li>Read the use case and accountable owners.</li><li>Download and annotate the assessment workbook.</li><li>Request specific evidence for unresolved controls.</li><li>Record a decision when you have sign-off authority.</li></ol>' + button("library", "Open review guidance →", "text-button") + '</section>') + activity();
  }
  function renderAuditQueue() {
    if (!el("#queueTabs")) return;
    if (!isLead()) scope = "mine";
    const scopes = [["mine", "My reviews", personalQueue().length]];
    if (isLead()) scopes.push(["unassigned", "Unassigned", unassigned().length], ["team", "Team queue", queue.length]);
    el("#queueTabs").innerHTML = scopes.map(([id, name, count]) => button("scope", name + ' <span>' + count + '</span>', "ux-tab" + (scope === id ? " active" : ""), 'data-value="' + id + '" aria-pressed="' + (scope === id) + '"')).join("");
    let items = scope === "mine" ? personalQueue() : scope === "unassigned" ? unassigned() : queue;
    items = items.filter((r) => (filter === "all" || r.tags.includes(filter)) && (r.id + " " + r.name + " " + r.org).toLowerCase().includes(search.toLowerCase()));
    items = [...items].sort((a, b) => Number(b.tags.includes("urgent")) - Number(a.tags.includes("urgent")));
    el("#queueResultCount").textContent = items.length + (items.length === 1 ? " review" : " reviews");
    el("#queueScopeLabel").textContent = scope === "mine" ? person().name : "Responsible AI Assurance";
    document.querySelectorAll('[data-ux="filter"]').forEach((b) => { b.classList.toggle("active", b.dataset.value === filter); b.setAttribute("aria-pressed", String(b.dataset.value === filter)); });
    el("#auditorQueue").innerHTML = items.length ? '<div class="ux-queue-header"><span>REVIEW / BUSINESS AREA</span><span>RISK & DEADLINE</span><span>CURRENT OWNER</span><span>NEXT ACTION</span></div>' + items.map((r) => {
      const p = owner(r.id), assignedToMe = p?.id === personId;
      return '<article class="ux-queue-row"><div><span class="ux-id">' + r.id + ' · ' + r.lifecycle + '</span><button class="ux-title-button" data-open-review="' + r.id + '">' + esc(r.name) + '</button><span class="ux-subtle">' + esc(r.org) + ' · ' + esc(r.stage) + '</span></div><div class="ux-risk-time">' + pill(r.risk + " risk", r.risk === "High" ? "red" : r.risk === "Medium" ? "amber" : "") + '<span class="' + (r.tags.includes("urgent") ? "ux-urgent" : "ux-subtle") + '">' + esc(r.sla) + '</span></div><div class="ux-owner">' + (p ? initials(p) + '<span><strong>' + p.name + '</strong><small>' + (p.id === leadId ? "Lead Auditor" : p.specialty) + '</small></span>' : '<span class="ux-unassigned">Unassigned</span>') + '</div><div class="ux-row-actions">' + (isLead() ? button("assign", p ? "Reassign" : "Assign auditor", p ? "ux-link" : "primary-button", 'data-id="' + r.id + '"') : "") + (assignedToMe ? button("open-review", "Review →", "secondary-button", 'data-id="' + r.id + '"') : "") + '</div></article>';
    }).join("") : '<div class="ux-empty"><span aria-hidden="true">✓</span><h3>' + (search || filter !== "all" ? "No reviews match these filters" : scope === "unassigned" ? "Every review has an owner" : "No reviews assigned yet") + '</h3><p>' + (search || filter !== "all" ? "Try a different name or clear your filters." : scope === "unassigned" ? "You can rebalance existing work from the team queue." : "Your team lead will assign work here when it is ready.") + '</p>' + (search || filter !== "all" ? button("clear-filters", "Clear filters") : scope === "unassigned" ? button("scope", "View team queue", "secondary-button", 'data-value="team"') : "") + '</div>';
  }
  function workload() {
    return '<section class="panel ux-workload"><div class="ux-section-head"><div><p class="eyebrow">ASSIGN WITH CONTEXT</p><h2>Team workload</h2></div>' + pill("5 auditors") + '</div><p class="ux-subtle">Open reviews in this preview. Consider expertise as well as count.</p>' + team.map((p) => {
      const count = queue.filter((r) => assignments[r.id] === p.id).length;
      return '<div class="ux-workload-row">' + initials(p) + '<div><strong>' + p.name + '</strong><small>' + (p.id === leadId ? "Lead · " : "") + p.specialty + '</small></div><meter min="0" max="' + Math.max(4, count) + '" value="' + count + '" aria-label="' + p.name + ': ' + count + ' open reviews"></meter><b>' + count + '</b></div>';
    }).join("") + '</section>';
  }
  function activity() {
    const visible = history.filter((h) => role() === "admin" || isLead() || h.detail.includes(person().name));
    return '<section class="panel ux-activity"><p class="eyebrow">ACCOUNTABILITY</p><h2>Assignment history</h2>' + (visible.length ? '<ol>' + visible.slice(0, 6).map((h) => '<li><span class="ux-event-dot"></span><div><strong>' + esc(h.title) + '</strong><p>' + esc(h.detail) + '</p><small>' + h.time + '</small></div></li>').join("") + '</ol>' : '<div class="ux-history-empty"><span>↗</span><strong>A clear record of every handoff</strong><p>Assignment and lead changes made in this preview appear here with their reason and actor.</p></div>') + '</section>';
  }
  function renderAdmin() {
    const unowned = unassigned();
    el("#adminHome").innerHTML = '<div class="ux-page-intro"><div><p class="eyebrow">GOVERNANCE OPERATIONS</p><h2>A clear view of what needs you.</h2><p>Keep ownership, process, and access ready for the team.</p></div>' + button("configuration", "Open configuration →", "primary-button") + '</div><div class="ux-admin-metrics">' + metric("Active reviews", queue.length, "Across the audit team") + metric("Awaiting assignment", unowned.length, "Routed to the Lead Auditor") + metric("Auditors", team.length, "RAI-Auditors") + metric("Team lead", lead().name, "Responsible AI Assurance") + '</div><div class="ux-two-column"><section class="panel ux-admin-actions"><p class="eyebrow">OPERATING PRIORITIES</p><h2>Keep the process moving</h2><article><span class="ux-action-icon">↗</span><div><strong>' + unowned.length + ' reviews awaiting an owner</strong><p>' + lead().name + ' manages assignment for this team.</p></div>' + button("teams", "Manage team", "secondary-button") + '</article><article><span class="ux-action-icon">◎</span><div><strong>One group. Clear responsibilities.</strong><p>Five auditors share access; the designated lead assigns work.</p></div>' + button("groups", "View groups", "secondary-button") + '</article><article><span class="ux-action-icon">⌘</span><div><strong>Review lifecycle</strong><p>Manage stages, service windows, and decision rights.</p></div>' + button("configuration", "Configure", "secondary-button") + '</article></section>' + activity() + '</div><section class="ux-admin-team-strip"><div><p class="eyebrow">RESPONSIBLE AI ASSURANCE</p><h3>Your audit team</h3><p>Lead responsibility can change without changing the Auditor persona.</p></div><div class="ux-avatar-stack">' + team.map(initials).join("") + '</div>' + button("teams", "Manage lead & team →", "secondary-button") + '</section>';
    el("#teamSettings").innerHTML = '<div class="admin-pane-head"><div><p class="eyebrow">TEAM RESPONSIBILITY</p><h2>Responsible AI Assurance</h2><p>All five members are Auditors. One designated lead manages assignments.</p></div>' + button("change-lead", "Change team lead", "primary-button") + '</div><div class="ux-lead-card">' + initials(lead()) + '<div><small>CURRENT LEAD AUDITOR</small><h3>' + lead().name + '</h3><p>Can assign and reassign reviews within this team.</p></div>' + pill("Assignment authority", "green") + '</div><div class="ux-team-boundary"><strong>Access and responsibility stay separate.</strong><p>Directory membership grants Auditor access. This team setting grants assignment responsibility. Decision authority is recorded separately for each auditor.</p></div><div class="ux-team-members">' + team.map((p) => '<article>' + initials(p) + '<div><strong>' + p.name + '</strong><small>' + p.specialty + '</small></div>' + pill(p.id === leadId ? "Lead Auditor" : "Auditor", p.id === leadId ? "green" : "") + '<span class="ux-subtle">' + (p.canDecide ? "Sign-off authority" : "Assessment only") + '</span></article>').join("") + '</div>';
  }
  function navigate(page) {
    el("#adminHome").classList.toggle("active", role() === "admin" && page === "overview");
    if (role() === "admin" && page === "overview") { el("#adminView").classList.remove("active"); el("#pageTitle").textContent = "Operations overview"; }
    if (role() === "auditor" && page === "overview") el("#pageTitle").textContent = isLead() ? "Audit operations" : "My audit workspace";
    el("#auditorPreviewLabel").hidden = role() !== "auditor";
    document.querySelectorAll(".nav-item").forEach((b) => b.setAttribute("aria-current", b.classList.contains("active") ? "page" : "false"));
    syncProfile();
    syncNotificationIndicator();
    renderAuditor(); renderAdmin(); renderSubmitter();
    el("#reviewCount").textContent = role() === "auditor" ? personalQueue().length : role() === "admin" ? queue.length : reviews.filter((r) => !isClosed(r)).length;
  }
  function refresh() { syncProfile(); navigate(currentWorkspacePage); }
  function canOpen(id) {
    if (role() === "auditor" && !isLead() && !personalQueue().some((r) => r.id === id)) { showToast("Review unavailable", "This review is not currently assigned to you.", "!"); return false; }
    return true;
  }
  function canReview(id, decision = false) {
    const ok = role() === "auditor" && assignments[id] === personId && queue.some((r) => r.id === id) && (!decision || person().canDecide);
    if (!ok) showToast("Action unavailable", decision ? "This action requires an assigned auditor with sign-off authority." : "Only the assigned auditor can assess this review.", "!");
    return ok;
  }
  function drawer(id) {
    const r = reviews.find((x) => x.id === id) || queue.find((x) => x.id === id);
    if (!r) return;
    drawerFocus = document.activeElement;
    const p = owner(id), needs = /evidence requested|^evidence$/i.test(r.status || r.stage);
    const mine = role() === "auditor" && p?.id === personId && !isClosed(r);
    el(".risk-banner > span").textContent = (r.risk || "Pending") + " risk";
    el("#reviewNextAction").innerHTML = '<div class="ux-drawer-context"><div><small>CURRENT OWNER</small><strong>' + (isClosed(r) ? "Complete" : needs ? "Submitter" : p ? p.name : "Lead Auditor") + '</strong></div><div><small>NEXT ACTION</small><strong>' + (isClosed(r) ? "Decision recorded" : needs ? "Respond to evidence request" : p ? "Assess controls" : "Assign an auditor") + '</strong></div></div>' + (isLead() && !isClosed(r) ? button("assign", p ? "Reassign review" : "Assign auditor", "secondary-button", 'data-id="' + id + '"') : "");
    const response = evidence[id];
    if (response?.response) el("#reviewNextAction").insertAdjacentHTML("beforeend", '<div class="ux-response-record"><small>EVIDENCE RESPONSE RECEIVED</small><p>' + esc(response.response) + '</p>' + (response.fileName ? '<span>Attachment: ' + esc(response.fileName) + ' · local preview</span>' : "") + '</div>');
    el(".evidence-spine").innerHTML = rail(r) + '<p class="ux-subtle">' + (p ? "Assigned auditor: " + p.name + "." : "Waiting for the team lead to assign an auditor.") + '</p>';
    el(".submitter-workbench").hidden = role() !== "user" || !needs;
    el(".auditor-workbench").hidden = !mine;
    el(".drawer-note strong").textContent = "Evidence requested" + (p ? " by " + p.name.split(" ")[0] : "");
    el(".drawer-note p").textContent = evidence[id]?.question || "Provide supporting evidence for the unresolved controls.";
    el("#reviewDrawer").dataset.reviewId = id;
    el("#drawerClose").focus({ preventScroll: true });
  }
  function showDialog(kind, id, title, body, saveLabel) {
    returnFocus = document.activeElement;
    dialogContext = { kind, id, leadId, actor: role() === "admin" ? roleProfiles.admin.name : person().name, personId, previous: assignments[id] };
    el("#uxDialogEyebrow").textContent = kind === "assign" ? "REVIEW OWNERSHIP" : kind === "lead" ? "TEAM RESPONSIBILITY" : "EVIDENCE RESPONSE";
    el("#uxDialogTitle").textContent = title;
    el("#uxDialogBody").innerHTML = body;
    el("#uxDialogSave").textContent = saveLabel;
    el("#uxDialogError").hidden = true;
    el("#experienceDialog").showModal();
  }
  function closeDialog() { el("#experienceDialog").close(); }
  function assignmentDialog(id) {
    if (!isLead()) return showToast("Assignment unavailable", "Only this team's Lead Auditor can assign reviews.", "!");
    const r = queue.find((x) => x.id === id);
    if (!r) return;
    const assigned = owner(id);
    showDialog("assign", id, assigned ? "Reassign review" : "Give this review an owner", '<div class="ux-dialog-record"><span>' + id + ' · ' + r.risk + ' risk</span><strong>' + esc(r.name) + '</strong><small>' + (assigned ? "Currently assigned to " + assigned.name : "Currently unassigned") + ' · ' + r.sla + '</small></div><fieldset class="ux-assignee-options"><legend>Choose an auditor</legend>' + team.map((p) => {
      const count = queue.filter((x) => assignments[x.id] === p.id).length;
      return '<label class="ux-assignee"><input type="radio" name="assignee" value="' + p.id + '" required' + (assigned?.id === p.id ? " disabled" : "") + '>' + initials(p) + '<span><strong>' + p.name + '</strong><small>' + p.specialty + (p.id === leadId ? " · Lead" : "") + '</small></span><b>' + count + ' open</b></label>';
    }).join("") + '</fieldset><label class="ux-field">Reason for this handoff<textarea name="reason" rows="2" required minlength="5" maxlength="500" placeholder="Explain the expertise or capacity behind this choice."></textarea></label><p class="ux-subtle">The assignee and assignment history update together in this local preview.</p>', assigned ? "Reassign review" : "Assign review");
  }
  function leadDialog() {
    if (role() !== "admin") return;
    showDialog("lead", null, "Change the team lead", '<p class="ux-dialog-intro">The new lead gains assignment responsibility. ' + lead().name + ' keeps their Auditor access and existing reviews.</p><label class="ux-field">New Lead Auditor<select name="lead" required><option value="">Choose a team member</option>' + team.filter((p) => p.id !== leadId).map((p) => '<option value="' + p.id + '">' + p.name + '</option>').join("") + '</select></label><label class="ux-field">Reason for changing the lead<textarea name="reason" rows="3" minlength="5" maxlength="500" required placeholder="For example, team rotation or leave cover."></textarea></label><div class="ux-inline-note">Applies immediately in this preview. Sign-off authority remains unchanged.</div>', "Save team lead");
  }
  function evidenceDialog() {
    const id = el("#drawerTitle").textContent;
    const r = reviews.find((x) => x.id === id);
    if (role() !== "user" || !r || !/evidence requested/i.test(r.status)) return;
    showDialog("evidence", id, "Respond to the evidence request", '<div class="ux-dialog-record"><span>' + id + '</span><strong>' + esc(r.name) + '</strong></div><div class="ux-inline-note">' + esc(evidence[id]?.question || "Provide supporting evidence for the unresolved controls.") + '</div><label class="ux-field">Your response<textarea name="response" required minlength="10" maxlength="4000" rows="4" placeholder="Explain the evidence and how it addresses the auditor’s question."></textarea></label><label class="ux-field">Supporting file (optional)<input type="file" name="evidenceFile" accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.docx"><small>PDF, spreadsheet, document or image · up to 25 MB</small></label>', "Send response");
  }
  function fail(message) { el("#uxDialogError").textContent = message; el("#uxDialogError").hidden = false; }
  function saveDialog(e) {
    e.preventDefault();
    const c = dialogContext;
    if (!c) return;
    const data = new FormData(e.target);
    if (c.kind === "assign") {
      if (!isLead() || personId !== c.personId || leadId !== c.leadId || assignments[c.id] !== c.previous || !queue.some((r) => r.id === c.id)) return fail("This assignment changed. Close this dialog and try again.");
      const recipient = team.find((p) => p.id === data.get("assignee"));
      const reason = String(data.get("reason") || "").trim();
      if (!recipient || recipient.id === assignments[c.id] || reason.length < 5) return fail("Choose a different auditor and add a reason of at least five characters.");
      const previous = owner(c.id);
      assignments[c.id] = recipient.id;
      notify(c.id, "auditor", "Review assigned to you", c.actor + " assigned " + c.id + ". " + reason);
      log(c.id + (previous ? " reassigned" : " assigned"), c.actor + ": " + (previous ? previous.name : "Unassigned") + " → " + recipient.name + ". " + reason);
      closeDialog(); refresh(); closeReview();
      showToast("Assigned to " + recipient.name, c.id + " · Assignment history updated");
    } else if (c.kind === "lead") {
      if (role() !== "admin" || leadId !== c.leadId) return fail("Team responsibility changed. Reopen this dialog.");
      const next = team.find((p) => p.id === data.get("lead"));
      const reason = String(data.get("reason") || "").trim();
      if (!next || next.id === leadId || reason.length < 5) return fail("Choose a new lead and provide a reason.");
      const previous = lead().name;
      leadId = next.id;
      log("Team lead changed", c.actor + ": " + previous + " → " + next.name + ". " + reason);
      closeDialog(); refresh();
      showToast("Team lead updated", next.name + " can now manage team assignments.");
    } else {
      const r = reviews.find((x) => x.id === c.id);
      const response = String(data.get("response") || "").trim(), file = data.get("evidenceFile");
      if (role() !== "user" || !r || !/evidence requested/i.test(r.status)) return fail("This review is no longer waiting for your evidence.");
      if (response.length < 10) return fail("Describe your response in at least ten characters.");
      if (file?.size && (file.size > 25 * 1024 * 1024 || !/\.(pdf|xlsx|xls|csv|png|jpe?g|docx)$/i.test(file.name))) return fail("Choose a supported file smaller than 25 MB.");
      evidence[c.id] = { ...evidence[c.id], response, fileName: file?.name || "", submittedAt: new Date().toISOString() };
      notify(c.id, "auditor", "Evidence response received", "The submitter responded to your evidence request for " + c.id + ".");
      r.status = "In assessment"; r.tone = "review"; r.updated = "Evidence sent just now";
      const q = queue.find((x) => x.id === c.id);
      if (q) { q.stage = "Assessment"; q.tags = q.tags.filter((tag) => tag !== "evidence"); }
      closeDialog(); closeReview(); refresh();
      showToast("Evidence response sent", c.id + " is back with the assigned auditor.");
    }
  }
  function evidenceRequested(id, question) {
    evidence[id] = { question };
    if (reviews.some((r) => r.id === id)) notify(id, "user", "Additional evidence requested", question);
    const q = queue.find((x) => x.id === id);
    if (q) { q.stage = "Evidence"; if (!q.tags.includes("evidence")) q.tags.push("evidence"); }
    refresh();
  }
  function handleClick(e) {
    const target = e.target.closest("[data-ux]");
    if (!target) return;
    const action = target.dataset.ux;
    if (action === "scope") { scope = target.dataset.value; renderAuditQueue(); }
    if (action === "filter") { filter = target.dataset.value; renderAuditQueue(); }
    if (action === "clear-filters") { search = ""; filter = "all"; el("#auditSearch").value = ""; renderAuditQueue(); }
    if (action === "open-review") openReview(target.dataset.id);
    if (action === "new-review") openUpload("poc");
    if (action === "continue-poc") openUpload("deployment");
    if (action === "registry" || action === "library") navigateWorkspace(action);
    if (action === "configuration") { navigateWorkspace("configuration"); setAdminTab("process"); }
    if (action === "teams" || action === "groups") { if (role() === "admin") { navigateWorkspace("configuration"); setAdminTab(action); } }
    if (action === "assign") assignmentDialog(target.dataset.id);
    if (action === "change-lead") leadDialog();
    if (action === "close-dialog") closeDialog();
  }
  window.ProoflineUX = { personalQueue,
    notificationVisible(item) { return !item.auditorId || item.auditorId === personId; },
    decisionRecorded(id) { if (reviews.some((r) => r.id === id)) notify(id, "user", "Review approved", id + " has been signed off by " + person().name + "."); refresh(); }, navigate, refresh, renderQueue: renderAuditQueue, renderUserReviews: renderUserList, canOpen, canReview, drawer, evidenceDialog, evidenceRequested,
    afterWorkbook() { el("#signOffButton").disabled = !person().canDecide; el(".decision-help").textContent = person().canDecide ? "Sign-off approves this review. Assignment authority is managed separately." : "You can request evidence. This auditor does not have sign-off authority."; },
    drawerClosed() { if (drawerFocus?.isConnected) drawerFocus.focus({ preventScroll: true }); drawerFocus = null; }
  };
  mount();
})();

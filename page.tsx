"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BadgeCheck, Bell, Bot, Building2, ChartNoAxesCombined, Check, ChevronRight, CircleHelp, ContactRound, Download, FileSearch, Filter, Globe2, LayoutDashboard, Lightbulb, ListChecks, Mail, MessageSquareText, Plus, Search, Settings2, ShieldCheck, Sparkles, Target, Users, X } from "lucide-react";

type Prospect = {
  id: string; organization_name: string; contact_name: string; email: string; phone: string;
  location: string; need_summary: string; source_url: string; score: number;
  status: string; source_type: string; created_at: string;
};
type Business = { name: string; city: string; category: string; description: string; products_services: string; service_areas: string; website_url: string; lead_destination: string };
type Campaign = { id: string; name: string; target_location: string; offer: string; target_keywords: string[]; status: string; created_at: string };

const initialBusiness: Business = {
  name: "", city: "Dar es Salaam", category: "Local services", description: "",
  products_services: "", service_areas: "Dar es Salaam", website_url: "", lead_destination: ""
};
const demoProspects: Prospect[] = [
  { id:"demo-1", organization_name:"Mlimani Office Supplies (demo)", contact_name:"Public business contact", email:"", phone:"", location:"Dar es Salaam", need_summary:"Potential fit for office stationery supply; validate current need before outreach.", source_url:"", score:78, status:"reviewed", source_type:"manual", created_at:new Date().toISOString() },
  { id:"demo-2", organization_name:"Kariakoo Retail Shop (demo)", contact_name:"", email:"", phone:"", location:"Kariakoo, Dar es Salaam", need_summary:"Potential wholesale buyer based on business category; no recent intent verified.", source_url:"", score:61, status:"new", source_type:"manual", created_at:new Date().toISOString() }
];
const nav = [
  ["Overview", LayoutDashboard], ["Prospects", Users], ["Campaigns", Target],
  ["AI Lead Engine", Sparkles], ["Outreach", MessageSquareText], ["Settings", Settings2]
] as const;

export default function Home() {
  const [page, setPage] = useState("Overview");
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [businessSaved, setBusinessSaved] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [offer, setOffer] = useState("");
  const [location, setLocation] = useState("Dar es Salaam");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordText, setKeywordText] = useState("");
  const [newLead, setNewLead] = useState({ organization_name:"", contact_name:"", email:"", phone:"", location:"Dar es Salaam", need_summary:"", source_url:"" });
  const [messageLead, setMessageLead] = useState<Prospect | null>(null);
  const [draft, setDraft] = useState("");
  const [showLeadForm, setShowLeadForm] = useState(false);

  useEffect(() => {
    try {
      const b = localStorage.getItem("ymind_business");
      const p = localStorage.getItem("ymind_prospects");
      const c = localStorage.getItem("ymind_campaigns");
      if (b) { setBusiness(JSON.parse(b)); setBusinessSaved(true); }
      if (p) setProspects(JSON.parse(p));
      if (c) setCampaigns(JSON.parse(c));
    } catch { /* corrupted local draft: start safely */ }
  }, []);

  const persistProspects = (next: Prospect[]) => { setProspects(next); localStorage.setItem("ymind_prospects", JSON.stringify(next)); };
  const persistCampaigns = (next: Campaign[]) => { setCampaigns(next); localStorage.setItem("ymind_campaigns", JSON.stringify(next)); };
  const filtered = useMemo(() => prospects.filter(p => [p.organization_name,p.contact_name,p.location,p.need_summary,p.status].join(" ").toLowerCase().includes(query.toLowerCase())), [prospects,query]);
  const qualified = prospects.filter(p => p.status === "qualified" || p.score >= 75).length;
  const contacted = prospects.filter(p => p.status === "contacted" || p.status === "replied").length;
  const stats = [
    { label:"Prospects", value:prospects.length, note:"In your pipeline", icon:Users },
    { label:"High-fit leads", value:qualified, note:"Score 75+ or qualified", icon:Target },
    { label:"Campaigns", value:campaigns.length, note:"Plans created", icon:ChartNoAxesCombined },
    { label:"Contacted", value:contacted, note:"Manually tracked", icon:MessageSquareText }
  ];

  function flash(text: string, error=false) { setNotice(text); setNoticeError(error); window.setTimeout(() => setNotice(""), 5000); }
  function saveBusiness() {
    if (!business.name.trim() || !business.category.trim() || !business.description.trim()) { flash("Add your business name, category and description first.", true); return; }
    localStorage.setItem("ymind_business", JSON.stringify(business));
    setBusinessSaved(true); flash("Business profile saved on this device.");
  }
  function addProspect() {
    if (!newLead.organization_name.trim() && !newLead.email.trim() && !newLead.phone.trim()) { flash("Add a business name or a contact detail.", true); return; }
    const item: Prospect = { ...newLead, id:crypto.randomUUID(), score:0, status:"new", source_type:"manual", created_at:new Date().toISOString() };
    persistProspects([item,...prospects]); setNewLead({organization_name:"",contact_name:"",email:"",phone:"",location:"Dar es Salaam",need_summary:"",source_url:""}); setShowLeadForm(false); flash("Prospect added. Verify its source and contact eligibility before outreach.");
  }
  async function generateKeywords() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/keywords", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({business,location,offer:offer || business.products_services,category:business.category}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Keyword generation failed.");
      setKeywords(data.keywords || []);
      flash(data.mode === "ai" ? "AI keyword suggestions generated." : "Starter keyword ideas generated. Configure AI for richer suggestions.");
    } catch (e) { flash(e instanceof Error ? e.message : "Could not generate keywords.", true); }
    finally { setBusy(false); }
  }
  async function scoreProspect(p: Prospect) {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/score", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ business, prospect:p }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Scoring failed.");
      persistProspects(prospects.map(x => x.id === p.id ? {...x,score:data.score,need_summary:x.need_summary || data.summary,status:x.score >= 75 ? "reviewed" : x.status} : x));
      flash("Lead fit score updated. A score is not proof of recent search intent.");
    } catch (e) { flash(e instanceof Error ? e.message : "Could not score lead.", true); }
    finally { setBusy(false); }
  }
  function createCampaign() {
    if (!campaignName.trim() || !(offer || business.products_services).trim()) { flash("Add a campaign name and an offer first.", true); return; }
    const c: Campaign = {id:crypto.randomUUID(),name:campaignName,target_location:location,offer:offer || business.products_services,target_keywords:keywords,status:"draft",created_at:new Date().toISOString()};
    persistCampaigns([c,...campaigns]); setCampaignName(""); flash("Campaign plan saved as draft. No ads have been launched.");
  }
  function draftMessage(p: Prospect) {
    const name = business.name || "our business";
    setMessageLead(p);
    setDraft(`Hello${p.contact_name ? " " + p.contact_name : ""}, I’m reaching out on behalf of ${name}. ${business.description || "We provide products and services in your area."} I thought this might be relevant to ${p.organization_name || "your business"} based on the business information available. If this is useful, I can share more details. If not, please let me know and I won't follow up.`);
    setPage("Outreach");
  }
  function downloadCSV() {
    const headers = ["organization_name","contact_name","email","phone","location","need_summary","source_url","score","status","source_type"];
    const rows = prospects.map(p => headers.map(h => `"${String((p as unknown as Record<string,unknown>)[h] ?? "").replaceAll('"','""')}"`).join(","));
    const blob = new Blob([[headers.join(","),...rows].join("\n")],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url;a.download="ymind-prospects.csv";a.click();URL.revokeObjectURL(url);
  }

  const header = {
    "Overview":["Your acquisition cockpit","A clear view of the prospects, campaigns and conversations moving your business forward."],
    "Prospects":["Prospect pipeline","Keep source evidence, customer needs and lead status together."],
    "Campaigns":["Campaign workspace","Build demand-generation plans before connecting paid advertising."],
    "AI Lead Engine":["AI Lead Engine","Find relevant demand signals and turn your offer into a focused prospecting plan."],
    "Outreach":["Outreach workspace","Prepare useful, personalized messages and review eligibility before sending."],
    "Settings":["Business settings","Tell Y-Mind what you sell, where you operate and which leads matter."]
  }[page] || ["Y-Mind","Customer acquisition, made smarter."];

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">Y</div><span>Y-Mind</span></div>
      <div className="nav">{nav.map(([label,Icon])=><button key={label} className={page===label?"active":""} onClick={()=>setPage(label)}><Icon size={17}/>{label}{label==="Prospects" && prospects.length>0 ? <span style={{marginLeft:"auto",fontSize:11}}>{prospects.length}</span>:null}</button>)}</div>
      <div className="side-note"><Sparkles size={15} style={{display:"inline",marginRight:6,color:"#b1a2ff"}}/><b>Intent, not guesswork.</b><br/>Find relevant opportunities. Respect people's choices. Grow with evidence.</div>
      <div style={{fontSize:11,color:"#647087",padding:"0 10px"}}>Y-Mind MVP · Tanzania</div>
    </aside>
    <main className="main">
      <div className="topbar">
        <div><div className="eyebrow">AI CUSTOMER ACQUISITION</div><h1>{header[0]}</h1><div className="sub">{header[1]}</div></div>
        <div className="pill"><span className="dot"/>{businessSaved ? business.name : "Business not configured"}</div>
      </div>
      {notice && <div className={`notice ${noticeError?"error":""}`} style={{marginBottom:18}}>{notice}</div>}

      {page==="Overview" && <>
        <div className="grid">{stats.map(s=><div className="card" key={s.label}><div className="stat-label"><s.icon size={16}/>{s.label}</div><div className="stat-value">{s.value}</div><div className="stat-foot">{s.note}</div></div>)}</div>
        <div className="two-col">
          <section className="card">
            <div className="section-head"><h2>Recent prospects</h2><button className="btn" onClick={()=>setPage("Prospects")}>View pipeline <ChevronRight size={14}/></button></div>
            {prospects.length ? <div className="table-wrap"><table><thead><tr><th>Prospect</th><th>Location</th><th>Fit score</th><th>Status</th></tr></thead><tbody>{prospects.slice(0,5).map(p=><tr key={p.id}><td>{p.organization_name || p.email || p.phone}</td><td>{p.location || "—"}</td><td className="lead-score">{p.score || "—"}</td><td><span className={`status ${p.status==="qualified"?"green":""}`}>{p.status}</span></td></tr>)}</tbody></table></div>:<div className="empty"><Users size={22} style={{margin:"0 auto 9px"}}/><b>No prospects yet</b><br/>Add a prospect or capture your first inquiry to start your pipeline.<br/><button className="btn primary" style={{marginTop:12}} onClick={()=>{setPage("Prospects");setShowLeadForm(true)}}><Plus size={14}/> Add first prospect</button></div>}
          </section>
          <section className="card">
            <div className="section-head"><h2>Quick start</h2><Lightbulb size={18} color="#b0a0ff"/></div>
            <div style={{display:"grid",gap:12}}>
              {[["1","Set up your business","Tell Y-Mind what you sell and where."],["2","Find relevant prospects","Import verified business leads or capture inquiries."],["3","Prepare outreach","Draft relevant messages and review eligibility."],["4","Learn from outcomes","Record which leads become real opportunities."]].map(([n,t,d])=><div key={n} style={{display:"flex",gap:12,alignItems:"flex-start"}}><div className="brand-mark" style={{width:28,height:28,borderRadius:9,fontSize:12,flexShrink:0}}>{n}</div><div><b style={{fontSize:13}}>{t}</b><div style={{fontSize:12,color:"#929db0",marginTop:4,lineHeight:1.5}}>{d}</div></div></div>)}
            </div>
            <button className="btn primary" style={{width:"100%",marginTop:22}} onClick={()=>setPage("Settings")}>Configure business <ChevronRight size={15}/></button>
          </section>
        </div>
        <section className="card" style={{marginTop:16}}>
          <div className="section-head"><h2>How Y-Mind finds demand</h2><span className="status green">Privacy-aware</span></div>
          <div className="grid" style={{margin:"0",gridTemplateColumns:"repeat(3,minmax(0,1fr))"}}>
            <div><FileSearch size={20} color="#b1a2ff"/><b style={{display:"block",marginTop:12,fontSize:14}}>Public business signals</b><p className="stat-foot" style={{lineHeight:1.7}}>Use permitted public business information and keep the source attached to every prospect.</p></div>
            <div><Target size={20} color="#b1a2ff"/><b style={{display:"block",marginTop:12,fontSize:14}}>Search-intent strategy</b><p className="stat-foot" style={{lineHeight:1.7}}>Suggest keywords and ad plans. Platforms handle delivery to their eligible audiences.</p></div>
            <div><ShieldCheck size={20} color="#b1a2ff"/><b style={{display:"block",marginTop:12,fontSize:14}}>Respectful outreach</b><p className="stat-foot" style={{lineHeight:1.7}}>Check eligibility and review messages. Never identify private searchers or send blind bulk messages.</p></div>
          </div>
        </section>
      </>}

      {page==="Settings" && <div className="card">
        <div className="section-head"><h2>Business profile</h2><Building2 size={18} color="#b1a2ff"/></div>
        <p className="sub">The more precise your offer and service area, the more useful Y-Mind's suggestions will be.</p>
        <div className="form-grid">
          <div className="field"><label>Business name *</label><input value={business.name} onChange={e=>setBusiness({...business,name:e.target.value})} placeholder="e.g. Mtaa Tech Solutions"/></div>
          <div className="field"><label>Category *</label><input value={business.category} onChange={e=>setBusiness({...business,category:e.target.value})} placeholder="e.g. Computer repair"/></div>
          <div className="field"><label>City / market</label><input value={business.city} onChange={e=>setBusiness({...business,city:e.target.value})}/></div>
          <div className="field"><label>Service areas</label><input value={business.service_areas} onChange={e=>setBusiness({...business,service_areas:e.target.value})}/></div>
          <div className="field"><label>Website (optional)</label><input value={business.website_url} onChange={e=>setBusiness({...business,website_url:e.target.value})} placeholder="https://..."/></div>
          <div className="field"><label>Lead destination (optional)</label><input value={business.lead_destination} onChange={e=>setBusiness({...business,lead_destination:e.target.value})} placeholder="Business email or inquiry URL"/></div>
        </div>
        <div className="field"><label>What does the business offer? *</label><textarea value={business.description} onChange={e=>setBusiness({...business,description:e.target.value})} placeholder="Describe your products/services, ideal customer, pricing, what makes the offer useful."/></div>
        <div className="field"><label>Products / services (comma separated)</label><input value={business.products_services} onChange={e=>setBusiness({...business,products_services:e.target.value})} placeholder="laptop repair, laptop accessories"/></div>
        <div className="actions"><button className="btn primary" onClick={saveBusiness}><Check size={15}/> Save business profile</button><span className="stat-foot" style={{alignSelf:"center"}}>MVP saves this profile in this browser only.</span></div>
      </div>}

      {page==="Prospects" && <>
        <div className="section-head"><div><h2>Your prospects</h2><div className="stat-foot" style={{marginTop:6}}>Every record should have a clear source and a legitimate next step.</div></div><div className="actions"><button className="btn" onClick={downloadCSV} disabled={!prospects.length}><Download size={14}/> Export CSV</button><button className="btn primary" onClick={()=>setShowLeadForm(!showLeadForm)}><Plus size={15}/> Add prospect</button></div></div>
        {showLeadForm && <div className="card" style={{marginBottom:16}}>
          <div className="section-head"><h2>Add a prospect</h2><button className="btn" onClick={()=>setShowLeadForm(false)}><X size={14}/></button></div>
          <div className="notice warn" style={{marginBottom:12}}>Only add information you are authorized to use. Record the source and do not assume a public phone number permits every type of marketing.</div>
          <div className="form-grid">
            <div className="field"><label>Business / organization</label><input value={newLead.organization_name} onChange={e=>setNewLead({...newLead,organization_name:e.target.value})} placeholder="Business name"/></div>
            <div className="field"><label>Contact name (optional)</label><input value={newLead.contact_name} onChange={e=>setNewLead({...newLead,contact_name:e.target.value})}/></div>
            <div className="field"><label>Business email</label><input type="email" value={newLead.email} onChange={e=>setNewLead({...newLead,email:e.target.value})}/></div>
            <div className="field"><label>Business phone</label><input value={newLead.phone} onChange={e=>setNewLead({...newLead,phone:e.target.value})}/></div>
            <div className="field"><label>Location</label><input value={newLead.location} onChange={e=>setNewLead({...newLead,location:e.target.value})}/></div>
            <div className="field"><label>Source URL</label><input value={newLead.source_url} onChange={e=>setNewLead({...newLead,source_url:e.target.value})} placeholder="https://public-business-source..."/></div>
          </div>
          <div className="field"><label>Need / evidence (do not invent search history)</label><textarea value={newLead.need_summary} onChange={e=>setNewLead({...newLead,need_summary:e.target.value})} placeholder="What public evidence suggests a possible business need?"/></div>
          <button className="btn primary" onClick={addProspect}><Plus size={14}/> Save prospect</button>
        </div>}
        <div className="card"><div style={{position:"relative",marginBottom:14}}><Search size={16} style={{position:"absolute",left:12,top:12,color:"#8792a8"}}/><input className="search" style={{paddingLeft:37}} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search prospects, location or status..."/></div>
          {filtered.length ? <div className="table-wrap"><table><thead><tr><th>Prospect</th><th>Location</th><th>Source / evidence</th><th>Fit</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><b>{p.organization_name || p.email || p.phone}</b><div className="stat-foot">{p.contact_name}</div></td><td>{p.location || "—"}</td><td style={{maxWidth:240,whiteSpace:"normal"}}>{p.source_url ? <a href={p.source_url} target="_blank" rel="noreferrer" style={{color:"#b2a4ff"}}>Open source ↗</a> : "Source not provided"}<div className="stat-foot">{p.need_summary || "No evidence summary"}</div></td><td className="lead-score">{p.score || "—"}</td><td><span className={`status ${p.status==="qualified"?"green":""}`}>{p.status}</span></td><td><div className="actions"><button className="btn" onClick={()=>scoreProspect(p)} disabled={busy}><Sparkles size={13}/> Score</button><button className="btn" onClick={()=>draftMessage(p)}><Mail size={13}/> Draft</button><select aria-label="Lead status" value={p.status} onChange={e=>persistProspects(prospects.map(x=>x.id===p.id?{...x,status:e.target.value}:x))} style={{background:"#0b0e16",border:"1px solid #303749",color:"#cbd3e5",borderRadius:8,fontSize:11}}><option value="new">New</option><option value="reviewed">Reviewed</option><option value="qualified">Qualified</option><option value="contacted">Contacted</option><option value="replied">Replied</option><option value="converted">Converted</option><option value="disqualified">Disqualified</option></select></div></td></tr>)}</tbody></table></div> : <div className="empty">No prospects found. Add a prospect or change your search.</div>}
        </div>
      </>}

      {page==="Campaigns" && <>
        <div className="two-col">
          <section className="card"><div className="section-head"><h2>New campaign plan</h2><Target size={18} color="#b1a2ff"/></div>
            <div className="notice warn">Planning only: this MVP does not spend money or launch ads.</div>
            <div className="field"><label>Campaign name</label><input value={campaignName} onChange={e=>setCampaignName(e.target.value)} placeholder="e.g. Computer repair leads — Ubungo"/></div>
            <div className="field"><label>Offer / service</label><textarea value={offer} onChange={e=>setOffer(e.target.value)} placeholder={business.products_services || "What are you offering?"}/></div>
            <div className="field"><label>Target location</label><input value={location} onChange={e=>setLocation(e.target.value)}/></div>
            <div className="field"><label>Keywords</label><textarea value={keywordText} onChange={e=>setKeywordText(e.target.value)} placeholder="Paste keywords, one per line, or generate them in AI Lead Engine."/><div className="stat-foot">Saved campaign keywords come from generated suggestions or the text above.</div></div>
            <button className="btn primary" onClick={()=>{if(keywordText.trim())setKeywords(keywordText.split("\n").map(x=>x.trim()).filter(Boolean));createCampaign()}}><Plus size={14}/> Save draft campaign</button>
          </section>
          <section className="card"><div className="section-head"><h2>Campaign plans</h2><Activity size={18} color="#b1a2ff"/></div>
            {campaigns.length ? campaigns.map(c=><div key={c.id} style={{padding:"14px 0",borderBottom:"1px solid #252b38"}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><b style={{fontSize:14}}>{c.name}</b><span className="status yellow">{c.status}</span></div><div className="stat-foot" style={{marginTop:6}}>{c.target_location} · {c.target_keywords.length} keywords</div><p className="stat-foot">{c.offer}</p></div>) : <div className="empty">Your campaign drafts will appear here.</div>}
          </section>
        </div>
      </>}

      {page==="AI Lead Engine" && <>
        <div className="two-col">
          <section className="card"><div className="section-head"><h2>Discover demand signals</h2><Sparkles size={19} color="#b1a2ff"/></div>
            <p className="sub">Generate search phrases that people might use when they need your product. These are ideas to investigate—not verified records of individual searches.</p>
            <div className="field"><label>Offer / product / service</label><textarea value={offer} onChange={e=>setOffer(e.target.value)} placeholder={business.products_services || "What do you sell?"}/></div>
            <div className="field"><label>Location</label><input value={location} onChange={e=>setLocation(e.target.value)}/></div>
            <button className="btn primary" onClick={generateKeywords} disabled={busy}><Sparkles size={15}/>{busy?"Working...":"Generate intent keywords"}</button>
            {keywords.length>0 && <div style={{marginTop:20}}><b style={{fontSize:13}}>Suggested keyword ideas</b><div className="actions" style={{marginTop:12}}>{keywords.map((k,i)=><span key={i} className="pill">{k}</span>)}</div><button className="btn" style={{marginTop:15}} onClick={()=>{setKeywordText(keywords.join("\n"));setPage("Campaigns")}}>Use in campaign plan <ChevronRight size={14}/></button></div>}
          </section>
          <section className="card"><div className="section-head"><h2>Intent signals Y-Mind can use</h2><Globe2 size={18} color="#b1a2ff"/></div>
            {[["Search keywords","Use them to plan search ads; search platforms do not disclose every searcher's identity."],["Inbound requests","A customer voluntarily asks for pricing, a quote or a callback."],["Public business evidence","A public company page indicates relevance; it does not prove current buying intent."],["Campaign outcomes","Aggregated performance and conversion events help optimize future campaigns."]].map(([t,d])=><div key={t} style={{display:"flex",gap:10,padding:"12px 0",borderBottom:"1px solid #252b38"}}><BadgeCheck size={17} color="#7ce5c0" style={{flexShrink:0}}/><div><b style={{fontSize:13}}>{t}</b><div className="stat-foot" style={{marginTop:5,lineHeight:1.6}}>{d}</div></div></div>)}
          </section>
        </div>
        <section className="card" style={{marginTop:16}}><div className="section-head"><h2>AI scoring queue</h2><ListChecks size={18} color="#b1a2ff"/></div>
          {prospects.length ? <div className="table-wrap"><table><thead><tr><th>Prospect</th><th>Current fit score</th><th>Evidence</th><th>Action</th></tr></thead><tbody>{prospects.slice(0,10).map(p=><tr key={p.id}><td>{p.organization_name || p.email || p.phone}</td><td className="lead-score">{p.score || "Unscored"}</td><td style={{whiteSpace:"normal"}}>{p.need_summary || "No intent evidence recorded"}</td><td><button className="btn" onClick={()=>scoreProspect(p)} disabled={busy}><Sparkles size={13}/> Score lead</button></td></tr>)}</tbody></table></div> : <div className="empty">Add prospects first. Y-Mind will score fit from available evidence, not invented search history.</div>}
        </section>
      </>}

      {page==="Outreach" && <>
        <div className="two-col">
          <section className="card"><div className="section-head"><h2>Message draft</h2><MessageSquareText size={18} color="#b1a2ff"/></div>
            {messageLead ? <>
              <div className="notice warn" style={{marginBottom:12}}>Draft only. Check contact eligibility and the applicable channel rules before sending. This app does not send messages in the MVP.</div>
              <div className="field"><label>Recipient</label><input value={messageLead.organization_name || messageLead.email || messageLead.phone} readOnly/></div>
              <div className="field"><label>Draft message</label><textarea style={{minHeight:190}} value={draft} onChange={e=>setDraft(e.target.value)}/></div>
              <div className="actions"><button className="btn" onClick={()=>{navigator.clipboard?.writeText(draft);flash("Draft copied where clipboard access is available.")}}><Download size={14}/> Copy draft</button><button className="btn" onClick={()=>{setMessageLead(null);setDraft("")}}>Close draft</button></div>
            </> : <div className="empty"><Mail size={22} style={{margin:"0 auto 9px"}}/><b>No draft selected</b><br/>Go to Prospects and choose “Draft” on a lead.</div>}
          </section>
          <section className="card"><div className="section-head"><h2>Outreach checklist</h2><ShieldCheck size={18} color="#b1a2ff"/></div>
            {["Is the source documented and relevant?","Is the destination a business contact or an opted-in contact?","Is this channel and message permitted?","Does the message identify the sender honestly?","Can the recipient easily decline further contact?","Has the recipient already opted out?"].map((x,i)=><div key={x} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"12px 0",borderBottom:"1px solid #252b38"}}><span className="status">{i+1}</span><span style={{fontSize:13,lineHeight:1.6}}>{x}</span></div>)}
          </section>
        </div>
      </>}

      <div className="footer">Y-Mind MVP · Tanzania-first customer acquisition. Prospect fit is not proof of recent search activity. This prototype stores data in this browser; configure the backend before using real customer data. Never upload sensitive personal information without an appropriate lawful basis.</div>
    </main>
  </div>;
}

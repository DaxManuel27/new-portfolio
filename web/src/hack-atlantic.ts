import {clamp,ease,type JourneyState} from './journey';
export const HACK_ATLANTIC={
 title:'Hack Atlantic',role:'Founder',
 contributions:[
  'Founded Hack Atlantic, <strong>led an 8 person team</strong> for Atlantic Canada’s largest student-run hackathon that brought over <strong>130 attendees, 43 projects, and 13 sponsors</strong> from ideation to execution in under 4 months.',
  'Deployed an application tracking system for over <strong>200 applicants</strong> in <strong>Next.js, Go, and Postgres</strong>, automating status updates with Twilio Sendgrid, and implemented role based access for organizers to update applicant statuses.',
  'Engineered a full stack competitor ID system that generated unique QR codes for <strong>130+ participants</strong> and provided a role-based volunteer scanner, handling <strong>100+ concurrent users</strong> for check-in and meal times.',
  'Designed marketing assets through <strong>Codex and Figma MCP</strong>, resulting in over <strong>200 applications and 30k impressions</strong>.',
 ],
 why:[
  'It started when me and 3 other guys travelled to Montreal for our first hackathon at McGill University. I was amazed at how they brought together this many people together to build, and I looked into how they did it, as something like this did not exist in Fredericton, or even the east coast.',
  'In April 2026, we decided to start it and see where it goes. I built a landing page, and attached an email signup list to see if people would actually attend an event like this. Throughout the summer, we gained traction and sponsorships, where I reached the point of no return when it comes to making this event happen.',
  'The rest is history.',
 ],
 stats:[['200+','Applications'],['110+','Hackers'],['43','Projects'],['23,000+','mg of caffeine'],['13','Sponsors'],['$6k+','in prizes']],
 links:[['hackatlantic.ca','https://www.hackatlantic.ca/','site'],['Instagram','https://www.instagram.com/hackatlantic','instagram'],['LinkedIn','https://www.linkedin.com/company/hack-atlantic/','linkedin']],
} as const;
const icons={site:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor"/>',linkedin:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 10v7M7.5 6.5v1M11.5 17v-7m0 3c0-4 5-4 5 0v4"/>'};
export function createHackAtlanticSection(){
 const section=document.createElement('section');section.className='ha-section';section.setAttribute('aria-label','Hack Atlantic founder experience');
 section.innerHTML=`<div class="ha-hero"><p class="ha-eyebrow">Hack Atlantic · 2026</p><div class="ha-laptop"><div class="ha-laptop-lid"><div class="ha-camera" aria-hidden="true"></div><img src="${import.meta.env.BASE_URL}assets/hack-atlantic-hero.png" alt="Hack Atlantic website, with its sunset coastline and event navigation" width="2395" height="1412"></div><div class="ha-laptop-base" aria-hidden="true"></div></div><a class="ha-caption" href="https://www.hackatlantic.ca/" target="_blank" rel="noopener noreferrer">hackatlantic.ca <span aria-hidden="true">↗</span></a></div><div class="ha-shore" aria-hidden="true"></div><div class="ha-recap"><div class="ha-copy ultra-copy"><h2>Hack Atlantic <span>– Founder</span></h2><ul>${HACK_ATLANTIC.contributions.map(text=>`<li>${text}</li>`).join('')}</ul></div><div class="ha-numbers"><h3>By the numbers</h3><dl class="ha-stats">${HACK_ATLANTIC.stats.map(([number,label])=>`<div><dt>${label}</dt><dd>${number}</dd></div>`).join('')}</dl></div><section class="ha-why ha-copy"><h3>The Why</h3>${HACK_ATLANTIC.why.map(text=>`<p>${text}</p>`).join('')}</section><nav class="ha-links" aria-label="Hack Atlantic links">${HACK_ATLANTIC.links.map(([label,url,icon])=>`<a href="${url}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[icon]}</svg>${label}<span aria-hidden="true">↗</span></a>`).join('')}</nav></div>`;
 return section;
}
/** Scrub a normal document through the viewport, with brief fades at its boundaries. */
export function hackStoryView(state:Pick<JourneyState,'phase'|'local'>,height:number,viewport:number){
 const active=state.phase.kind==='hack-story',p=state.local;
 return {active,opacity:active?ease(p/.06)*(1-ease((p-.95)/.05)):0,y:-Math.max(0,height-viewport)*clamp((p-.12)/.78)};
}

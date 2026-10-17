import{a as e,i as t,o as n,t as r}from"./styles-DN4orVgr.js";var i=[{kind:`human`,text:`Let's design a platform that connects small farms with the city's kitchens. Use pdt42.`},{kind:`run`,command:`pdt42 next`,output:`Next: D1 · Map the ecosystem

Nothing is modelled yet. Start with D1 — or with E1 if you still need to find the opportunity.

> Who is in the ecosystem, clustered into which roles?

Run \`pdt42 guide step D1\` for the brief.`},{kind:`run`,command:`pdt42 guide step D1`,output:"# D1 · Map the ecosystem\n\nPhase: Strategy Design · Status: todo\n\n> Who is in the ecosystem, clustered into which roles?\n\n## File\n\nWrite this step in `2-design/d1-ecosystem.pdt42.md` (any `*.pdt42.md` file works; this is the convention). Wrap blocks in ```pdt42 fences.\n\n## Dependencies\n\n- `:::ecosystem` from E1 — optional via platform.ecosystem; none yet\n- `:::entity` from E2 — optional via platform.owners, platform.core-entity; none yet\n- `:::brief` from E7 — optional via platform.brief; none yet\n\n## Home chapters\n\n- `:::entity`: add role, clusters to the existing blocks in their home chapter, `1-exploration/e2-scan.pdt42.md` (E2). If you discover a new entity here, add it there, not in this step's chapter.\n- `:::ecosystem`: referenced from here; it is written in its home chapter, `1-exploration/e1-arenas.pdt42.md` (E1), not in this step's chapter.\n- `:::brief`: referenced from here; it is written in its home chapter, `1-exploration/e7-brief.pdt42.md` (E7), not in this step's chapter.\n\n## How\n\n1. Brainstorm entities alone first, then together; cluster similar ones into entity-roles (`clusters:`). The entity blocks live in the Ecosystem Scan's chapter (E2): add the ones you find here there, even when you skipped exploration.\n2. Give each a `role`: owner, stakeholder, peer-consumer, peer-producer or partner — by the key value it produces or consumes.\n…"},{kind:`agent`,text:`Asks who takes part. Writes the owner and two entity-roles in their home chapter, the Ecosystem Scan, and the platform in D1.`},{kind:`write`,file:`1-exploration/e2-scan.pdt42.md`,excerpt:`## Small-scale farmers

Family farms within sixty kilometres. They grow well; selling is what costs them.

\`\`\`pdt42
:::entity
id: e-farmers
title: Small-scale farmers
role: peer-producer
:::
\`\`\``},{kind:`write`,file:`2-design/d1-ecosystem.pdt42.md`,excerpt:`## Harvest Commons

A cooperative that lets small farms sell their harvest before it is sown.

\`\`\`pdt42
:::platform
id: platform-harvest
title: Harvest Commons
owners: e-coop
:::
\`\`\``},{kind:`run`,command:`pdt42 validate`,output:"W011 1-exploration/e2-scan.pdt42.md:8  1-exploration/e2-scan.pdt42.md (E2 Scan the ecosystem) shows no Ecosystem Scan — add a `:::canvas` block with `canvas: ecosystem-scan`\nW011 2-design/d1-ecosystem.pdt42.md:8  2-design/d1-ecosystem.pdt42.md (D1 Map the ecosystem) shows no Ecosystem Canvas — add a `:::canvas` block with `canvas: ecosystem`\nH010 1-exploration/e2-scan.pdt42.md:20  Small-scale farmers is connected to nothing else in the model\nH104 1-exploration/e2-scan.pdt42.md:20  Small-scale farmers's portrait lacks potential, goals or pressures, gains\nH010 1-exploration/e2-scan.pdt42.md:32  Restaurants is connected to nothing else in the model\nH104 1-exploration/e2-scan.pdt42.md:32  Restaurants's portrait lacks potential, goals or pressures, gains\n\n4 elements in 2 files — 0 errors, 2 warnings, 4 hints"},{kind:`agent`,text:`W011: both chapters lack their canvas. Places each under its title.`},{kind:`write`,file:`1-exploration/e2-scan.pdt42.md`,excerpt:`# Scan the ecosystem

\`\`\`pdt42
:::canvas
id: cv-ecosystem-scan
canvas: ecosystem-scan
:::
\`\`\``},{kind:`write`,file:`2-design/d1-ecosystem.pdt42.md`,excerpt:`# Map the ecosystem

\`\`\`pdt42
:::canvas
id: cv-ecosystem
canvas: ecosystem
:::
\`\`\``},{kind:`run`,command:`pdt42 validate`,output:`H010 1-exploration/e2-scan.pdt42.md:27  Small-scale farmers is connected to nothing else in the model
H104 1-exploration/e2-scan.pdt42.md:27  Small-scale farmers's portrait lacks potential, goals or pressures, gains
H010 1-exploration/e2-scan.pdt42.md:39  Restaurants is connected to nothing else in the model
H104 1-exploration/e2-scan.pdt42.md:39  Restaurants's portrait lacks potential, goals or pressures, gains

4 elements in 2 files — 0 errors, 0 warnings, 4 hints`},{kind:`run`,command:`pdt42 next`,output:`Next: D2 · Portray the entity-roles

Everything up to D1 is in place.

> What is each role's context, what drives it, and what gains does it seek?

Run \`pdt42 guide step D2\` for the brief.`}],a=`./harvest-commons/`;function o(e,t={},...n){let r=document.createElement(e);for(let[e,n]of Object.entries(t))r.setAttribute(e,n);return r.append(...n),r}function s(){let r=o(`div`,{class:`method__grid`});for(let i of e){let e=o(`ol`,{class:`method__steps`});for(let r of n.filter(e=>e.phase===i.id)){let n=t.find(e=>e.id===r.canvas);e.append(o(`li`,{},o(`a`,{href:`${a}#${r.file}`,title:r.question},o(`span`,{class:`method__id`},r.id),o(`span`,{class:`method__title`},r.title),o(`span`,{class:`method__canvas`},n?n.title:`no canvas of its own`))))}r.append(o(`section`,{class:`method__phase method__phase--${i.id}`},o(`h3`,{class:`method__name`},i.title),o(`p`,{class:`method__question`},i.question),e))}return r}var c=e=>new Promise(t=>setTimeout(t,e));function l(e,t,n){let r=0;return async function(){let i=++r,a=()=>i===r;e.replaceChildren();let s=t=>{let n=e.scrollHeight-e.scrollTop-e.clientHeight<48;return e.append(t),n&&(e.scrollTop=e.scrollHeight),t},l=async(e,t,r)=>{if(!n)return void(e.textContent=t);for(let n=1;n<=t.length&&a();n++)e.textContent=t.slice(0,n),await c(r)},u=async(t,r,i)=>{if(!n)return void(t.textContent=r);for(let n of r.split(`
`)){if(!a())return;t.textContent+=`${t.textContent?`
`:``}${n}`,e.scrollTop=e.scrollHeight,await c(i)}};for(let e of t){if(!a())return;if(e.kind===`human`||e.kind===`agent`){let t=o(`span`);s(o(`p`,{class:`session__${e.kind}`},o(`span`,{class:`session__who`},e.kind===`human`?`you`:`agent`),t)),await l(t,e.text,e.kind===`human`?22:12)}else if(e.kind===`run`){let t=o(`span`);s(o(`div`,{class:`session__cmd`},o(`span`,{class:`session__prompt`},`$ `),t)),await l(t,e.command,55),n&&await c(350),await u(s(o(`pre`,{class:`session__out`})),e.output,30)}else s(o(`div`,{class:`session__write`},`✎ ${e.file}`)),await u(s(o(`pre`,{class:`session__file`})),e.excerpt,45);n&&await c(e.kind===`run`?1400:700)}}}function u(){let e=document.getElementById(`session-screen`);if(!e)return;let t=!matchMedia(`(prefers-reduced-motion: reduce)`).matches,n=l(e,i,t);if(document.getElementById(`session-replay`)?.addEventListener(`click`,()=>void n()),!t||!(`IntersectionObserver`in window))return void n();let r=new IntersectionObserver(e=>{e.some(e=>e.isIntersecting)&&(r.disconnect(),n())},{threshold:.4});r.observe(e)}function d(){document.getElementById(`method-map`)?.append(s()),u(),r();let e=document.getElementById(`copy`);e?.addEventListener(`click`,()=>{let t=document.getElementById(`start-cmd`)?.textContent??``;navigator.clipboard?.writeText(t).then(()=>{e.textContent=`✓`,setTimeout(()=>e.textContent=`⧉`,1500)},()=>void 0)});for(let e of document.querySelectorAll(`.row__zoom`)){let t=e.querySelector(`img`);t&&(e.href=t.src)}}d();
'use strict';
/* The ten services, in site order. Titles and descriptions come from content.json
   (home.svcN_*, services.sN_*); this file holds what the CMS does not edit:
   the short name used in chips and the booking form, the section label, the
   capability bullets and tags on the services page, and the illustration. */

const win = (url, inner) => `<div class="win"><div class="win-bar"><i></i><i></i><i></i><span>${url}</span></div><div class="win-body">${inner}</div></div>`;
const chip = (html, pos, delay) => `<span class="chip" style="${pos};animation-delay:${delay || 0}s">${html}</span>`;
const prod = t => `<div class="col"><div class="blk sq ${t || ''}"></div><div class="ln"></div><span class="mut">$48</span></div>`;
const phone = (label, inner) => `<div class="ph"><span class="mut">${label}</span>${inner}<div class="tab"><i></i><i></i><i></i><i></i></div></div>`;

module.exports = [
  {
    short: 'Web Development', label: 'WEB DEVELOPMENT',
    bullets: ['Custom & headless storefronts', 'Performance & SEO optimisation', 'CRO & A/B testing', 'Maintenance & support retainers'],
    tags: ['Next.js', 'Headless', 'Core Web Vitals'],
    alt: 'a storefront in a browser window with speed scores',
    visual: () => win('yourstore.com',
      `<div class="row"><div class="col"><div class="ln g" style="width:28%"></div><div class="ln h" style="width:92%"></div><div class="ln h" style="width:64%"></div><div class="ln" style="width:80%"></div><span class="mbtn">Shop now</span></div><div class="blk t1 sq" style="flex:0 0 36%"></div></div>
       <div class="g3"><div class="blk" style="height:3em"></div><div class="blk" style="height:3em"></div><div class="blk t3" style="height:3em"></div></div>`)
      + chip('<b>1.1s</b> LCP', 'right:4%;top:9%') + chip('<b>98</b> performance', 'left:4%;bottom:8%', 1.4),
  },
  {
    short: 'Store Building', label: 'ECOMMERCE STORE BUILDING',
    bullets: ['Theme setup & brand styling', 'Catalogue & product data', 'Payments, shipping & tax', 'Migrations & replatforms'],
    tags: ['Shopify', 'WooCommerce', 'BigCommerce'],
    alt: 'a product catalogue with a cart and checkout button',
    visual: () => win('store / catalogue',
      `<div class="row" style="align-items:stretch"><div class="g3" style="flex:1.7">${prod('t1')}${prod()}${prod('t2')}${prod()}${prod('t3')}${prod()}</div>
       <div class="pcard" style="flex:1"><span class="mut">Cart · 2 items</span><div class="row"><div class="blk sq t1" style="flex:0 0 2.2em"></div><div class="ln" style="flex:1"></div></div><div class="row"><div class="blk sq" style="flex:0 0 2.2em"></div><div class="ln" style="flex:1"></div></div><span>Total <b class="acc">$96</b></span><span class="mbtn" style="justify-self:stretch;text-align:center">Checkout</span></div></div>`),
  },
  {
    short: 'Marketplaces', label: 'MARKETPLACE MANAGEMENT',
    bullets: ['Listing & A+ content creation', 'Catalogue & inventory ops', 'Sponsored ads management', 'Account health & case handling'],
    tags: ['Amazon', 'Flipkart', 'Myntra', 'Meesho'],
    alt: 'marketplace listings with ratings and a Buy Box badge',
    visual: () => `<div class="stack">
       <div class="pcard lst" style="left:0;top:4%;transform:rotate(-4deg)"><div class="blk sq"></div><div class="col"><div class="ln h" style="width:80%"></div><span class="acc">★★★★☆</span><span class="mut">$32</span></div></div>
       <div class="pcard lst" style="left:14%;top:30%;transform:rotate(2deg)"><div class="blk sq t3"></div><div class="col"><div class="ln h" style="width:70%"></div><span class="acc">★★★★★</span><span class="mut">$54</span></div></div>
       <div class="pcard lst" style="left:28%;top:58%"><div class="blk sq t1"></div><div class="col"><div class="ln h" style="width:86%"></div><span class="acc">★★★★★ 4.8</span><span>$48 <span class="grn">· in stock</span></span></div></div>
     </div>` + chip('<span class="grn">●</span> Buy Box won', 'right:5%;top:10%') + chip('Account health <b>Good</b>', 'left:5%;bottom:7%', 1.2),
  },
  {
    short: 'Digital Marketing', label: 'DIGITAL MARKETING',
    bullets: ['Paid search & shopping', 'Paid social & creative', 'Marketplace & retail media', 'Analytics & attribution'],
    tags: ['Google Ads', 'Meta', 'X', 'Amazon Ads'],
    alt: 'a revenue chart rising above ad spend',
    visual: () => `<div class="pcard" style="width:100%"><div class="row" style="justify-content:space-between;align-items:flex-end"><div class="col"><span class="mut">Revenue vs ad spend</span><span class="big"><span class="acc">4.2×</span> ROAS</span></div><span class="mut">Last 90 days</span></div>
       <svg viewBox="0 0 300 110" aria-hidden="true"><path class="s-m" stroke-width="1" d="M0 109.5H300M0 73H300M0 36H300"></path><polyline class="s-m" stroke-width="2" stroke-dasharray="5 6" points="0,92 50,90 100,86 150,84 200,80 250,78 300,74"></polyline><polyline class="s-g draw" pathLength="1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="0,96 50,84 100,88 150,62 200,50 250,30 300,10"></polyline><circle class="f-a" cx="300" cy="10" r="5"></circle></svg>
       <div class="row" style="flex-wrap:wrap;gap:.5em"><span class="pill">Google</span><span class="pill">Meta</span><span class="pill">X</span><span class="pill">Amazon Ads</span></div></div>`,
  },
  {
    short: 'Social Media', label: 'SOCIAL MEDIA HANDLING',
    bullets: ['Content & short-form creative', 'Calendar & scheduling', 'Community management', 'Reporting & growth'],
    tags: ['Instagram', 'Reels', 'Community'],
    alt: 'a phone showing a brand feed beside a weekly content calendar',
    visual: () => phone('@yourbrand', `<div class="g3"><div class="blk sq t1"></div><div class="blk sq"></div><div class="blk sq t3"></div><div class="blk sq"></div><div class="blk sq t2"></div><div class="blk sq"></div><div class="blk sq t3"></div><div class="blk sq"></div><div class="blk sq t1"></div></div>`)
      + `<div class="pcard" style="flex:1"><span class="mut">This week</span><div class="week"><span>M<i class="on"></i></span><span>T<i></i></span><span>W<i class="on"></i></span><span>T<i class="ac"></i></span><span>F<i class="on"></i></span><span>S<i></i></span><span>S<i class="on"></i></span></div><div class="ln" style="width:70%"></div><span><b class="acc">7</b> posts scheduled</span></div>`
      + chip('<span class="grn">●</span> Reel goes live 6 pm', 'right:4%;bottom:8%', .8),
  },
  {
    short: 'Product Design', label: 'PRODUCT DESIGN',
    bullets: ['Discovery & design workshops', 'UX & interface design', 'Prototyping & user testing', 'Design systems & handoff'],
    tags: ['Figma', 'Prototyping', 'Design Systems'],
    alt: 'a product drawing with dimension lines and spec notes',
    visual: () => `<svg viewBox="0 0 320 240" aria-hidden="true">
       <rect class="f-c" x="118" y="62" width="92" height="150" rx="16" stroke-width="2"></rect><rect class="f-c" x="140" y="36" width="48" height="26" rx="5" stroke-width="2"></rect>
       <path class="s-m" stroke-width="1" stroke-dasharray="4 5" d="M164 22V226"></path>
       <path class="s-g draw" pathLength="1" stroke-width="2" d="M132 132H196M132 150H180"></path>
       <path class="s-a" stroke-width="1.5" d="M246 36V212M240 36H252M240 212H252M118 228H210M118 222V234M210 222V234"></path>
       <text class="f-a" font-size="10" x="256" y="128">176 mm</text><text class="f-a" font-size="10" x="146" y="238">92 mm</text>
       <path class="s-m" stroke-width="1" d="M118 96H70M210 180H262"></path>
       <text class="f-t" x="14" y="92">Matte PP</text><text class="f-t" x="14" y="104">shell</text><text class="f-t" x="266" y="184">Rev C</text>
     </svg>` + chip('Spec sheet <b>ready</b>', 'left:5%;top:8%'),
  },
  {
    short: 'Branding', label: 'BRANDING',
    bullets: ['Brand strategy & positioning', 'Identity & visual system', 'Voice, messaging & guidelines', 'Brand ops & rollout'],
    tags: ['Identity', 'Strategy', 'Guidelines'],
    alt: 'a brand guide with logo, type specimen and colour swatches',
    visual: () => `<div class="pcard" style="flex:1.1;align-self:stretch;align-content:space-between"><div class="row"><div class="blk t1 sq" style="flex:0 0 2.6em"></div><div class="ln h" style="flex:1"></div></div><span class="big" style="font-size:5.4em">Aa</span><span class="mut">Display · Body · Mono</span></div>
       <div class="col" style="flex:1"><div class="g2"><div><div class="swc c1"></div><span class="mut">Primary</span></div><div><div class="swc c2"></div><span class="mut">Line</span></div><div><div class="swc c3"></div><span class="mut">Accent</span></div><div><div class="swc c4"></div><span class="mut">Ink</span></div></div><div class="pcard"><span class="mut">Brand guide v2</span><div class="ln h" style="width:76%"></div><div class="ln" style="width:54%"></div></div></div>`,
  },
  {
    short: 'Custom ERP', label: 'CUSTOM ERP SYSTEMS',
    bullets: ['Inventory & order management', 'Purchasing & vendor workflows', 'Accounting & GST-ready reporting', 'Storefront & marketplace sync'],
    tags: ['Custom Build', 'Integrations', 'Automation'],
    alt: 'an inventory table with stock levels and an order flow',
    visual: () => win('erp / inventory',
      `<div class="tr mut"><span>SKU</span><span>Stock</span><span>Status</span></div>
       <div class="tr"><span>KT-1042</span><div class="bar"><i style="width:82%"></i></div><span class="grn">In stock</span></div>
       <div class="tr"><span>KT-1043</span><div class="bar"><i style="width:56%"></i></div><span class="grn">In stock</span></div>
       <div class="tr"><span>SG-2210</span><div class="bar"><i class="lo" style="width:14%"></i></div><span class="acc">Reorder</span></div>
       <div class="flow"><span class="pill">Orders</span><i class="arw"></i><span class="pill">Inventory</span><i class="arw"></i><span class="pill">Purchasing</span><i class="arw"></i><span class="pill">Reports</span></div>`)
      + chip('Synced <b>2 min ago</b>', 'right:4%;top:7%'),
  },
  {
    short: 'CRM', label: 'CRM SYSTEMS',
    bullets: ['Lead capture & pipeline design', 'Follow-up automation', 'Customer history & segmentation', 'WhatsApp, email & call integrations'],
    tags: ['Pipelines', 'Automation', 'Integrations'],
    alt: 'a sales pipeline board with lead, talking and closed columns',
    visual: () => `<div class="kan">
       <div><span class="mut">LEAD</span><div class="kc"><div class="ln h" style="width:70%"></div><div class="ln"></div></div><div class="kc"><div class="ln h" style="width:54%"></div><div class="ln"></div></div><div class="kc"><div class="ln h" style="width:62%"></div><div class="ln"></div></div></div>
       <div><span class="mut">TALKING</span><div class="kc"><div class="ln h" style="width:66%"></div><div class="ln"></div><span class="acc">Call today</span></div><div class="kc"><div class="ln h" style="width:48%"></div><div class="ln"></div></div></div>
       <div><span class="mut">CLOSED</span><div class="kc won"><div class="ln g" style="width:60%"></div><div class="ln"></div><span class="grn">Won</span></div></div>
     </div>` + chip('<b>0</b> enquiries missed', 'right:5%;bottom:8%', 1),
  },
  {
    short: 'Native Apps', label: 'NATIVE APPS',
    bullets: ['Native iOS & Android builds', 'Push notifications & retention', 'Offline-ready storefront & fast checkout', 'App Store & Play Store launch'],
    tags: ['iOS', 'Android', 'Native'],
    alt: 'the same store on an iOS phone and an Android phone',
    visual: () => phone('iOS', `<div class="ln h" style="width:60%"></div><div class="blk t1" style="height:4.6em"></div><div class="g2"><div class="blk sq"></div><div class="blk sq t3"></div></div>`)
      + `<svg class="spark" viewBox="0 0 40 40" aria-hidden="true"><path class="f-a" d="M20 4l4 12 12 4-12 4-4 12-4-12-12-4 12-4z"></path></svg>`
      + phone('Android', `<div class="ln h" style="width:60%"></div><div class="blk t2" style="height:4.6em"></div><div class="g2"><div class="blk sq"></div><div class="blk sq t3"></div></div>`),
  },
];

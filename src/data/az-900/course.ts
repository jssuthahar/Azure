/**
 * AZ-900 course details copy: the "understand before you start" page at /az-900/.
 * Facts about the exam itself come from syllabus.ts; this file holds the
 * course's own promise, audience, outcomes, roadmap and FAQ.
 */
import type { CourseInfo } from '../types';

export const COURSE: CourseInfo = {
  title: 'Microsoft AZ-900: Azure Fundamentals',
  subtitle: 'Learn the cloud from zero and pass AZ-900 with lessons you can see, click and test yourself on. No Azure account needed.',
  intro: [
    'AZ-900 checks that you understand what the cloud is and how Microsoft Azure is put together: regions and zones, compute, networking, storage, identity, cost and governance. It is the usual first step into an Azure career, and you do not need any technical background to pass it.',
    'This course follows the official skills outline topic by topic. Every lesson starts with a 30-second answer, then lets you feel the idea in a 3D scene, a simulated Azure portal and a practice lab before it explains the theory. A quiz closes each lesson, so you know you have it before you move on.',
  ],
  audience: [
    { icon: '🎒', title: 'Students and career changers', text: 'You have never used a cloud service and want a gentle, story-first start.' },
    { icon: '🎓', title: 'Freshers and job seekers', text: 'You want a recognised certificate on your CV and answers ready for cloud interviews.' },
    { icon: '💻', title: 'Developers', text: 'You build apps and want to know which Azure service fits, and what it costs.' },
    { icon: '🗂️', title: 'Sales, project and business roles', text: 'You talk to cloud teams and customers and want to follow the conversation.' },
  ],
  outcomes: [
    'Explain cloud computing, the shared responsibility model and the consumption-based model in plain words',
    'Choose between public, private and hybrid cloud for a real business case',
    'Tell IaaS, PaaS and SaaS apart and say who manages what',
    'Describe high availability, scalability, elasticity, reliability and predictability',
    'Explain regions, region pairs, availability zones and datacenters',
    'Pick the right compute: virtual machines, containers, App Service or Functions',
    'Understand virtual networks, VPN Gateway, ExpressRoute, DNS and public endpoints',
    'Compare storage types, access tiers and redundancy options',
    'Describe Microsoft Entra ID, MFA, Conditional Access, RBAC and Zero Trust',
    'Estimate and control cost with the pricing calculator, Cost Management and tags',
    'Govern Azure with management groups, Azure Policy, resource locks and Microsoft Purview',
    'Use the portal, Cloud Shell, Azure Arc, ARM templates, Azure Advisor and Azure Monitor',
  ],
  requirements: [
    'No Azure account, credit card or cloud experience needed',
    'A phone, tablet or computer with a browser',
    'About 20 minutes a day; most learners finish in two to four weeks',
  ],
  roadmap: [
    { title: 'Week 1: Cloud concepts', text: 'What the cloud is, cloud models, service types and the benefits. Finish each lesson quiz before moving on.' },
    { title: 'Week 2: Architecture and compute', text: 'Regions, zones, resource groups, then virtual machines, containers, App Service and Functions. Try the datacenter in 3D.' },
    { title: 'Week 3: Networking, storage and identity', text: 'Virtual networks, storage accounts and redundancy, then Entra ID and Zero Trust. Do the matching practice labs.' },
    { title: 'Week 4: Cost, governance and tools', text: 'Pricing, Cost Management, Azure Policy, locks, Purview and monitoring. Then switch to smart practice for weak topics.' },
    { title: 'Exam week: Mock exams and revision', text: 'Take full mock exams until you score 80% or more twice, read the cheat sheet and the exam day guide, then book.' },
  ],
  faq: [
    { q: 'Is this AZ-900 course really free?', a: 'Yes. Every lesson, simulation, lab, quiz, mock exam and the practice certificate is free. There is no paid tier and no sign-in.' },
    { q: 'Do I need an Azure account or a credit card?', a: 'No. The 3D scenes, the Azure portal walkthroughs and the Cloud Shell are simulations that run in your browser, so you cannot create a surprise bill.' },
    { q: 'How long does it take to prepare for AZ-900?', a: 'Most beginners need two to four weeks at about 20 minutes a day. If you already work with cloud services, one week of lessons plus mock exams is often enough.' },
    { q: 'Are these real AZ-900 exam questions?', a: 'No. Every question here is original and written to practise the skills in the official outline. We never publish real, recalled or leaked exam questions.' },
    { q: 'Where is my progress saved?', a: 'In this browser only. Completed lessons, quiz scores, XP and your practice certificate stay on your device. Installing the app keeps them handy offline.' },
    { q: 'Is the practice certificate a Microsoft certification?', a: 'No. It is an MSDEVBUILD practice certificate that shows you passed our mock exam. To become Microsoft certified you sit the AZ-900 exam with Microsoft.' },
  ],
};

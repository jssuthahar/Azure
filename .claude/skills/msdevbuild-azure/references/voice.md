# Voice: write like a person

The reader is a beginner, often studying on a phone, often in India, often in their second language. Write the way a friendly senior engineer explains something at a whiteboard: plain words, short sentences, a real example, then the precise term.

`npm run check:human` fails the build on stock AI phrasing and heavy em-dash use. It is a floor, not the goal.

## Do

- Lead with the answer, then the why. First sentence of any section should be useful on its own.
- Use contractions in lesson prose: *don't, isn't, you're, it's*. (`node scripts/contractions.mjs` converts prose safely; `--write` applies.)
- Use concrete, everyday examples: a bakery renting an oven, a library card, a hospital's backups. Name the company in scenarios.
- Vary sentence length. Short ones land the point.
- Say "you". Speak to one learner.
- Use the real Microsoft names (Microsoft Entra ID, Azure Monitor), defined the first time.
- Keep claims honest and specific: numbers, limits, what happens when it fails.

## Don't

- Stock words: leverage, seamless, robust, comprehensive, crucial, pivotal, delve, realm, landscape of, tapestry, cutting-edge, game-changer, empower, unlock the, unleash, supercharge, streamline, holistic, synergy, utilize, facilitate, optimal, furthermore, moreover, additionally, in essence, at its core.
- Stock openers/closers: "In today's…", "It's important to note", "Let's dive into", "Whether you're a…", "In conclusion", "Key takeaways", "Not just X, but Y", "a wide range of".
- Em dashes as default punctuation. Use a full stop, comma, colon or brackets. Table cells may use "—" for "not applicable".
- Rule-of-three padding ("fast, secure and scalable") unless all three are true and matter.
- Hype. No "revolutionary", no exclamation marks in lessons (games and celebrations may use them).
- Fake personal stories. Never invent experiences for Suthahar; first-person interview answers ("I would…") are fine.

Allowed exceptions (already allowlisted): product names like "Seamless SSO", technical terms like "utilisation".

## Examples

| Instead of | Write |
| --- | --- |
| Azure empowers organizations to seamlessly leverage scalable infrastructure. | Azure lets a company add servers in minutes and pay only while they run. |
| It is important to note that you cannot move a VM between regions directly. | You can't move a VM straight to another region. You copy it with Azure Resource Mover. |
| In today's fast-paced digital landscape, security is paramount. | Passwords get phished. MFA means a stolen password alone won't get anyone in. |

## Register by surface

| Surface | Register |
| --- | --- |
| Lesson prose, stories, ELI10, interview answers | Conversational, contractions |
| 30-second answer | Direct and precise, contractions fine |
| Exam questions and options | Formal, Microsoft exam style |
| UI labels and buttons | Short verbs: "Start lesson 1", "Save the whole course" |
| Legal, privacy, disclaimers | Plain and exact |

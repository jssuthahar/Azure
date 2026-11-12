/**
 * Interactive activities per AZ-900 lesson (keyed by topic slug).
 * Shapes and defaults live in ../activities.ts; a lesson places each one with
 * <Activity id="…" /> in its MDX. Start with a few lessons and grow from there.
 *
 * Rules: original questions only, exam-style questions stay formal, numbers in
 * simulators are illustrative and the component says so.
 */
import type { LessonActivities } from '../activities';

export const ACTIVITIES: Record<string, LessonActivities> = {
  'what-is-cloud-computing': {
    master: 'Cloud Computing Master',
    activities: [
      {
        id: 'predict-exam-rush',
        kind: 'predict',
        title: 'What happens at 9:00 sharp?',
        intro: "Make a guess before you read on. There's no penalty for being wrong, and guessing first helps the answer stick.",
        scenario: 'An online exam website has 10,000 students trying to log in at exactly 9:00 AM. The whole website runs on one physical server in the school office.',
        question: 'What do you think will happen?',
        options: [
          { text: 'The website works normally.', why: "One server can only handle so many requests at once. 10,000 logins in the same minute is far past what a single school server can take." },
          { text: 'The website becomes slow or crashes.', why: 'Right. Requests queue up faster than the server can answer them. Pages time out, logins fail and some students see an error page.' },
          { text: 'The internet speed automatically increases.', why: "A faster connection wouldn't help much. The bottleneck is the server's CPU and memory, and nothing about the internet changes on its own." },
          { text: 'The server automatically creates more hardware.', why: "A physical server can't grow new hardware. Someone has to buy, ship and install more machines, which takes weeks. Adding capacity in minutes is exactly what the cloud adds." },
        ],
        answer: 1,
        reveal: "The single server hits 100% CPU, requests pile up and the site falls over. The school's only fix on its own hardware is to **buy more servers**, which then sit idle for the rest of the year. With **cloud computing** the school rents extra servers for exam morning, the load is shared, and it hands them back afterwards so it **pays only for what it used**.",
        visual: 'overload',
      },
      {
        id: 'check-renting',
        kind: 'quiz',
        style: 'check',
        title: 'Quick check: owning or renting?',
        intro: 'Two quick true-or-false questions on the electricity idea.',
        questions: [
          {
            q: 'True or false: to use cloud computing, a company must first buy its own servers.',
            options: [
              { text: 'True', why: "That's the old on-premises way. In the cloud the provider owns the servers and you rent what you need." },
              { text: 'False', why: 'Correct. The provider (Microsoft, for Azure) owns the hardware. You create resources over the internet and pay for what you use.' },
            ],
            answer: 1,
            concept: 'Cloud computing',
          },
          {
            q: 'True or false: when you delete a cloud virtual machine, you stop paying for its compute time.',
            options: [
              { text: 'True', why: 'Correct. Compute is metered while it runs. Delete the VM and the compute charge stops, just like switching off a light stops the meter.' },
              { text: 'False', why: "Cloud compute is billed by usage, so the meter stops when the VM is gone. (Things you keep, such as saved disks, still cost a little.)" },
            ],
            answer: 0,
            concept: 'Measured service',
          },
        ],
      },
      {
        id: 'traffic-spike',
        kind: 'traffic',
        title: 'Festival sale: watch the traffic hit',
        intro: 'Move the slider, or press Start simulation to play a whole sale day hour by hour. Watch both sides at the same time.',
        scenario: 'An online shopping site normally has a few thousand shoppers. Tonight at 8 PM its festival sale starts.',
        perServer: 2000,
        onPremServers: 4,
        onPremServerHourUsd: 0.4,
        cloudServerHourUsd: 0.5,
        minUsers: 100,
        maxUsers: 100000,
        day: [300, 150, 100, 100, 120, 300, 900, 2500, 4000, 5000, 6000, 7000, 7500, 6500, 6000, 6500, 8000, 12000, 25000, 60000, 100000, 80000, 30000, 8000],
        dayLabel: 'Festival sale day',
      },
      {
        id: 'explore-building-blocks',
        kind: 'explore',
        title: 'Click each part of a cloud website',
        intro: 'This is a typical small website in the cloud. Tap each part to see what it does, then answer its question. Explore all five to finish.',
        entry: { id: 'users', icon: '👥', label: 'Users' },
        links: [['users', 'network'], ['network', 'lb'], ['lb', 'vm'], ['vm', 'db'], ['vm', 'storage']],
        nodes: [
          {
            id: 'network',
            icon: '🛡️',
            label: 'Networking',
            does: 'Connects your cloud resources to each other and to the internet, and decides which traffic is allowed in.',
            why: "Without a network, nothing can reach your app. With a private network, your database isn't exposed to the whole internet.",
            example: 'A shop lets shoppers reach the website but keeps the database on a private network only the web servers can reach.',
            service: 'Azure Virtual Network',
            question: {
              q: 'Which Azure service lets you create a private, isolated network for your cloud resources?',
              options: [
                { text: 'Azure Virtual Network', why: 'Correct. A virtual network (VNet) is your private network in Azure.' },
                { text: 'Azure Blob Storage', why: 'Blob Storage stores files and objects. It is not a network.' },
                { text: 'Azure Virtual Machines', why: 'Virtual machines run inside a virtual network, but they do not create one.' },
              ],
              answer: 0,
            },
          },
          {
            id: 'lb',
            icon: '⚖️',
            label: 'Load balancer',
            does: 'Shares incoming requests across several servers so no single one is overwhelmed.',
            why: "It's what makes adding servers useful. If one server fails, the load balancer stops sending it traffic.",
            example: 'During the sale, 10,000 shoppers are spread across 8 web servers instead of crushing one.',
            service: 'Azure Load Balancer',
            question: {
              q: 'A company runs its website on three virtual machines. Which component distributes incoming traffic across the three machines?',
              options: [
                { text: 'A database', why: 'A database stores data. It does not route web traffic.' },
                { text: 'A load balancer', why: 'Correct. A load balancer spreads requests across healthy servers.' },
                { text: 'A storage account', why: 'A storage account holds files and data, not traffic routing rules.' },
              ],
              answer: 1,
            },
          },
          {
            id: 'vm',
            icon: '🖥️',
            label: 'Virtual machines',
            does: 'Run your code. A virtual machine is a computer you rent: you pick the CPU, memory and operating system.',
            why: 'This is the "compute" part of cloud computing. Need more power for a busy hour? Add more VMs, then remove them.',
            example: 'The shop runs its website on 2 VMs on a quiet day and 20 during the sale.',
            service: 'Azure Virtual Machines',
            question: {
              q: 'Which type of cloud service provides the processing power to run applications?',
              options: [
                { text: 'Compute', why: 'Correct. Compute (such as virtual machines) runs your code.' },
                { text: 'Storage', why: 'Storage keeps data. It does not run your application.' },
                { text: 'Networking', why: 'Networking connects resources. It does not run your code.' },
              ],
              answer: 0,
            },
          },
          {
            id: 'db',
            icon: '🗄️',
            label: 'Database',
            does: 'Stores structured data such as customers, products and orders, and answers questions about it quickly.',
            why: 'A managed database means Microsoft handles patching, backups and hardware, so your team looks after the data, not the server.',
            example: 'Every order placed during the sale is saved in the database, even if a web server restarts.',
            service: 'Azure SQL Database',
            question: {
              q: 'A company wants a relational database without managing the underlying server or operating system. Which option meets this requirement?',
              options: [
                { text: 'Install SQL Server on a physical server in the office', why: 'This means the company manages the hardware, operating system and database itself.' },
                { text: 'Azure SQL Database', why: 'Correct. Azure SQL Database is a managed relational database. Microsoft runs the server and OS.' },
                { text: 'Azure Blob Storage', why: 'Blob Storage stores unstructured files, not relational tables.' },
              ],
              answer: 1,
            },
          },
          {
            id: 'storage',
            icon: '📦',
            label: 'Storage',
            does: 'Keeps files of any size: product photos, videos, backups and documents.',
            why: 'Storage grows with you. You pay per GB you keep, and you never run out of disk on a busy day.',
            example: 'Every product photo on the shop is stored once and served to millions of shoppers.',
            service: 'Azure Blob Storage',
            question: {
              q: 'A company needs to store millions of product images and pay only for the space it uses. Which Azure service should it use?',
              options: [
                { text: 'Azure Blob Storage', why: 'Correct. Blob Storage holds unstructured data such as images and is billed per GB stored.' },
                { text: 'Azure Load Balancer', why: 'A load balancer distributes traffic. It does not store files.' },
                { text: 'Azure Virtual Network', why: 'A virtual network connects resources. It does not store files.' },
              ],
              answer: 0,
            },
          },
        ],
      },
      {
        id: 'five-characteristics',
        kind: 'match',
        title: 'Match the five cloud characteristics',
        intro: "You'll see one situation at a time. Pick the characteristic it shows. Each of the five cards is used once.",
        pairs: [
          { term: 'On-demand self-service', icon: '🙋', meaning: 'you create resources yourself, without asking anyone', scenario: 'You create a virtual machine in the Azure portal in five minutes without phoning Microsoft or raising a purchase order.', why: 'Nobody at Microsoft had to approve or set it up. You served yourself, on demand.' },
          { term: 'Broad network access', icon: '📱', meaning: 'services are reachable over the network from many kinds of device', scenario: 'A sales manager checks the same company dashboard from a laptop in Chennai and a phone at the airport in Dubai.', why: 'The service is reachable over the network from any device and place, so the manager isn’t tied to an office PC.' },
          { term: 'Resource pooling', icon: '🏊', meaning: "the provider shares big pools of hardware between many customers, keeping each one isolated", scenario: 'Your company and thousands of other customers run workloads on the same Azure datacenter hardware, and none of you can see each other’s data.', why: 'The hardware is one big shared pool. Each customer gets an isolated slice of it.' },
          { term: 'Rapid elasticity', icon: '📈', meaning: 'capacity grows and shrinks quickly, often automatically', scenario: 'A ticket-booking site goes from 3 servers to 30 in a few minutes when a concert goes on sale, then back to 3 at night.', why: 'Capacity stretched to match demand and shrank again afterwards. That stretch is elasticity.' },
          { term: 'Measured service', icon: '🧾', meaning: 'usage is metered and you are billed for what you consume', scenario: 'At the end of the month, the bill shows exactly how many hours each VM ran and how many GB were stored.', why: 'Usage is metered like an electricity meter, and the bill follows the meter.' },
        ],
      },
      {
        id: 'real-world-problems',
        kind: 'quiz',
        style: 'scenario',
        title: 'Can you solve this real-world problem?',
        intro: 'Four businesses, four problems. Pick the best solution and see why the other options fall short.',
        questions: [
          {
            scenario: 'An e-commerce company gets 15 times its normal traffic during a three-day festival sale. Last year its own servers crashed on the first night.',
            q: 'What should the company do?',
            options: [
              { text: 'Buy enough servers for the festival peak and keep them all year.', why: 'It would survive the sale, but most of those servers would sit idle for 362 days while still costing power, space and upkeep.' },
              { text: 'Host the site in the cloud and let it scale out for the sale, then scale back in.', why: 'Right. The company rents extra capacity only for the three busy days and pays only for what it uses.' },
              { text: 'Ask customers to shop at different times.', why: "Customers shop when the sale is on. A business can't schedule its demand away." },
            ],
            answer: 1,
            concept: 'Rapid elasticity and consumption-based pricing',
          },
          {
            scenario: 'A school needs 20 extra servers for its online exams, which run for two weeks twice a year. The rest of the time it needs two.',
            q: 'Which approach costs the school the least?',
            options: [
              { text: 'Rent the 20 extra servers in the cloud only during exam weeks.', why: 'Right. The school pays for 20 servers for about four weeks a year, not 52.' },
              { text: 'Buy 22 servers and keep them in the server room.', why: 'The school pays up front for 20 machines that are idle about 48 weeks a year.' },
              { text: 'Run the exams on the two existing servers.', why: "Two servers can't carry exam traffic, which is the problem the school started with." },
            ],
            answer: 0,
            concept: 'Consumption-based model (OpEx)',
          },
          {
            scenario: 'A three-person startup wants to launch its app next month. It has no office, no server room and very little money.',
            q: 'How can it launch without buying hardware?',
            options: [
              { text: 'Take a bank loan to buy servers and rent a small data room.', why: 'Possible, but it means big up-front spending (CapEx) and weeks of setup before a single user arrives.' },
              { text: 'Wait until it raises enough money to build its own datacenter.', why: "That could take years, and the market won't wait." },
              { text: 'Build the app on cloud services and pay monthly for what it uses.', why: 'Right. No up-front hardware, ready in minutes, and the bill starts small and grows with real usage.' },
            ],
            answer: 2,
            concept: 'No up-front cost, speed to market',
          },
          {
            scenario: 'A company has staff in India, Germany and the United States. Everyone needs the same files, and today they email copies to each other.',
            q: 'What is the best fix?',
            options: [
              { text: 'Put a file server in each country and copy files between them every night.', why: 'Three servers to buy and maintain, and files are out of date for most of the day.' },
              { text: 'Store the files in a cloud service that staff reach over the internet from anywhere.', why: 'Right. One copy of each file, reachable from any device in any country.' },
              { text: 'Keep emailing files but use a faster mail server.', why: "Faster email doesn't solve the real problem: many copies of the same file drifting apart." },
            ],
            answer: 1,
            concept: 'Broad network access',
          },
        ],
      },
      {
        id: 'own-or-rent',
        kind: 'sort',
        title: 'On-premises or cloud computing?',
        intro: 'Drag each card into the right box. No mouse, or on a phone? Tap a card, then tap a box.',
        buckets: [
          { label: 'On-premises', icon: '🏢' },
          { label: 'Cloud computing', icon: '☁️' },
        ],
        items: [
          { text: 'Purchase physical servers', bucket: 0, why: 'Buying the machines yourself is the on-premises model: a big up-front cost (CapEx).' },
          { text: 'Rent computing resources', bucket: 1, why: "Renting instead of owning is the heart of cloud computing." },
          { text: 'Maintain cooling systems', bucket: 0, why: 'With your own server room you run the air conditioning. In the cloud, Microsoft cools its datacenters.' },
          { text: 'Scale capacity in minutes', bucket: 1, why: 'Adding servers in minutes is rapid elasticity. On-premises, new hardware takes weeks.' },
          { text: 'Replace damaged hardware yourself', bucket: 0, why: 'On-premises, a dead disk is your problem. In the cloud, the provider replaces failed hardware.' },
          { text: 'Pay based on usage', bucket: 1, why: 'Paying for what you use is the consumption-based model, which is cloud computing.' },
          { text: 'Wait weeks for new servers to arrive', bucket: 0, why: 'Ordering, shipping and installing hardware takes weeks on-premises.' },
          { text: 'Provider handles power and physical security', bucket: 1, why: 'In the cloud, Microsoft runs the buildings, power, guards and hardware.' },
        ],
      },
      {
        id: 'cloud-expert-challenge',
        kind: 'challenge',
        title: 'Cloud Expert Challenge',
        intro: 'Six quick questions, 30 seconds each. Answer fast for a better score. Prefer no clock? Switch the timer off.',
        seconds: 30,
        questions: [
          {
            q: 'Who owns the physical datacenters in the Azure public cloud?',
            options: [
              { text: 'Microsoft', why: 'Correct. In a public cloud, the provider owns and runs the datacenters.' },
              { text: 'Each customer', why: 'Customers rent capacity. They do not own Azure datacenters.' },
              { text: 'The local government', why: 'Governments can be customers, but Microsoft owns and operates Azure datacenters.' },
            ],
            answer: 0,
          },
          {
            q: 'What happens to compute charges when you delete a cloud resource you no longer need?',
            options: [
              { text: 'They continue until the end of the year.', why: 'Cloud compute is not an annual contract by default. It is metered by usage.' },
              { text: 'They stop.', why: 'Correct. With consumption-based pricing, you stop paying when you stop using it.' },
              { text: 'They double as a cancellation fee.', why: 'There is no such fee for pay-as-you-go resources.' },
            ],
            answer: 1,
          },
          {
            q: 'What does pay-as-you-go mean?',
            options: [
              { text: 'You pay a fixed price up front for three years.', why: 'That describes a commitment such as a reservation, not pay-as-you-go.' },
              { text: 'You pay only for the resources you use, when you use them.', why: 'Correct. You are billed for actual consumption.' },
              { text: 'Cloud services are free until you reach a limit.', why: 'Some services have free tiers, but pay-as-you-go means paying for usage.' },
            ],
            answer: 1,
          },
          {
            q: 'Why do many companies prefer cloud computing for workloads with unpredictable traffic?',
            options: [
              { text: 'Capacity can be added and removed quickly as demand changes.', why: 'Correct. Rapid elasticity means capacity follows demand.' },
              { text: 'Cloud servers never fail.', why: 'Cloud hardware can fail too. Good designs plan for failure.' },
              { text: 'The cloud removes the need for any security.', why: 'Security is shared between the provider and the customer.' },
            ],
            answer: 0,
          },
          {
            q: 'Which spending model does cloud computing mainly use?',
            options: [
              { text: 'Capital expenditure (CapEx)', why: 'CapEx is up-front spending on things you own, such as servers.' },
              { text: 'Operational expenditure (OpEx)', why: 'Correct. Cloud is an ongoing, pay-for-what-you-use operating cost.' },
            ],
            answer: 1,
          },
          {
            q: 'Which characteristic lets you create a virtual machine yourself through a portal, without contacting the provider?',
            options: [
              { text: 'Measured service', why: 'Measured service is about metering and billing usage.' },
              { text: 'Resource pooling', why: 'Resource pooling is the provider sharing hardware across customers.' },
              { text: 'On-demand self-service', why: 'Correct. You provision resources yourself, whenever you need them.' },
            ],
            answer: 2,
          },
        ],
      },
      {
        id: 'architect-mission',
        kind: 'mission',
        title: 'Your first cloud architect mission',
        intro: 'Write a line or two for each question, in your own words. Then compare it with the model answer and tick what you covered.',
        brief: "You're responsible for the infrastructure of an online education platform with 20,000 students. Most days a few hundred are online. During exam week, all 20,000 log in within the same hour.",
        tasks: [
          {
            prompt: 'Why does this platform need cloud computing?',
            model: 'Demand jumps from a few hundred users to 20,000 in one hour. The cloud lets the platform add servers for exam week and remove them afterwards.',
            points: ['Traffic is spiky (exam week)', 'Capacity can be added for the peak', 'Capacity is removed afterwards'],
          },
          {
            prompt: 'What problems does the cloud solve here?',
            model: 'No crash on exam day, no money spent on idle servers the rest of the year, no server room to cool, power or repair, and new capacity in minutes instead of weeks.',
            points: ['The site stays up at the peak', 'No paying for idle hardware', 'The provider runs the hardware and datacenter'],
          },
          {
            prompt: 'Why might on-premises infrastructure not be suitable?',
            model: 'To survive exam week on its own hardware, the platform would have to buy for the peak and leave most servers idle for the rest of the year. Buying more takes weeks, and the team would also handle cooling, power and hardware failures.',
            points: ['You must buy for the peak up front (CapEx)', 'Hardware sits idle most of the year', 'Adding servers takes weeks'],
          },
          {
            prompt: 'Which cloud characteristics matter most?',
            model: 'Rapid elasticity (grow and shrink for exam week), measured service (pay for the hours used), on-demand self-service (the team adds capacity itself) and broad network access (students join from anywhere, on any device).',
            points: ['Rapid elasticity', 'Measured service', 'On-demand self-service', 'Broad network access'],
          },
        ],
      },
    ],
  },
};

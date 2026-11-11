/**
 * Wraps each <h2> and the content after it in
 * <section class="lesson-section" data-section="...">, so the lesson can
 * switch between Beginner view (story, Nimbus, scenario, visuals) and Full.
 */
export function sectionKind(text) {
  const t = text.toLowerCase();
  if (t.includes('start with a question')) return 'story';
  if (t.includes('explain it like')) return 'eli10';
  if (t.includes('real-world') || t.includes('business scenario')) return 'scenario';
  if (t.startsWith('visual')) return 'visual';
  if (t.includes('technical')) return 'technical';
  if (t.includes('when to use')) return 'when';
  return 'other';
}
export const SIMPLE_SECTIONS = ['story', 'eli10', 'scenario', 'visual'];

const textOf = (n) => (n.type === 'text' ? n.value : (n.children ?? []).map(textOf).join(''));

export function rehypeSections() {
  return (tree) => {
    const out = [];
    let current = null;
    for (const node of tree.children) {
      if (node.type === 'element' && node.tagName === 'h2') {
        current = {
          type: 'element',
          tagName: 'section',
          properties: { className: ['lesson-section'], dataSection: sectionKind(textOf(node)) },
          children: [node],
        };
        out.push(current);
      } else if (current) current.children.push(node);
      else out.push(node);
    }
    tree.children = out;
  };
}
